# Axi Trades - Production Architecture & Migration Guide

## Overview
This platform has been transitioned from prototype mocks to a hardened, production-ready full-stack architecture with authentic live market feeds, secured payment gateways, transactional email dispatch, real-time Firestore persistence, and server-side verification.

---

## Key Architectural Updates

### 1. Market Data Engine (`server.ts` & `/api/markets/quotes`)
- **Real Feeds**: Direct dual-layer integration with Yahoo Finance v2 (Currencies, Indices, Commodities, Equities) and Binance public tickers (Crypto).
- **In-Memory Cache**: 1.2-second rate-limiting cache to prevent third-party rate limits while streaming real market ticks to clients.
- **WebSocket Streaming**: Multi-symbol live tick broadcast to front-end trading sessions.

### 2. Payment Gateway & Deposit Verification (`server.ts` & `useStripePayment.ts`)
- **Server Verification**: `/api/stripe/verify-deposit` verifies transactions against Stripe before crediting balances.
- **Webhook Handlers**: `/api/stripe/webhook` handles raw body signature verification (`stripe-signature`) for `checkout.session.completed` and `payment_intent.succeeded`.
- **Anti-Replay**: Clean URL routing prevents duplicated deposit crediting on page reload.

### 3. Account Data & Firestore Security (`firestore.rules` & `useFirebaseData.ts`)
- **Zero Mock Data**: Removed hardcoded test emails, simulated account balances, and dummy master traders.
- **Granular Rules**: Strict owner-only access for `/users/{userId}/*` collections.
- **Admin Configuration**: Closed public write permissions on `/config` and `/system_config`; updates require authenticated administrator credentials.

### 4. Direct Mail & Telegram Notifications
- **Direct SMTP**: Configured via `SMTP_*` environment variables in `server.ts` using Nodemailer.
- **Telegram Bot**: Instant admin alerting via `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for registrations, deposits, withdrawals, KYC submissions, and support requests.

### 5. AI Assistant & Market Intelligence
- **Gemini Proxy**: Server-side Gemini API proxy (`/api/ai/chat`) with strict system instructions and rate limits.
- **Live News Feed**: Multi-provider financial news aggregator supporting Finnhub, Alpha Vantage, and global RSS feeds.

---

## Deployment Checklist

1. **Environment Configuration**:
   - Copy `.env.example` to `.env` and provide real credentials (`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).
2. **Deploy Firestore Rules**:
   - Run `firebase deploy --only firestore:rules` or use the deployment tool.
3. **Build & Run**:
   - `npm run build`
   - `npm run start`
