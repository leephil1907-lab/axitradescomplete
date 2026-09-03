import fs from 'node:fs';

// Final production pass: the database stores one row per crypto wallet, while
// bank/instant transfer remain singleton method types. Keep both admin and
// customer APIs compatible with that model.
const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');
const pmStart = server.indexOf("app.get('/api/admin/payment-methods'");
const activityStart = server.indexOf("app.get('/api/admin/activity'", pmStart);
if (pmStart >= 0 && activityStart > pmStart) {
  const block = `app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (!persistedMethods) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const crypto = persistedMethods
    .filter((row) => row.method_type === 'crypto')
    .map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled) }));
  return res.json({
    success: true,
    source: 'postgres',
    methods: {
      bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled) } : { enabled: false },
      instantTransfer: instantRow ? { ...(instantRow.details || {}), enabled: Boolean(instantRow.enabled) } : { enabled: false },
      crypto
    }
  });
});

`;
  server = server.slice(0, pmStart) + block + server.slice(activityStart);
}

const pmPostStart = server.indexOf("app.post('/api/admin/payment-methods'");
const activityAfterPost = server.indexOf("app.get('/api/admin/activity'", pmPostStart);
if (pmPostStart >= 0 && activityAfterPost > pmPostStart) {
  const postBlock = `app.post('/api/admin/payment-methods', requireAdmin, async (req, res) => {
  const incoming = req.body || {};
  const methods = {
    bankTransfer: {
      enabled: Boolean(incoming.bankTransfer?.enabled), bankName: String(incoming.bankTransfer?.bankName || '').trim(),
      accountName: String(incoming.bankTransfer?.accountName || '').trim(), accountNumber: String(incoming.bankTransfer?.accountNumber || '').trim(),
      routingNumber: String(incoming.bankTransfer?.routingNumber || '').trim(), swiftBic: String(incoming.bankTransfer?.swiftBic || '').trim(),
      currency: String(incoming.bankTransfer?.currency || '').trim(), instructions: String(incoming.bankTransfer?.instructions || '').trim()
    },
    instantTransfer: {
      enabled: Boolean(incoming.instantTransfer?.enabled), providerName: String(incoming.instantTransfer?.providerName || '').trim(),
      accountName: String(incoming.instantTransfer?.accountName || '').trim(), accountNumber: String(incoming.instantTransfer?.accountNumber || '').trim(),
      instructions: String(incoming.instantTransfer?.instructions || '').trim()
    },
    crypto: (Array.isArray(incoming.crypto) ? incoming.crypto : (incoming.crypto ? [incoming.crypto] : [])).map((wallet: any) => ({
      id: String(wallet.id || ''), enabled: Boolean(wallet.enabled), asset: String(wallet.asset || '').trim().toUpperCase(),
      network: String(wallet.network || '').trim(), address: String(wallet.address || wallet.walletAddress || '').trim(),
      memo: String(wallet.memo || '').trim(), label: String(wallet.label || '').trim(), instructions: String(wallet.instructions || '').trim()
    })).filter((wallet: any) => wallet.asset || wallet.network || wallet.address || wallet.label)
  };
  const invalid = methods.crypto.find((wallet: any) => wallet.enabled && (!wallet.asset || !wallet.network || !wallet.address));
  if (invalid) return res.status(400).json({ success: false, error: 'Every enabled crypto wallet requires an asset, network, and wallet address.' });
  const saved = await dbSavePaymentMethods(methods, String((req as any).adminEmail || 'unknown-admin')).catch((error) => {
    console.error('Postgres payment settings save failed:', error?.message || error);
    return false;
  });
  if (!saved) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor: String((req as any).adminEmail || 'unknown-admin'), metadata: methods }).catch(() => {});
  const persistedMethods = await dbPaymentMethods().catch(() => []);
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled) }));
  return res.json({ success: true, source: 'postgres', methods: {
    bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled) } : { enabled: false },
    instantTransfer: instantRow ? { ...(instantRow.details || {}), enabled: Boolean(instantRow.enabled) } : { enabled: false },
    crypto
  }});
});

`;
  server = server.slice(0, pmPostStart) + postBlock + server.slice(activityAfterPost);
}
fs.writeFileSync(serverPath, server);

// The existing production-real-funding build step initially normalized only
// the first crypto wallet. Replace that client-side normalization with a full
// list so every configured network/address reaches the customer funding UI.
const fundsPath = 'src/components/FundsView.tsx';
let funds = fs.readFileSync(fundsPath, 'utf8');
const cryptoStart = funds.indexOf("        const crypto = methods.find((m: any) => m.id === 'crypto');");
const bankStart = funds.indexOf('        if (bank || instant) {', cryptoStart);
if (cryptoStart >= 0 && bankStart > cryptoStart) {
  const replacement = `        const cryptoMethods = methods.filter((m: any) => m.id === 'crypto');\n        const bank = methods.find((m: any) => m.id === 'bankTransfer');\n        const instant = methods.find((m: any) => m.id === 'instantTransfer');\n`;
  funds = funds.slice(0, cryptoStart) + replacement + funds.slice(bankStart);
}
const oldCryptoBlockStart = funds.indexOf('        if (crypto) {');
const oldBankBlockStart = funds.indexOf('        if (bank || instant) {', oldCryptoBlockStart);
if (oldCryptoBlockStart >= 0 && oldBankBlockStart > oldCryptoBlockStart) {
  const replacement = `        if (cryptoMethods.length) {\n          const configuredWallets = cryptoMethods.map((method: any) => {\n            const d = method.details || method;\n            const asset = String(d.asset || 'crypto').toLowerCase();\n            return [asset + '-' + String(d.network || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), {\n              address: String(d.walletAddress || d.address || ''), network: String(d.network || ''), memo: d.memo || undefined, active: Boolean(method.active)\n            }];\n          });\n          next.cryptoWallets = { ...next.cryptoWallets, ...Object.fromEntries(configuredWallets) };\n        }\n`;
  funds = funds.slice(0, oldCryptoBlockStart) + replacement + funds.slice(oldBankBlockStart);
}
fs.writeFileSync(fundsPath, funds);
console.log('Multi-wallet crypto payment methods wired through production admin and customer flows.');
