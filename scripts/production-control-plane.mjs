import fs from 'node:fs';

const file = 'server.ts';
let source = fs.readFileSync(file, 'utf8');
const importLine = "import { initControlPlane, registerControlPlane } from './server/controlPlane';";
const marker = '// AUTHORITATIVE_CONTROL_PLANE_WIRED';

if (!source.includes(importLine)) {
  const anchor = "import { requireAuth, requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';";
  if (!source.includes(anchor)) throw new Error('Control-plane import anchor not found');
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

if (!source.includes(marker)) {
  const anchor = 'app.use(express.json());';
  if (!source.includes(anchor)) throw new Error('Express JSON middleware marker not found');
  source = source.replace(anchor, `${anchor}\n\n${marker}\ninitControlPlane().catch((error) => console.error('Control plane initialization failed:', error));\nregisterControlPlane(app);`);
}

fs.writeFileSync(file, source);
console.log('Authoritative control plane wired into server.ts');
