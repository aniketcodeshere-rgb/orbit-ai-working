# Orbit AI — Study & Productivity Agent

A small, deployable Node.js + vanilla HTML/CSS/JS mini project using Gemini. The Gemini key is kept server-side and is never sent to the browser. Chat history is saved in the current browser's localStorage.

## Run locally

1. Install Node.js 18 or newer.
2. Set your **new** Gemini key as an environment variable. Do not paste it into `public/index.html` or commit it to Git.

Windows PowerShell:
```powershell
$env:GEMINI_API_KEY="YOUR_NEW_GEMINI_KEY"
$env:GEMINI_MODEL="gemini-2.5-flash"
npm start
```

macOS/Linux:
```bash
export GEMINI_API_KEY="YOUR_NEW_GEMINI_KEY"
export GEMINI_MODEL="gemini-2.5-flash"
npm start
```

3. Open http://localhost:3000
4. Check http://localhost:3000/api/health to see whether the server detects the key.

## Deploy on Render

1. Push the project folder to a private or public GitHub repository. Never commit the real API key.
2. In Render, create **New + → Web Service** and connect the repository.
3. Runtime: Node. Build command can be blank or `npm install`; start command: `npm start`.
4. In Render Environment, add `GEMINI_API_KEY` with your new key, and optionally `GEMINI_MODEL=gemini-2.5-flash`.
5. Deploy and open your service URL. `/api/health` should report `configured: true`.

## Features

- Gemini-powered assistant with contextual chat messages
- Study helper, daily planner, summarizer, quiz generator, email writer, project mentor
- Local browser chat history, rename-by-first-prompt, export current conversation to Markdown
- Responsive UI, loading indicator, API error messages
- Server-side API key handling

## Important notes

- A key was shared in a chat earlier. Revoke it in Google AI Studio and create a replacement before deployment.
- History is browser-local, not synced between devices or users. Cloud history/login would require a database and authentication.
- Gemini API availability, quota, and billing depend on your Google AI Studio project.
