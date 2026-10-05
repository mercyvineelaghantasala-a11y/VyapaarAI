const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_RETRIES = 3;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function extractJsonText(response) {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const candidates = response?.candidates || [];
  const textParts = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter(Boolean);

  return textParts.join(" ").trim();
}

async function generateLeadAnalysis(prompt, model) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const rawText = extractJsonText(response);

  if (!rawText) {
    throw new Error("The model returned an empty response.");
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const trimmedText = rawText.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(trimmedText);
  }
}

async function analyzeLead(lead) {
  const safeLead = lead || {};

  const prompt = `
You are VyapaarAI, an intelligent AI agent for small business customer lead management.

Analyze the following customer lead:

Customer Name: ${safeLead.name ?? "Unknown"}
Company: ${safeLead.company ?? "Unknown"}
Source: ${safeLead.source ?? "Unknown"}
Current Lead Score: ${safeLead.score ?? "Unknown"}
Current Status: ${safeLead.status ?? "Unknown"}

Determine:

1. Customer purchase intent
2. Lead score from 0 to 100
3. Lead category: Hot, Warm, or Cold
4. Urgency: High, Medium, or Low
5. Customer requirements
6. Recommended business action
7. Personalized follow-up message

Important rules:
- Do not invent information.
- Use only the information provided.
- If information is unknown, say "Unknown".
- Give practical recommendations for a small business owner.
- Return only valid JSON.

Return this exact JSON structure:

{
  "intent": "string",
  "leadScore": 0,
  "category": "Hot",
  "urgency": "High",
  "requirements": ["string"],
  "recommendedAction": "string",
  "followUpMessage": "string"
}
`;

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await generateLeadAnalysis(prompt, DEFAULT_MODEL);
    } catch (error) {
      lastError = error;
      const message = error?.message || "";
      const status = error?.status || error?.cause?.code || "";
      const shouldRetry =
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("503") ||
        message.includes("high demand") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        status === "UNAVAILABLE" ||
        status === "RESOURCE_EXHAUSTED";

      if (!shouldRetry || attempt === MAX_RETRIES) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError || new Error("AI analysis failed. The selected model is unavailable.");
}

module.exports = {
  analyzeLead,
};