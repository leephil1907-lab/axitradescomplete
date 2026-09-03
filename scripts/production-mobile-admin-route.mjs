import fs from 'node:fs';

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

// Give administrators a mobile-friendly deep link: /admin.
// The AdminDashboardView remains responsible for the actual administrator
// password/session authentication; this change only removes the desktop-only
// keyboard shortcut dependency and the Firebase-user gate around that view.
const routeMarker = '// AXI_MOBILE_ADMIN_ROUTE_V1';
if (!app.includes(routeMarker)) {
  const oldState = "const [currentView, setView] = useState<ViewType>('home');";
  const newState = `${routeMarker}\n  const [currentView, setView] = useState<ViewType>(() => window.location.pathname.replace(/\\/$/, '') === '/admin' ? 'admin' : 'home');`;
  if (!app.includes(oldState)) throw new Error('Could not locate currentView initializer in App.tsx');
  app = app.replace(oldState, newState);
}

// AdminDashboardView has its own server-backed administrator authentication.
// Do not require a Firebase customer session just to reach its login screen.
const secureViews = "const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];";
const secureViewsFixed = "const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];";
if (app.includes(secureViews)) app = app.replace(secureViews, secureViewsFixed);

const adminRedirect = "if (currentView === 'admin' && !isAdminUser) {\n          setView('dashboard');\n          return;\n        }\n        // If user is logged in and currently on the login page, take them to their terminal";
const adminRedirectFixed = "// Admin access is authenticated by AdminDashboardView's server-backed login.\n        // Do not use the customer Firebase identity as an admin authorization gate.\n        // If user is logged in and currently on the login page, take them to their terminal";
if (app.includes(adminRedirect)) app = app.replace(adminRedirect, adminRedirectFixed);

fs.writeFileSync(appPath, app);
console.log('production-mobile-admin-route: /admin deep link enabled and standalone admin auth preserved');
