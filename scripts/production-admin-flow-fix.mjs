import fs from 'node:fs';

// Final production admin-flow correction. The hidden admin entry point must never
// fall through to the normal Firebase user login route.

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

// A standalone admin session is sufficient to enter the private admin route.
// Regular users remain protected by Firebase authentication.
if (!app.includes('AXI_ADMIN_SESSION_ROUTE_FIX_V1')) {
  const oldGuard = `if (currentView === 'admin' && !isAdminUser) {\n          setView('dashboard');\n          return;\n        }`;
  const newGuard = `if (currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }`;
  if (app.includes(oldGuard)) app = app.replace(oldGuard, newGuard);

  const marker = `  // Only redirect away from login if authenticated, and away from private routes if not authenticated`;
  if (!app.includes('const hasStandaloneAdminSession=')) {
    if (!app.includes(marker)) throw new Error('App auth guard marker not found');
    app = app.replace(marker, `  // AXI_ADMIN_SESSION_ROUTE_FIX_V1\n  const hasStandaloneAdminSession = typeof window !== 'undefined' && Boolean(window.sessionStorage.getItem('axi_admin_token'));\n\n${marker}`);
  }

  // Critical: an active standalone admin session must never be redirected to the user login page.
  const secureBlock = `const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];\n        if (secureViews.includes(currentView)) {\n          setView('login');\n        }`;
  const secureReplacement = `const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];\n        if (secureViews.includes(currentView) && !hasStandaloneAdminSession) {\n          setView('login');\n        }`;
  if (app.includes(secureBlock)) app = app.replace(secureBlock, secureReplacement);
  fs.writeFileSync(appPath, app);
}

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');

// Replace the standalone admin form with password-only access. The server supplies
// the configured administrator identity, so the normal user login is never involved.
const oldAdminState = `const [adminEmail,setAdminEmail]=useState('');\n  const [adminPassword,setAdminPassword]=useState('');`;
const newAdminState = `const [adminPassword,setAdminPassword]=useState('');`;
if (admin.includes(oldAdminState)) admin = admin.replace(oldAdminState, newAdminState);

admin = admin.replace(
  `body:JSON.stringify({email:adminEmail,password:adminPassword})`,
  `body:JSON.stringify({password:adminPassword})`
);

const emailInput = `<input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} type="email" autoComplete="username" required placeholder="Administrator email" className="mb-3 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"/>`;
if (admin.includes(emailInput)) admin = admin.replace(emailInput, '');

// Make the heading explicitly communicate that this is the private password gate.
admin = admin.replace('Administrator Portal', 'Administrator Access');
admin = admin.replace('Sign in to Admin Dashboard', 'Enter administrator password');

fs.writeFileSync(adminPath, admin);

const headerPath = 'src/components/Header.tsx';
let header = fs.readFileSync(headerPath, 'utf8');

// The existing hidden trigger is retained, but the 7th click now goes directly
// to the standalone admin password gate instead of showing an intermediate sign-in
// prompt that can be mistaken for the normal client authentication flow.
const oldHandler = /const handleHiddenAdminLogoClick=\(\)=>\{.*?\};/;
if (header.includes('AXI_HIDDEN_ADMIN_TRIGGER_V3') && oldHandler.test(header)) {
  header = header.replace(oldHandler, `const handleHiddenAdminLogoClick=()=>{const next=hiddenAdminClicks+1;if(hiddenAdminTimerRef.current)clearTimeout(hiddenAdminTimerRef.current);if(next>=7){setHiddenAdminClicks(0);setShowHiddenAdminPrompt(false);handleNav('admin');return;}setHiddenAdminClicks(next);hiddenAdminTimerRef.current=setTimeout(()=>setHiddenAdminClicks(0),1800);};`);
}

// If the source did not yet contain the trigger, add a direct 7-click trigger.
if (!header.includes('AXI_HIDDEN_ADMIN_TRIGGER_V3')) {
  const state = `  const [userDropdownOpen, setUserDropdownOpen] = useState(false);`;
  if (!header.includes(state)) throw new Error('Header state marker not found');
  const injected = `  // AXI_HIDDEN_ADMIN_TRIGGER_V3\n  const [hiddenAdminClicks,setHiddenAdminClicks]=useState(0);\n  const hiddenAdminTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);\n  const handleHiddenAdminLogoClick=()=>{const next=hiddenAdminClicks+1;if(hiddenAdminTimerRef.current)clearTimeout(hiddenAdminTimerRef.current);if(next>=7){setHiddenAdminClicks(0);handleNav('admin');return;}setHiddenAdminClicks(next);hiddenAdminTimerRef.current=setTimeout(()=>setHiddenAdminClicks(0),1800);};`;
  header = header.replace(state, state + '\n' + injected);
}

// Directly wire the Axi logo to the hidden click counter. Normal single clicks still return home.
header = header.replace(
  `onClick={() => handleNav('home')}`,
  `onClick={() => { handleHiddenAdminLogoClick(); if (hiddenAdminClicks < 6) handleNav('home'); }}`
);

// Remove any previously injected intermediate admin prompt; the admin route itself is the password gate.
header = header.replace(/\n\s*\{showHiddenAdminPrompt && <div className="fixed inset-0 z-\[100\].*?<\/div>\}\n/s, '\n');
header = header.replace(`const [showHiddenAdminPrompt,setShowHiddenAdminPrompt]=useState(false);\n  `, '');
header = header.replace(`const openHiddenAdmin=()=>{setShowHiddenAdminPrompt(false);setHiddenAdminClicks(0);handleNav('admin');};\n`, '');
fs.writeFileSync(headerPath, header);

// Patch the standalone admin endpoint to accept password-only requests while
// preserving the configured administrator email as the server-side identity.
const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');
const oldLogin = `authenticateAdminCredentials(String(req.body?.email||''),String(req.body?.password||''))`;
const newLogin = `authenticateAdminCredentials(String(req.body?.email||process.env.ADMIN_EMAIL||''),String(req.body?.password||''))`;
if (server.includes(oldLogin)) server = server.replace(oldLogin, newLogin);
fs.writeFileSync(serverPath, server);

console.log('Production hidden-admin flow corrected: hidden trigger -> standalone password gate -> Admin Dashboard; normal user login is excluded.');
