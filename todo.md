# Axi Trades Complete — Admin Dashboard Functionality Roadmap

## Phase A — Fix Bitcoin / Market Price Accuracy ✅
- [x] Replaced crypto source: Kraken (primary) + Coinbase (fallback)
- [x] Replaced Binance klines with Kraken OHLC API for chart history
- [x] Replaced Binance WebSocket with Coinbase WS in liveMarketFeed.ts

## Phase D — Stripe: Admin-Only Manual Balance Update ✅
- [x] server.ts: webhook + verify-deposit record to pendingDeposits.json, no balance change
- [x] server.ts: GET /api/deposits/pending, POST /api/deposits/credit, POST /api/deposits/dismiss
- [x] server.ts: DepositPending email template + refCode plumbing
- [x] useStripePayment.ts: no auto-credit; shows "Pending Admin Credit" status
- [x] AdminDashboardView: Pending Stripe Deposits panel + Credit User buttons → /api/deposits/credit
- [x] AdminDashboardView: handleApproveDeposit credits SPECIFIC user via server API (not global setLiveBalance)

## Admin Dashboard — Make ALL 26 Sections Functional (MAIN TASK) ✅
- [x] overview: removed fake hardcoded stats → derive from real data (recentUsers.length, kycDocs, pendingDeposits, completedDepositsVol)
- [x] users (directory): real registered users from Firestore onSnapshot, working P&L override + balance controls via server API
- [x] userVerification: real users, batch approve, search/filter, status toggle via /api/users/:id/status + Firestore
- [x] adminReview (KYC): real KYC submissions from kyc.json via /api/kyc/list, approve/reject via /api/kyc/approve + /api/kyc/reject
- [x] handleApproveKYC: removed auto-bonus credit — no balance auto-credit, button says "Approve Verification"
- [x] deposits: connected to /api/deposits/pending + Pending Stripe Deposits panel with Credit User buttons
- [x] withdrawals: dedicated handleApproveWithdrawal (marks processed, no credit) + handleRejectWithdrawal (refunds specific user via server API + Firestore)
- [x] pnlControl: AdminUserPnlControl sub-component — writes P&L overrides to Firestore
- [x] liveEditor: AdminLiveSiteEditor sub-component — useSiteCMS hook, live overlay toggle, element editing, reset
- [x] partnerApplications: empty defaults, fetch from /api/partners/list, functional Approve/Decline + email
- [x] vpsRequests: empty defaults, fetch from /api/vps/list, functional Provision/Reject + email
- [x] promoClaims: empty defaults, fetch from /api/promos/list, functional Credit Bonus/Decline + balance credit + email
- [x] editBot: functional bot config editing, bound to state, saveBotConfig POSTs to /api/admin/bot-config
- [x] sendEmail: functional SMTP config via /api/email/config, test email via /api/email/test
- [x] walletSettings: AdminManageWallet — updateCentralPaymentConfig syncs to Firestore /config/paymentConfig + /system_config/wallets
- [x] walletAddressManagement: AdminManageWallet with initialSubTab="crypto" — same Firestore sync
- [x] systemIntegration: AdminSystemIntegrationStatus — fetches /api/stripe/status, ping/disconnect webhook buttons
- [x] siteCMS: useSiteCMS hook — persists to localStorage + dispatches axi_cms_updated event
- [x] tradingBotSettings: checkboxes bound to state, persist to /api/admin/trading-bot-settings
- [x] investmentPlanSettings: functional plan editing (add/enable/disable), saveInvestmentPlans POSTs to /api/admin/investment-plans
- [x] changePassword: async server call to /api/admin/change-password with current/new password validation
- [x] manageTradingPairs: editable spread/leverage inline, saveTradingPairsToServer POSTs to /api/admin/trading-pairs
- [x] manageCurrency: editable symbol/rate inline, saveCurrenciesToServer POSTs to /api/admin/currencies
- [x] manageCopyTraders: add/feature/unfeature/remove traders, persistCopyTraders POSTs to /api/admin/copy-traders
- [x] manualCredit: functional manual credit to specific user via handleQuickAdjustUserBalance → /api/users/:id/balance
- [x] auditLogs: logAuditAction records entries, category/search filter, export to JSON, clear
- [x] tawktoSettings: enable/disable, test chat widget, credentials form via saveTawkToConfig → /api/tawkto/config
- [x] targetUserIdForManual: removed fake default 'usr_8492' → empty
- [x] pnlOverrideUserSelected: removed fake default 'usr_8492' → empty
- [x] Removed all fake hardcoded user references (usr_8492, alex.t@example.com, trader@axi.com)
- [x] tsc --noEmit: ZERO errors (client + server)
- [x] npm run build: PASSES (Vite + esbuild)

## Phase E — Step-by-Step KYC with Document Upload → Admin Approval
- [ ] Make user-facing KYC multi-step with real document upload → POST /api/kyc/submit
- [ ] Remove fake hardcoded "Step 1 Passed / 75% Verified" timeline in SettingsView
- [ ] AdminDashboardView: show KYC submissions with documents, approve/disapprove buttons

## Phase B — Remove ALL Fake/Simulation (login → payment)
- [ ] Audit & remove simulated balances, fake trades, mock KYC timeline, setTimeout fake uploads

## Phase F — Build, Verify & Preview
- [x] tsc --noEmit clean (ZERO errors)
- [x] npm run build passes
- [ ] Live preview verification
- [ ] git commit + push to origin/main
