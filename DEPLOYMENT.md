# Axi Trades — Deployment Guide

## Platform: Render (Pro, with persistent disk)

This project is a **full-stack application** with two parts:

1. **Frontend** — React + Vite static build (output: `dist/`)
2. **Backend** — Express.js server (`dist/server.cjs`) that runs as a **persistent long-running process**

The Express server does three things at once:
- Serves the static frontend files from `dist/`
- Handles all `/api/*` endpoints (live market prices, Stripe payments, KYC, email, admin dashboard, Gemini AI, etc.)
- Keeps live price feeds running in memory with periodic refresh

### Why not Vercel?

Vercel is **serverless**: short-lived functions that spin up per request and die after. There is no `/api` serverless function file in this repo — the API lives inside `dist/server.cjs`, a full Express server that Vercel cannot run as a persistent process. Every API call hits a non-existent function → 100% error rate. You need a platform that runs long-lived server processes. **Render does.**

---

## ✅ Deploy on Render Pro (recommended)

Render runs Docker web services as long-lived processes and supports **persistent disks** on paid plans, so the runtime data store (`/app/data` — users, KYC uploads, fallback store) survives deploys and restarts.

1. Go to **https://render.com** and sign in with GitHub
2. Click **New → Web Service → Deploy an existing repository**
3. Select `leephil1907-lab/axitradescomplete`
4. Render auto-detects `render.yaml` — settings pre-filled:
   - Runtime: Docker
   - Dockerfile path: `./Dockerfile`
   - Plan: **Pro**
   - Health check: `/api/markets/quotes`
   - Persistent disk: `axitrades-data` (10 GB) mounted at `/app/data`
5. Click **Create Web Service** — Render builds the Docker image and runs `node dist/server.cjs`
6. Add environment variables in the dashboard (see below)

**Cost:** Render Pro is a paid plan; the 10 GB persistent disk is included with the paid service.

### Persistent memory (Render Disk)

The app writes its runtime file-fallback store to `process.cwd() + '/data'` (`data/users.json`, KYC uploads, etc.). The `render.yaml` disk mounts a persistent 10 GB volume at `/app/data`, so that data survives deploys, restarts, and image rebuilds. PostgreSQL (`DATABASE_URL`) remains the source of truth when configured; the disk store is the durable fallback.

---

## Environment Variables to Set

Copy these into the Render dashboard **Environment** tab (do not commit real values):

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `8080` |
| `APP_URL` | Yes | Your Render service URL (e.g. `https://axitrades.onrender.com`) |
| `GEMINI_API_KEY` | Yes | Gemini AI chat/sentiment features |
| `STRIPE_SECRET_KEY` | For payments | Stripe live or test secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `TELEGRAM_BOT_TOKEN` | Optional | Admin notifications |
| `TELEGRAM_CHAT_ID` | Optional | Admin notifications |
| `WEBHOOK_SECRET` | Optional | Trading signal webhook auth |
| `DATABASE_URL` | Optional | PostgreSQL connection string (source of truth when configured) |
| `VITE_FIREBASE_*` | For auth | Firebase client config (7 vars) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key (browser-safe) |
| `VITE_TAWKTO_*` | Optional | Tawk.to live support widget |
| `SMTP_HOST/PORT/USER/PASS` | Optional | Email dispatch (default: Resend SMTP) |
| `WHATSAPP_NUMBER` | Optional | WhatsApp support deep-link number |

---

## Alternative platforms (Docker-capable)

Your `Dockerfile` is production-ready (Node 22, `NODE_ENV=production`, port 8080, serves frontend + API from one process), so it also runs on other Docker-capable platforms such as Google Cloud Run and Fly.io (`fly.toml` and `cloudbuild.yaml` remain in the repo). Render Pro is recommended because it combines long-lived processes with a persistent disk in one managed service.

---

## Local verification

```bash
npm install
npm run build          # tsc --noEmit + vite build + esbuild server bundle
npm start              # node dist/server.cjs  (http://localhost:3000)
curl http://localhost:3000/api/health
```
