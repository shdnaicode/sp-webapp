# SP Webapp

Full‑stack learning platform built with React (Vite) and Express/MongoDB. It includes email/password auth, GitHub OAuth login, course/quiz content, a streaming AI chatbot (Gemini), comments, progress tracking, and a responsive UI.

![Preivew](/public/preview.png)

## Features
- React + Vite SPA with React Router
- Auth: Email/Password and “Continue with GitHub” OAuth
- AI Chatbot: Gemini streaming responses with URL context ingestion
- Courses, quizzes, comments, and progress tracking
- Rate limiting, static uploads, and 404 handling on the backend
- Tailwind CSS styling and a clean, componentized UI

## Tech Stack
- Frontend: React 19, Vite 7, React Router, Tailwind CSS
- Backend: Node/Express, MongoDB/Mongoose, JWT
- AI: @google/generative‑ai (Gemini)

## Project Structure

```
sp-webapp/
├─ backend/
│  ├─ server.js                # Express bootstrap, CORS, rate-limits, routes, uploads
│  ├─ models/
│  │  └─ user.js               # Mongoose User model
│  ├─ routes/
│  │  ├─ auth.js               # Register/Login/Me
│  │  ├─ oauth.js              # GitHub OAuth start + callback
│  │  ├─ gemini.js             # Chat + streaming + URL summarization
│  │  ├─ courses.js, quizzes.js, comments.js, ...
│  └─ uploads/                 # Static files served at /uploads
├─ src/
│  ├─ App.jsx                  # Router + protected/public routes
│  ├─ context/AuthContext.jsx  # Auth state, token storage, helpers
│  ├─ lib/api.js               # API base URL helper
│  ├─ pages/                   # Route pages (login, register, home, chatbot, etc.)
│  │  ├─ login.jsx             # Email/password + GitHub button
│  │  └─ oauth-success.jsx     # OAuth token handoff and redirect
│  └─ components/, features/   # UI components and features
├─ public/                     # Static assets served by Vite
├─ vite.config.js              # Vite dev server + API proxy (to 5050)
├─ package.json                # Scripts and dependencies
└─ README.md                   # You are here
```

## Environment Variables

Backend (required):
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — Secret to sign app JWTs

Backend (optional / recommended):
- `PORT` — API port (default: 5050)
- `HOST` — API host (default: 0.0.0.0 for containers/Render)
- `FRONTEND_URL` — SPA origin for OAuth redirects (e.g., http://localhost:5173 or https://app.example.com)
- `GITHUB_CLIENT_ID` — GitHub OAuth App client ID
- `GITHUB_CLIENT_SECRET` — GitHub OAuth App client secret
- `GITHUB_REDIRECT_URI` — Explicit callback URL if needed (defaults to `https://<host>/api/oauth/github/callback`)

Frontend (optional):
- `VITE_API_BASE_URL` — Absolute API base (omit when using Vite proxy)
- `VITE_GITHUB_OAUTH_URL` — Absolute OAuth start URL (defaults to `/api/oauth/github`)

## Getting Started

Prereqs:
- Node.js 18+ (backend uses global fetch)
- MongoDB instance (local or hosted)

Install dependencies:

```sh
npm install
```

Set environment variables (create a `.env` in repo root):

```env
MONGO_URI="mongodb://localhost:27017/sp-webapp"
JWT_SECRET="replace-with-strong-secret"
```

Run in development (two processes):

```sh
# Terminal 1: start the API server (http://localhost:5050)
npm run server

# Terminal 2: start the Vite dev server (http://localhost:5173)
npm run dev
```

Or run both with one command:

```sh
npm run dev:full
```

Build for production:

```sh
npm run build
# then start only the backend; it serves API only (front-end is static elsewhere)
npm start
```

Note: The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5050` (see `vite.config.js`).

## GitHub OAuth Setup

1) Create a GitHub OAuth app: https://github.com/settings/developers
2) Set the Authorization callback URL(s):
	 - Local: `http://localhost:5050/api/oauth/github/callback`
	 - Prod: `https://<your-api-host>/api/oauth/github/callback`
3) Add env vars to your backend environment:
	 - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, optionally `FRONTEND_URL` and `GITHUB_REDIRECT_URI`.
4) Flow:
	 - Login page → “Continue with GitHub” → `/api/oauth/github`
	 - GitHub consent → `/api/oauth/github/callback`
	 - Backend issues JWT, redirects to SPA `/oauth/success?token=...&user=...`
	 - Frontend stores token/user and navigates to home

## Scripts
- `npm run dev` — Start Vite dev server (frontend)
- `npm run server` — Start backend Express server
- `npm run dev:full` — Run both servers concurrently
- `npm run build` — Build frontend assets
- `npm start` — Start backend (suitable for hosting providers)

## Troubleshooting
- API not reachable in dev?
	- Ensure `npm run server` is running on 5050; Vite proxy forwards `/api` and `/uploads`.
- Render/hosting issues?
	- Backend binds to `0.0.0.0` and uses `process.env.PORT` — verify those envs are set by your host.
- OAuth callback mismatch?
	- The GitHub app callback URL must exactly match your backend route. For local dev, use `http://localhost:5050/api/oauth/github/callback`.
- Missing email from GitHub?
	- We request `user:email`, but if none is returned, the app falls back to a noreply email. You can prompt users to add an email later.
- Node version
	- Use Node.js 18+ so `fetch` is available server-side. Otherwise, install a fetch polyfill.

## Project Ownership
This project is open-source; feel free to use and customize it.

## Author
- [Shindanai Sudprasert](https://github.com/shdnaicode)
