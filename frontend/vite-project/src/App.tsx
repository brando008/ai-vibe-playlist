// src/App.tsx
import React from "react";
import PlaylistBuilder from "./components/PlaylistBuilder";

const App: React.FC = () => (
  <div className="min-h-screen bg-gray-100">
    <header className="bg-white shadow p-4">
      <h1 className="text-2xl font-bold text-center">
        AI Vibe Playlist Generator
      </h1>
    </header>
    <main className="p-4">
      <PlaylistBuilder />
    </main>
  </div>
);

export default App;
