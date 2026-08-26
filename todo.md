# AxiTrades Complete - Fix Plan

## Phase 1: Audit & Discovery (DONE)
- [x] Scanned codebase — demo account mode is legit; real fake item was handle3DSecureAuthorize OTP sim
- [x] Stripe flow: card path fell to fake OTP "authenticating" step when Stripe unconfigured -> the failure
- [x] HeroSlideshow: all 5 images exist + built into dist; autoplay/transition logic verified working
- [x] Prices: DEFAULT_MARKET_QUOTES + INITIAL_BASELINE_PRICES are seed fallbacks overwritten by live feeds (Binance WS, open.er-api.com, Yahoo, Finnhub) — kept as legitimate fallback
- [x] AssetBrandLogo: real brand SVGs (BTC, ETH, SOL, XRP, DOGE, etc.) + smart letter fallback — OK, no fake branding
- [x] Admin bank editor: fully present in AdminManageWallet (bankName, accountName, accountNumber, swiftBic, routing, address, instructions) + Firestore sync — OK
- [x] pnl override (utils/pnlOverride.ts) + wallet addresses (paymentConfigService) preserved per user request

## Phase 2: Fix Fake Data (DONE)
- [x] Removed fake 3DS OTP simulation (handle3DSecureAuthorize) in QuickDepositModal
- [x] Removed fake auto-verification of deposits in server verify-deposit endpoint
- [x] Card flow now only uses real Stripe (Checkout Session -> PaymentIntent -> clear error)
- [x] Removed fake seed user "Alex Thompson" (alex.t@example.com) from server appUsersStore default -> now []
- [x] Verified FundsView "Stripe 3DS Secure" label is on real Stripe checkout-success txs (accurate, kept)
- [x] Verified demoBalance refs are legit Demo Account mode feature (kept intact)
- [x] Verified AdminDashboardView/pnlOverride usr_8492 refs are balance-sync matching logic, not fake seed (kept)
- [x] pnl override + wallet address functionality preserved (untouched)

## Phase 3: Fix Stripe Payment Flow (DONE)
- [x] Diagnosed failure: card path fell to fake OTP "authenticating" when Stripe unconfigured
- [x] Fixed Stripe checkout form / payment intent flow (real Stripe only, no fake fallback)
- [x] Improved StripeCheckoutForm 3DS + decline handling (clear messages, no fake success)
- [x] Guarded card_details against missing publishable key (shows error instead of broken Elements)

## Phase 4: Admin Bank Details Control (DONE)
- [x] Confirmed admin manual update for bank details already exists & works in AdminManageWallet
- [x] Confirmed wallet address management works (Firestore sync via paymentConfigService)

## Phase 5: Fix Carousel & Branding (DONE)
- [x] HeroSlideshow carousel verified: 5 slides, all images present + built into dist, autoplay/nav working
- [x] Price feeds verified: live Binance WS + open.er-api.com + Yahoo + Finnhub (seed = fallback only)
- [x] Branding icons verified: real brand SVGs in AssetBrandLogo + smart fallback

## Phase 6: Build & Verify (DONE)
- [x] TypeScript typecheck passes (tsc --noEmit, exit 0, no errors)
- [x] Build succeeds (vite build + esbuild server bundle, 2754 modules, dist/ produced)
- [x] Patch/cleanup scripts removed (patch1-6.py, cleanup.py)
- [ ] Commit & push to repo (NEEDS: GitHub Personal Access Token — auth not configured in env)
