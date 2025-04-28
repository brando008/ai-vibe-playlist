// frontent/src/components/PlaylistBuilder.tsx
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

export default function PLaylistBuilder() {
  const [spotifyToken, setSpotifyToken] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [tracks, setTracks] = useState<PlaylistItem[]>([]);

  // 1. Grab Spotify token from url
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    if (token) {
      setSpotifyToken(token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setTracks([]);

    try {
      // 2. Parse the prompt
      const parseRes = await axios.post<{ parsedData: any }>(
        "/api/parse-prompt",
        { prompt }
      );
      const aiParsed = parseRes.data.parsedData;

      // 3. Fetch Spotify track details
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

  return (
    <div className="max-w-xl mx-auto p-4">
      {!spotifyToken ? (
        <a
          href="https://127.0.0.1:8888/auth/login"
          className="block text-center bg-green-500 hover:bg-green-600 text-white py-2 rounded"
        >
          Log in with Spotify
        </a>
      ) : (
        <>
          <textarea
            className="w-full border p-2 mb-2 rounded"
            placeholder="Describe your vibe..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <button
            disabled={!prompt || loading}
            onClick={handleGenerate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Playlist"}
          </button>
        </>
      )}

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {tracks.length > 0 && (
        <ul className="mt-6 space-y-4">
          {tracks.map(({ song, artist, spotifyTrack }) => (
            <li key={spotifyTrack.id} className="flex items-center space-x-4">
              <img
                src={spotifyTrack.album.images[2]?.url}
                alt={song}
                className="w-12 h-12 rounded"
              />
              <div>
                <p className="font-semibold">{song}</p>
                <p className="text-sm text-gray-600">{artist}</p>
              </div>
              <a
                href={spotifyTrack.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-green-500 hover:underline"
              >
                ▶️ Play
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
