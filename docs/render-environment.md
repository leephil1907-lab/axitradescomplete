# Render environment setup

Open **Render → axitrades → Environment**. Keep credentials in Render, not in Git or chat. Keep existing values for services already in use.

| Priority | Variable | Value or source |
|---|---|---|
| Required | `APP_URL` | Canonical HTTPS website origin, e.g. `https://axitrades.com`. No path. |
| Required | `FIREBASE_SERVICE_ACCOUNT_JSON` | Complete service account JSON from the matching Firebase project, pasted as one Render variable. Never use a `VITE_` prefix for it. |
| Required for email | `RESEND_API_KEY` | Resend server key with send permission. |
| Required for email | `RESEND_FROM_EMAIL` | Sender address on a domain verified in Resend, e.g. `no-reply@axitrades.com`. |
| Optional | `RESEND_FROM_NAME` | `Axi Trades` |
| Optional | `ADMIN_NOTIFICATION_EMAIL` | Private inbox for registration notifications. |
| Required for translation | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud key restricted to Cloud Translation API, enabled on a billing-enabled project. |
| Already in blueprint | `NODE_ENV`, `PORT` | `production`, `8080` for this Docker service. |
| If already using the integration | `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Preserve the applicable existing settings; not required for the display or account emails. |

Also add the hostname to **Firebase Authentication → Settings → Authorized domains**, enable the Email/Password provider, and verify the sender domain in Resend. After the matching code is deployed, check `/api/health`, then verify signup and password recovery with a controlled test inbox. See [account and motion review](account-and-motion-review.md) for the staging runner.

For a separate staging Docker build, use public build arguments `VITE_USE_STAGING_FIREBASE=true`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_DATABASE_ID`. Pair these with that staging project's server-side Firebase JSON and staging `APP_URL`. Do not enable the staging flag in production.
