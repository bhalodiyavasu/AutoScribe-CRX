// Gemini API Configuration
const GEMINI_KEYS = [
  'AQ.Ab8RN6ItrJNC4b11nmc4gBU_GK2Ae0u0AYC5nho9NKw4Bc3DqQ', // Default key gemini
  'AQ.Ab8RN6L3CxPKTHhs7WNjaw6W3FVU9qJyIdxVHNWL6Zhw7c0C8g'  // One key gemini
];
const GEMINI_MODEL = 'gemini-2.5-flash-lite';

// OpenRouter API Configuration
const OPENROUTER_KEYS = [
  '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', // Default
  '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', // One key
  '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'  // Backup key
];
const OPENROUTER_MODELS = [
  'openrouter/free'
];

let currentKeyIndex = 0;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    // Inject data.js first, then krisper-data.js and content.js to make window.AUTOSCRIBE_DATA and window.KRISPER_DATA accessible
    await chrome.scripting.executeScript({ 
      target: { tabId: tab.id }, 
      files: ['data.js', 'krisper-data.js', 'content.js'] 
    });
  } catch (e) { console.error('[AutoScribe]', e); }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FILL_WITH_AI') {
    callAI(msg.fields).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'autoscribe-fill') {
    port.onMessage.addListener(async (msg) => {
      if (msg.type === 'FILL_WITH_AI') {
        try {
          await streamAI(msg.fields, port);
        } catch (e) {
          port.postMessage({ type: 'ERROR', error: e.message });
        }
      }
    });
  }
});

// Common helper to generate the AI prompt
function generatePrompt(fields) {
  const randomSeed = Math.random().toString(36).substring(7);
  return `You are a realistic Indian form data generator. Generate a completely RANDOM and UNIQUE set of values for ONE consistent Indian person. (Session Seed: ${randomSeed})

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

// Common helper to fetch from LLM with rotating keys and fallback models/endpoints
async function fetchLLM(prompt, stream = false) {
  const store = await chrome.storage.local.get('aiProvider');
  const provider = store.aiProvider || 'GEMINI';

  const keys = provider === 'GEMINI' ? GEMINI_KEYS : OPENROUTER_KEYS;
  let lastError = null;

  for (let k = 0; k < keys.length; k++) {
    const keyIndex = (currentKeyIndex + k) % keys.length;
    const apiKey = keys[keyIndex];

    if (provider === 'GEMINI') {
      const url = stream 
        ? `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

      try {
        console.log(`[AutoScribe] Attempting Gemini call with key index ${keyIndex}, stream=${stream}`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          let errMsg = errText;
          try {
            const parsedErr = JSON.parse(errText);
            if (parsedErr?.error?.message) {
              errMsg = parsedErr.error.message;
            }
          } catch (_) {}
          lastError = `Gemini error ${res.status}: ${errMsg}`;
          console.warn(`[AutoScribe] Gemini Key index ${keyIndex} failed: ${lastError}. Trying next...`);
          continue;
        }

        currentKeyIndex = keyIndex;
        return res;
      } catch (e) {
        lastError = e.message;
        console.warn(`[AutoScribe] Gemini Fetch failed with key index ${keyIndex}: ${lastError}. Trying next...`);
      }
    } else {
      // OpenRouter Provider
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      for (const model of OPENROUTER_MODELS) {
        try {
          console.log(`[AutoScribe] Attempting OpenRouter call with key index ${keyIndex}, model ${model}, stream=${stream}`);
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.9,
              stream: stream
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            let errMsg = errText;
            try {
              const parsedErr = JSON.parse(errText);
              if (parsedErr?.error?.message) {
                errMsg = parsedErr.error.message;
              } else if (parsedErr?.message) {
                errMsg = parsedErr.message;
              }
            } catch (_) {}
            lastError = `OpenRouter error ${res.status}: ${errMsg}`;
            console.warn(`[AutoScribe] OpenRouter Key index ${keyIndex} Model ${model} failed: ${lastError}. Trying next...`);
            continue;
          }

          currentKeyIndex = keyIndex;
          return res;
        } catch (e) {
          lastError = e.message;
          console.warn(`[AutoScribe] OpenRouter Fetch failed with key index ${keyIndex}: ${lastError}. Trying next...`);
        }
      }
    }
  }

  throw new Error(`All ${provider} API keys failed. Last error: ${lastError}`);
}

async function streamAI(fields, port) {
  try {
    const store = await chrome.storage.local.get('aiProvider');
    const provider = store.aiProvider || 'GEMINI';

    const prompt = generatePrompt(fields);
    const res = await fetchLLM(prompt, true);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let filledKeys = new Set();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;
        if (cleanLine === 'data: [DONE]') continue;
        if (cleanLine.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(cleanLine.substring(6));
            
            // Extract content chunk depending on provider
            let content = '';
            if (provider === 'GEMINI') {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else {
              content = parsed.choices?.[0]?.delta?.content || '';
            }
            
            accumulatedText += content;

            // Match complete key-value pairs from accumulated text
            const regex = /"([^"]+)"\s*:\s*(?:"([^"]*)"|(-?\d+(?:\.\d+)?)|(true|false))/g;
            let match;
            const newValues = {};
            let foundNew = false;

            while ((match = regex.exec(accumulatedText)) !== null) {
              const key = match[1];
              if (filledKeys.has(key)) continue;

              let val = undefined;
              if (match[2] !== undefined) val = match[2];
              else if (match[3] !== undefined) val = Number(match[3]);
              else if (match[4] !== undefined) val = match[4] === 'true';

              if (val !== undefined) {
                newValues[key] = val;
                filledKeys.add(key);
                foundNew = true;
              }
            }

            if (foundNew) {
              port.postMessage({ type: 'CHUNK', values: newValues });
            }

            // Early exit if all requested fields are filled
            const requestedKeys = fields.map(f => f.id);
            const allFilled = requestedKeys.every(k => filledKeys.has(k));
            if (allFilled) {
              console.log('[AutoScribe] All requested fields filled. Closing stream early.');
              try { reader.cancel(); } catch (_) {}
              port.postMessage({ type: 'DONE' });
              return;
            }
          } catch (e) {
            // Ignore partial JSON parsing errors
          }
        }
      }
    }

    port.postMessage({ type: 'DONE' });
  } catch (e) {
    port.postMessage({ type: 'ERROR', error: e.message });
  }
}

async function callAI(fields) {
  try {
    const store = await chrome.storage.local.get('aiProvider');
    const provider = store.aiProvider || 'GEMINI';

    const prompt = generatePrompt(fields);
    const res = await fetchLLM(prompt, false);
    const data = await res.json();
    
    let text = '';
    if (provider === 'GEMINI') {
      text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      text = data?.choices?.[0]?.message?.content;
    }

    if (!text) {
      return { error: 'AI returned empty response.' };
    }

    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: 'AI did not return valid JSON.' };
    }
    return { values: JSON.parse(jsonMatch[0]) };
  } catch (e) {
    return { error: e.message };
  }
}
