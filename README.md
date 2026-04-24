# webdevscav

Competitive scavenger hunt for web developers.

## Project Structure

- `client`: React + Vite frontend
- `server`: Express + TypeScript game API
- `api/[...all].ts`: Vercel serverless entrypoint for the Express API

## Local Development

1. Copy `.env.example` to `.env` and fill values.
2. In one terminal:
   - `cd server`
   - `npm install`
   - `npm run dev`
3. In another terminal:
   - `cd client`
   - `npm install`
   - `npm run dev`

The frontend defaults to `/api` in production, but you can override with `VITE_API_BASE_URL`.

## Deploy To Vercel

This repo is configured to deploy as a single Vercel project:
- static frontend from `client`
- serverless API from `api/[...all].ts`

### 1) Import the repo into Vercel

- In Vercel, choose **Add New Project** and import this repository.
- Keep the project root as the repository root.
- `vercel.json` handles build and routing.

### 2) Add environment variables (Project Settings → Environment Variables)

Required:
- `GEMINI_API_KEY`

Recommended for persistent leaderboard/session storage:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string of a Firebase service account key)

Frontend (if needed):
- `VITE_API_BASE_URL` (default is `/api`, usually no change needed)

Optional:
- `CORS_ORIGIN` (set to your production URL if you want strict CORS, e.g. `https://your-app.vercel.app`)

### 3) Deploy

- Trigger deploy from Vercel UI.
- Once complete, verify:
  - `https://your-app.vercel.app/api/health` returns `{ status: "ok" ... }`
  - UI loads and game start works.

## Notes

- If Firebase Admin variables are missing, the backend falls back to in-memory storage (not shared/persistent across serverless instances).
- For real public usage, configure Firebase Admin env vars so leaderboard data persists.
