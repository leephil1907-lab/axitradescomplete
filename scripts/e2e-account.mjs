import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

// Deliberately refuse to run without an explicitly isolated target and a real
// test inbox. No password/token/code is written to the console or disk.
const bundled = JSON.parse(readFileSync(new URL('../firebase-applet-config.json', import.meta.url)));
const { ACCOUNT_E2E_URL, ACCOUNT_E2E_EMAIL, ACCOUNT_E2E_FIREBASE_API_KEY, ACCOUNT_E2E_FIREBASE_PROJECT } = process.env;
assert.ok(process.env.ACCOUNT_E2E_CONFIRM === 'isolated-staging', 'Set ACCOUNT_E2E_CONFIRM=isolated-staging');
assert.ok(ACCOUNT_E2E_URL && ACCOUNT_E2E_EMAIL && ACCOUNT_E2E_FIREBASE_API_KEY && ACCOUNT_E2E_FIREBASE_PROJECT, 'Set the staging URL, disposable inbox, and staging Firebase web configuration');
const base = new URL(ACCOUNT_E2E_URL);
assert.ok(base.protocol === 'https:' && !/(^|\.)axitrades\.com$/i.test(base.hostname), 'Use an HTTPS staging hostname outside the production domain');
assert.notEqual(ACCOUNT_E2E_FIREBASE_API_KEY, bundled.apiKey);
assert.notEqual(ACCOUNT_E2E_FIREBASE_PROJECT, bundled.projectId);
const email = ACCOUNT_E2E_EMAIL.trim().toLowerCase();
const password = () => `Ax!2${randomBytes(19).toString('hex')}`;
const original = password(), updated = password();
const inbox = createInterface({ input: process.stdin, output: process.stdout });

async function request(url, payload, token) {
  const response = await fetch(url, {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
function firebase(method, payload) {
  return request(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(ACCOUNT_E2E_FIREBASE_API_KEY)}`, payload);
}
async function inboxCode(path, mode) {
  const link = new URL(await inbox.question(`Paste the ${mode} link from the staging inbox: `));
  assert.equal(link.origin, base.origin, 'Email link must point to the staging origin');
  assert.equal(link.pathname, path);
  assert.equal(link.searchParams.get('mode'), mode);
  const code = link.searchParams.get('oobCode');
  assert.ok(code, 'Action link is missing a code');
  return code;
}

try {
  const created = await firebase('signUp', { email, password: original, returnSecureToken: true });
  assert.equal(created.status, 200, 'Disposable signup failed; use a fresh test inbox/sign-in alias');
  const token = created.body.idToken;
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
  assert.equal(claims.aud, ACCOUNT_E2E_FIREBASE_PROJECT, 'Firebase token is not from the expected staging project');
  const registration = await request(new URL('/api/users/register', base), { email, name: 'Staging Test', country: 'Nigeria' }, token);
  assert.equal(registration.status, 200, 'Registration API failed');
  assert.equal(registration.body.user.id, claims.sub);
  assert.equal(registration.body.user.status, 'Pending');
  console.log('PASS: authenticated signup and pending application');

  const verifyCode = await inboxCode('/verify-email', 'verifyEmail');
  assert.equal((await firebase('update', { oobCode: verifyCode })).status, 200, 'Verification code rejected');
  const signedIn = await firebase('signInWithPassword', { email, password: original, returnSecureToken: true });
  assert.equal(signedIn.status, 200, 'Original password sign-in failed');
  const lookup = await firebase('lookup', { idToken: signedIn.body.idToken });
  assert.equal(lookup.body?.users?.[0]?.emailVerified, true);
  console.log('PASS: real inbox verification and successful login');

  const reset = await request(new URL('/api/auth/password-reset/request', base), { email });
  assert.equal(reset.status, 202, 'Reset request was not accepted');
  const resetCode = await inboxCode('/reset-password', 'resetPassword');
  assert.equal((await firebase('resetPassword', { oobCode: resetCode })).body?.email, email);
  assert.equal((await firebase('resetPassword', { oobCode: resetCode, newPassword: updated })).status, 200);
  assert.equal((await firebase('signInWithPassword', { email, password: original, returnSecureToken: true })).status, 400);
  assert.equal((await firebase('signInWithPassword', { email, password: updated, returnSecureToken: true })).status, 200);
  console.log('PASS: real inbox reset, old password rejected and new password accepted');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  inbox.close();
}
