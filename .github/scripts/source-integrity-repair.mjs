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

// All password-reset emails use Axi Trades SMTP branding, never Firebase's client email sender.
const settingsPath = 'src/components/SettingsView.tsx';
let settings = fs.readFileSync(settingsPath, 'utf8');
settings = settings.replace(/, sendPasswordResetEmail(?=\s*\})/, '');
const oldReset = "await sendPasswordResetEmail(auth, user.email);\n      showToast('Password reset email sent! Check your inbox.', 'success');";
const newReset = "const response = await fetch('/api/auth/password-reset/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });\n      if (!response.ok) throw new Error('Password recovery is temporarily unavailable.');\n      showToast('Axi Trades password reset email sent. Check your inbox.', 'success');";
settings = settings.replace(oldReset, newReset);
fs.writeFileSync(settingsPath, settings);

// Ensure transactional messages have an Axi reply-to address.
const emailPath = 'server/emailService.ts';
let email = fs.readFileSync(emailPath, 'utf8');
email = email.replace("from:`\\\"${process.env.SMTP_FROM_NAME||'Axi Trades Official'}\\\" <${process.env.SMTP_FROM_EMAIL||'no-reply@axitrades.com'}>`,to,subject,html:html(title,pre,body),text:", "from:`\\\"${process.env.SMTP_FROM_NAME||'Axi Trades Official'}\\\" <${process.env.SMTP_FROM_EMAIL||'no-reply@axitrades.com'}>`,replyTo:process.env.SMTP_REPLY_TO||'support@axitrades.com',to,subject,html:html(title,pre,body),text:");
fs.writeFileSync(emailPath, email);

console.log('Source integrity and Axi email branding repair applied.');
