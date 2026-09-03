import fs from 'node:fs';

// Production payment-method normalization. PostgreSQL is authoritative for
// customer/admin payment configuration. Crypto is multi-row; manual e-wallets
// are singleton method types.
const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

const methodNames = `const names: Record<string, string> = { bankTransfer: 'Bank Transfer', instantTransfer: 'Instant Transfer', crypto: 'Crypto', paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller' };`;
const methodTypes = `const types: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'wallet', skrill: 'wallet', neteller: 'wallet' };`;
const iconNames = `const icons: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'paypal', skrill: 'skrill', neteller: 'neteller' };`;

// Admin GET: return every persisted method, including all crypto wallets and
// PayPal/Skrill/Neteller. This keeps the admin form fully round-trippable.
const pmStart = server.indexOf("app.get('/api/admin/payment-methods'");
const activityStart = server.indexOf("app.get('/api/admin/activity'", pmStart);
if (pmStart >= 0 && activityStart > pmStart) {
  const block = `app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (!persistedMethods) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));
  const wallet = (type: string, iconName: string) => {
    const row = persistedMethods.find((item) => item.method_type === type);
    return row ? { ...(row.details || {}), enabled: Boolean(row.enabled), iconName } : { enabled: false, account: '', accountName: '', instructions: '', iconName };
  };
  return res.json({ success: true, source: 'postgres', methods: {
    bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    instantTransfer: instantRow ? { ...(instantRow.details || {}), enabled: Boolean(instantRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    paypal: wallet('paypal', 'paypal'),
    skrill: wallet('skrill', 'skrill'),
    neteller: wallet('neteller', 'neteller'),
    crypto
  }});
});

`;
  server = server.slice(0, pmStart) + block + server.slice(activityStart);
}

// Admin POST: persist all supported payment methods. Crypto remains an array;
// PayPal/Skrill/Neteller each have one configurable receiving account.
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
    paypal: {
      enabled: Boolean(incoming.paypal?.enabled), account: String(incoming.paypal?.account || incoming.paypal?.email || '').trim(),
      accountName: String(incoming.paypal?.accountName || '').trim(), instructions: String(incoming.paypal?.instructions || '').trim(), iconName: 'paypal'
    },
    skrill: {
      enabled: Boolean(incoming.skrill?.enabled), account: String(incoming.skrill?.account || incoming.skrill?.email || '').trim(),
      accountName: String(incoming.skrill?.accountName || '').trim(), instructions: String(incoming.skrill?.instructions || '').trim(), iconName: 'skrill'
    },
    neteller: {
      enabled: Boolean(incoming.neteller?.enabled), account: String(incoming.neteller?.account || incoming.neteller?.email || '').trim(),
      accountName: String(incoming.neteller?.accountName || '').trim(), instructions: String(incoming.neteller?.instructions || '').trim(), iconName: 'neteller'
    },
    crypto: (Array.isArray(incoming.crypto) ? incoming.crypto : (incoming.crypto ? [incoming.crypto] : [])).map((wallet: any, index: number) => ({
      id: String(wallet.id || ('crypto-' + index + '-' + Date.now().toString(36))), enabled: Boolean(wallet.enabled), asset: String(wallet.asset || '').trim().toUpperCase(),
      network: String(wallet.network || '').trim(), address: String(wallet.address || wallet.walletAddress || '').trim(),
      memo: String(wallet.memo || '').trim(), label: String(wallet.label || '').trim(), instructions: String(wallet.instructions || '').trim(), iconName: 'crypto'
    })).filter((wallet: any) => wallet.asset || wallet.network || wallet.address || wallet.label)
  };
  const invalid = methods.crypto.find((wallet: any) => wallet.enabled && (!wallet.asset || !wallet.network || !wallet.address));
  if (invalid) return res.status(400).json({ success: false, error: 'Every enabled crypto wallet requires an asset, network, and wallet address.' });
  const saved = await dbSavePaymentMethods(methods, String((req as any).adminEmail || 'unknown-admin')).catch((error) => {
    console.error('Postgres payment settings save failed:', error?.message || error); return false;
  });
  if (!saved) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor: String((req as any).adminEmail || 'unknown-admin'), metadata: methods }).catch(() => {});
  const persistedMethods = await dbPaymentMethods().catch(() => []);
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));
  const wallet = (type: string, iconName: string) => { const row = persistedMethods.find((item) => item.method_type === type); return row ? { ...(row.details || {}), enabled: Boolean(row.enabled), iconName } : { enabled: false, account: '', accountName: '', instructions: '', iconName }; };
  return res.json({ success: true, source: 'postgres', methods: {
    bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    instantTransfer: instantRow ? { ...(instantRow.details || {}), enabled: Boolean(instantRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    paypal: wallet('paypal', 'paypal'), skrill: wallet('skrill', 'skrill'), neteller: wallet('neteller', 'neteller'), crypto
  }});
});

`;
  server = server.slice(0, pmPostStart) + postBlock + server.slice(activityAfterPost);
}

// Customer GET: expose configured manual providers with stable IDs, labels and
// iconName values. Card is exposed only when Stripe is configured server-side.
const customerStart = server.indexOf("app.get('/api/payment-methods', requireAuth");
if (customerStart >= 0) {
  const customerEnd = server.indexOf('\n});', customerStart);
  if (customerEnd > customerStart) {
    const route = `app.get('/api/payment-methods', requireAuth, async (_req, res) => {
  try {
    const rows = await dbPaymentMethods().catch(() => null);
    if (!rows) return res.json({ success: true, source: 'unconfigured', methods: [] });
    ${methodNames}
    ${methodTypes}
    ${iconNames}
    const methods = rows.map((row: any) => ({
      id: row.method_type === 'crypto' ? (row.id || 'crypto') : row.method_type,
      name: names[row.method_type] || row.method_type,
      type: types[row.method_type] || 'other', active: Boolean(row.enabled),
      details: row.details || {}, iconName: icons[row.method_type] || row.method_type,
      ...((row.details && typeof row.details === 'object') ? row.details : {})
    }));
    if (process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      methods.unshift({ id: 'card', name: 'Card', type: 'card', active: true, details: {}, iconName: 'card' });
    }
    return res.json({ success: true, source: 'postgres', methods });
  } catch (error: any) {
    console.error('Customer payment-method read failed:', error?.message || error);
    return res.status(500).json({ error: 'Payment configuration unavailable' });
  }
});`;
    server = server.slice(0, customerStart) + route + server.slice(customerEnd + '\n});'.length);
  }
}
fs.writeFileSync(serverPath, server);

// Customer funding UI: preserve every configured crypto wallet instead of
// collapsing the list to the first wallet, and use the server-provided iconName.
const fundsPath = 'src/components/FundsView.tsx';
let funds = fs.readFileSync(fundsPath, 'utf8');
const cryptoLine = "        const crypto = methods.find((m: any) => m.type === 'crypto' && m.id === 'crypto');";
if (funds.includes(cryptoLine)) {
  funds = funds.replace(cryptoLine, "        const cryptoMethods = methods.filter((m: any) => m.type === 'crypto' && m.active);\n        const crypto = cryptoMethods[0];");
}
const oldCrypto = `        if (crypto) {\n          const d = crypto.details || crypto; const asset = String(d.asset || 'usdt').toLowerCase();\n          next.cryptoWallets = { ...next.cryptoWallets, [asset]: { address: String(d.walletAddress || d.address || ''), network: String(d.network || ''), memo: d.memo || undefined, active: true } };\n        }`;
const newCrypto = `        if (cryptoMethods.length) {\n          const configuredWallets = cryptoMethods.map((method: any, index: number) => {\n            const d = method.details || method;\n            const asset = String(d.asset || ('crypto-' + index)).toLowerCase();\n            const network = String(d.network || '');\n            const key = asset + '-' + network.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + String(index);\n            return [key, { address: String(d.walletAddress || d.address || ''), network, memo: d.memo || undefined, active: true, label: d.label || d.asset || network, iconName: method.iconName || 'crypto' }];\n          });\n          next.cryptoWallets = { ...next.cryptoWallets, ...Object.fromEntries(configuredWallets) };\n        }`;
if (funds.includes(oldCrypto)) funds = funds.replace(oldCrypto, newCrypto);

// Remove legacy hardcoded provider recipients if this older block still exists.
funds = funds.replace(/payments@axi-clearing\.com/g, '');
funds = funds.replace(/support@axi-clearing\.com/g, '');

fs.writeFileSync(fundsPath, funds);
console.log('Multi-wallet crypto plus PayPal/Skrill/Neteller payment methods wired through production admin and customer flows.');
