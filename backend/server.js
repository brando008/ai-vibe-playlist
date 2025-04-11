// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const querystring = require("querystring");

const app = express();
const port = process.env.PORT || 8888;

// Middleware setup
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// test
app.get("/", (req, res) => {
  res.json({ message: "Backend is up and running over HTTPS!" });
});

//random string for security
const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Import routes from the routes folder here
// Example: const authRoutes = require('./router/auth');
// app.use('/auth', authRoutes);

//Route: /auth/login
//Redirects the user to Spotify's authorization endpoint
app.get("/auth/login", (req, res) => {
  const state = generateRandomString(16);
  const scope = "playlist-modify-public playlist-modify-private";

  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(
    {
      response_type: "code",
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state,
    }
  )}`;

  //in production set it to store into cookies late for validation
  res.redirect(authUrl);
});

//Route: /auth/callback
//Handles the redirect from Spotify after authentication
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  //verify the received state matches the security state in production

  try {
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-wwww-form-unlencoded",
        Authoization:
          "Basic " +
          Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
      data: querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    //Redirect to frontend with token, consider secure transfer in production
    res.json({ access_token, refresh_token, expires_in });
  } catch (error) {
    console.error(
      "Error exchanging code for tokens:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to exchange code for tokens" });
  }
});

//Route: /auth/refresh_token
//Refreshes Spotify's access token using a reefesh token
app.get("/auth/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  if (!refresh_token) {
    return res.status(400).json({ error: "Missing refresh token" });
  }

  try {
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
      data: querystring.stringify({
        refresh_token: refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const { access_token, expires_in } = tokenResponse.data;
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

//Route: /api/parse-prompt
app.post("/api/parse-prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res
      .status(400)
      .json({ error: "Missing prompt in the request body" });
  }

  try {
    const openaiResponse = await axios({
      method: "post",
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      data: {
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
- Artists: any explicitly mentioned artist names (list as an array)
- Recommendations: if the text mentions "similar artists" or "like", suggest at least three similar artist (list as an array); if not, return an empty array
- Playlist: generate exactly 10 song entries. Each entry should be an object with "song" and "artist".

Text: "${prompt}"

Return only complete, valid JSON with keys "mood", "genre", "artists", "recommendations", and "playlist".
Ensure the JSON output is complete with all opening and closing brackets.`,
          },
        ],
        max_tokens: 250,
        temperature: 0.2,
      },
    });

    //Used this as my prompt: Can you create me a hype playlist that includes artists like SZA?

    const resultText = openaiResponse.data.choices[0].message.content.trim();

    let cleanedResult = resultText.trim();
    if (cleanedResult.startsWith("```")) {
      cleanedResult = cleanedResult.replace(/```(json)?/g, "").trim();
    }

    cleanedResult = cleanedResult.replace(/,(\s*[}\]])/g, "$1");
    //Might need to add more in production
    if (!cleanedResult.endsWith("}")) {
      cleanedResult += "}";
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResult);
    } catch (jsonError) {
      return res.status(200).json({
        warning: "Failed to parse JSON. Returning raw output.",
        raw: resultText,
      });
    }

    res.json({ parsedData });
  } catch (error) {
    console.error(
      "Error calling OpenAI API:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to process prompt with OpenAI" });
  }
});

const httpsOptions = {
  key: fs.readFileSync("./server.key"),
  cert: fs.readFileSync("./server.cert"),
};

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`HTTPS Server running on https://127.0.0.1:${port}`);
});

// This is replaced with the HTTPS
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
