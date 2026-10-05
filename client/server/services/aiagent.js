const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeLead(lead) {
  const prompt = `
You are VyapaarAI, an intelligent customer lead analysis agent
for small businesses.

Analyze the following customer lead.

Customer Name: ${lead.name}
Company: ${lead.company}
Source: ${lead.source}
Lead Score Currently Available: ${lead.score}
Status Currently Available: ${lead.status}

Your job is to determine:

1. Customer purchase intent
2. Lead score from 0 to 100
3. Lead category:
   - Hot
   - Warm
   - Cold
4. Urgency:
   - High
   - Medium
   - Low
5. Customer requirements
6. Recommended business action
7. Personalized follow-up message

Important rules:

- Do not invent information.
- Use only the information provided.
- If information is unknown, say "Unknown".
- Give practical recommendations for a small business owner.
- Return ONLY the requested JSON structure.
`;

  const response = await openai.responses.create({
    model: "gpt-5",
    input: prompt,

    text: {
      format: {
        type: "json_schema",
        name: "lead_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent: {
              type: "string",
            },

            leadScore: {
              type: "number",
            },

            category: {
              type: "string",
              enum: ["Hot", "Warm", "Cold"],
            },

            urgency: {
              type: "string",
              enum: ["High", "Medium", "Low"],
            },

            requirements: {
              type: "array",
              items: {
                type: "string",
              },
            },

            recommendedAction: {
              type: "string",
            },

            followUpMessage: {
              type: "string",
            },
          },

          required: [
            "intent",
            "leadScore",
            "category",
            "urgency",
            "requirements",
            "recommendedAction",
            "followUpMessage",
          ],

          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

module.exports = {
  analyzeLead,
};