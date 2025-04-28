const axios = require("axios");

/**
 * Sanitize and normalize song/artist names for Spotify search.
 */
function sanitize(str) {
  return (
    str
      // Replace curly quotes with straight
      .replace(/[“”‘’]/g, '"')
      // Strip trailing dots (e.g. "Fred Again..")
      .replace(/\.+$/, "")
      .trim()
  );
}

/**
 * Perform a Spotify search with the given query.
 */
async function spotifySearch(query, accessToken) {
  const response = await axios.get("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { q: query, type: "track", limit: 1 },
  });
  return response.data.tracks.items;
}

/**
 * Search Spotify for a single track by title + artist, with fallbacks.
 * @param {string} songTitle
 * @param {string} artist
 * @param {string} accessToken
 * @returns {object|null} Spotify track object or null if not found
 */
async function searchSpotifyTrack(songTitle, artist, accessToken) {
  const title = sanitize(songTitle);
  const art = sanitize(artist);

  // 1️⃣ Try the most specific query: track + artist
  let query = `track:"${title}" artist:"${art}"`;
  try {
    let items = await spotifySearch(query, accessToken);
    if (items.length) return items[0];

    // 2️⃣ Fallback #1: drop the "track:" qualifier
    query = `"${title}" artist:"${art}"`;
    items = await spotifySearch(query, accessToken);
    if (items.length) return items[0];

    // 3️⃣ Fallback #2: search by title only
    query = `"${title}"`;
    items = await spotifySearch(query, accessToken);
    if (items.length) return items[0];

    // No matches
    return null;
  } catch (err) {
    // Log the full error for debugging
    console.error(
      `Spotify search error for "${songTitle}" by "${artist}":`,
      err.response?.status,
      err.response?.data || err.message
    );
    return null;
  }
}

module.exports = { searchSpotifyTrack };
