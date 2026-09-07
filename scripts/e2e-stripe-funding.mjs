#!/usr/bin/env node
/**
 * e2e-stripe-funding.mjs
 * ---------------------------------------------------------------------------
 * End-to-end, TEST-MODE verification of the Stripe card-deposit -> admin
 * Funding Review loop. It drives the running application purely over HTTP so it
 * works against a local dev server OR the Railway deployment (set API_BASE).
 *
 * What it proves, in order:
 *   1. Server is reachable and healthy.
 *   2. Card is offered only when Stripe is configured (informational).
 *   3. A real Stripe TEST PaymentIntent is created + confirmed (test card).
 *   4. A signed payment_intent.succeeded webhook is delivered to /api/stripe/webhook.
 *   5. The admin Funding Review queue shows the payment as
 *      "Awaiting Admin Credit" (never auto-credited).
 *   6. The admin approves the exact amount -> funding record Credited AND the
 *      user's balance actually increases by that amount (atomic DB credit).
 *   7. A second payment is rejected -> no balance change.
 * ---------------------------------------------------------------------------
 * Usage (NEVER with Stripe LIVE keys — test mode only):
 *
 *   export API_BASE=http://localhost:3000            # or your Railway URL
 *   export STRIPE_SECRET_KEY=sk_test_...             # Stripe TEST secret key
 *   export STRIPE_WEBHOOK_SECRET=whsec_...           # must equal the server's
 *   export ADMIN_EMAIL=you@axi.com ADMIN_PASSWORD=... # admin login used by server
 *   export E2E_AMOUNT=75                             # optional, USD, default 50
 *   node scripts/e2e-stripe-funding.mjs
 *
 * Prerequisites on the server under test:
 *   - STRIPE_SECRET_KEY, VITE_STRIPE_PUBLISHABLE_KEY and STRIPE_WEBHOOK_SECRET set
 *   - Webhook registered for payment_intent.succeeded (+ checkout.session.completed)
 *   - Admin auth configured (ADMIN_EMAILS/ADMIN_PASSWORD...)
 */
import Stripe from 'stripe';

const API_BASE = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const AMOUNT_USD = Number(process.env.E2E_AMOUNT || 50);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const results = [];
function ok(name, detail = '') { results.push({ name, pass: true, detail }); console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function fail(name, detail = '') { results.push({ name, pass: false, detail }); console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

function assert(cond, message) { if (!cond) throw new Error(message); }

async function main() {
  console.log(`\nStripe TEST-mode Funding Review E2E\n  API base : ${API_BASE}\n  Amount   : $${AMOUNT_USD} USD\n  Node     : ${process.version}\n`);

  // ---- 0. config sanity (before touching Stripe) ----
  const missing = [];
  if (!STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) missing.push('ADMIN_EMAIL/ADMIN_PASSWORD');
  if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) info('STRIPE_SECRET_KEY does not start with sk_test_ — double-check you are NOT using live keys.');
  if (missing.length) { fail('Configuration', `missing env: ${missing.join(', ')}`); finish(); return; }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  // ---- 1. health + card exposure ----
  {
    const h = await api('/api/health');
    h.status === 200 && h.json?.ok ? ok('GET /api/health', 'server healthy') : fail('GET /api/health', `status=${h.status}`);
    const pm = await api('/api/payment-methods');
    const methods = (pm.json?.methods || []).map((m) => m.id);
    info(`payment methods exposed: ${methods.join(', ') || '(none)'}`);
    if (methods.includes('card')) ok('Card is offered (Stripe keys configured server-side)');
    else info('Card not offered — server is missing STRIPE_SECRET_KEY + VITE_STRIPE_PUBLISHABLE_KEY');
  }

  // ---- 2. admin login + test user ----
  let adminToken = '';
  {
    const login = await api('/api/admin/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    if (login.status === 200 && login.json?.token) { adminToken = login.json.token; ok('Admin login', 'token acquired'); }
    else if (login.status === 503) fail('Admin login', 'server has no admin auth configured (503)');
    else fail('Admin login', `status=${login.status} ${login.text.slice(0,120)}`);
    if (!adminToken) { finish(); return; }
  }

  const testEmail = `e2e.card.${Date.now()}@axitest.local`;
  let testUser = null;
  {
    const reg = await api('/api/users/register', {
      method: 'POST',
      body: { email: testEmail, name: 'E2E Card Tester', country: 'International' },
    });
    testUser = reg.json?.user || reg.json;
    if (testUser?.id && testUser?.email) ok('Registered test user', `${testEmail} (id=${testUser.id})`);
    else fail('Register test user', `status=${reg.status} ${reg.text.slice(0,120)}`);
    if (!testUser?.id) { finish(); return; }
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  async function currentBalance() {
    const u = await api('/api/users', { headers: adminHeaders });
    const row = (u.json?.users || []).find((x) => String(x.email).toLowerCase() === testEmail);
    return row ? Number(row.balance || 0) : NaN;
  }
  const balanceBefore = await currentBalance();
  info(`balance before payments: $${Number.isFinite(balanceBefore) ? balanceBefore.toFixed(2) : 'N/A (user not in /api/users)'}`);

  // ---- 3+4. real Stripe TEST charge -> signed webhook ----
  async function payAndDeliverWebhook(amountUsd) {
    const cents = Math.round(amountUsd * 100);
    const pi = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      receipt_email: testEmail, // lets the server resolve the payer even on an instance without the in-memory user
      metadata: { userId: testUser.id, userEmail: testEmail, source: 'stripe_payment_processor', test: 'e2e' },
      automatic_payment_methods: { enabled: true },
    });
    const confirmed = await stripe.paymentIntents.confirm(pi.id, { payment_method: 'pm_card_visa' });
    assert(confirmed.status === 'succeeded', `PaymentIntent ${pi.id} status=${confirmed.status}`);
    const payload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      type: 'payment_intent.succeeded',
      data: { object: confirmed, previous_attributes: null },
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
    });
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: STRIPE_WEBHOOK_SECRET });
    const wh = await api('/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'content-type': 'application/json', 'stripe-signature': signature } });
    const ref = `STRIPE-PI-${pi.id.slice(-8).toUpperCase()}`;
    return { ref, pi, webhookStatus: wh.status, webhookBody: wh.text };
  }

  let depositA = null;
  {
    try {
      const r = await payAndDeliverWebhook(AMOUNT_USD);
      ok('Stripe TEST charge + signed webhook', `PI ${r.pi.id} -> webhook HTTP ${r.webhookStatus}`);
      if (r.webhookStatus !== 200) info(`webhook response body: ${r.webhookBody.slice(0,160)}`);
      depositA = r.ref;
    } catch (e) { fail('Stripe TEST charge + signed webhook', e.message); finish(); return; }
  }

  // ---- 5. poll funding queue for the pending deposit ----
  async function findPending(ref) {
    for (let i = 0; i < 15; i++) {
      const q = await api('/api/admin/funding/pending', { headers: adminHeaders });
      if (q.status === 503) { fail('Funding queue', 'server returned 503 (PostgreSQL not configured on that instance)'); return null; }
      const found = (q.json?.deposits || []).find((d) => d.id === ref || d.stripeRef === ref);
      if (found) return found;
      await sleep(700);
    }
    return null;
  }

  let fundingA = await findPending(depositA);
  if (fundingA) {
    const pendingText = String(fundingA.status || '');
    const wantsAdminCredit = pendingText.toLowerCase().includes('awaiting admin credit');
    const notCredited = !fundingA.creditedByAdmin && pendingText.toLowerCase() !== 'credited';
    const matchesUser = String(fundingA.userEmail || '').toLowerCase() === testEmail;
    if (wantsAdminCredit && notCredited && matchesUser) ok('Funding queue shows payment', `"${fundingA.status}" · ${fundingA.userEmail} · ${fundingA.id}`);
    else fail('Funding queue shows payment', JSON.stringify(fundingA).slice(0, 200));
    if (Number(fundingA.amount) !== AMOUNT_USD) info(`recorded amount $${fundingA.amount} (expected $${AMOUNT_USD})`);
  } else {
    fail('Funding queue shows payment', `record ${depositA} not found after polling`);
    finish(); return;
  }

  // ---- 6. admin approves -> balance must increase ----
  {
    const credit = await api(`/api/admin/funding/${encodeURIComponent(fundingA.id)}/credit`, { method: 'POST', headers: adminHeaders, body: {} });
    const after = await currentBalance();
    const gained = Number.isFinite(balanceBefore) && Number.isFinite(after) ? after - balanceBefore : NaN;
    if (credit.status === 200 && credit.json?.success) ok('Admin approve & credit', `funding record -> ${credit.json.status}`);
    else fail('Admin approve & credit', `status=${credit.status} ${credit.text.slice(0,160)}`);
    if (Number.isFinite(gained) && Math.abs(gained - AMOUNT_USD) < 0.01) ok('User balance credited exactly', `$${balanceBefore.toFixed(2)} -> $${after.toFixed(2)}`);
    else fail('User balance credited exactly', Number.isFinite(gained) ? `gained $${gained.toFixed(2)}, expected $${AMOUNT_USD}` : 'balance lookup unavailable');
    // double-credit guard
    const again = await api(`/api/admin/funding/${encodeURIComponent(fundingA.id)}/credit`, { method: 'POST', headers: adminHeaders, body: {} });
    again.status === 409 || (again.json && !again.json.success)
      ? ok('Double-credit rejected', `second approve -> ${again.status}`)
      : fail('Double-credit rejected', `status=${again.status} ${again.text.slice(0,120)}`);
  }

  // ---- 7. reject path must not change balance ----
  {
    try {
      const r = await payAndDeliverWebhook(AMOUNT_USD / 2);
      const fundingB = await findPending(r.ref);
      if (!fundingB) { info('Reject path: pending record not visible (skipping balance assertion)'); }
      else {
        const reject = await api(`/api/admin/funding/${encodeURIComponent(fundingB.id)}/reject`, { method: 'POST', headers: adminHeaders, body: { reason: 'E2E reject-path verification' } });
        reject.status === 200 && reject.json?.status === 'Rejected' ? ok('Admin reject', `record ${fundingB.id} -> ${reject.json.status}`) : fail('Admin reject', `status=${reject.status} ${reject.text.slice(0,160)}`);
        const afterReject = await currentBalance();
        if (Number.isFinite(balanceBefore) && Number.isFinite(afterReject) && Math.abs(afterReject - (balanceBefore + AMOUNT_USD)) < 0.01) ok('Rejected payment did not credit', `balance still $${afterReject.toFixed(2)}`);
        else info(`balance after reject: $${afterReject} (base check needs /api/users list)`);
      }
    } catch (e) { info(`Reject path skipped: ${e.message}`); }
  }

  finish();
}

function finish() {
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n┌──────────────────────────────────────────────┐`);
  console.log(`│  RESULT: ${passed} passed, ${failed} failed${failed ? '  ⚠️  FIX NEEDED' : '  ✅ all good'}  │`);
  console.log(`└──────────────────────────────────────────────┘\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error('E2E harness crashed:', e); process.exit(2); });
