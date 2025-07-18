// src/components/PlaylistBuilder.tsx
import { useState, useEffect } from "react";
import axios from "axios";

interface SpotifyTrack {
  id: string;
  name: string;
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
}

interface PlaylistItem {
  song: string;
  artist: string;
  spotifyTrack: SpotifyTrack;
}

export default function PlaylistBuilder() {
  const [spotifyToken, setSpotifyToken] = useState<string>("");
  const [spotifyUserId, setSpotifyUserId] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [tracks, setTracks] = useState<PlaylistItem[]>([]);

  // 1. Grab Spotify token from URL & fetch user profile
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    if (token) {
      setSpotifyToken(token);
      window.history.replaceState({}, "", window.location.pathname);

      // Fetch the current user's Spotify ID
      axios
        .get<{ id: string }>("/api/spotify/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log("Fetched Spotify user ID:", res.data.id);
          setSpotifyUserId(res.data.id);
        })
        .catch((err) => {
          console.error(
            "Failed to fetch user ID:",
            err.response?.data || err.message
          );
          setError("Could not verify Spotify user");
        });
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setTracks([]);
    setParsedData(null);

    try {
      // 2a. Parse the prompt
      const parseRes = await axios.post<{ parsedData: any }>(
        "/api/parse-prompt",
        { prompt }
      );
      const aiParsed = parseRes.data.parsedData;
      setParsedData(aiParsed);

      // 2b. Fetch Spotify track details
      const fetchRes = await axios.post<{ tracks: PlaylistItem[] }>(
        "/api/spotify/fetch-tracks",
        {
          parsedData: aiParsed,
          spotifyAccessToken: spotifyToken,
        }
      );
      setTracks(fetchRes.data.tracks);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Save the generated playlist into the user’s Spotify account
  const handleSave = async () => {
    console.log("handleSave clicked", {
      spotifyToken,
      spotifyUserId,
      parsedData,
      tracks,
    });
    if (!spotifyToken || !spotifyUserId) {
      setError("You must log in to save a playlist.");
      return;
    }
    if (!parsedData || tracks.length === 0) {
      setError("You need to generate a playlist before saving.");
      return;
    }

    try {
      const saveRes = await axios.post<{ playlistUrl: string }>(
        "/api/spotify/build-playlist",
        {
          parsedData,
          spotifyAccessToken: spotifyToken,
          spotifyUserId,
        }
      );
      // open the new playlist in a new tab
      window.open(saveRes.data.playlistUrl, "_blank");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || "Failed to save playlist");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-2xl">
      {!spotifyToken ? (
        <a
          href="https://127.0.0.1:8888/auth/login"
          className="block text-center bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200"
        >
          Log in with Spotify
        </a>
      ) : (
        <>
          <textarea
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Describe your vibe..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <button
            disabled={!prompt || loading}
            onClick={handleGenerate}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Playlist"}
          </button>
        </>
      )}

      {error && (
        <p className="mt-4 text-red-600 font-medium text-center">{error}</p>
      )}

      {tracks.length > 0 && (
        <>
          <ul className="mt-6 space-y-4">
            {tracks.map(({ song, artist, spotifyTrack }) => (
              <li
                key={spotifyTrack.id}
                className="flex items-center space-x-4 border-b pb-2"
              >
                <img
                  src={spotifyTrack.album.images[2]?.url}
                  alt={song}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{song}</p>
                  <p className="text-sm text-gray-600">{artist}</p>
                </div>
                <a
                  href={spotifyTrack.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  ▶️
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={handleSave}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-all duration-200"
          >
            Save to My Spotify
          </button>
        </>
      )}
    </div>
  </div>
  );
  
}
