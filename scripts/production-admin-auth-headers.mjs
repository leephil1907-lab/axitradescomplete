import fs from 'node:fs';

const files = [
  'src/components/AdminDashboardView.tsx',
  'src/components/AdminFundingQueue.tsx',
  'src/components/AdminPaymentMethods.tsx',
  'src/components/AdminUserDetailDrawer.tsx'
];

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  let source = fs.readFileSync(path, 'utf8');
  if (!source.includes("../utils/authHeaders")) continue;
  source = source.replace(/import\s*\{\s*authHeaders\s*\}\s*from\s*['"]\.\.\/utils\/authHeaders['"];?/, "import { adminAuthHeaders } from '../utils/authHeaders';");
  source = source.replace(/\bauthHeaders\(/g, 'adminAuthHeaders(');
  fs.writeFileSync(path, source);
}
console.log('Admin UI requests now use the dedicated standalone admin session helper.');
