# AxiTrades website audit — 26 November 2026 (UTC)

Scope: logged-out browser smoke tests against the local production build, source review for availability, and a read-only production reachability check. This is not an authenticated or transactional sign-off.

## Browser results after fixes

Chromium widths: **320, 390, 768, and 1440 CSS pixels**, height 850, reduced motion enabled. The scanner checked document width and sampled visible headings, form controls, buttons and iframes outside intentional horizontal scrollers. It does not establish pixel parity or coverage of every interaction, browser, language, or zoom level.

| Views checked | Result |
|---|---|
| Home, CFDs, Perpetual Futures, Spot Crypto | Rendered at all four widths; no overflow or sampled clipped controls found. |
| Markets terminal | Waited for the ticket to render (not the skeleton); no overflow or sampled clipped controls found. Embedded chart provider availability was not certified. |
| Platforms, Tools, Account Options, Axi Select, Academy, Blog, Economic Calendar | Rendered at all four widths. Tools calculator selector and Blog newsletter submit button clipped at 320px initially; both cleared on retest. |
| Partners, About, Promotions, Legal, Help Centre, Forex VPS | Rendered at all four widths. Form submissions, delivery and fulfilment were not tested. |
| Payment Methods and Client Dashboard links | Both correctly reached the login gate while signed out. Authenticated pages behind the gate were not tested. |
| Admin | Login gate rendered on `/admin`; authenticated operations were not tested. |
| Open Account dialog | Opened, selected Nigeria, and dismissed with Escape at all four widths. No account was created. |
| Language selector | At 320 × 650, seeded French, mocked translated responses, opened the picker, selected English, confirmed stored preference was cleared, and verified English after another reload. Actual upstream translation separately failed in sandbox. |

Across the final sweep: **84 page/viewport checks, zero uncaught page errors**. Before the fix, the public payment configuration subscription attempted to write incomplete defaults and threw a Firestore `undefined` error. Missing configuration now uses local defaults marked not live, without a public write.

Production reachability: `https://axitrades.com/` and `https://axitrades.com/api/health` both returned successfully through the page reader. The homepage showed Gold unavailable during that read while Bitcoin, EUR/USD and Ethereum displayed live-labelled values. This is a point-in-time observation, not a quote-feed or deployment certification.

## Prioritized follow-up

| Priority | Finding | Next check or fix |
|---|---|---|
| High | Dashboard source identifies execution as simulated, including the live-account ledger mode. Spot and perpetual pages are informational. | Clarify simulation and availability consistently before any production trading claims. Verify an execution and custody provider before enabling real orders. |
| High | Deposits, withdrawals, KYC and admin approvals were not tested with provisioned accounts. | Run staging tests with controlled test users, test-mode payment methods, signed webhooks, ledger reconciliation and role checks. Never use real funds for smoke tests. |
| High | Local `POST /api/translate` returned `success:false` with `fetch failed`. English recovery works, but production translations were not independently tested. | Verify translation-provider reachability/API configuration on the production service and show a visible fallback state on errors. Review translation scope: the text-node translator scans page text, so exclude private account and transaction details before broad rollout. |
| Medium | Limit and Stop entry orders are disabled by design. The sentiment gauge is a model estimate. | Keep limitations visible. Validate any future pending-order workflows independently of market orders. |
| Medium | MT4/MT5 and MCP integrations are not enabled in this build. Platform and education views do not imply verified service connections. | Add integration only with provisioned providers, or continue labeling these surfaces informational. |
| Medium | Gold was unavailable in the production sample; availability of all instruments, economic-calendar data and TradingView content remains unverified. | Check source-by-source timestamps and fallback behavior on Render; retest on a supported network. |
| Medium | Many destinations are in-app views without durable URLs. Language reload can return those views to Home. | Add shareable routes and a reload/back/forward test for each page. |
| Medium | Promotions, newsletter, support, partnerships and VPS were render-tested, not delivery-tested. | Use a staging inbox and provider test accounts to verify delivery and remove or label unavailable actions. |
| Low | Vite build still warns about bundle size. Safari/iOS, Firefox, 200% zoom, and longer real translations remain untested. | Add browser-matrix coverage, measure real load times, and split route bundles where useful. |

For the previous design-reference inventory, see [Axi visual comparison](axi-visual-checklist.md).

## Follow-up release checks

Translation now uses the supported Google Cloud Translation v2 API with a bounded timeout and returns HTTP 503 when unavailable. The browser translates only the signed-out public page content, not account/workspace screens or the language picker. A provider failure leaves English content available and shows an English reset. Local tests passed with a mocked provider and with no key configured. To enable real translation, provision `GOOGLE_TRANSLATE_API_KEY` in Render (server-side, restricted to the Cloud Translation API in a billing-enabled project), redeploy, and verify a translation of “Open account” to French returns non-English text. Verify switching back to English and reloading on the deployed site. Do not use mock success as evidence of production availability.

Local signed-out access checks returned 401 for withdrawal and KYC submission and the admin funding, withdrawal and KYC queues. This verifies the logged-out boundary only. For the authenticated sign-off, use an isolated staging database, a separate test payment account, synthetic identity documents, and one ordinary and one administrator test user:

1. **Deposits:** Use `npm run test:e2e:stripe` with the staging URL and Stripe test-mode configuration. Check that a confirmed payment does not credit until approved, webhook replay and duplicate approval do not double-credit, rejection leaves the balance unchanged, and the ledger reconciles.
2. **Withdrawals:** Check invalid amounts and insufficient balances; submit one valid synthetic request, verify its reservation, reject once and verify the release exactly once. On a second request, verify approval and audit trail. Do not infer provider payout from an approved status.
3. **KYC:** Submit synthetic documents on a disposable account; verify the user cannot view another account’s documents and cannot self-approve. Exercise approval and rejection, check persistence after reload and verify any KYC-gated action.
4. **Admin:** With the ordinary account, confirm admin queues and mutations remain inaccessible. With the admin account, verify queue visibility, approval/rejection transitions, audit attribution, and expired-session behavior.
5. **Trading:** Treat execution as simulated and Spot/Perpetual pages as informational. No live brokerage, exchange or custody test is in scope until a real integration is approved and provisioned.
