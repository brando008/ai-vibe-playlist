# AI Vibe Playlist Generator

A full-stack React + Node.js app that uses OpenAI to parse natural-language prompts into playlist details and the Spotify Web API to generate and save real playlists.

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS + TypeScript  
- **Backend:** Node.js + Express  
- **AI Integration:** OpenAI API (`gpt-4o-mini`)  
- **Music Data:** Spotify Web API (Authorization Code Flow)  
- **Dev SSL:** local HTTPS via self-signed cert  
- **Deployment:** Frontend on Vercel, Backend on Render/Heroku

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18+  
- [npm](https://www.npmjs.com/) or Yarn  
- A Spotify Developer account & app (Client ID, Client Secret)  
- An OpenAI account & API key

---

## 🔒 Environment Variables

1. Copy the template and fill in your own keys:
```bash
cp .env.example .env
```
2. Edit .env.example to .env:
  ```bash
  # OpenAI
  OPENAI_API_KEY=sk-...
  
  # Spotify
  SPOTIFY_CLIENT_ID=your_spotify_client_id
  SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
  SPOTIFY_REDIRECT_URI=https://127.0.0.1:8888/auth/callback
  ```
## 🔧 Generate a Self-Signed SSL Cert (Dev Only)

In your backend/ folder:
  ```bash
  openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365
  ```
## 🚀 Running Locally

1. Backend
  ```bash
  cd backend
  npm install
  node server.js
  ```
You should see:
  ```bash
  HTTPS Server running on https://127.0.0.1:8888
  ```
2. Frontend
 ```bash
  cd ../frontend/vite-project
  npm install
  npm run dev
 ```
## 🧩 Usage

1. Open your browser to http://localhost:5173
2. Click Log in with Spotify → complete consent → you’ll return with an access_token.
3. Enter a prompt in the textarea, e.g.
  ```bash
  Can you create me a hype playlist that features Fred Again.. and similar artists?
  ```
4.  Click Generate Playlist → see 10 tracks fetched from Spotify.
5.  Click Save to My Spotify → a new playlist is created in your account and opens in a new tab.
