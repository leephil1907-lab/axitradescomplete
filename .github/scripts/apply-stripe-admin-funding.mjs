import fs from 'node:fs';

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

const marker = "const PORT = Number(process.env.PORT) || 3000;";
if (!server.includes(marker)) throw new Error('server PORT marker not found');
if (!server.includes("/api/admin/funding/pending")) {
  const block = `
// Production funding review endpoints. Stripe payments are never auto-credited.
app.get('/api/admin/funding/pending', (_req, res) => {
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  res.json({ deposits: deposits.filter(d => !d.creditedByAdmin && d.status !== 'Rejected') });
});

app.post('/api/admin/funding/:id/credit', (req, res) => {
  const id = String(req.params.id || '');
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  const index = deposits.findIndex(d => d.id === id);
  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });
  const deposit = deposits[index];
  if (deposit.creditedByAdmin || deposit.status === 'Credited') return res.status(409).json({ error: 'Funding record has already been credited' });
  const creditedBalance = Number(req.body?.creditedBalance);
  if (!Number.isFinite(creditedBalance) || creditedBalance < 0) return res.status(400).json({ error: 'Invalid credited balance' });
  deposits[index] = { ...deposit, status: 'Credited', creditedByAdmin: true, creditedAt: new Date().toISOString(), creditedBalance, creditedUserId: String(req.body?.userId || '') };
  writeDataFile('pendingDeposits.json', deposits);
  res.json({ success: true, deposit: deposits[index] });
});

app.post('/api/admin/funding/:id/reject', (req, res) => {
  const id = String(req.params.id || '');
  const deposits = readDataFile<any[]>('pendingDeposits.json', []);
  const index = deposits.findIndex(d => d.id === id);
  if (index < 0) return res.status(404).json({ error: 'Funding record not found' });
  if (deposits[index].creditedByAdmin) return res.status(409).json({ error: 'Credited funding cannot be rejected' });
  deposits[index] = { ...deposits[index], status: 'Rejected', rejectedAt: new Date().toISOString(), rejectedByAdmin: true };
  writeDataFile('pendingDeposits.json', deposits);
  res.json({ success: true, deposit: deposits[index] });
});

`;
  server = server.replace(marker, block + marker);
}
fs.writeFileSync(serverPath, server);

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
if (!admin.includes("import AdminFundingQueue from './AdminFundingQueue';")) {
  const importMarker = "import AdminPaymentMethods from './AdminPaymentMethods';";
  if (!admin.includes(importMarker)) throw new Error('admin import marker not found');
  admin = admin.replace(importMarker, "import AdminFundingQueue from './AdminFundingQueue';\n" + importMarker);
}

if (!admin.includes('<AdminFundingQueue showToast={showToast}/>') && !admin.includes('<AdminFundingQueue showToast={showToast} />')) {
  const returnIndex = admin.indexOf('return <div');
  if (returnIndex < 0) throw new Error('admin render marker not found');
  admin = admin.slice(0, returnIndex) + 'return (\n    <AdminFundingQueue showToast={showToast} />\n' + admin.slice(returnIndex + 'return <div'.length);
  admin = admin.replace('return (\n    <AdminFundingQueue showToast={showToast} />\n className=', 'return (\n    <AdminFundingQueue showToast={showToast} />\n    <div className=');
}
fs.writeFileSync(adminPath, admin);

console.log('Stripe manual-credit queue wiring verified');
