import fs from 'node:fs';

const p = 'server.ts';
let s = fs.readFileSync(p, 'utf8');

// Repair duplicate persistence declarations without constructing a fragile RegExp.
const creditLine = "const persistedCredit = await dbCreditFunding(id, String(req.headers['x-admin-email'] || 'admin')).catch(() => null);";
const creditFirst = s.indexOf(creditLine);
if (creditFirst !== -1) {
  const before = s.slice(0, creditFirst + creditLine.length);
  const after = s.slice(creditFirst + creditLine.length).split(creditLine).join('');
  s = before + after;
}

const methodsBlock = `const persistedMethods = await dbPaymentMethods().catch(() => null);\n  if (persistedMethods) {\n    const methods = Object.fromEntries(persistedMethods.map((row) => [row.method_type, { ...(row.details || {}), enabled: row.enabled }]));\n    return res.json({ success: true, methods, source: 'postgres' });\n  }`;
const methodsFirst = s.indexOf(methodsBlock);
if (methodsFirst !== -1) {
  const before = s.slice(0, methodsFirst + methodsBlock.length);
  const after = s.slice(methodsFirst + methodsBlock.length).split(methodsBlock).join('');
  s = before + after;
}

// Stripe webhooks must fail closed. Unsigned payloads are never accepted.
s = s.replace(/if \(stripe && webhookSecret && sig\) \{[\s\S]*?\} else \{\s*\/\/ Fallback if webhook secret isn't configured yet[\s\S]*?event = typeof bodyString === 'string' \? JSON\.parse\(bodyString\) : bodyString;\s*\}/, "if (!stripe || !webhookSecret || !sig) {\n      return res.status(503).json({ error: 'Stripe webhook verification is not configured' });\n    }\n    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);");

// Trading signal webhooks also fail closed when no shared secret is configured.
s = s.replace(/const expectedSecret = process\.env\.WEBHOOK_SECRET;\n\n  if \(expectedSecret && secretHeader !== expectedSecret\) \{/, "const expectedSecret = process.env.WEBHOOK_SECRET;\n\n  if (!expectedSecret) return res.status(503).json({ error: 'Webhook authentication is not configured' });\n  if (secretHeader !== expectedSecret) {");

// Defense-in-depth: every /api/admin/* endpoint requires verified administrator auth.
const anchor = 'app.use(express.json());';
if (s.includes(anchor) && !s.includes("app.use('/api/admin', requireAdmin);")) {
  s = s.replace(anchor, `${anchor}\n\napp.use('/api/admin', requireAdmin);`);
}
fs.writeFileSync(p, s);

// Keep password-reset requests on the Axi Trades server email path.
const settingsPath = 'src/components/SettingsView.tsx';
let settings = fs.readFileSync(settingsPath, 'utf8');
settings = settings.replace(/, sendPasswordResetEmail(?=\s*\})/, '');
const oldReset = "await sendPasswordResetEmail(auth, user.email);\n      showToast('Password reset email sent! Check your inbox.', 'success');";
const newReset = "const response = await fetch('/api/auth/password-reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });\n      if (!response.ok) throw new Error('Password recovery is temporarily unavailable.');\n      showToast('Axi Trades password reset email sent. Check your inbox.', 'success');";
settings = settings.replace(oldReset, newReset);
fs.writeFileSync(settingsPath, settings);

console.log('Source integrity repair applied.');
