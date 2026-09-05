import fs from 'node:fs';

// Admin UI must use the standalone server-issued session. Keep it persistent across
// normal browser restarts so the sole administrator is not repeatedly challenged.
const authPath = 'src/utils/authHeaders.ts';
fs.writeFileSync(authPath, `import { auth } from '../firebase';\n\nconst ADMIN_KEY = 'axi_admin_token';\n\nfunction readAdminToken() {\n  if (typeof window === 'undefined') return null;\n  return window.localStorage.getItem(ADMIN_KEY) || window.sessionStorage.getItem(ADMIN_KEY);\n}\n\nexport async function authHeaders(extra: Record<string,string> = {}) {\n  const adminToken = readAdminToken();\n  if (adminToken) return { ...extra, Authorization: \`Bearer \${adminToken}\` };\n  const user = auth.currentUser;\n  if (!user) throw new Error('Authentication required');\n  const token = await user.getIdToken();\n  return { ...extra, Authorization: \`Bearer \${token}\` };\n}\n\nexport function adminAuthHeaders(extra: Record<string,string> = {}) {\n  const token = readAdminToken();\n  if (!token) return { ...extra };\n  return { ...extra, Authorization: \`Bearer \${token}\` };\n}\n`);

// Persist the already-authenticated Admin session rather than sessionStorage-only.
for (const path of ['src/App.tsx']) {
  if (!fs.existsSync(path)) continue;
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace("window.sessionStorage.getItem('axi_admin_token')", "(window.localStorage.getItem('axi_admin_token') || window.sessionStorage.getItem('axi_admin_token'))");
  s = s.replace("window.sessionStorage.setItem('axi_admin_token',d.token)", "window.localStorage.setItem('axi_admin_token',d.token);window.sessionStorage.setItem('axi_admin_token',d.token)");
  s = s.replace("window.sessionStorage.removeItem('axi_admin_token')", "window.localStorage.removeItem('axi_admin_token');window.sessionStorage.removeItem('axi_admin_token')");
  fs.writeFileSync(path, s);
}

console.log('Persistent standalone Admin session UI fix applied.');
