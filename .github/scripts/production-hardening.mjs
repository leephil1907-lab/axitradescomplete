import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);

// 1) Add server-side Firebase token verification and role enforcement.
const authPath = 'server/adminAuth.ts';
fs.mkdirSync('server', { recursive: true });
write(authPath, `import { cert, getApps, initializeApp } from 'firebase-admin/app';\nimport { getAuth } from 'firebase-admin/auth';\nimport type { Request, Response, NextFunction } from 'express';\n\nfunction getAdminAuth() {\n  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;\n  if (!raw) return null;\n  try {\n    const serviceAccount = JSON.parse(raw);\n    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });\n    return getAuth(app);\n  } catch (error) {\n    console.error('[auth] Firebase Admin initialization failed');\n    return null;\n  }\n}\n\nfunction configuredAdmins() {\n  return new Set((process.env.ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean));\n}\n\nexport async function verifyBearer(req: Request) {\n  const authHeader = String(req.headers.authorization || '');\n  if (!authHeader.startsWith('Bearer ')) return null;\n  const token = authHeader.slice(7).trim();\n  if (!token) return null;\n  const auth = getAdminAuth();\n  if (!auth) throw new Error('Server authentication is not configured');\n  return auth.verifyIdToken(token, true);\n}\n\nexport async function requireAuth(req: Request, res: Response, next: NextFunction) {\n  try {\n    const decoded = await verifyBearer(req);\n    if (!decoded) return res.status(401).json({ error: 'Authentication required' });\n    (req as any).authUser = decoded;\n    next();\n  } catch (error) {\n    console.error('[auth] token verification failed');\n    return res.status(401).json({ error: 'Invalid authentication token' });\n  }\n}\n\nexport async function requireAdmin(req: Request, res: Response, next: NextFunction) {\n  try {\n    const decoded = await verifyBearer(req);\n    if (!decoded) return res.status(401).json({ error: 'Administrator authentication required' });\n    const email = String(decoded.email || '').toLowerCase();\n    const admins = configuredAdmins();\n    const uidAdmins = new Set((process.env.ADMIN_UIDS || '').split(',').map(v => v.trim()).filter(Boolean));\n    if (!admins.has(email) && !uidAdmins.has(decoded.uid)) {\n      return res.status(403).json({ error: 'Administrator access required' });\n    }\n    (req as any).authUser = decoded;\n    (req as any).adminEmail = email;\n    next();\n  } catch (error) {\n    console.error('[auth] admin verification failed');\n    return res.status(401).json({ error: 'Invalid administrator authentication' });\n  }\n}\n`);

// 2) Harden server routes and eliminate client-supplied admin identity.
let s = read('server.ts');
if (s.includes("from './server/adminAuth'")) {
  s = s.replace("import { requireAdmin } from './server/adminAuth';", "import { requireAuth, requireAdmin } from './server/adminAuth';");
} else {
  s = s.replace("import YahooFinanceRaw from 'yahoo-finance2';", "import YahooFinanceRaw from 'yahoo-finance2';\nimport { requireAuth, requireAdmin } from './server/adminAuth';");
}

const adminRoutes = [
  "app.get('/api/users',",
  "app.get('/api/admin/funding/pending',",
  "app.post('/api/admin/funding/:id/credit',",
  "app.post('/api/admin/funding/:id/reject',",
  "app.get('/api/admin/payment-methods',",
  "app.post('/api/admin/payment-methods',",
  "app.get('/api/admin/activity',",
  "app.put('/api/users/:id/balance',",
  "app.put('/api/users/:id/status',",
  "app.put('/api/users/:id/pnl',",
  "app.put('/api/users/:id/password',"
];
for (const marker of adminRoutes) {
  const replacement = marker + ' requireAdmin, ';
  if (s.includes(marker) && !s.includes(replacement)) s = s.replace(marker, replacement);
}

s = s.replace(/String\(req\.headers\['x-admin-email'\] \|\| 'admin'\)/g, "String((req as any).adminEmail || 'unknown-admin')");

for (const marker of [
  "app.post('/api/stripe/create-payment-intent',",
  "app.post('/api/stripe/create-checkout-session',",
  "app.post('/api/stripe/verify-deposit',",
  "app.get('/api/stripe/payment-intent/:id',",
  "app.post('/api/kyc/submit',",
  "app.get('/api/kyc/list',",
  "app.post('/api/kyc/approve',",
  "app.post('/api/kyc/reject',"
]) {
  const isAdmin = marker.includes("/api/kyc/list") || marker.includes("/api/kyc/approve") || marker.includes("/api/kyc/reject");
  const replacement = marker + (isAdmin ? ' requireAdmin, ' : ' requireAuth, ');
  if (s.includes(marker) && !s.includes(replacement)) s = s.replace(marker, replacement);
}

s = s.replace("const { amount, currency = 'usd', depositId, userId } = req.body;", "const { amount, currency = 'usd', depositId } = req.body;\n  const userId = String((req as any).authUser?.uid || '');");
s = s.replace("const { amount, currency = 'usd', depositId, userId, method } = req.body;", "const { amount, currency = 'usd', depositId, method } = req.body;\n    const userId = String((req as any).authUser?.uid || '');");
s = s.replace("const { paymentIntentId, sessionId, amount, userId } = req.body || {};", "const { paymentIntentId, sessionId } = req.body || {};\n  const userId = String((req as any).authUser?.uid || '');");

// Remove fabricated offline AI claims.
s = s.replace(/return res\.json\(\{\s*text: "Welcome to Axi AI Assistant![\s\S]*?offline: true\s*\}\);/, "return res.status(503).json({ error: 'Axi AI Assistant is temporarily unavailable. No simulated market guidance is provided.' });");
s = s.replace(/res\.json\(\{\s*text: "I ran into a connection glitch[\s\S]*?error: error\.message\s*\}\);/, "res.status(502).json({ error: 'Axi AI Assistant is temporarily unavailable. No simulated market guidance is provided.' });");

// Remove hardcoded market prices: unavailable means unavailable until a provider supplies data.
const baseStart = s.indexOf('const INITIAL_BASELINE_PRICES:');
const baseEnd = s.indexOf('// Initialize with live real baseline rates', baseStart);
if (baseStart >= 0 && baseEnd > baseStart) s = s.slice(0, baseStart) + "const INITIAL_BASELINE_PRICES: Record<string, { price: number; change: number }> = {};\n\n" + s.slice(baseEnd);
s = s.replace("const base = INITIAL_BASELINE_PRICES[sym] || { price: 1.0, change: 0 };", "const base = INITIAL_BASELINE_PRICES[sym] || { price: 0, change: 0 };");
s = s.replace("bidDiff: - (base.price * 0.0001),\n    askDiff: (base.price * 0.0001),\n    spread: Number((base.price * 0.0002).toFixed(4)),", "bidDiff: 0,\n    askDiff: 0,\n    spread: 0,");
s = s.replace("status: 'live',\n    source: 'Real-time Interbank / Binance / Exchange Feed'", "status: 'unavailable',\n    source: 'No verified market feed available'");

// Disable fake/premade investment and bot configurations by default. Real values must be explicitly configured.
s = s.replace(/readDataFile\('adminBotConfig\.json', \{[\s\S]*?\}\);/, "readDataFile('adminBotConfig.json', { active: false });");
s = s.replace(/readDataFile\('adminTradingBotSettings\.json', \{[\s\S]*?\}\);/, "readDataFile('adminTradingBotSettings.json', { automatedTradingEnabled: false, circuitBreakerEnabled: true });");
s = s.replace(/readDataFile\('adminInvestmentPlans\.json', \[[\s\S]*?\]\);/, "readDataFile('adminInvestmentPlans.json', []);");
s = s.replace(/readDataFile\('adminTradingPairs\.json', \[[\s\S]*?\]\);/, "readDataFile('adminTradingPairs.json', []);");
s = s.replace(/readDataFile\('adminCurrencies\.json', \[[\s\S]*?\]\);/, "readDataFile('adminCurrencies.json', [{ code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1, isBase: true }]);");

// Never let SPA fallback make sensitive probe paths look successful.
const sensitivePathGuard = `\n// Return 404 for common framework/config probes instead of serving the SPA shell.\napp.use((req, res, next) => {\n  const blocked = /^(\\/\\.env|\\/\\.git(?:\\/|$)|\\/\\.vscode(?:\\/|$)|\\/server-status(?:\\/|$)|\\/server(?:\\/|$)|\\/actuator(?:\\/|$)|\\/trace\\.axd(?:\\/|$)|\\/info\\.php(?:\\/|$)|\\/telescope(?:\\/|$)|\\/v2\\/_catalog(?:\\/|$)|\\/debug(?:\\/|$)|\\/config\\.json$|\\/\\@vite\\/env$|\\/\\.DS_Store$)/i.test(req.path);\n  if (blocked) return res.status(404).json({ error: 'Not found' });\n  next();\n});\n`;
if (!s.includes('common framework/config probes')) s = s.replace("// General Express JSON middleware for all other API routes\napp.use(express.json());", sensitivePathGuard + "\n// General Express JSON middleware for all other API routes\napp.use(express.json());");

write('server.ts', s);

// 3) Central client helper for Firebase bearer tokens.
const helper = `import { auth } from '../firebase';\n\nexport async function authHeaders(extra: Record<string,string> = {}) {\n  const user = auth.currentUser;\n  if (!user) throw new Error('Authentication required');\n  const token = await user.getIdToken();\n  return { ...extra, Authorization: \`Bearer \${token}\` };\n}\n`;
write('src/utils/authHeaders.ts', helper);

// 4) Secure admin UI API calls.
const adminFiles = ['src/components/AdminFundingQueue.tsx','src/components/AdminPaymentMethods.tsx'];
for (const p of adminFiles) {
  let c = read(p);
  if (!c.includes("../utils/authHeaders")) c = c.replace("import React", "import { authHeaders } from '../utils/authHeaders';\nimport React");
  c = c.replace("fetch('/api/admin/funding/pending')", "fetch('/api/admin/funding/pending', { headers: await authHeaders() })");
  c = c.replace("fetch('/api/users')", "fetch('/api/users', { headers: await authHeaders() })");
  c = c.replace("headers: { 'Content-Type': 'application/json' }", "headers: await authHeaders({ 'Content-Type': 'application/json' })");
  c = c.replace("fetch(`/api/admin/funding/${encodeURIComponent(deposit.id)}/reject`, { method: 'POST' })", "fetch(`/api/admin/funding/${encodeURIComponent(deposit.id)}/reject`, { method: 'POST', headers: await authHeaders() })");
  c = c.replace("fetch('/api/admin/payment-methods')", "fetch('/api/admin/payment-methods', { headers: await authHeaders() })");
  write(p, c);
}

// 5) Remove the browser-local registered-user ledger. The server/database is authoritative.
let h = read('src/hooks/useFirebaseData.ts');
h = h.replace("const savedStr = safeStorage.getItem('axi_registered_users');", "const savedStr = null; // Server/Postgres is authoritative; browser storage is never an admin ledger.");
h = h.replace("safeStorage.setItem('axi_registered_users', JSON.stringify(userList));", "// Registration records are persisted server-side; do not mirror them into browser storage.");
// Guest trading/watchlist paths are not permitted in production.
h = h.replace("if (!user) { setOpenPositions(prev => [...prev, pos]); return; }", "if (!user) throw new Error('Authentication required to place a trade');");
h = h.replace("'User': user?.email || 'Guest / Demo Trader'", "'User': user?.email || 'Unauthenticated'");
h = h.replace("if (!user) { setOpenPositions(prev => prev.filter(p => p.id !== posId)); return; }", "if (!user) throw new Error('Authentication required');");
h = h.replace("if (!user) {\n      setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);\n      return;\n    }", "if (!user) throw new Error('Authentication required');");
write('src/hooks/useFirebaseData.ts', h);

// 6) Remove repository-level fallback credentials/config from frontend Firebase config.
let fb = read('src/firebase.ts');
fb = fb.replace(" || defaultConfig.apiKey", "").replace(" || defaultConfig.authDomain", "").replace(" || defaultConfig.projectId", "").replace(" || defaultConfig.storageBucket", "").replace(" || defaultConfig.messagingSenderId", "").replace(" || defaultConfig.appId", "");
fb = fb.replace("const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (defaultConfig as Record<string, string>).firestoreDatabaseId;", "const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (defaultConfig as Record<string, string>).firestoreDatabaseId;");
write('src/firebase.ts', fb);

console.log('Production hardening applied.');
