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
  while (s.includes(line + '\n' + line)) {
    s = s.replace(line + '\n' + line, line);
  }
}

// Normalize the admin payment-method read route and make it fail closed when
// PostgreSQL is unavailable instead of silently falling back to a local file.
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

// Stripe webhooks must be cryptographically verified. Never accept an
// unsigned request as a payment event.
const insecureStripe = /if \(stripe && webhookSecret && sig\) \{[\s\S]*?\n  \} catch \(err: any\) \{/;
const secureStripe = `if (!stripe || !webhookSecret || !sig) {
      return res.status(503).send('Stripe webhook verification is not configured');
    }
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {`;
s = s.replace(insecureStripe, secureStripe);

// Trading signal webhooks must fail closed when the shared secret is absent
// or incorrect. Authentication is not execution: the response must not claim
// that a broker order was executed unless a real execution gateway is wired.
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
