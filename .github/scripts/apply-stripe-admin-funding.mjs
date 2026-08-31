import fs from 'node:fs';

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

const marker = "const PORT = Number(process.env.PORT) || 3000;";
if (!server.includes(marker)) throw new Error('server PORT marker not found');
if (!server.includes("/api/admin/funding/pending")) {
  const block = `\n// Production funding review endpoints. Stripe payments are never auto-credited.\napp.get('/api/admin/funding/pending', (_req, res) => {\n  const deposits = readDataFile<any[]>('pendingDeposits.json', []);\n  res.json({ deposits: deposits.filter(d => !d.creditedByAdmin && d.status !== 'Rejected') });\n});\n\napp.post('/api/admin/funding/:id/credit', (req, res) => {\n  const id = String(req.params.id || '');\n  const deposits = readDataFile<any[]>('pendingDeposits.json', []);\n  const index = deposits.findIndex(d => d.id === id);\n  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });\n  const deposit = deposits[index];\n  if (deposit.creditedByAdmin || deposit.status === 'Credited') return res.status(409).json({ error: 'Funding record has already been credited' });\n  const creditedBalance = Number(req.body?.creditedBalance);\n  if (!Number.isFinite(creditedBalance) || creditedBalance < 0) return res.status(400).json({ error: 'Invalid credited balance' });\n  deposits[index] = { ...deposit, status: 'Credited', creditedByAdmin: true, creditedAt: new Date().toISOString(), creditedBalance, creditedUserId: String(req.body?.userId || '') };\n  writeDataFile('pendingDeposits.json', deposits);\n  res.json({ success: true, deposit: deposits[index] });\n});\n\napp.post('/api/admin/funding/:id/reject', (req, res) => {\n  const id = String(req.params.id || '');\n  const deposits = readDataFile<any[]>('pendingDeposits.json', []);\n  const index = deposits.findIndex(d => d.id === id);\n  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });\n  if (deposits[index].creditedByAdmin) return res.status(409).json({ error: 'Credited funding cannot be rejected' });\n  deposits[index] = { ...deposits[index], status: 'Rejected', rejectedAt: new Date().toISOString(), rejectedByAdmin: true };\n  writeDataFile('pendingDeposits.json', deposits);\n  res.json({ success: true, deposit: deposits[index] });\n});\n\n`;
  server = server.replace(marker, block + marker);
}
fs.writeFileSync(serverPath, server);

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
if (!admin.includes("import AdminFundingQueue from './AdminFundingQueue';")) {
  const importMarker = "import AdminSystemIntegrationStatus from './AdminSystemIntegrationStatus';";
  if (!admin.includes(importMarker)) throw new Error('admin import marker not found');
  admin = admin.replace(importMarker, importMarker + "\nimport AdminFundingQueue from './AdminFundingQueue';");
}
const fnMarker = "}: AdminDashboardViewProps) {";
const renderMarker = "return (";
const fnIndex = admin.indexOf(fnMarker);
if (fnIndex < 0) throw new Error('admin function marker not found');
const returnIndex = admin.indexOf(renderMarker, fnIndex);
if (returnIndex < 0) throw new Error('admin render marker not found');
if (!admin.includes('<AdminFundingQueue showToast={showToast} />')) {
  admin = admin.slice(0, returnIndex + renderMarker.length) + "\n    <AdminFundingQueue showToast={showToast} />" + admin.slice(returnIndex + renderMarker.length);
}
fs.writeFileSync(adminPath, admin);

console.log('Stripe manual-credit queue wired into server and admin dashboard');
