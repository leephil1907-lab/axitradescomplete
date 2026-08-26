# AxiTrades Complete - Fix Plan (v2 — thorough audit)

## Phase A: Information Gathering
- [ ] Ask user for: Stripe secret key, Stripe publishable key, Firebase config, GitHub PAT (for push)
- [ ] Ask user for: real bank details to set as defaults (or confirm leave blank for admin to fill)

## Phase B: Thorough Fake Data / Premade Sample Audit
- [x] Audit server.ts seed stores: ALL now empty [] defaults (fake Alex Thompson user already removed)
- [x] Audit auto-approval: KYC=manual admin approve; deposits=manual via update-status; autoApproveLimit NOT enforced (misleading label)
- [x] Audit src: withdraw deducts balance client-side on submit (holds funds); registration sends status:Approved (auto-account-approval)
- [x] demoBalance=present is legit Demo Account mode feature
- [x] Report findings to user (asking for info + confirming fixes)

## Phase C: Auto-Approval Removal
- [ ] Find & remove auto-approval of deposits (server verify-deposit + client-side auto-success)
- [ ] Find & remove auto-approval of withdrawals/payouts
- [ ] Find & remove auto-approval of KYC
- [ ] Ensure all require real admin manual approval

## Phase D: Admin Payment Method Details Control
- [ ] Verify admin can update bank details from dashboard (AdminManageWallet)
- [ ] Verify admin can update/manage crypto wallet addresses from dashboard
- [ ] Verify admin can update Stripe/card method settings from dashboard
- [ ] Ensure all payment-method detail changes persist (Firestore + propagate to deposit UIs)

## Phase E: Live User Registration -> Admin Page Sync
- [ ] Audit registration flow (/api/users/register + client register)
- [ ] Ensure newly registered users appear live on admin dashboard user list
- [ ] Ensure admin sees real-time updates of new registrations

## Phase F: Stripe Keys + Config
- [ ] Configure Stripe secret + publishable keys (.env / server config)
- [ ] Verify card payment flow works end-to-end with real keys

## Phase G: Build, Verify, Push
- [ ] TypeScript typecheck passes
- [ ] Build succeeds
- [ ] Commit & push to repo (needs GitHub PAT)
