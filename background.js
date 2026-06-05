// ── API Configuration ────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const OPENROUTER_MODELS = ['openrouter/free'];

// ── Script injection on icon click ───────────────────────────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel/sidepanel.html',
      enabled: true
    }).catch(() => {});
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['data.js', 'krisper/krisper-data.js', 'content.js']
    });
  } catch (e) { console.error('[AutoScribe]', e); }
});

// ── Context Menus ────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Parent Context Menu
    chrome.contextMenus.create({
      id: 'autoscribe-parent',
      title: 'AutoScribe',
      contexts: ['all']
    });

    // Submenus
    chrome.contextMenus.create({
      id: 'autoscribe-ai-fill-all',
      parentId: 'autoscribe-parent',
      title: 'AI Smart Fill (All)',
      contexts: ['all']
    });
    chrome.contextMenus.create({
      id: 'autoscribe-ai-fill-field',
      parentId: 'autoscribe-parent',
      title: 'AI Smart Fill (This Field)',
      contexts: ['editable']
    });
    chrome.contextMenus.create({
      id: 'autoscribe-quick-fill-all',
      parentId: 'autoscribe-parent',
      title: 'Quick Auto Fill (All)',
      contexts: ['all']
    });
    chrome.contextMenus.create({
      id: 'autoscribe-quick-fill-field',
      parentId: 'autoscribe-parent',
      title: 'Quick Auto Fill (This Field)',
      contexts: ['editable']
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab.id && info.menuItemId.startsWith('autoscribe-')) {
    let mode = '';
    let target = '';

    if (info.menuItemId === 'autoscribe-ai-fill-all') {
      mode = 'AI';
      target = 'all';
    } else if (info.menuItemId === 'autoscribe-ai-fill-field') {
      mode = 'AI';
      target = 'field';
    } else if (info.menuItemId === 'autoscribe-quick-fill-all') {
      mode = 'NORMAL';
      target = 'all';
    } else if (info.menuItemId === 'autoscribe-quick-fill-field') {
      mode = 'NORMAL';
      target = 'field';
    } else {
      return; // Ignore parent menu clicks
    }

    const injected = await ensureContentScriptsInjected(tab.id);
    if (injected) {
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_FILL', mode, target }).catch(err => {
        console.error('[AutoScribe] Failed to send message to tab:', err);
      });
    }
  }
});

async function ensureContentScriptsInjected(tabId) {
  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'sidepanel/sidepanel.html',
      enabled: true
    }).catch(() => {});
  } catch (e) {}
  for (let i = 0; i < 3; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return true;
    } catch (e) {
      if (i === 0) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ['data.js', 'krisper/krisper-data.js', 'content.js']
          });
        } catch (err) {
          console.error('[AutoScribe] Script injection failed:', err);
          return false;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  return false;
}

// ── Streaming connection handler ─────────────────────────────────────────────
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'autoscribe-fill') return;
  port.onMessage.addListener(async (msg) => {
    if (msg.type !== 'FILL_WITH_AI') return;
    try {
      await streamAI(msg.fields, msg.sessionSeed, port);
    } catch (e) {
      port.postMessage({ type: 'ERROR', error: e.message });
    }
  });
});

// ── Prompt generator ─────────────────────────────────────────────────────────
function generatePrompt(fields, sessionSeed) {
  const seed = sessionSeed || Math.random().toString(36).substring(7);
  return `Generate a JSON object mapping field ID to realistic random values for ONE consistent Indian person. (Session Seed: ${seed})

RULES:
- Name: Indian. Phone: "+91 XXXXX XXXXX" (starts with 6-9). Email: gmail/yahoo/outlook.in
- Address: realistic Indian street, city, state, pincode. Aadhar: "XXXX XXXX XXXX". PAN: "ABCDE1234F"
- For "o" (options) → select ONLY from the provided options list
- Date: YYYY-MM-DD. Time: HH:MM (DOB: 20-40 years ago, Joining: future)
- Checkbox: true/false. Number: respect min/max

FIELDS:
${JSON.stringify(fields)}

Return ONLY a JSON object mapping the field ID ("i" property) to its value. No markdown styling, no explanation.
Example: {"f_0":"Aarav","f_1":"aarav.sharma@gmail.com"}`;
}

// ── Parse API error message ──────────────────────────────────────────────────
function parseErrorMessage(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message || parsed?.message || text;
  } catch (_) {
    return text;
  }
}

// ── Fetch from LLM with key rotation & fallback ─────────────────────────────
async function fetchLLM(prompt, stream = false) {
  const store = await chrome.storage.local.get([
    'aiProvider',
    'geminiDefaultKey',
    'geminiBackupKey',
    'geminiSelectedModel',
    'openrouterDefaultKey',
    'openrouterBackupKey',
    'openrouterSelectedModel'
  ]);

  const provider = store.aiProvider || 'GEMINI';
  let keys = [];
  let modelName = '';

  if (provider === 'GEMINI') {
    if (store.geminiDefaultKey) keys.push(store.geminiDefaultKey);
    if (store.geminiBackupKey) keys.push(store.geminiBackupKey);
    if (keys.length === 0) {
      throw new Error('Please configure a Gemini API key in the extension settings first.');
    }
    modelName = store.geminiSelectedModel || GEMINI_MODEL;
  } else {
    if (store.openrouterDefaultKey) keys.push(store.openrouterDefaultKey);
    if (store.openrouterBackupKey) keys.push(store.openrouterBackupKey);
    if (keys.length === 0) {
      throw new Error('Please configure an OpenRouter API key in the extension settings first.');
    }
    modelName = store.openrouterSelectedModel || OPENROUTER_MODELS[0];
  }

  let lastError = null;

  for (let k = 0; k < keys.length; k++) {
    const apiKey = keys[k];

    if (provider === 'GEMINI') {
      const action = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${action}key=${apiKey}`;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = parseErrorMessage(errText);
          console.warn(`[AutoScribe] Gemini key ${k} failed: ${lastError}`);
          continue;
        }

        return { res, provider };
      } catch (e) {
        lastError = e.message;
        console.warn(`[AutoScribe] Gemini fetch failed (key ${k}): ${lastError}`);
      }
    } else {
      // OpenRouter
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/vasubhalodiya',
            'X-Title': 'AutoScribe Form Filler'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.9,
            stream
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = parseErrorMessage(errText);
          console.warn(`[AutoScribe] OpenRouter key ${k} failed: ${lastError}`);
          continue;
        }

        return { res, provider };
      } catch (e) {
        lastError = e.message;
        console.warn(`[AutoScribe] OpenRouter fetch failed (key ${k}): ${lastError}`);
      }
    }
  }

  // Construct polished and professional error messages based on key failures
  let userError = '';
  if (keys.length === 1) {
    userError = `Connection failed. The primary API key is invalid or returned an error. Details: ${lastError}`;
  } else if (keys.length === 2) {
    userError = `Connection failed. Both the primary and backup API keys failed. Details: ${lastError}`;
  } else {
    userError = `Connection failed. The default API keys failed to authenticate. Details: ${lastError}`;
  }

  throw new Error(userError);
}

// ── Extract content chunk from SSE based on provider ─────────────────────────
function extractContent(parsed, provider) {
  if (provider === 'GEMINI') {
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return parsed.choices?.[0]?.delta?.content || '';
}

// ── Stream AI response and send chunks to content script ─────────────────────
async function streamAI(fields, sessionSeed, port) {
  try {
    const prompt = generatePrompt(fields, sessionSeed);
    const { res, provider } = await fetchLLM(prompt, true);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    const filledKeys = new Set();
    const requestedKeys = fields.map(f => f.i);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) continue;

        try {
          const parsed = JSON.parse(trimmed.substring(6));
          accumulatedText += extractContent(parsed, provider);

          // Match complete key-value pairs from accumulated text
          const regex = /"([^"]+)"\s*:\s*(?:"([^"]*)"|(-?\d+(?:\.\d+)?)|(true|false))/g;
          const newValues = {};
          let foundNew = false;
          let match;

          while ((match = regex.exec(accumulatedText)) !== null) {
            const key = match[1];
            if (filledKeys.has(key)) continue;

            const val = match[2] !== undefined ? match[2]
              : match[3] !== undefined ? Number(match[3])
                : match[4] === 'true';

            newValues[key] = val;
            filledKeys.add(key);
            foundNew = true;
          }

          if (foundNew) {
            port.postMessage({ type: 'CHUNK', values: newValues });
          }

          // Early exit if all fields are filled
          if (requestedKeys.every(k => filledKeys.has(k))) {
            try { reader.cancel(); } catch (_) { }
            port.postMessage({ type: 'DONE' });
            return;
          }
        } catch (_) {
          // Ignore partial JSON parsing errors
        }
      }
    }

    port.postMessage({ type: 'DONE' });
  } catch (e) {
    port.postMessage({ type: 'ERROR', error: e.message });
  }
}

// ── Dynamic Model Fetching Helpers ──────────────────────────────────────────
async function fetchModelsForProvider(provider, apiKey) {
  if (provider === 'GEMINI') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch Gemini models: ${res.status} - ${txt}`);
    }
    const data = await res.json();
    return (data.models || [])
      .filter(m => m.name && m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
  } else {
    // OpenRouter
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to fetch OpenRouter models: ${res.status} - ${txt}`);
    }
    const data = await res.json();
    return (data.data || []).map(m => m.id);
  }
}

async function getModelsHelper(provider, customDefaultKey, customBackupKey) {
  let keysToTry = [];
  if (customDefaultKey) keysToTry.push(customDefaultKey);
  if (customBackupKey) keysToTry.push(customBackupKey);
  if (keysToTry.length === 0) {
    const fallbackModels = provider === 'GEMINI'
      ? ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
      : ['openrouter/free', 'google/gemini-2.5-flash:free', 'meta-llama/llama-3-8b-instruct:free'];
    return { success: false, models: fallbackModels, error: 'No API keys provided. Please configure a key in the settings panel.' };
  }

  let lastError = null;
  for (const key of keysToTry) {
    try {
      const models = await fetchModelsForProvider(provider, key);
      if (models && models.length > 0) {
        return { success: true, models };
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  // Fallback to static lists if everything fails
  const fallbackModels = provider === 'GEMINI'
    ? ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
    : ['openrouter/free', 'google/gemini-2.5-flash:free', 'meta-llama/llama-3-8b-instruct:free'];

  return { success: false, models: fallbackModels, error: lastError };
}

// ── Message listener for opening Side Panel & fetching models ───────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_SIDE_PANEL') {
    if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      chrome.sidePanel.open({ tabId: sender.tab.id })
        .catch(err => console.error('[AutoScribe] Failed to open side panel:', err));
    } else {
      console.warn('[AutoScribe] chrome.sidePanel API not supported in this environment.');
    }
  } else if (msg.type === 'FETCH_MODELS') {
    getModelsHelper(msg.provider, msg.defaultKey, msg.backupKey)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, models: [], error: err.message }));
    return true; // Keep message channel open for async response
  }
});
