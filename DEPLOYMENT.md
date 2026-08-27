# Axi Trades — Deployment Guide

## Why Vercel Shows 100% Error Rate (648 Failed Invocations)

Your project is a **full-stack application** with two parts:

1. **Frontend** — React + Vite static build (output: `dist/`)
2. **Backend** — Express.js server (`dist/server.cjs`) that runs as a **persistent long-running process**

The Express server does three things at once:
- Serves the static frontend files from `dist/`
- Handles all `/api/*` endpoints (live market prices from Kraken/Coinbase/Yahoo, Stripe payments, KYC, email, admin dashboard, Gemini AI, etc.)
- Keeps live price feeds running in memory with periodic refresh

**The problem:** Vercel is a **serverless** platform. It runs short-lived functions that spin up on each request and die after. Your `vercel.json` has this rewrite:

```json
{ "source": "/api/(.*)", "destination": "/api" }
```

This tells Vercel to send all `/api/*` requests to a serverless function at `/api` — **but no such function file exists** in your repo. The API lives inside `dist/server.cjs`, a full Express server that Vercel cannot run as a persistent process. So every single API call (648 of them) hits a non-existent function → **100% error rate**.

Vercel simply cannot host this architecture. You need a platform that runs **long-lived server processes** (not serverless functions).

---

## ✅ Recommended Deployment Platforms

All four options below run your Dockerfile as-is. Your `Dockerfile` is already production-ready (Node 20, `NODE_ENV=production`, port 8080, serves both frontend + API from one process).

### Option 1 — Railway (Easiest, recommended)

Railway runs Docker containers and supports long-running Node servers natively.

1. Go to **https://railway.app** and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your repo `leephil1907-lab/axitradescomplete`
4. Railway auto-detects the `railway.json` + `Dockerfile`
5. Go to **Settings → Networking → Generate Domain** to get a public URL
6. Go to **Variables** tab and add your environment variables (see below)
7. Deploy — Railway builds the Docker image and runs `node dist/server.cjs`

**Cost:** Free tier ($5 credit/month), then ~$0.000463/GB-hour. A small app costs under $5/month.

### Option 2 — Render (Great free tier)

Render runs Docker web services with a generous free tier.

1. Go to **https://render.com** and sign in with GitHub
2. Click **New → Web Service → Deploy an existing repository**
3. Select `leephil1907-lab/axitradescomplete`
4. Render auto-detects `render.yaml` — settings pre-filled:
   - Runtime: Docker
   - Dockerfile path: `./Dockerfile`
   - Health check: `/api/markets/quotes`
5. Add environment variables in the dashboard (see below)
6. Click **Create Web Service** — Render builds and deploys

**Cost:** Free tier (512MB RAM, spins down after 15 min inactivity). Paid starts at $7/month for always-on.

### Option 3 — Google Cloud Run (Most scalable, pay-per-use)

Your Dockerfile was originally built for Cloud Run (`EXPOSE 8080`).

1. Install Google Cloud CLI: `https://cloud.google.com/sdk/docs/install`
2. Authenticate: `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`
3. Build and push the image:
```bash
gcloud run deploy axitrades \
  --source . \
  --region us-central1 \
  --port 8080 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars NODE_ENV=production,PORT=8080
```
4. Cloud Run builds the Dockerfile, deploys, and gives you a URL like `https://axitrades-xxxx-uc.a.run.app`
5. Add other env vars (GEMINI_API_KEY, STRIPE_SECRET_KEY, etc.) via the Console or `--set-env-vars`

**Cost:** Generous free tier (2 million requests/month, 360,000 GB-seconds/month). Pay-per-use after that.

### Option 4 — Fly.io (Fast global edge)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` in the project directory (it detects the Dockerfile)
3. Follow prompts to create the app
4. Set secrets: `fly secrets set GEMINI_API_KEY=xxx STRIPE_SECRET_KEY=xxx`
5. Deploy: `fly deploy`
6. Get URL: `fly apps info`

**Cost:** Free tier includes up to 3 shared-cpu-1x VMs with 256MB RAM.

---

## Environment Variables to Set

Copy these from your `.env` file into the platform's environment variable settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Set to `8080` (or let platform set it) |
| `APP_URL` | Yes | Your deployment URL (e.g. `https://axitrades.up.railway.app`) |
| `GEMINI_API_KEY` | Yes | For AI chat/sentiment features |
| `STRIPE_SECRET_KEY` | For payments | Stripe live or test secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `TELEGRAM_BOT_TOKEN` | Optional | For admin notifications |
| `TELEGRAM_CHAT_ID` | Optional | For admin notifications |
| `WEBHOOK_SECRET` | Optional | Trading signal webhook auth |
| `VITE_FIREBASE_*` | For auth | Firebase client config (7 vars) |

---

## Quick Summary

| Platform | Can run Express server? | Free tier? | Setup difficulty |
|----------|------------------------|------------|-----------------|
| **Vercel** | ❌ No (serverless only) | Yes | — (won't work) |
| **Railway** | ✅ Yes | $5 credit/mo | ⭐ Easiest |
| **Render** | ✅ Yes | Yes (spins down) | ⭐⭐ Easy |
| **Cloud Run** | ✅ Yes | 2M req/mo free | ⭐⭐⭐ Medium |
| **Fly.io** | ✅ Yes | 3 VMs free | ⭐⭐⭐ Medium |

**My recommendation:** Start with **Railway** — it's the fastest to set up (just connect your GitHub repo and it auto-detects everything), gives you a public URL immediately, and runs the full Express server with all API endpoints, live prices, Stripe, KYC, and admin dashboard working exactly as they do locally.
