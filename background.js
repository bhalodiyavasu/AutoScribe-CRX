// ── API Configuration ────────────────────────────────────────────────────────
const GEMINI_KEYS = [
  'AQ.Ab8RN6ItrJNC4b11nmc4gBU_GK2Ae0u0AYC5nho9NKw4Bc3DqQ',
  'AQ.Ab8RN6L3CxPKTHhs7WNjaw6W3FVU9qJyIdxVHNWL6Zhw7c0C8g'
];
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

const OPENROUTER_KEYS = [
  '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',
  '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',
  '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'
];
const OPENROUTER_MODELS = ['openrouter/free'];

let currentKeyIndex = 0;

// ── Script injection on icon click ───────────────────────────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['data.js', 'krisper-data.js', 'content.js']
    });
  } catch (e) { console.error('[AutoScribe]', e); }
});

// ── Streaming connection handler ─────────────────────────────────────────────
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'autoscribe-fill') return;
  port.onMessage.addListener(async (msg) => {
    if (msg.type !== 'FILL_WITH_AI') return;
    try {
      await streamAI(msg.fields, port);
    } catch (e) {
      port.postMessage({ type: 'ERROR', error: e.message });
    }
  });
});

// ── Prompt generator ─────────────────────────────────────────────────────────
function generatePrompt(fields) {
  const seed = Math.random().toString(36).substring(7);
  return `You are a realistic Indian form data generator. Generate a completely RANDOM and UNIQUE set of values for ONE consistent Indian person. (Session Seed: ${seed})

RULES:
- Indian names, phone "+91 XXXXX XXXXX" (start 6-9), email with gmail.com/yahoo.in/outlook.in
- Realistic Indian address with street, area, city, state, pincode
- Aadhar "XXXX XXXX XXXX", PAN "ABCDE1234F"
- For "select"/"radio"/"dropdown" → pick ONLY from "options" if provided
- "number" → respect min/max, "date" → YYYY-MM-DD, "time" → HH:MM
- "checkbox"/"toggle" → true or false
- Birth/DOB dates = 20-40 years ago, joining = near future
- All data must be consistent (same person, city, state)
- Do NOT generate the same person or values across multiple calls. Make this identity entirely unique.

FIELDS:
${JSON.stringify(fields)}

Return ONLY a JSON object mapping each "id" to its value. No explanation.
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
  const store = await chrome.storage.local.get('aiProvider');
  const provider = store.aiProvider || 'GEMINI';
  const keys = provider === 'GEMINI' ? GEMINI_KEYS : OPENROUTER_KEYS;
  let lastError = null;

  for (let k = 0; k < keys.length; k++) {
    const keyIndex = (currentKeyIndex + k) % keys.length;
    const apiKey = keys[keyIndex];

    if (provider === 'GEMINI') {
      const action = stream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:${action}key=${apiKey}`;

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          lastError = `Gemini error ${res.status}: ${parseErrorMessage(errText)}`;
          console.warn(`[AutoScribe] Gemini key ${keyIndex} failed: ${lastError}`);
          continue;
        }

        currentKeyIndex = keyIndex;
        return { res, provider };
      } catch (e) {
        lastError = e.message;
        console.warn(`[AutoScribe] Gemini fetch failed (key ${keyIndex}): ${lastError}`);
      }
    } else {
      // OpenRouter
      for (const model of OPENROUTER_MODELS) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.9,
              stream
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            lastError = `OpenRouter error ${res.status}: ${parseErrorMessage(errText)}`;
            console.warn(`[AutoScribe] OpenRouter key ${keyIndex}, model ${model} failed: ${lastError}`);
            continue;
          }

          currentKeyIndex = keyIndex;
          return { res, provider };
        } catch (e) {
          lastError = e.message;
          console.warn(`[AutoScribe] OpenRouter fetch failed (key ${keyIndex}): ${lastError}`);
        }
      }
    }
  }

  throw new Error(`All ${provider} API keys failed. Last error: ${lastError}`);
}

// ── Extract content chunk from SSE based on provider ─────────────────────────
function extractContent(parsed, provider) {
  if (provider === 'GEMINI') {
    return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return parsed.choices?.[0]?.delta?.content || '';
}

// ── Stream AI response and send chunks to content script ─────────────────────
async function streamAI(fields, port) {
  try {
    const prompt = generatePrompt(fields);
    const { res, provider } = await fetchLLM(prompt, true);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    const filledKeys = new Set();
    const requestedKeys = fields.map(f => f.id);

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
            try { reader.cancel(); } catch (_) {}
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
