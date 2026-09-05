import fs from 'node:fs';

const file = 'server.ts';
let source = fs.readFileSync(file, 'utf8');
const importLine = "import { initControlPlane, registerControlPlane } from './server/controlPlane';";
const fundingImport = "import { initFundingControlPlane, registerFundingControlPlane } from './server/fundingControlPlane';";
const marker = '// AUTHORITATIVE_CONTROL_PLANE_WIRED';

if (!source.includes(importLine)) {
  const anchor = "import { requireAuth, requireAdmin, authenticateAdminCredentials, adminLoginConfigured } from './server/adminAuth';";
  if (!source.includes(anchor)) throw new Error('Control-plane import anchor not found');
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}
if (!source.includes(fundingImport)) {
  const anchor = importLine;
  source = source.replace(anchor, `${anchor}\n${fundingImport}`);
}

if (!source.includes(marker)) {
  const anchor = 'app.use(express.json());';
  if (!source.includes(anchor)) throw new Error('Express JSON middleware marker not found');
  source = source.replace(anchor, `${anchor}\n\n${marker}\ninitControlPlane().catch((error) => console.error('Control plane initialization failed:', error));\nregisterControlPlane(app);\ninitFundingControlPlane().catch((error) => console.error('Funding control plane initialization failed:', error));\nregisterFundingControlPlane(app);`);
} else if (!source.includes('registerFundingControlPlane(app);')) {
  source = source.replace("registerControlPlane(app);", "registerControlPlane(app);\ninitFundingControlPlane().catch((error) => console.error('Funding control plane initialization failed:', error));\nregisterFundingControlPlane(app);");
}

fs.writeFileSync(file, source);
console.log('Authoritative control plane and atomic funding queue wired into server.ts');