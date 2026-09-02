import fs from 'node:fs';

const path = 'server.ts';
let s = fs.readFileSync(path, 'utf8');

// Remove accidental consecutive duplicate declarations deterministically.
const duplicateLines = [
  "  const persistedCredit = await dbCreditFunding(id, String((req as any).adminEmail || 'unknown-admin')).catch(() => null);",
  "  const persistedCredit = await dbCreditFunding(id, String(req.headers['x-admin-email'] || 'admin')).catch(() => null);",
  "  const persistedMethods = await dbPaymentMethods().catch(() => null);",
];
for (const line of duplicateLines) {
  while (s.includes(line + '\n' + line)) s = s.replace(line + '\n' + line, line);
}

// Normalize the admin payment-method read route and fail closed when PostgreSQL
// is unavailable. This also removes any duplicate declarations left by older
// repair workflows.
const pmStart = s.indexOf("app.get('/api/admin/payment-methods'");
const pmPost = s.indexOf("app.post('/api/admin/payment-methods'", pmStart);
if (pmStart !== -1 && pmPost !== -1) {
  const pmBlock = `app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (persistedMethods) {
    const methods = Object.fromEntries(persistedMethods.map((row) => [row.method_type, { ...(row.details || {}), enabled: row.enabled }]));
    return res.json({ success: true, methods, source: 'postgres' });
  }
  return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
});

`;
  s = s.slice(0, pmStart) + pmBlock + s.slice(pmPost);
}

// Rebuild only the Stripe signature-verification prefix using stable route
// markers, so the cleanup can safely repair both the original and any
// previously malformed intermediate version.
const stripeStart = s.indexOf("app.post('/api/stripe/webhook'");
const pingMarker = s.indexOf('  // Record active ping activity', stripeStart);
const tryMarker = s.indexOf('  try {', stripeStart);
if (stripeStart !== -1 && tryMarker !== -1 && pingMarker !== -1 && tryMarker < pingMarker) {
  const verification = `  try {
    if (!stripe || !webhookSecret || !sig) {
      return res.status(503).send('Stripe webhook verification is not configured');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(\`⚠️ Webhook signature verification failed:\`, err.message);

    // Update ping activity for verification failures.
    webhookPingState.lastPingTimestamp = Date.now();
    webhookPingState.lastPingEvent = 'verification.failed';
    webhookPingState.lastPingStatus = 'Disconnected';
    webhookPingState.lastPingLatencyMs = Date.now() - startTime;
    webhookPingState.history.unshift({
      timestamp: new Date().toISOString(),
      event: 'verification.failed',
      status: 'Disconnected',
      latencyMs: Date.now() - startTime,
      source: 'Stripe Signature Verification'
    });
    if (webhookPingState.history.length > 20) webhookPingState.history.pop();

    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

`;
  s = s.slice(0, tryMarker) + verification + s.slice(pingMarker);
}

// Trading signal webhooks must fail closed when the shared secret is absent or
// incorrect. Authentication is not execution, so don't claim broker execution.
s = s.replace(
  "  if (expectedSecret && secretHeader !== expectedSecret) {",
  "  if (!expectedSecret || secretHeader !== expectedSecret) {"
);
s = s.replace(
  "message: 'Webhook signal received and processed by Axi execution gateway',",
  "message: 'Webhook signal received and authenticated; execution requires a configured broker execution gateway',"
);

fs.writeFileSync(path, s);
console.log('Idempotent production cleanup completed.');
// Final cleanup rerun marker: 2026-09-02.
