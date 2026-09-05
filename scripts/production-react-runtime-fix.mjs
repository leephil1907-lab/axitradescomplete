import fs from 'node:fs';

const appPath='src/App.tsx';
let app=fs.readFileSync(appPath,'utf8');

// React error #300 is caused by changing the number/order of hooks when the
// email-action route early-returns before hooks. Keep the route decision as data
// and perform the return only after every hook has executed.
const oldEmail="  const ep=new URLSearchParams(window.location.search); const em=ep.get('mode'); const ec=ep.get('oobCode');\n  if((window.location.pathname==='/reset-password'||window.location.pathname==='/verify-email')&&em&&ec)return <EmailActionPage />;";
const newEmail="  const ep=new URLSearchParams(window.location.search); const em=ep.get('mode'); const ec=ep.get('oobCode');\n  const shouldRenderEmailAction=((window.location.pathname==='/reset-password'||window.location.pathname==='/verify-email')&&Boolean(em&&ec));";
if(app.includes(oldEmail)) app=app.replace(oldEmail,newEmail);

const returnAnchor="  return (\n    <div className={`min-h-screen";
const returnReplacement="  if (shouldRenderEmailAction) return <EmailActionPage />;\n\n  return (\n    <div className={`min-h-screen";
if(app.includes(returnAnchor) && !app.includes('if (shouldRenderEmailAction) return <EmailActionPage />;')) app=app.replace(returnAnchor,returnReplacement);

// Standalone admin sessions must not be treated as unauthenticated customer sessions.
const authAnchor="  // Only redirect away from login if authenticated, and away from private routes if not authenticated\n  useEffect(() => {";
const authReplacement="  const hasStandaloneAdminSession=typeof window!=='undefined'&&Boolean(window.sessionStorage.getItem('axi_admin_token'));\n\n  // Only redirect away from login if authenticated, and away from private routes if not authenticated\n  useEffect(() => {";
if(app.includes(authAnchor) && !app.includes('const hasStandaloneAdminSession=')) app=app.replace(authAnchor,authReplacement);

app=app.replace("if (currentView === 'admin' && !isAdminUser) {\n          setView('dashboard');\n          return;\n        }","if (currentView === 'admin' && !isAdminUser && !hasStandaloneAdminSession) {\n          setView('dashboard');\n          return;\n        }");
app=app.replace("const secureViews: ViewType[] = ['dashboard', 'settings', 'admin', 'funds'];\n        if (secureViews.includes(currentView)) {","const secureViews: ViewType[] = ['dashboard', 'settings', 'funds'];\n        if (secureViews.includes(currentView) || (currentView === 'admin' && !hasStandaloneAdminSession)) {");

fs.writeFileSync(appPath,app);
console.log('Production React runtime fix applied.');
