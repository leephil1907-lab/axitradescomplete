# Stripe test-mode → Funding Review E2E

Verifies the real **Stripe TEST-mode** card-deposit loop end-to-end over HTTP:

1. Admin login (`POST /api/admin/login`).
2. Register a throwaway test user (`POST /api/users/register`).
3. Create + confirm a **real Stripe test PaymentIntent** (test card `pm_card_visa`, the API-side equivalent of `4242 4242 4242 4242`) via the Stripe API using `sk_test_…`.
4. Deliver a **cryptographically signed** `payment_intent.succeeded` webhook to `/api/stripe/webhook` (no webhook tunnel needed — the signature is generated locally with the exact secret the server uses).
5. Assert the deposit appears in the admin Funding Review queue (`GET /api/admin/funding/pending`) as **"Awaiting Admin Credit"** and is **never auto-credited**.
6. Admin approves the exact amount (`POST /api/admin/funding/:id/credit`) → funding record becomes `Credited` **and** the user's Postgres balance rises by exactly that amount (atomic DB transaction + ledger row).
7. Double-credit is rejected (HTTP 409).
8. A second payment is **rejected** (`/reject`) → balance is unchanged.

No code path credits Stripe automatically; the admin manual credit in Funding Review is the only balance movement.

## Prerequisites

**On the server under test** (dev `.env` or Railway variables):

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` (TEST key) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (endpoint secret) |
| `DATABASE_URL` | Postgres (funding queue is DB-backed) |
| `ADMIN_EMAILS` (or `ADMIN_EMAIL`) | admin login email |
| `ADMIN_PASSWORD_HASH` + `ADMIN_PASSWORD_SALT` | scrypt password (what `ADMIN_PASSWORD` resolves to at login) |
| `ADMIN_SESSION_SECRET` | HMAC secret for admin tokens |

For the **deployed Railway app** also register a Stripe test webhook endpoint pointing at
`https://<railway-app>.up.railway.app/api/stripe/webhook` with events
`payment_intent.succeeded` and `checkout.session.completed`, and copy its signing secret
(`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

> ⚠️ Test mode only. Never run this against live Stripe keys.

## Run

```bash
export API_BASE=http://localhost:3000        # or https://<railway-app>.up.railway.app
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
export ADMIN_EMAIL=you@example.com
export ADMIN_PASSWORD=your-admin-password
export E2E_AMOUNT=50                          # optional, USD (default 50)

npm run test:e2e:stripe                       # == node scripts/e2e-stripe-funding.mjs
```

Exit code `0` = every assertion passed; non-zero otherwise.

## What the user does after this run

1. Open the deployed app, log in as the test user, fund via card (or use the PaymentIntent IDs printed
   in the run).
2. In the **Admin Dashboard → Funding Review**, approve the deposit; the balance and ledger update in
   the same atomic transaction.
3. Confirm the Telegram admin notification fired and the user's **Balance / Transactions / KPIs**
   all reflect the credit (Postgres is the source of truth).

## Node version

The project targets **Node 22** (`.nvmrc` = `22`, `package.json` `engines: >=22 <23`,
`Dockerfile` `node:22-alpine`). Local dev should run on Node 22:
`nvm use` / `fnm use` after switching to Node 22 LTS.
