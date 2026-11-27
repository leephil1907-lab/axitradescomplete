# Account, email and motion review

Reference: `https://www.axi.com/int/` exposes a video hero and numbered campaigns. This build now moves the campaign artwork and lighting within each active slide, not just at the transition. These are local animations on existing imagery, not the reference site's video footage. Exact media and visual parity remain open. Pause stops both artwork and slide advancement; reduced motion disables them.

## Local verification

- Chromium at 320, 390, 768 and 1440px: opened account picker, selected Nigeria, continued to `/signup`, reloaded the signup route, opened `/login`, toggled password visibility, opened recovery and checked missing-provider behavior. A missing verification code displayed an error on the verification page. No uncaught page errors or page-level horizontal overflow were observed in those checks.
- 390px: confirmed the active artwork transform changes between frames, pause stops the animation, and resume advances to the next campaign. CFDs, Perpetual Futures and Spot Crypto deep links rendered without page-level horizontal overflow.
- A mocked `202` recovery response reached the confirmation screen and the submitted address was normalized. Local registration without a token was denied. No inbox delivery, actual account signup, or successful Firebase login was simulated as a production pass.
- Production build and whitespace check passed. Changes are not deployed.

## Staging acceptance before release

1. Configure the staging `APP_URL`, the matching Firebase Admin service account and Firebase authorized domain, and a Resend key with a verified sender domain. Optionally configure the admin notification recipient. Use an isolated Firebase project and a controlled inbox.
2. Complete signup with a disposable test identity. Confirm it creates one pending application, refresh/retry does not duplicate it, and a matching verification link arrives by email. Confirm the link works in a private browser window and an already-used or invalid link produces a clear error.
3. Sign out and sign in with correct and incorrect credentials. Confirm dashboard navigation and sign-out. Test Google and Facebook only if enabled and configured in staging.
4. Request password recovery for the test account, open the delivered link, change the password, and confirm the old password fails and the new one works. Verify known and unknown addresses receive the same public acknowledgement, and a burst hits the rate limit. A `202` only acknowledges the request, not delivery.
5. Check notification delivery and links in mobile email clients. If reference-motion parity is required, obtain approved source video files and compare rendered crops and timing at matched desktop and mobile sizes.

## Follow-up implementation

- Removed the old welcome-email call from the account profile listener, which could send another notification on a profile refresh. Completed registration is now the source of welcome mail. The signup completion screen offers authenticated, rate-limited verification resend; the recipient is taken from Firebase, not from input supplied to the endpoint.
- Tested the local server with mocked Firebase Admin and Resend: registered successfully, rejected mismatched identities, ignored a client-supplied approval and balance, retried without duplicating the welcome email, generated verification and reset URLs in HTML and plain text, and verified resend auth and throttling. These checks do not exercise real inbox delivery.
- An isolated staging build can now use `VITE_USE_STAGING_FIREBASE=true` with the staging project's `VITE_FIREBASE_*` values at build time. Missing config or reusing the bundled production project fails rather than silently selecting production. Docker builds accept the same public build arguments. Keep Firebase Admin and Resend settings on the staging server only.
- Run `npm run test:e2e:account` from an interactive terminal with `ACCOUNT_E2E_CONFIRM=isolated-staging`, `ACCOUNT_E2E_URL`, `ACCOUNT_E2E_EMAIL`, `ACCOUNT_E2E_FIREBASE_PROJECT`, and `ACCOUNT_E2E_FIREBASE_API_KEY`. It requires a fresh disposable inbox, validates the email links against the staging hostname, exercises real Firebase signup and login, verifies the delivered confirmation link, and uses the delivered reset link to check both old and new passwords. Remove the disposable test identity after the run.
