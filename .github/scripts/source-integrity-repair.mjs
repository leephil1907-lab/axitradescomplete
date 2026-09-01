import fs from 'node:fs';
const p = 'server.ts';
let s = fs.readFileSync(p, 'utf8');

// Repair duplicate declarations introduced by overlapping persistence automation.
const creditLine = "const persistedCredit = await dbCreditFunding(id, String(req.headers['x-admin-email'] || 'admin')).catch(() => null);";
const creditMatches = s.match(new RegExp(creditLine.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g')) || [];
if (creditMatches.length > 1) {
  let seen = 0;
  s = s.replace(new RegExp(creditLine.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'g'), () => (++seen === 1 ? creditLine : ''));
}

const methodsBlock = `const persistedMethods = await dbPaymentMethods().catch(() => null);\n  if (persistedMethods) {\n    const methods = Object.fromEntries(persistedMethods.map((row) => [row.method_type, { ...(row.details || {}), enabled: row.enabled }]));\n    return res.json({ success: true, methods, source: 'postgres' });\n  }`;
let firstMethods = true;
while (s.split(methodsBlock).length > 2) {
  s = s.replace(methodsBlock, firstMethods ? (firstMethods = false, methodsBlock) : '');
}

// Stripe webhooks must fail closed. Unsigned payloads are never accepted.
s = s.replace(/if \(stripe && webhookSecret && sig\) \{[\s\S]*?\} else \{\s*\/\/ Fallback if webhook secret isn't configured yet[\s\S]*?event = typeof bodyString === 'string' \? JSON\.parse\(bodyString\) : bodyString;\s*\}/, "if (!stripe || !webhookSecret || !sig) {\n      return res.status(503).json({ error: 'Stripe webhook verification is not configured' });\n    }\n    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);");

// Trading signal webhooks also fail closed when no shared secret is configured.
s = s.replace(/const expectedSecret = process\.env\.WEBHOOK_SECRET;\n\n  if \(expectedSecret && secretHeader !== expectedSecret\) \{/, "const expectedSecret = process.env.WEBHOOK_SECRET;\n\n  if (!expectedSecret) return res.status(503).json({ error: 'Webhook authentication is not configured' });\n  if (secretHeader !== expectedSecret) {");

// Defense-in-depth: every /api/admin/* endpoint requires verified administrator auth.
const anchor = "app.use(express.json());";
if (s.includes(anchor) && !s.includes("app.use('/api/admin', requireAdmin);")) {
  s = s.replace(anchor, `${anchor}\n\napp.use('/api/admin', requireAdmin);`);
}

fs.writeFileSync(p, s);
console.log('Source integrity repair applied.');
