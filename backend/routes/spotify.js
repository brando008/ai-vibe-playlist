//backend/routes/spotify.js

const express = require("express");
const { searchSpotifyTrack } = require("../services/spotify");
const router = express.Router();

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

module.exports = router;
