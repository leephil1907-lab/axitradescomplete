import fs from 'node:fs';

// AXI standalone administrator authentication + hidden logo access.
const adminAuthPath = 'server/adminAuth.ts';
fs.writeFileSync(adminAuthPath, `import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
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
  if (!ADMIN_SESSION_SECRET || !ADMIN_EMAIL) throw new Error('Admin authentication is not configured');
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase(), exp }), 'utf8').toString('base64url');
  return payload + '.' + sign(payload);
}
export function verifyAdminSession(token: string) {
  if (!ADMIN_SESSION_SECRET || !ADMIN_EMAIL || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !timingSafeEqualText(sign(payload), signature)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.email !== ADMIN_EMAIL || Number(parsed.exp) < Math.floor(Date.now() / 1000)) return null;
    return parsed as { email: string; exp: number };
  } catch { return null; }
}
export function authenticateAdminCredentials(email: string, password: string) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!ADMIN_EMAIL || normalized !== ADMIN_EMAIL || !passwordMatches(String(password || ''))) return null;
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
export async function requireAuth(req: Request, res: Response, next: NextFunction) { return requireAdmin(req, res, next); }
export function adminLoginConfigured() { return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_SALT && ADMIN_SESSION_SECRET); }
`);

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');
server = server.replace(/import \{[^\n]*\brequireAdmin\b[^\n]*\} from '\.\/server\/adminAuth';/, "import { requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';");
if (!server.includes("app.post('/api/admin/login'")) {
  const jsonMarker = 'app.use(express.json());';
  if (!server.includes(jsonMarker)) throw new Error('Express JSON middleware marker not found');
  const loginRoute = `app.post('/api/admin/login', (req, res) => {\n  if (!adminLoginConfigured()) return res.status(503).json({ error: 'Administrator authentication is not configured' });\n  const { email, password } = req.body || {};\n  const token = authenticateAdminCredentials(String(email || ''), String(password || ''));\n  if (!token) return res.status(401).json({ error: 'Incorrect administrator email or password.' });\n  return res.json({ token, email: String(email).trim().toLowerCase(), expiresIn: 43200 });\n});`;
  server = server.replace(jsonMarker, `${jsonMarker}\n\n${loginRoute}`);
}
fs.writeFileSync(serverPath, server);

fs.writeFileSync('src/utils/authHeaders.ts', `import { auth } from '../firebase';
export async function authHeaders(extra: Record<string, string> = {}) {
  const adminToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('axi_admin_token') : null;
  if (adminToken) return { ...extra, Authorization: \`Bearer \${adminToken}\` };
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required');
  const token = await user.getIdToken();
  return { ...extra, Authorization: \`Bearer \${token}\` };
}
`);

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
if (!admin.includes('AXI_STANDALONE_ADMIN_GATE_V2')) {
  const fnMarker = 'export default function AdminDashboardView(';
  const fnStart = admin.indexOf(fnMarker);
  const bodyStart = fnStart >= 0 ? admin.indexOf('{', fnStart) : -1;
  if (bodyStart < 0) throw new Error('AdminDashboardView function marker not found');
  const gate = `\n  // AXI_STANDALONE_ADMIN_GATE_V2\n  const [adminToken, setAdminToken] = useState<string | null>(() => typeof window !== 'undefined' ? window.sessionStorage.getItem('axi_admin_token') : null);\n  const [adminEmail, setAdminEmail] = useState('');\n  const [adminPassword, setAdminPassword] = useState('');\n  const [adminLoginBusy, setAdminLoginBusy] = useState(false);\n  const [adminLoginError, setAdminLoginError] = useState('');\n  const adminAllowed = Boolean(adminToken);\n  const handleAdminLogin = async (e: React.FormEvent) => {\n    e.preventDefault(); setAdminLoginError(''); setAdminLoginBusy(true);\n    try { const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }) }); const data = await response.json().catch(() => ({})); if (!response.ok || !data.token) throw new Error(data.error || 'Administrator sign-in failed.'); window.sessionStorage.setItem('axi_admin_token', data.token); setAdminToken(data.token); setAdminPassword(''); } catch (error: any) { setAdminLoginError(error?.message || 'Administrator sign-in failed.'); } finally { setAdminLoginBusy(false); }\n  };\n  if (!adminAllowed) return <div className=\"min-h-screen bg-slate-950 text-white flex items-center justify-center p-6\"><form onSubmit={handleAdminLogin} className=\"w-full max-w-md rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-2xl\"><div className=\"mb-6\"><div className=\"text-[10px] font-black uppercase tracking-[0.3em] text-red-400\">AxiTrades</div><h1 className=\"mt-2 text-3xl font-black\">Administrator Portal</h1><p className=\"mt-2 text-sm text-slate-400\">Private operations access.</p></div><input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type=\"email\" autoComplete=\"username\" required placeholder=\"Administrator email\" className=\"mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white\"/><input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} type=\"password\" autoComplete=\"current-password\" required placeholder=\"Password\" className=\"w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white\"/>{adminLoginError&&<div className=\"mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-300\">{adminLoginError}</div>}<button disabled={adminLoginBusy} className=\"mt-5 w-full rounded-xl bg-red-600 py-3.5 text-sm font-black disabled:opacity-60\">{adminLoginBusy?'Signing in…':'Sign in to Admin Dashboard'}</button></form></div>;\n`;
  admin = admin.slice(0, bodyStart + 1) + gate + admin.slice(bodyStart + 1);
  fs.writeFileSync(adminPath, admin);
}

const headerPath = 'src/components/Header.tsx';
let header = fs.readFileSync(headerPath, 'utf8');
if (!header.includes('AXI_HIDDEN_ADMIN_TRIGGER_V2')) {
  const stateMarker = "  const [userDropdownOpen, setUserDropdownOpen] = useState(false);";
  if (!header.includes(stateMarker)) throw new Error('Header state marker not found');
  header = header.replace(stateMarker, `${stateMarker}\n  // AXI_HIDDEN_ADMIN_TRIGGER_V2\n  const [hiddenAdminClicks, setHiddenAdminClicks] = useState(0);\n  const [showHiddenAdminPrompt, setShowHiddenAdminPrompt] = useState(false);\n  const hiddenAdminTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);\n  const handleHiddenAdminLogoClick = () => { const next = hiddenAdminClicks + 1; if (hiddenAdminTimerRef.current) clearTimeout(hiddenAdminTimerRef.current); if (next >= 7) { setHiddenAdminClicks(0); setShowHiddenAdminPrompt(true); return; } setHiddenAdminClicks(next); hiddenAdminTimerRef.current = setTimeout(() => setHiddenAdminClicks(0), 1800); };\n  const openHiddenAdminDashboard = () => { setShowHiddenAdminPrompt(false); setHiddenAdminClicks(0); handleNav('admin'); };`);
  const logoOnClick = "onClick={() => handleNav('home')}";
  if (!header.includes(logoOnClick)) throw new Error('Axi logo click handler marker not found');
  header = header.replace(logoOnClick, "onClick={() => { handleHiddenAdminLogoClick(); if (hiddenAdminClicks < 6) handleNav('home'); }}");
  const logoCloseMarker = `          </button>\n\n          {/* Left Desktop Nav Links`;
  if (!header.includes(logoCloseMarker)) throw new Error('Axi logo close marker not found');
  const prompt = `          {showHiddenAdminPrompt && (\n            <div className=\"fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5\" role=\"dialog\" aria-modal=\"true\" aria-label=\"Administrator access\"><div className=\"w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl\"><div className=\"mb-5\"><div className=\"text-[10px] font-black uppercase tracking-[0.3em] text-red-400\">AxiTrades</div><h2 className=\"mt-2 text-xl font-black\">Administrator access</h2><p className=\"mt-1 text-xs text-slate-400\">Private access detected.</p></div><button type=\"button\" onClick={openHiddenAdminDashboard} className=\"w-full rounded-xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-500\">Continue to secure sign-in</button><button type=\"button\" onClick={() => { setShowHiddenAdminPrompt(false); setHiddenAdminClicks(0); }} className=\"mt-2 w-full rounded-xl border border-white/10 py-3 text-sm text-slate-300\">Cancel</button></div></div>\n          )}\n\n`;
  header = header.replace(logoCloseMarker, `          </button>\n\n${prompt}          {/* Left Desktop Nav Links`);
  fs.writeFileSync(headerPath, header);
}

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
if (!app.includes('AXI_STANDALONE_ADMIN_ROUTE_V2')) {
  const secureMarker = "  // Only redirect away from login if authenticated, and away from private routes if not authenticated\n  useEffect(() => {";
  if (!app.includes(secureMarker)) throw new Error('App auth redirect marker not found');
  app = app.replace(secureMarker, `  // AXI_STANDALONE_ADMIN_ROUTE_V2\n  const hasStandaloneAdminSession = typeof window !== 'undefined' && Boolean(window.sessionStorage.getItem('axi_admin_token'));\n\n${secureMarker}`);
  app = app.replace("if (currentView === 'admin' && !isAdminUser) {\n          setView('dashboard');\n          return;\n        }", "if (currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }");
  app = app.replace("const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];", "const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];\n        if (currentView === 'admin' && hasStandaloneAdminSession) return;");
  fs.writeFileSync(appPath, app);
}

console.log('Standalone admin auth and hidden logo access applied.');
