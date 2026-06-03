const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Robust list of active free models to loop through in case of 404/failure
const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openrouter/free'
];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    // Inject data.js first, then content.js to make window.AUTOSCRIBE_DATA accessible
    await chrome.scripting.executeScript({ 
      target: { tabId: tab.id }, 
      files: ['data.js', 'content.js'] 
    });
  } catch (e) { console.error('[AutoScribe]', e); }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FILL_WITH_AI') {
    callAI(msg.fields).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

async function callAI(fields) {
  const randomSeed = Math.random().toString(36).substring(7);
  const prompt = `You are a realistic Indian form data generator. Generate a completely RANDOM and UNIQUE set of values for ONE consistent Indian person. (Session Seed: ${randomSeed})

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

  let lastError = null;

  // Try each model in sequence in case of 404 or other errors
  for (const model of MODELS) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }], temperature: 0.9 }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        lastError = `API error ${res.status}: ${errText}`;
        console.warn(`[AutoScribe] Model ${model} failed: ${lastError}. Trying next model...`);
        continue; // Try next model
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        lastError = 'AI returned empty response.';
        continue;
      }

      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          lastError = 'AI did not return valid JSON.';
          continue;
        }
        return { values: JSON.parse(jsonMatch[0]) };
      } catch (e) {
        lastError = 'Failed to parse AI response.';
        continue;
      }
    } catch (e) {
      lastError = e.message;
      console.warn(`[AutoScribe] Model ${model} fetch failed: ${lastError}. Trying next model...`);
    }
  }

  return { error: `All models failed. Last error: ${lastError}` };
}
