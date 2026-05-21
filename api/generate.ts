import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(450).json({ error: "Only POST requests are allowed" });
    return;
  }

  const { idea, provider = "gemini", customApiKey } = req.body;

  if (!idea || !idea.trim()) {
    res.status(400).json({ error: "Product idea is required" });
    return;
  }

  // Determine which API key to use
  let apiKey = "";
  if (customApiKey && customApiKey.trim()) {
    apiKey = customApiKey.trim();
  } else {
    // Fall back to owner's developer key from environment variables
    apiKey = provider === "openai" 
      ? (process.env.OPENAI_API_KEY || "") 
      : (process.env.GEMINI_API_KEY || "");
  }

  if (!apiKey) {
    res.status(401).json({
      error: `No API key available for ${provider === "openai" ? "OpenAI" : "Gemini"}. Please verify configuration or paste your own key in Settings.`,
    });
    return;
  }

  const systemInstruction = 
    "You are an expert market research and SEO assistant. The user will describe a product idea, niche, or topic they are interested in. " +
    "Analyze this idea and generate a list of 4 to 6 highly targeted search queries (keywords) paired with highly relevant subreddits " +
    "where potential customers or communities discuss pain points, needs, or alternatives related to this product. " +
    "Output your response strictly as a valid, raw JSON array of objects, with no markdown backticks, no comments, and no explanation. " +
    "Each object in the array MUST contain exactly these three string fields: " +
    "1. \"kw\": a short search query/keyword (e.g. \"competitor alternative\" or \"productivity tracker\"). " +
    "2. \"sub\": a highly relevant, active subreddit name without the r/ prefix (e.g. \"indiehackers\" or \"SaaS\"). " +
    "3. \"rationale\": a short 1-sentence explanation of why this community and keyword are valuable for tracking. " +
    "Example Output: " +
    "[{\"kw\":\"habit builder\",\"sub\":\"productivity\",\"rationale\":\"Tracks discussions of habit tracking software and struggles.\"}]";

  const promptText = `Generate custom keyword trackers for this product idea:\n"${idea}"`;

  try {
    let resultJsonText = "";

    if (provider === "openai") {
      // Direct REST Call to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemInstruction + " Wrap the outer array in an object: {\"suggestions\": [...] }" },
            { role: "user", content: promptText },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI HTTP ${response.status}: ${errText}`);
      }

      const openAiData = await response.json();
      const rawContent = openAiData.choices[0].message.content;
      
      // Parse the suggestions wrapper
      const parsedWrapper = JSON.parse(rawContent);
      resultJsonText = JSON.stringify(parsedWrapper.suggestions || parsedWrapper);

    } else {
      // Direct REST Call to Gemini (using gemini-2.5-flash)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errText}`);
      }

      const geminiData = await response.json();
      const rawContent = geminiData.candidates[0].content.parts[0].text;
      resultJsonText = rawContent;
    }

    // Clean up JSON strings that LLMs sometimes prefix/wrap
    let cleanedJsonText = resultJsonText.trim();
    if (cleanedJsonText.startsWith("```json")) {
      cleanedJsonText = cleanedJsonText.slice(7);
    } else if (cleanedJsonText.startsWith("```")) {
      cleanedJsonText = cleanedJsonText.slice(3);
    }
    if (cleanedJsonText.endsWith("```")) {
      cleanedJsonText = cleanedJsonText.slice(0, -3);
    }
    cleanedJsonText = cleanedJsonText.trim();

    // Verify it is actual parsable JSON before returning
    const parsedData = JSON.parse(cleanedJsonText);
    res.status(200).json(parsedData);

  } catch (error: any) {
    console.error("AI Generation Serverless Function Error:", error);
    res.status(500).json({
      error: `AI suggestion failed: ${error.message || "Unknown error during API call"}`,
    });
  }
}
