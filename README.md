# PyQuest

PyQuest is an RPG-style Python learning app built with React, Vite, Firebase, Monaco Editor, and Pyodide. It includes interactive lessons, browser-based code execution, realtime sandbox/duel features, and an optional Gemini mentor.

## Requirements

- Node.js 20+
- A Firebase project configured in `firebase-applet-config.json`
- A Gemini API key for mentor and daily-challenge generation

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The development server runs at `http://127.0.0.1:3000` by default. Set `HOST`, `PORT`, and `CORS_ORIGINS` in `.env` when the app is hosted elsewhere.

## Verification

```bash
npm run lint
npm run build
```

The Gemini key is read only by the server. The browser communicates with the `/api/mentor/*` proxy endpoints and never receives the secret.
