// backend/routes/parse.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/parse-prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You extract music details from user prompts for playlist creation.",
          },
          {
            role: "user",
            content: `Extract the following details from the text:
- Mood: overall vibe
- Genre: always determine the music style based on the artist or explicit details
- Artists: any explicitly mentioned artist names (array)
- Recommendations: if the text mentions "similar artists" or "like", suggest at least three similar artists (array); otherwise, return []
- Playlist: generate exactly 10 song entries, each an object with "song" and "artist"

Text: "${prompt}"

Return only complete, valid JSON with keys "mood", "genre", "artists", "recommendations", and "playlist".`,
          },
        ],
        max_tokens: 250,
        temperature: 0.2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    let resultText = openaiResponse.data.choices[0].message.content.trim();
    if (resultText.startsWith("```")) {
      resultText = resultText.replace(/```(json)?/g, "").trim();
    }
    resultText = resultText.replace(/,(\s*[}\]])/g, "$1");
    if (!resultText.endsWith("}")) resultText += "}";

    const parsedData = JSON.parse(resultText);
    res.json({ parsedData });
  } catch (err) {
    console.error(
      "Error calling OpenAI API:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to process prompt with OpenAI" });
  }
});

module.exports = router;
