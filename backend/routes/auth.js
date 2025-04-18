// backend/routes/auth.js
const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Generate random state string (for CSRF protection)
function generateRandomString(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// /auth/login
router.get("/login", (req, res) => {
  const state = generateRandomString();
  const scope = "playlist-modify-public playlist-modify-private";
  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
      state,
    });
  res.redirect(authUrl);
});

// /auth/callback
router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
      }
    );
    res.json(tokenResponse.data);
  } catch (err) {
    console.error(
      "Error exchanging code for tokens:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to exchange code for tokens" });
  }
});

// /auth/refresh_token
router.get("/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  if (!refresh_token)
    return res.status(400).json({ error: "missing refresh token" });

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({ grant_type: "refresh_token", refresh_token }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(`${CLIENT_ID}:S{CLIENT_SECRET}`).toString("base64"),
        },
      }
    );
    res.json(tokenResponse.data);
  } catch (err) {
    console.error("Error refreshing token:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

module.exports = router;
