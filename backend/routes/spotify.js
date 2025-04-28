//backend/routes/spotify.js

const express = require("express");
const axios = require("axios");
const {
  searchSpotifyTrack,
  createSpotifyPlaylist,
  addTracksToPlaylist,
} = require("../services/spotify");
const router = express.Router();

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ id: response.data.id });
  } catch (err) {
    console.error(
      "Error fetching Spotify profile:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

router.post("/fetch-tracks", async (req, res) => {
  const { parsedData, spotifyAccessToken } = req.body;
  if (!parsedData || !spotifyAccessToken) {
    return res
      .status(400)
      .json({ error: "Missing parsedData or spotifyAccessToken" });
  }

  const promises = parsedData.playlist.map((item) =>
    searchSpotifyTrack(item.song, item.artist, spotifyAccessToken).then(
      (track) => ({ ...item, spotifyTrack: track })
    )
  );

  const results = await Promise.all(promises);
  res.json({ tracks: results.filter((r) => r.spotifyTrack) });
});

router.post("/build-playlist", async (req, res) => {
  const { parsedData, spotifyAccessToken, spotifyUserId } = req.body;
  if (!parsedData || !spotifyAccessToken || !spotifyUserId) {
    return res.status(400).json({
      error: "Missing parsedData, spotifyAccessToken, or spotifyUserId",
    });
  }

  try {
    // 1. Look up each track URI
    const trackObjs = await Promise.all(
      parsedData.playlist.map((item) =>
        searchSpotifyTrack(item.song, item.artist, spotifyAccessToken)
      )
    );
    const uris = trackObjs.filter(Boolean).map((t) => t.uri);

    // 2. Create a new playlist for the user
    const playlistName = `${parsedData.mood || "My"} Vibe Playlist`;
    const playlist = await createSpotifyPlaylist(
      spotifyUserId,
      playlistName,
      spotifyAccessToken
    );

    // 3. Add the tracks to that playlist
    await addTracksToPlaylist(playlist.id, uris, spotifyAccessToken);

    // 4. Return the new playlist’s Spotify URL
    return res.json({ playlistUrl: playlist.external_urls.spotify });
  } catch (err) {
    console.error(
      "Error building Spotify playlist:",
      err.response?.data || err.message
    );
    return res.status(500).json({ error: "Failed to build Spotify playlist" });
  }
});

module.exports = router;
