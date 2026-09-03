import fs from 'node:fs';

const adminAuthPath = 'server/adminAuth.ts';
const adminAuth = `import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'Kaspertrading9@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || '');
const ADMIN_PASSWORD_SALT = String(process.env.ADMIN_PASSWORD_SALT || '');
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function timingSafeEqualText(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function passwordMatches(password: string) {
  if (!ADMIN_PASSWORD_HASH || !ADMIN_PASSWORD_SALT) return false;
  const derived = crypto.scryptSync(password, ADMIN_PASSWORD_SALT, 64).toString('hex');
  return timingSafeEqualText(derived, ADMIN_PASSWORD_HASH);
}

function sign(payload: string) {
  return crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
}

export function createAdminSession(email: string) {
  if (!ADMIN_SESSION_SECRET) throw new Error('Admin authentication is not configured');
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase(), exp }), 'utf8').toString('base64url');
  return payload + '.' + sign(payload);
}

export function verifyAdminSession(token: string) {
  if (!ADMIN_SESSION_SECRET || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !timingSafeEqualText(sign(payload), signature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.email !== ADMIN_EMAIL || Number(parsed.exp) < Math.floor(Date.now() / 1000)) return null;
    return parsed as { email: string; exp: number };
  } catch {
    return null;
  }
}

export function authenticateAdminCredentials(email: string, password: string) {
  const normalized = String(email || '').trim().toLowerCase();
  if (normalized !== ADMIN_EMAIL || !passwordMatches(String(password || ''))) return null;
  return createAdminSession(normalized);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authorization = String(req.headers.authorization || '');
  const match = authorization.match(/^Bearer\\s+(.+)$/i);
  const session = verifyAdminSession(match ? match[1] : '');
  if (!session) return res.status(401).json({ error: 'Administrator authentication required' });
  (req as any).adminEmail = session.email;
  (req as any).admin = { email: session.email };
  return next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  return requireAdmin(req, res, next);
}

export function adminLoginConfigured() {
  return Boolean(ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_SALT && ADMIN_SESSION_SECRET);
}
`;
fs.writeFileSync(adminAuthPath, adminAuth);

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');
const importLine = "import { requireAdmin } from './server/adminAuth';";
const customImport = "import { requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';";
server = server.replace(/import \{ (?:requireAuth, )?requireAdmin \} from '\.\/server\/adminAuth';/, customImport);
const jsonMarker = 'app.use(express.json());';
const loginRoute = `app.post('/api/admin/login', (req, res) => {
  if (!adminLoginConfigured()) return res.status(503).json({ error: 'Administrator authentication is not configured' });
  const { email, password } = req.body || {};
  const token = authenticateAdminCredentials(String(email || ''), String(password || ''));
  if (!token) return res.status(401).json({ error: 'Incorrect administrator email or password.' });
  return res.json({ token, email: String(email).trim().toLowerCase(), expiresIn: 43200 });
});`;
if (!server.includes("app.post('/api/admin/login'")) {
  if (!server.includes(jsonMarker)) throw new Error('Express JSON middleware marker not found');
  server = server.replace(jsonMarker, `${jsonMarker}\n\n${loginRoute}`);
}
fs.writeFileSync(serverPath, server);

const headersPath = 'src/utils/authHeaders.ts';
fs.writeFileSync(headersPath, `import { auth } from '../firebase';\n\nexport async function authHeaders(extra: Record<string, string> = {}) {\n  const adminToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('axi_admin_token') : null;\n  if (adminToken) return { ...extra, Authorization: \`Bearer \${adminToken}\` };\n  const user = auth.currentUser;\n  if (!user) throw new Error('Authentication required');\n  const token = await user.getIdToken();\n  return { ...extra, Authorization: \`Bearer \${token}\` };\n}\n`);

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
admin = admin.replace("import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';\nimport { auth } from '../firebase';\n", '');
const start = admin.indexOf('  const [adminUser');
const marker = '  if (!adminUser) return ';
const startReturn = admin.indexOf(marker, start);
const accessMarker = '\n  if (!adminAllowed) return ';
const accessStart = startReturn >= 0 ? admin.indexOf(accessMarker, startReturn) : -1;
if (start < 0 || startReturn < 0 || accessStart < 0) throw new Error('Admin auth block markers not found');
const accessEnd = admin.indexOf('\n}', accessStart);
if (accessEnd < 0) throw new Error('Admin access block end not found');
const replacement = `  const [adminToken, setAdminToken] = useState<string | null>(() => typeof window !== 'undefined' ? window.sessionStorage.getItem('axi_admin_token') : null);\n  const [adminEmail, setAdminEmail] = useState('');\n  const [adminPassword, setAdminPassword] = useState('');\n  const [adminLoginBusy, setAdminLoginBusy] = useState(false);\n  const [adminLoginError, setAdminLoginError] = useState('');\n  const adminAllowed = Boolean(adminToken);\n  const handleAdminLogin = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setAdminLoginError('');\n    setAdminLoginBusy(true);\n    try {\n      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }) });\n      const data = await response.json().catch(() => ({}));\n      if (!response.ok || !data.token) throw new Error(data.error || 'Administrator sign-in failed.');\n      window.sessionStorage.setItem('axi_admin_token', data.token);\n      setAdminToken(data.token);\n      setAdminPassword('');\n    } catch (error: any) {\n      setAdminLoginError(error?.message || 'Administrator sign-in failed.');\n    } finally {\n      setAdminLoginBusy(false);\n    }\n  };\n  const handleAdminLogout = () => { window.sessionStorage.removeItem('axi_admin_token'); setAdminToken(null); };\n  if (!adminAllowed) return <div className=\"min-h-screen bg-slate-950 text-white flex items-center justify-center p-6\"><div className=\"w-full max-w-md\"><div className=\"mb-8 text-center\"><p className=\"text-[10px] font-black uppercase tracking-[0.3em] text-red-400\">AxiTrades</p><h1 className=\"mt-2 text-3xl font-black tracking-tight\">Administrator Portal</h1><p className=\"mt-2 text-sm text-slate-400\">Private operations access.</p></div><form onSubmit={handleAdminLogin} className=\"rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-2xl\"><label className=\"block text-xs font-semibold text-slate-300\">Administrator email<input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type=\"email\" autoComplete=\"username\" required className=\"mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-red-500\" placeholder=\"admin@example.com\" /></label><label className=\"mt-4 block text-xs font-semibold text-slate-300\">Password<input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} type=\"password\" autoComplete=\"current-password\" required className=\"mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-red-500\" placeholder=\"••••••••\" /></label>{adminLoginError&&<div className=\"mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300\">{adminLoginError}</div>}<button disabled={adminLoginBusy} className=\"mt-6 w-full rounded-xl bg-red-600 py-3.5 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60\">{adminLoginBusy?'Signing in…':'Sign in to Admin Dashboard'}</button></form><button type=\"button\" onClick={()=>setView('login')} className=\"mt-5 w-full text-center text-xs text-slate-500 hover:text-white\">Return to client login</button></div></div>;\n`;
admin = admin.slice(0, start) + replacement + admin.slice(accessEnd + 1);
admin = admin.replace(/\n\s*if \(!adminAllowed\) return [\s\S]*?;\n/, '\n');
fs.writeFileSync(adminPath, admin);
console.log('Standalone server-side admin authentication applied.');
