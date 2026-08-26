# AxiTrades Complete - Fix Plan (COMPLETE)

## Phase A: Information Gathering (DONE)
- [x] Received: Stripe secret key, publishable key, webhook secret, GitHub PAT
- [x] Bank details: preset empty defaults (admin fills from dashboard)

## Phase B: Thorough Fake Data / Premade Sample Audit (DONE)
- [x] server.ts seed stores: ALL empty [] defaults (fake Alex Thompson user removed)
- [x] No fake/premade/mock transactions, users, partners, vps, promos in stores
- [x] demoBalance = legit Demo Account mode (kept); seed prices = live-feed fallback (kept)
- [x] AssetBrandLogo = real brand SVGs; HeroSlideshow = 5 real images (built into dist)

## Phase C: Auto-Approval Removal (DONE)
- [x] Removed auto-account-approval: LoginView email + Google login no longer send status:'Approved'
- [x] New users now register as 'Pending' + kycStatus 'NOT_STARTED' (server default)
- [x] server register: existing users keep admin-set status/verification/kyc/balance on re-login
- [x] KYC: user submits (Under Review) -> admin approves/rejects (normal protocol)
- [x] Deposits: 'Pending Verification' -> admin manual approval (no auto-credit)
- [x] Relabeled misleading 'Auto-Approval Limit' -> 'Manual Review Threshold' (honest copy)

## Phase D: Admin Payment Method Details Control (DONE)
- [x] Bank details editor (AdminManageWallet): name, holder, account/IBAN, SWIFT, routing, address, instructions
- [x] Empty preset defaults (no fake data) -> admin fills from dashboard -> Firestore -> propagates to deposit UI
- [x] Crypto wallet addresses (BTC/ETH/USDT) management preserved
- [x] Payment method enable/disable + maintenance mode controls preserved

## Phase E: Live User Registration -> Admin Page Sync (DONE)
- [x] Registration syncs to backend (/api/users/register) -> appears in admin user list
- [x] Admin dashboard polls /api/users every 4s + axi_registered_user_event listener -> live updates

## Phase F: Stripe Keys + Config (DONE)
- [x] .env created with real LIVE keys (gitignored): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLISHABLE_KEY
- [x] Publishable key embedded in client build (verified); secret key NOT leaked to client JS
- [x] Card payment flow: real Stripe Checkout Session -> PaymentIntent -> clear error (no fake fallback)

## Phase G: Build, Verify, Push (DONE)
- [x] TypeScript typecheck passes (tsc --noEmit exit 0)
- [x] Build succeeds (vite + esbuild, 2754 modules, dist produced)
- [x] Rebased on remote (resolved QuickDepositModal conflict, kept fake-3DS removal)
- [x] Committed & PUSHED to repo (419c1b8 on origin/main)
- [x] Token removed from git remote URL (security)
