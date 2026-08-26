# 🚀 Axi Forex & CFD Web Trading Platform

An enterprise-grade, full-stack Forex & CFD web trading platform designed to deliver institutional-grade execution, live charting terminals, account tier management, performance analytics, and AI-driven market analysis.

---

## 🌟 Key Features

- **📊 Live MT4/MT5 Charting Terminal**: Real-time candlestick charts with customizable timeframes, order execution controls (Buy/Sell, Stop Loss, Take Profit), and live Market Watch tickers across Forex pairs, Crypto, Commodities, and Indices.
- **💼 Multi-Account & Portfolio Management**: Toggle seamlessly between **Demo** and **Live ECN Pro** trading modes. Track active balance, equity, margin requirements, and unrealized P&L in real time.
- **📜 Closed Positions Performance Log & Analytics**:
  - Filter closed trades by direction (`BUY` / `SELL`), outcome (`PROFIT` / `LOSS`), or ticker symbol.
  - One-click export of official **CSV logs** and printable **PDF Performance Statements**.
  - Interactive **Balance History Chart**, **Trading Performance Heatmaps**, and **Portfolio Composition Pie Charts** built with Recharts.
- **🏆 Axi Select Capital Allocation Program**: Dedicated portal tracking trader progression towards up to **$1,000,000 USD** in funded capital with up to 80% profit split.
- **🤖 Gemini AI Voice & Assistant**: Integrated server-proxied AI chat and voice assistant powered by Google Gemini API for real-time market sentiment, trading strategy advice, and voice notes.
- **🛡️ Identity Verification & Security Center**: Complete KYC document upload flow with instant validation, 2-Factor Authentication toggles, and withdrawal security pin configuration.
- **💳 Instant Funds Management**: Deposit and withdrawal modal supporting Crypto (USDT ERC20/TRC20, BTC), Bank Wire Transfer, Credit Cards, and E-Wallets (Skrill/Neteller).

---

## 🔒 Security Architecture & API Protection

> **Crucial Security Implementation**: To protect secret credentials from public exposure, this application implements a full-stack server-side architecture.

- **Zero Client-Side Key Exposure**: Sensitive secrets such as `GEMINI_API_KEY` are strictly accessed on the Node/Express backend (`server.ts`).
- **Proxied Endpoints**: All client calls to AI capabilities route through backend endpoints (`/api/chat`, `/api/voice-transcript`, `/api/market-analysis`), ensuring API keys never reach browser bundles or network logs.
- **Flexible Environment Overrides**: Public client configuration (like Firebase Web SDK) supports `import.meta.env.VITE_FIREBASE_*` overrides with safe default fallbacks.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React Icons, Recharts, Motion (Framer Motion).
- **Backend Server**: Node.js, Express, `esbuild` for CommonJS production bundling.
- **Database & Auth**: Firebase Firestore & Firebase Authentication.
- **AI Integration**: `@google/genai` (Google Gemini SDK).
- **Containerization**: Docker (multi-stage node:20-alpine build) & Google Cloud Build.

---

## 💻 Local Development Setup

### Prerequisites

- **Node.js**: v18.x or v20.x or higher
- **npm**: v9.x or higher

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   cd YOUR_REPOSITORY_NAME
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and add your secret keys:
   ```bash
   cp .env.example .env
   ```
   Open `.env` in your editor and provide your Gemini API key:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   PORT=3000
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

---

## 🚢 Deployment Options

### Option A: Railway (GitHub Automated Deployment)

1. Push your repository to **GitHub**.
2. Log into [Railway.app](https://railway.app) and click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository.
4. Under **Variables**, add:
   - `GEMINI_API_KEY`: *Your secret Gemini API key*
   - `NODE_ENV`: `production`
5. Railway will automatically detect the `Dockerfile` (or build script) and deploy your full-stack trading application with an HTTPS domain.

### Option B: Google Cloud Run

1. Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated.
2. Submit build to Google Cloud Build:
   ```bash
   gcloud builds submit --config=cloudbuild.yaml .
   ```
3. Set your secret environment variable on Cloud Run:
   ```bash
   gcloud run services update axi-forex-service \
     --set-env-vars GEMINI_API_KEY="your_actual_gemini_api_key" \
     --region us-central1
   ```

---

## 📂 Project Structure

```
.
├── server.ts                  # Express backend & Gemini API proxy routes
├── src/
│   ├── App.tsx                # Main state container & view routing
│   ├── firebase.ts            # Firebase initialization & Firestore configuration
│   ├── types.ts               # Global TypeScript interface definitions
│   ├── components/            # UI components (Dashboard, Markets, Axi Select, Funds)
│   └── hooks/                 # Firebase data hooks (useFirebaseData)
├── Dockerfile                 # Multi-stage production Docker container definition
├── cloudbuild.yaml            # Cloud Build & Cloud Run pipeline specification
├── .env.example               # Template for environment variables
└── package.json               # Package manifests & build scripts
```

---

## 📜 License & Disclaimer

Financial trading involves significant risk of loss. High leverage can work against you as well as for you. Please read all relevant disclosure documents and risk warnings before initiating live trading operations.
