import fs from 'node:fs';

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');

// Fix the malformed cleanup return introduced by the funding queue wiring.
admin = admin.replace(
  /return \(\s*<AdminFundingQueue showToast=\{showToast\} \/>\) => \{/,
  'return () => {'
);

// Add the real admin-managed payment settings screen to the existing Payment Settings tab.
if (!admin.includes("import AdminPaymentMethods from './AdminPaymentMethods';")) {
  admin = admin.replace("import AdminFundingQueue from './AdminFundingQueue';", "import AdminFundingQueue from './AdminFundingQueue';\nimport AdminPaymentMethods from './AdminPaymentMethods';");
}
admin = admin.replace(
  /\{activeTab === 'walletSettings' && \(\s*<motion\.div[^>]*>\s*<AdminManageWallet \/>\s*<\/motion\.div>\s*\)\}/,
  "{activeTab === 'walletSettings' && (\n            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className=\"space-y-6\">\n              <AdminPaymentMethods showToast={showToast} />\n              <AdminManageWallet />\n            </motion.div>\n          )}"
);

// Eliminate fixed demo currency samples; currencies are now empty until configured by admin/live source.
admin = admin.replace(
  /return \[\s*\{ code: 'USD',[\s\S]*?\{ code: 'AUD',[\s\S]*?\}\s*\];/m,
  'return [];'
);

// Never invent a KYC recipient/name when a real user record is absent.
admin = admin.replace("recipientEmail: docItem.userEmail || 'trader@axi.com',", "recipientEmail: docItem.userEmail || '',");
admin = admin.replace("recipientName: docItem.user || 'Trader Client',", "recipientName: docItem.user || docItem.userEmail || '',");

// Do not expose a fake admin identity in audit records.
admin = admin.replace("adminId: 'ADMIN-CORE-01 (You)',", "adminId: (typeof window !== 'undefined' && window.localStorage.getItem('axi_admin_email')) || 'Authenticated Admin',");

fs.writeFileSync(adminPath, admin);

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

// Add payment-method persistence endpoints before PORT declaration if they are not already present.
if (!server.includes("app.get('/api/admin/payment-methods'")) {
  const marker = 'const PORT = Number(process.env.PORT) || 3000;';
  const block = `const PAYMENT_METHODS_FILE = 'paymentMethods.json';\n\napp.get('/api/admin/payment-methods', (_req, res) => {\n  const methods = readDataFile<any>(PAYMENT_METHODS_FILE, {\n    bankTransfer: { enabled: false, bankName: '', accountName: '', accountNumber: '', routingNumber: '', swiftBic: '', currency: '', instructions: '' },\n    instantTransfer: { enabled: false, providerName: '', accountName: '', accountNumber: '', instructions: '' },\n    crypto: { enabled: false, asset: '', network: '', address: '', memo: '', instructions: '' }\n  });\n  res.json({ success: true, methods });\n});\n\napp.post('/api/admin/payment-methods', (req, res) => {\n  const incoming = req.body || {};\n  const methods = {\n    bankTransfer: { enabled: Boolean(incoming.bankTransfer?.enabled), bankName: String(incoming.bankTransfer?.bankName || '').trim(), accountName: String(incoming.bankTransfer?.accountName || '').trim(), accountNumber: String(incoming.bankTransfer?.accountNumber || '').trim(), routingNumber: String(incoming.bankTransfer?.routingNumber || '').trim(), swiftBic: String(incoming.bankTransfer?.swiftBic || '').trim(), currency: String(incoming.bankTransfer?.currency || '').trim(), instructions: String(incoming.bankTransfer?.instructions || '').trim() },\n    instantTransfer: { enabled: Boolean(incoming.instantTransfer?.enabled), providerName: String(incoming.instantTransfer?.providerName || '').trim(), accountName: String(incoming.instantTransfer?.accountName || '').trim(), accountNumber: String(incoming.instantTransfer?.accountNumber || '').trim(), instructions: String(incoming.instantTransfer?.instructions || '').trim() },\n    crypto: { enabled: Boolean(incoming.crypto?.enabled), asset: String(incoming.crypto?.asset || '').trim(), network: String(incoming.crypto?.network || '').trim(), address: String(incoming.crypto?.address || '').trim(), memo: String(incoming.crypto?.memo || '').trim(), instructions: String(incoming.crypto?.instructions || '').trim() }\n  };\n  writeDataFile(PAYMENT_METHODS_FILE, methods);\n  res.json({ success: true, methods });\n});\n\n`;
  if (!server.includes(marker)) throw new Error('PORT marker not found in server.ts');
  server = server.replace(marker, block + marker);
}

fs.writeFileSync(serverPath, server);
console.log('Admin payment settings connected; demo defaults removed; malformed funding cleanup fixed.');
