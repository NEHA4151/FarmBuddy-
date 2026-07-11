import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function callGemini(model, contents, responseMimeType = null) {
  if (!GEMINI_API_KEY) {
    console.error("[Gemini Configuration Error] API key is missing or undefined in server environment (.env)!");
    throw new Error("API Key configuration error: GEMINI_API_KEY is not defined.");
  }
  
  if (GEMINI_API_KEY.trim() === "" || !GEMINI_API_KEY.startsWith("AIza") && !GEMINI_API_KEY.startsWith("AQ.")) {
    console.warn("[Gemini API Key Warning] The loaded GEMINI_API_KEY does not start with standard prefixes ('AIza' or 'AQ.'). Ensure it is correct in .env.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const body = {
    contents
  };
  
  if (responseMimeType) {
    body.generationConfig = {
      responseMimeType
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch (pe) {}

      const errCode = parsedError?.error?.code || response.status;
      const errStatus = parsedError?.error?.status || response.statusText;
      const errMsg = parsedError?.error?.message || errorText;

      console.error(`[Gemini API Error] Model: ${model} | Code: ${errCode} | Status: ${errStatus} | Message: ${errMsg}`);

      if (errCode === 400 && errMsg.includes("API key")) {
        console.error("[Gemini Auth Error] API key is invalid or rejected by Google servers.");
      } else if (errCode === 429) {
        console.error(`[Gemini Quota Error] Quota exceeded or service rate-limited for model ${model}. Details: ${errMsg}`);
      }

      throw new Error(`Gemini API Error (${errCode}): ${errMsg}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error(`[Gemini Response Error] Empty content returned for model ${model}:`, JSON.stringify(data));
      throw new Error(`Empty response from Gemini model ${model}.`);
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error(`[Gemini Exception] model: ${model} | exception: ${err.message}`);
    throw new Error(`Gemini model invocation failed: ${err.message}`);
  }
}

export const geminiService = {
  // Text Chat (gemini-3-flash-preview)
  async chatText(query) {
    const systemPrompt = `You are FarmBuddy AI, an expert agricultural and agronomy assistant. 
Keep your response concise, professional, and practical for farmers. 
Provide clear recommendations for crops, soil, pests, and irrigation.`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { text: query }
        ]
      }
    ];

    return await callGemini('gemini-2.5-flash', contents);
  },

  // Image + Text Analysis (gemini-3-pro-preview)
  async analyzeImage(query, base64Image, mimeType = 'image/jpeg') {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const systemPrompt = `You are an expert crop pathologist. Analyze the uploaded leaf/crop image and query.
Identify any diseases, issues, nutrient deficiencies, or pests.
You MUST return your response as a valid JSON object strictly adhering to this schema:
{
  "response": "A detailed explanation of the leaf/crop status and visual observations.",
  "issue": "A short diagnosis name (e.g. 'Late Blight', 'Nitrogen Deficiency', 'Healthy', 'Spider Mite Damage')",
  "confidence": 85.5, // A number between 0.0 and 100.0
  "recommendations": "Actionable, bulleted list of mitigation steps (e.g., '1. Prune affected leaves. 2. Apply organic copper fungicide.')"
}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { text: query || "What disease is this and what should I do?" },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ];

    const result = await callGemini('gemini-2.5-flash', contents, 'application/json');
    return JSON.parse(result);
  },

  // Voice Command Parsing (gemini-3-flash-preview)
  async analyzeVoice(transcript) {
    const prompt = `Analyze this transcribed voice command from a farmer: "${transcript}"
Determine if it is a normal query, an actionable database command, or a navigation request to open a screen.

Actionable database commands are:
1. Add irrigation entry (e.g. 'Add irrigation entry of 500 liters for batch FB-2026-001')
2. Add fertilizer log (e.g. 'Add fertilizer log of organic compost for batch FB-2026-002')
3. Add pesticide log (e.g. 'Add pesticide log of neem oil for batch FB-2026-001')
4. Add harvest update (e.g. 'Add harvest update of 850kg for batch FB-2026-002')

Navigation requests are requests to open or go to a screen, or perform report exports:
- "add-event" (for requests to open log event, add event, add log, log event page, log page)
- "farmer-dashboard" (for requests to go to home, dashboard, main page, overview)
- "create-batch" (for requests to go to create batch, add batch, initialize batch)
- "consumer-traceability" (for requests to go to customer verification, consumer trace, verification audit)
- "batch-timeline" (for requests to go to product journey, batch timeline, tracking timeline, transaction history)
- "generate-report" (for requests to generate report, download report, export report, export data)

Note: If the command is an actionable database command (like adding an irrigation log), set the navigation_target to "batch-timeline" so the user is redirected to see their log.

You MUST return your response as a valid JSON object strictly adhering to this schema:
{
  "is_actionable": true, // boolean, true if a database event should be logged
  "action_type": "Add irrigation entry", // or 'Add fertilizer log', 'Add pesticide log', 'Add harvest update', or null
  "batch_id": "FB-2026-001", // extracted batch ID if mentioned, or null
  "description": "Short description of the action (e.g. 'Watered with 500 liters' or 'Applied neem oil')", // string
  "navigation_target": "add-event", // set to one of: "add-event", "farmer-dashboard", "create-batch", "consumer-traceability", "batch-timeline" if the user wants to navigate to or open that screen (or if is_actionable is true); otherwise null
  "response": "A friendly response confirming the action or answering the query." // string
}`;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ];

    const result = await callGemini('gemini-2.5-flash', contents, 'application/json');
    return JSON.parse(result);
  },

  // Transcribe Audio file to text (gemini-3-flash-preview)
  async transcribeAudio(base64Audio, mimeType = 'audio/wav') {
    const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, '');

    const contents = [
      {
        role: 'user',
        parts: [
          { text: "Precisely transcribe this voice recording to text. Return ONLY the transcribed text. Do not add any greeting or explanation." },
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ]
      }
    ];

    return await callGemini('gemini-2.5-flash', contents);
  }
};
