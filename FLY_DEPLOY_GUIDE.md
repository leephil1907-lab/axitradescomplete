# 🚀 Deploy Axi Trades to Fly.io — Complete Step-by-Step Guide

This guide walks you through deploying the full Axi Trades application (React frontend + Express.js backend with live market data) to Fly.io. Fly.io is ideal because it supports **long-running persistent servers** (unlike Vercel, which is serverless-only and caused the 100% error rate you saw).

---

## ⏱️ Estimated Time
**15–25 minutes** (most of it is waiting for the Docker build + deploy)

## 💰 Cost
- **Free tier**: 3 shared-cpu-1x VMs (256MB RAM each) + $5/month free credit
- **Your config**: 512MB RAM, always-on = ~**$2–3/month** (covered by free credit)
- To stay fully free: change `memory = "512mb"` → `memory = "256mb"` in `fly.toml`

---

## 📋 Prerequisites Checklist

| # | Requirement | Status |
|---|-------------|--------|
| 1 | A Fly.io account (sign up at https://fly.io — free) | ☐ |
| 2 | Your GitHub repo: https://github.com/leephil1907-lab/axitradescomplete | ✅ Ready |
| 3 | Your `.env` file with secret values (API keys, Firebase, Stripe, Telegram, etc.) | ☐ |
| 4 | A credit card on Fly.io (required even for free tier — won't be charged) | ☐ |

> **Important:** Your `.env` file is **NOT** in the GitHub repo (it's in `.gitignore` and `.dockerignore` for security). You'll need your local copy of `.env` to know which secret values to set on Fly. If you don't have it handy, the app will still run — Firebase and Tawk.to have built-in fallback configs, and missing API keys (Stripe, Telegram) simply disable those specific features gracefully.

---

## 🔑 Understanding Build-Time vs. Runtime Secrets

Your app has **two types** of environment variables. It's critical to understand the difference:

### Build-Time Variables (`VITE_*` — baked into the frontend during `npm run build`)
These are embedded into the compiled JavaScript bundle during the Docker build. They **cannot** be changed after deployment without rebuilding.

| Variable | Required? | Fallback if missing |
|----------|-----------|---------------------|
| `VITE_FIREBASE_*` (7 vars) | No | ✅ Uses `firebase-applet-config.json` (in repo) |
| `VITE_TAWKTO_*` (3 vars) | No | ✅ Hardcoded fallback values in `tawkto.ts` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | ⚠️ Stripe deposit disabled (shows "use Bank Wire/Crypto") |

> **Good news:** Because Firebase config and Tawk.to both have fallbacks baked into the repo, **the frontend will work out-of-the-box** even if you set zero build-time variables. The only feature that won't work without configuration is Stripe card deposits.

### Runtime Variables (server-side, read by Express at startup)
These are set as Fly **secrets** and can be updated without rebuilding. The server reads them via `process.env`.

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `GEMINI_API_KEY` | AI chat/features | Optional |
| `STRIPE_SECRET_KEY` | Stripe payment processing | Optional (Stripe off without it) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Optional |
| `WEBHOOK_SECRET` | General webhook security | Optional |
| `TELEGRAM_BOT_TOKEN` | Admin notifications (new registrations) | Optional |
| `TELEGRAM_CHAT_ID` | Admin notifications target | Optional |
| `FINNHUB_API_KEY` | Live market data feed | Optional (fallback feeds exist) |
| `ALPHA_VANTAGE_API_KEY` | Live market data feed | Optional (fallback feeds exist) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email sending | Optional |
| `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` | Email sender identity | Optional |
| `APP_URL` | Your deployed URL (for webhooks/links) | Set after first deploy |

> **Key insight:** The live market price feeds have multiple fallback data sources, so even without `FINNHUB_API_KEY` or `ALPHA_VANTAGE_API_KEY`, the `/api/markets/quotes` endpoint will still return live data from other sources.

---

## 🛠️ Step 1 — Install the Fly CLI

### Option A: macOS / Linux (recommended)
Open your **local terminal** (NOT the sandbox) and run:

```bash
curl -L https://fly.io/install.sh | sh
```

This installs `flyctl` to `~/.fly/bin/`. Add it to your PATH:

```bash
# Add to your shell profile (.bashrc, .zshrc, or .profile)
export PATH="$HOME/.fly/bin:$PATH"

# Reload your shell
source ~/.bashrc   # or: source ~/.zshrc
```

Verify:
```bash
fly version
```

### Option B: macOS via Homebrew
```bash
brew install flyctl
```

### Option C: Windows
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

---

## 🔐 Step 2 — Sign Up & Log In to Fly.io

```bash
fly auth login
```

- This opens your browser to fly.io
- If you don't have an account, click **"Sign up"** and create one (free)
- If you already have an account, just sign in
- You'll be asked to add a credit card — **this is required** even for the free tier, but you won't be charged unless you exceed the free limits

Verify you're logged in:
```bash
fly auth whoami
```

---

## 📥 Step 3 — Clone Your Repo Locally

On your **local machine**, clone the repository:

```bash
git clone https://github.com/leephil1907-lab/axitradescomplete.git
cd axitradescomplete
```

> If you already have the repo locally, just `cd` into it and `git pull origin main` to get the latest code (which includes the `fly.toml` and the server fix).

Verify the fly.toml exists:
```bash
cat fly.toml
```

You should see the config with `app = "axitrades"`, region `iad`, 512MB RAM, always-on.

---

## 🚀 Step 4 — Deploy (First Time)

From inside the project directory, run:

```bash
fly deploy
```

### What happens on first deploy:

1. **App creation prompt**: Fly will say something like:
   ```
   An existing fly.toml file was found for app "axitrades" but is not associated with a Fly app.
   Would you like to create a new app? (y/n)
   ```
   **Type `y`** and press Enter.

2. **Choose a deployment region** (if prompted): Pick the one closest to your users:
   - `iad` — Washington, D.C. (default, good for US/global)
   - `lhr` — London (good for Europe)
   - `sin` — Singapore (good for Asia)
   - `syd` — Sydney (good for Australia/Oceania)

3. **Docker build**: Fly builds the Docker image (this takes **5–10 minutes** the first time as it downloads the Node 20 Alpine image and installs npm packages). You'll see build logs streaming.

4. **Deployment**: Fly launches a VM with your image, runs the health check on `/api/markets/quotes`, and once it passes, your app is live.

5. **Success**: You'll see:
   ```
   --> v0 deployed successfully
   ```
   with a URL like `https://axitrades.fly.dev`

> **If the app name "axitrades" is taken** (another Fly user has it), Fly will ask you to pick a different name. Choose something like `axitrades-app` or `axi-portal`, and update the `app = "..."` line in `fly.toml` to match.

---

## 🔑 Step 5 — Set Your Runtime Secrets

After the first deploy, set your server-side secrets. **You only need to set the ones you have values for** — the app works without most of them.

Run these commands one by one (replace the placeholder values with your actual keys from your `.env` file):

### Core (recommended)
```bash
# Your deployed URL (use the URL Fly gave you, e.g. https://axitrades.fly.dev)
fly secrets set APP_URL=https://axitrades.fly.dev

# Gemini AI key (if you have one)
fly secrets set GEMINI_API_KEY=your_gemini_key_here
```

### Market Data (optional — fallbacks exist)
```bash
fly secrets set FINNHUB_API_KEY=your_finnhub_key_here
fly secrets set ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

### Telegram Admin Notifications (optional)
```bash
fly secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here
fly secrets set TELEGRAM_CHAT_ID=your_chat_id_here
```

### Stripe Payments (optional — without this, Stripe deposits are disabled)
```bash
fly secrets set STRIPE_SECRET_KEY=sk_live_xxx
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
fly secrets set WEBHOOK_SECRET=your_webhook_secret_here
```

### Email / SMTP (optional)
```bash
fly secrets set SMTP_HOST=smtp.gmail.com
fly secrets set SMTP_PORT=587
fly secrets set SMTP_USER=your_email@gmail.com
fly secrets set SMTP_PASS=your_app_password
fly secrets set SMTP_FROM_NAME="Axi Support"
fly secrets set SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Set multiple at once (faster)
```bash
fly secrets set \
  APP_URL=https://axitrades.fly.dev \
  GEMINI_API_KEY=your_key \
  FINNHUB_API_KEY=your_key \
  ALPHA_VANTAGE_API_KEY=your_key \
  TELEGRAM_BOT_TOKEN=your_token \
  TELEGRAM_CHAT_ID=your_chat_id
```

> **After setting secrets, Fly automatically redeploys** the app with the new environment. Wait for it to finish (watch the output for "deployed successfully").

---

## 🌐 Step 6 — Open Your Live App

```bash
fly apps open
```

This opens your browser to `https://axitrades.fly.dev` (or whatever your app name is).

### Verify it's working:

1. **Homepage loads** — you should see the Axi homepage with carousel, AXI images, mobile app section
2. **Live prices** — scroll down to the markets table; you should see live BTCUSD, EURUSD, etc. prices updating
3. **Registration** — click "OPEN ACCOUNT", complete the wizard, and you should reach the success screen
4. **Login** — click "Sign in", log in with your registered account, and you should reach the dashboard
5. **Admin** — press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac), log in, and you should see the admin dashboard with your registered user appearing in the users list

---

## 📊 Step 7 — Monitor & Manage

### View live logs
```bash
fly logs
```
This streams real-time server logs. Watch for any errors during registration/login.

### Check app status
```bash
fly status
```
Shows your VM(s), their health, and uptime.

### SSH into the machine (advanced debugging)
```bash
fly ssh console
```

### Scale resources (if needed)
```bash
# Upgrade to 1GB RAM
fly scale memory 1024

# Add a second machine for redundancy
fly scale count 2
```

### List all your secrets
```bash
fly secrets list
```

---

## 🔄 Step 8 — Future Updates (Redeploying)

Whenever you push new code to GitHub and want to deploy it:

```bash
cd axitradescomplete
git pull origin main          # get latest code
fly deploy                    # rebuild + redeploy
```

Fly's Docker build cache makes subsequent deploys **much faster** (2–3 minutes instead of 10).

---

## ⚠️ Build-Time Variables (Advanced — Only If Needed)

If you find that Firebase, Tawk.to, or Stripe aren't working correctly on the deployed site (because the fallback configs differ from your actual project), you need to set build-time `VITE_*` variables during the Docker build. There are two ways:

### Method 1: Create a `.env` file locally before deploy (simplest)

Since `.env` is in `.dockerignore`, it won't be copied into the Docker build. To include it, temporarily remove it from `.dockerignore` OR use Fly build secrets:

Edit `.dockerignore` and remove or comment out the `.env` line:
```
# .env    <-- comment this out
```

Then make sure your local `.env` file has all the `VITE_*` values, and deploy:
```bash
fly deploy
```

> ⚠️ **Security note:** This bakes your secrets into the Docker image layer. Don't push the Docker image to a public registry. Since Fly's registry is private to your account, this is acceptable. After deploy, **re-add `.env` to `.dockerignore`** to be safe.

### Method 2: Use Fly build secrets (recommended, more secure)

```bash
# Set build-time secrets (available during Docker build, NOT at runtime)
fly secrets set \
  --build \
  VITE_FIREBASE_API_KEY=your_key \
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com \
  VITE_FIREBASE_PROJECT_ID=your_project_id \
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com \
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
  VITE_FIREBASE_APP_ID=your_app_id \
  VITE_FIREBASE_DATABASE_ID=your_db_id \
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx \
  VITE_TAWKTO_PROPERTY_ID=your_property_id \
  VITE_TAWKTO_WIDGET_ID=your_widget_id \
  VITE_TAWKTO_DIRECT_URL=your_tawkto_url

# Then deploy (build secrets are used during the build)
fly deploy
```

> **In most cases, you can skip this step entirely** because:
> - Firebase config falls back to `firebase-applet-config.json` (already in the repo)
> - Tawk.to falls back to hardcoded values in `tawkto.ts`
> - Only `VITE_STRIPE_PUBLISHABLE_KEY` has no fallback (Stripe deposits will be disabled)

---

## 🆘 Troubleshooting

### Problem: "Health check failed" during deploy
The health check hits `/api/markets/quotes`. If it fails, the server may need more startup time.

**Fix:** Increase the grace period in `fly.toml`:
```toml
[[http_service.checks]]
  grace_period = "60s"   # was 30s, increase to 60s
```
Then `fly deploy` again.

### Problem: App name "axitrades" is already taken
**Fix:** Choose a different name:
```bash
fly apps create axitrades-portal
# Then update fly.toml:
# app = "axitrades-portal"
fly deploy
```

### Problem: Out of memory (OOM) errors
The Express server + live price feeds can use ~300–400MB under load.

**Fix:** Scale up:
```bash
fly scale memory 1024
```

### Problem: Live prices not updating
The market data feeds need the server to stay running. Check:
```bash
fly logs | grep -i "market\|quote\|price"
```
If feeds aren't initializing, set the API keys:
```bash
fly secrets set FINNHUB_API_KEY=your_key ALPHA_VANTAGE_API_KEY=your_key
```

### Problem: Registration or login errors
Check the server logs:
```bash
fly logs | grep -i "register\|login\|auth\|error"
```
Common causes:
- Firebase Auth domain mismatch → set `VITE_FIREBASE_AUTH_DOMAIN` as a build secret
- Backend not receiving POST → check `fly logs` for the `/api/users/register` request

### Problem: "fly: command not found"
The CLI isn't in your PATH. Fix:
```bash
export PATH="$HOME/.fly/bin:$PATH"
```
Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent.

### Problem: Deploy fails with "Docker build error"
```bash
# Get detailed build logs
fly deploy --verbose

# If node_modules is corrupted, clear the cache
fly deploy --no-cache
```

---

## 📝 Quick Reference — All Commands

```bash
# Setup (one-time)
curl -L https://fly.io/install.sh | sh
fly auth login
git clone https://github.com/leephil1907-lab/axitradescomplete.git
cd axitradescomplete

# Deploy
fly deploy

# Set secrets
fly secrets set APP_URL=https://axitrades.fly.dev
fly secrets set GEMINI_API_KEY=xxx FINNHUB_API_KEY=xxx ALPHA_VANTAGE_API_KEY=xxx
fly secrets set TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=xxx
fly secrets set STRIPE_SECRET_KEY=sk_live_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx

# Manage
fly apps open          # open in browser
fly logs               # view logs
fly status             # check health
fly secrets list       # list secrets

# Update
git pull origin main
fly deploy
```

---

## ✅ Final Checklist

- [ ] Fly CLI installed (`fly version` works)
- [ ] Logged in (`fly auth whoami` shows your email)
- [ ] Repo cloned locally and up to date
- [ ] First deploy completed (`fly deploy` → "deployed successfully")
- [ ] Runtime secrets set (`fly secrets set ...`)
- [ ] App opens in browser (`fly apps open`)
- [ ] Homepage loads with live prices
- [ ] Registration works (test with a new email)
- [ ] Login works (test with the registered account)
- [ ] Admin dashboard shows new users (Ctrl+Shift+A)

**You're live! 🎉** Your full Axi Trades application is running on Fly.io with a persistent Express server, live market data, Firebase authentication, and the admin dashboard — no more Vercel 100% error rate.
