import fs from 'node:fs';

const path = 'server.ts';
let s = fs.readFileSync(path, 'utf8');

const duplicateLines = [
  "  const persistedCredit = await dbCreditFunding(id, String((req as any).adminEmail || 'unknown-admin')).catch(() => null);",
  "  const persistedCredit = await dbCreditFunding(id, String(req.headers['x-admin-email'] || 'admin')).catch(() => null);",
];
for (const line of duplicateLines) {
  while (s.split(line).length > 2) s = s.replace(line + '\n' + line, line);
}

const pmBlock = /app\.get\('\/api\/admin\/payment-methods',[\s\S]*?\n\}\);\n\napp\.post\('\/api\/admin\/payment-methods'/;
const pmReplacement = `app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (persistedMethods) {
    const methods = Object.fromEntries(persistedMethods.map((row) => [row.method_type, { ...(row.details || {}), enabled: row.enabled }]));
    return res.json({ success: true, methods, source: 'postgres' });
  }
  return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
});

app.post('/api/admin/payment-methods'`;
s = s.replace(pmBlock, pmReplacement);

const insecureStripe = /if \(stripe && webhookSecret && sig\) \{[\s\S]*?\n  \} catch \(err: any\) \{/;
const secureStripe = `if (!stripe || !webhookSecret || !sig) {
      return res.status(503).send('Stripe webhook verification is not configured');
    }
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {`;
s = s.replace(insecureStripe, secureStripe);

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
// Triggered intentionally to run the final verification workflow.
