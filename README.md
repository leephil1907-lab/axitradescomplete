# 🚀 Axi — Forex & CFD Web Trading Platform

A full-stack Forex & CFD trading platform with live charts, multi-account management, KYC verification, and an AI market assistant.

## ✨ Features

- **Live Charting Terminal** — Real-time candlestick charts, Buy/Sell execution with SL/TP, Market Watch tickers (Forex, Crypto, Commodities, Indices)
- **Multi-Account Management** — Demo & Live ECN Pro modes, real-time balance/equity/margin/P&L tracking
- **Performance Analytics** — Closed-trade filtering, CSV/PDF exports, balance history & performance heatmaps
- **Axi Select Program** — Trader progression portal for up to $1M funded capital
- **Gemini AI Assistant** — Server-proxied chat & voice assistant for market analysis
- **KYC Verification** — Document upload with admin approval workflow, 2FA, WebAuthn biometrics
- **Funds Management** — Crypto (USDT, BTC), Bank Wire, Credit Card, and E-Wallet deposits/withdrawals
- **Admin Dashboard** — 26 sections: users, KYC review, deposits/withdrawals, Stripe manual credit, bot config, wallet management, audit logs

## 🔒 Security

- API keys (Gemini, Stripe, Firebase) are server-side only — never exposed to the client
- All AI/stripe/payment calls route through backend endpoints
- Environment overrides via `.env`

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, Motion
- **Backend**: Node.js, Express, esbuild (CJS bundling)
- **Database/Auth**: Firebase Firestore & Authentication
- **AI**: Google Gemini SDK
- **Payments**: Stripe
- **Deploy**: Docker, Google Cloud Build, Railway

## 🚀 Quick Start

```bash
git clone https://github.com/leephil1907-lab/axitradescomplete.git
cd axitradescomplete
npm install
cp .env.example .env   # Add your API keys
npm run dev            # http://localhost:3000
```

### Key Environment Variables

```
GEMINI_API_KEY=your_key
STRIPE_SECRET_KEY=your_key
FIREBASE_API_KEY=your_key
PORT=3000
```

## 📦 Build & Deploy

```bash
npm run build    # Vite build + esbuild server bundle
npm run start    # Production server
```

**Railway**: Push to GitHub → New Project → Deploy from repo → add env vars → done.

**Google Cloud Run**: `gcloud builds submit --config=cloudbuild.yaml .`

## 📁 Structure

```
server.ts          # Express backend & API routes
src/
  App.tsx          # Main app & view routing
  firebase.ts      # Firebase init
  components/      # UI components
  hooks/           # Firebase data hooks
Dockerfile         # Production container
.env.example       # Env variable template
```

## ⚠️ Disclaimer

Financial trading involves significant risk of loss. Read all risk disclosures before live trading.
