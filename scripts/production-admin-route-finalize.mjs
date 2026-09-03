import fs from 'node:fs';

const path = 'src/App.tsx';
let s = fs.readFileSync(path, 'utf8');

// Admin is a standalone password-gated route. It must be reachable before an
// admin token exists so the password gate can be rendered. The gate itself is
// the security boundary; ordinary private user routes remain Firebase-gated.
s = s.replace(
  `if (currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }`,
  `if (false && currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }`
);
s = s.replace(
  `const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];`,
  `const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];`
);
s = s.replace(
  `const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];`,
  `const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];`
);

// Never redirect the standalone admin route into the normal user login page.
s = s.replace(
  `if (secureViews.includes(currentView)) {\n          setView('login');\n        }`,
  `if (secureViews.includes(currentView) && !hasStandaloneAdminSession) {\n          setView('login');\n        }`
);
fs.writeFileSync(path, s);
console.log('Admin route finalized: no redirect to normal user login.');
