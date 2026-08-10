# Deploying the AI Reliability Platform

The code lives in this repo; the platform itself is deployed on:

- **Render** — API, worker, and managed Redis (the `render.yaml` blueprint)
- **Vercel** — the dashboard (the `vercel.json` config)
- **Supabase** — Postgres (already used by the API)

## 1. Render (API + worker + Redis)

1. Go to https://dashboard.render.com → **New → Blueprint** and select this repository.
2. Render reads `render.yaml` and creates three services:
   - `ai-reliability-redis` (managed Redis)
   - `ai-reliability-api` (web service)
   - `ai-reliability-worker` (background worker)
3. Fill in the **manual env vars** (marked `sync: false` in the blueprint) on each service:

   | Variable | Where | Value |
   |---|---|---|
   | `DATABASE_URL` | api + worker | Your Supabase connection string (`postgresql+asyncpg://…`) |
   | `API_KEY` | api | A long random string: `openssl rand -hex 32` |
   | `CORS_ORIGINS` | api | Your Vercel dashboard URL, e.g. `https://ai-reliability-platform.vercel.app` |
   | `GITHUB_TOKEN` | api + worker | GitHub token with `repo` scope (private repos + change proposals) |
   | `GITHUB_OWNER` | api + worker | e.g. `Anshul1023` (used for public-repo sync without a token) |
   | `OPENAI_API_KEY` / `AI_MODEL` / `AI_BASE_URL` | api | Optional: real LLM answers (Groq free tier works: `https://api.groq.com/openai/v1`) |

   `REDIS_URL` is injected automatically from the Redis service.

4. Deploy. The API's `/health` should return `{"status":"ok",...}`.

## 2. Vercel (dashboard)

1. Go to https://vercel.com → **Add New → Project** → import this repository.
2. Vercel picks up `vercel.json` (root directory `apps/dashboard`, build `npm run build`, output `dist`).
3. Add an environment variable at build time:
   - `VITE_API_URL` → your Render API URL, e.g. `https://ai-reliability-api.onrender.com`
4. Deploy. Open the dashboard, go to **Settings → API access**, and paste the same `API_KEY`.

## 3. After deploy

- Open the dashboard → **AI Chat → Sync projects** to pull your repos in.
- The monitoring worker starts checking services that have a `check_url` (the portfolio's Vercel/Render
  services are already registered in Supabase).
- Optionally set the repo's homepage on GitHub to the Vercel dashboard URL.

## Security checklist

- [ ] `API_KEY` is set on the API (write endpoints are locked)
- [ ] HTTPS is enabled (Vercel + Render both provide it; the WebSocket uses `wss://` automatically)
- [ ] `CORS_ORIGINS` is your dashboard domain only
- [ ] Secrets are only in the host's env vars — never in the repo
- [ ] `GITHUB_TOKEN` has `repo` scope (or fine-grained Contents + Pull requests write)
