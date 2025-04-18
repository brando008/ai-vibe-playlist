const axios = require("axios");

//Search Spotify for a single track by title + artist
async function searchSpotifyTract(songTitle, artist, accessToken) {
  const query = `${songTitle} ${artist}`;
  try {
    const response = await axios.get("https://api.spotify.com/va/search", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { q: query, type: "track, limit: 1" },
    });
    return response.data.tracks.items[0] || null;
  } catch (err) {
    console.error(
      `Error searching for "${songTitle}" by "${artist}":`,
      err.message
    );
    return null;
  }
}

module.exports = { searchSpotifyTrack };
