import fs from 'node:fs';

// Production-only administrator authentication. Regular client authentication remains Firebase.
// ADMIN_EMAIL is optional for backwards compatibility: when it is absent, the first
// address in ADMIN_EMAILS is used as the administrator identity. The password is
// always verified against the server-side scrypt hash; no password is stored here.
fs.writeFileSync('server/adminAuth.ts', `import crypto from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { NextFunction, Request, Response } from 'express';
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || ADMIN_EMAILS[0] || '').trim().toLowerCase();
const ADMIN_PASSWORD_HASH = String(process.env.ADMIN_PASSWORD_HASH || '');
const ADMIN_PASSWORD_SALT = String(process.env.ADMIN_PASSWORD_SALT || '');
const ADMIN_SESSION_SECRET = String(process.env.ADMIN_SESSION_SECRET || '');
const SESSION_TTL_SECONDS = 43200;
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function validPassword(password:string){if(!ADMIN_PASSWORD_HASH||!ADMIN_PASSWORD_SALT)return false;const h=crypto.scryptSync(password,ADMIN_PASSWORD_SALT,64).toString('hex');return safeEqual(h,ADMIN_PASSWORD_HASH);}
function signature(payload:string){return crypto.createHmac('sha256',ADMIN_SESSION_SECRET).update(payload).digest('base64url');}
export function authenticateAdminCredentials(email:string,password:string){const e=String(email||'').trim().toLowerCase();const allowed=ADMIN_EMAILS.length?ADMIN_EMAILS:(ADMIN_EMAIL?[ADMIN_EMAIL]:[]);if(!e||!allowed.includes(e)||!validPassword(String(password||'')))return null;const exp=Math.floor(Date.now()/1000)+SESSION_TTL_SECONDS;const p=Buffer.from(JSON.stringify({email:e,exp}),'utf8').toString('base64url');return p+'.'+signature(p);}
export function verifyAdminSession(token:string){if((!ADMIN_EMAIL&&!ADMIN_EMAILS.length)||!ADMIN_SESSION_SECRET||!token)return null;const [p,s]=token.split('.');if(!p||!s||!safeEqual(signature(p),s))return null;try{const v=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));const allowed=ADMIN_EMAILS.length?ADMIN_EMAILS:(ADMIN_EMAIL?[ADMIN_EMAIL]:[]);if(!allowed.includes(String(v.email||'').toLowerCase())||Number(v.exp)<=Math.floor(Date.now()/1000))return null;return v as {email:string;exp:number};}catch{return null;}}
export function adminLoginConfigured(){return Boolean((ADMIN_EMAIL||ADMIN_EMAILS.length)&&ADMIN_PASSWORD_HASH&&ADMIN_PASSWORD_SALT&&ADMIN_SESSION_SECRET);}
export async function requireAdmin(req:Request,res:Response,next:NextFunction){const m=String(req.headers.authorization||'').match(/^Bearer\\s+(.+)$/i);const session=verifyAdminSession(m?.[1]||'');if(!session)return res.status(401).json({error:'Administrator authentication required'});(req as any).adminEmail=session.email;return next();}
function getFirebaseAuth(){const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)return null;try{const serviceAccount=JSON.parse(raw);if(serviceAccount.private_key)serviceAccount.private_key=String(serviceAccount.private_key).replace(/\\n/g,'\\n');const app=getApps().length?getApps()[0]:initializeApp({credential:cert(serviceAccount)});return getAuth(app);}catch(error){console.error('Firebase Admin initialization failed:',error);return null;}}
export async function requireAuth(req:Request,res:Response,next:NextFunction){const m=String(req.headers.authorization||'').match(/^Bearer\\s+(.+)$/i);if(!m)return res.status(401).json({error:'Authentication required'});const firebaseAuth=getFirebaseAuth();if(!firebaseAuth)return res.status(503).json({error:'Server authentication is not configured'});try{const decoded=await firebaseAuth.verifyIdToken(m[1]);(req as any).user={uid:decoded.uid,email:decoded.email||''};return next();}catch(error:any){console.error('Customer token verification failed:',error?.message||error);return res.status(401).json({error:'Invalid authentication token'});}}
`);

let server=fs.readFileSync('server.ts','utf8');
server=server.replace(/import \{[^\n]*\brequireAdmin\b[^\n]*\} from '\.\/server\/adminAuth';/, "import { requireAuth, requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';");
if(!server.includes("app.post('/api/admin/login'")){
  const marker='app.use(express.json());';
  if(!server.includes(marker))throw new Error('Express JSON middleware marker not found');
  const route=`app.post('/api/admin/login',(req,res)=>{if(!adminLoginConfigured())return res.status(503).json({error:'Administrator authentication is not configured'});const token=authenticateAdminCredentials(String(req.body?.email||''),String(req.body?.password||''));if(!token)return res.status(401).json({error:'Incorrect administrator email or password.'});return res.json({token,expiresIn:43200});});`;
  server=server.replace(marker,marker+'\n'+route);
}
fs.writeFileSync('server.ts',server);

fs.writeFileSync('src/utils/authHeaders.ts',`import { auth } from '../firebase';
export async function authHeaders(extra:Record<string,string>={}){const adminToken=typeof window!=='undefined'?window.sessionStorage.getItem('axi_admin_token'):null;if(adminToken)return {...extra,Authorization:\`Bearer \${adminToken}\`};const user=auth.currentUser;if(!user)throw new Error('Authentication required');const token=await user.getIdToken();return {...extra,Authorization:\`Bearer \${token}\`};}
`);

let admin=fs.readFileSync('src/components/AdminDashboardView.tsx','utf8');
if(!admin.includes('AXI_STANDALONE_ADMIN_GATE_V3')){
  const marker='  const { cmsContent } = useSiteCMS();';
  if(!admin.includes(marker))throw new Error('Admin dashboard state marker not found');
  const gate=`  // AXI_STANDALONE_ADMIN_GATE_V3
  const [adminToken,setAdminToken]=useState<string|null>(()=>typeof window!=='undefined'?window.sessionStorage.getItem('axi_admin_token'):null);
  const [adminEmail,setAdminEmail]=useState('');
  const [adminPassword,setAdminPassword]=useState('');
  const [adminLoginBusy,setAdminLoginBusy]=useState(false);
  const [adminLoginError,setAdminLoginError]=useState('');
  const submitAdminLogin=async(e:React.FormEvent)=>{e.preventDefault();setAdminLoginBusy(true);setAdminLoginError('');try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:adminEmail.trim(),password:adminPassword})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.token)throw new Error(d.error||'Administrator sign-in failed');window.sessionStorage.setItem('axi_admin_token',d.token);setAdminToken(d.token);setAdminPassword('');}catch(err:any){setAdminLoginError(err?.message||'Administrator sign-in failed')}finally{setAdminLoginBusy(false)}};
  if(!adminToken)return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"><form onSubmit={submitAdminLogin} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-2xl"><div className="mb-6"><div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">AxiTrades</div><h1 className="mt-2 text-3xl font-black">Administrator Portal</h1><p className="mt-2 text-sm text-slate-400">Private operations access.</p></div><input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type="email" autoComplete="username" required placeholder="Administrator email" className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"/><input value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} type="password" autoComplete="current-password" required placeholder="Password" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"/>{adminLoginError&&<p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-300">{adminLoginError}</p>}<button disabled={adminLoginBusy} className="mt-5 w-full rounded-xl bg-red-600 py-3.5 text-sm font-black disabled:opacity-60">{adminLoginBusy?'Signing in…':'Sign in to Admin Dashboard'}</button></form></div>;
`;
  admin=admin.replace(marker,marker+'\n'+gate);
  fs.writeFileSync('src/components/AdminDashboardView.tsx',admin);
}

let header=fs.readFileSync('src/components/Header.tsx','utf8');
if(!header.includes('AXI_HIDDEN_ADMIN_TRIGGER_V3')){
  const state='  const [userDropdownOpen, setUserDropdownOpen] = useState(false);';
  if(!header.includes(state))throw new Error('Header state marker not found');
  const states=`  // AXI_HIDDEN_ADMIN_TRIGGER_V3
  const [hiddenAdminClicks,setHiddenAdminClicks]=useState(0);
  const [showHiddenAdminPrompt,setShowHiddenAdminPrompt]=useState(false);
  const hiddenAdminTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const handleHiddenAdminLogoClick=()=>{const next=hiddenAdminClicks+1;if(hiddenAdminTimerRef.current)clearTimeout(hiddenAdminTimerRef.current);if(next>=7){setHiddenAdminClicks(0);setShowHiddenAdminPrompt(true);return;}setHiddenAdminClicks(next);hiddenAdminTimerRef.current=setTimeout(()=>setHiddenAdminClicks(0),1800);};
  const openHiddenAdmin=()=>{setShowHiddenAdminPrompt(false);setHiddenAdminClicks(0);handleNav('admin');};`;
  header=header.replace(state,state+'\n'+states);
  header=header.replace("onClick={() => handleNav('home')} ","onClick={() => { handleHiddenAdminLogoClick(); if (hiddenAdminClicks < 6) handleNav('home'); }} ");
  const logoButtonClose='          </button>\n';
  const firstEnd=header.indexOf(logoButtonClose);
  if(firstEnd<0)throw new Error('Header logo button marker not found');
  const prompt=`\n          {showHiddenAdminPrompt && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl"><div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">AxiTrades</div><h2 className="mt-2 text-xl font-black">Administrator access</h2><p className="mt-1 text-xs text-slate-400">Private access detected.</p><button type="button" onClick={openHiddenAdmin} className="mt-5 w-full rounded-xl bg-red-600 py-3 text-sm font-black">Continue to secure sign-in</button><button type="button" onClick={()=>setShowHiddenAdminPrompt(false)} className="mt-2 w-full rounded-xl border border-white/10 py-3 text-sm">Cancel</button></div></div>}\n`;
  header=header.slice(0,firstEnd+logoButtonClose.length)+prompt+header.slice(firstEnd+logoButtonClose.length);
  fs.writeFileSync('src/components/Header.tsx',header);
}

let app=fs.readFileSync('src/App.tsx','utf8');
if(!app.includes('AXI_STANDALONE_ADMIN_ROUTE_V3')){
  const marker='  // Only redirect away from login if authenticated, and away from private routes if not authenticated';
  if(!app.includes(marker))throw new Error('App auth guard marker not found');
  app=app.replace(marker,`  // AXI_STANDALONE_ADMIN_ROUTE_V3\n  const hasStandaloneAdminSession=typeof window!=='undefined'&&Boolean(window.sessionStorage.getItem('axi_admin_token'));\n\n${marker}`);
  app=app.replace("if (currentView === 'admin' && !isAdminUser) {\n          setView('dashboard');\n          return;\n        }","if (currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }");
  fs.writeFileSync('src/App.tsx',app);
}
console.log('Standalone admin auth and customer Firebase auth applied successfully.');
