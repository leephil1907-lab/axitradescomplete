import fs from 'node:fs';

// Instant Transfer is a manual payment category containing multiple designated
// receiving methods (PayPal, Skrill and Neteller). The admin can add more than
// one entry and customers receive only active entries.
const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

const adminStart = server.indexOf("app.get('/api/admin/payment-methods'");
const activityStart = server.indexOf("app.get('/api/admin/activity'", adminStart);
if (adminStart >= 0 && activityStart > adminStart) {
  const route = `app.get('/api/admin/payment-methods', requireAdmin, async (_req, res) => {
  const persistedMethods = await dbPaymentMethods().catch(() => null);
  if (!persistedMethods) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  const bankRow = persistedMethods.find((row) => row.method_type === 'bankTransfer');
  const instantRow = persistedMethods.find((row) => row.method_type === 'instantTransfer');
  const instantDetails: any = instantRow?.details || {};
  const instantTransfer = Array.isArray(instantDetails.methods) ? instantDetails.methods : [];
  const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));
  const wallet = (type: string, iconName: string) => {
    const row = persistedMethods.find((item) => item.method_type === type);
    return row ? { ...(row.details || {}), enabled: Boolean(row.enabled), iconName } : { enabled: false, account: '', accountName: '', instructions: '', iconName };
  };
  return res.json({ success: true, source: 'postgres', methods: {
    bankTransfer: bankRow ? { ...(bankRow.details || {}), enabled: Boolean(bankRow.enabled), iconName: 'bank' } : { enabled: false, iconName: 'bank' },
    instantTransfer,
    paypal: wallet('paypal', 'paypal'),
    skrill: wallet('skrill', 'skrill'),
    neteller: wallet('neteller', 'neteller'),
    crypto
  }});
});

`;
  server = server.slice(0, adminStart) + route + server.slice(activityStart);
}

const postStart = server.indexOf("app.post('/api/admin/payment-methods'");
const postActivityStart = server.indexOf("app.get('/api/admin/activity'", postStart);
if (postStart >= 0 && postActivityStart > postStart) {
  const route = `app.post('/api/admin/payment-methods', requireAdmin, async (req, res) => {
  const incoming = req.body || {};
  const instantInput = incoming.instantTransfer || {};
  const instantMethods = (Array.isArray(instantInput.methods) ? instantInput.methods : (Array.isArray(instantInput) ? instantInput : [])).map((method: any, index: number) => ({
    id: String(method.id || ('instant-' + index + '-' + Date.now().toString(36))),
    enabled: Boolean(method.enabled),
    provider: method.provider === 'skrill' || method.provider === 'neteller' ? method.provider : 'paypal',
    account: String(method.account || method.email || method.accountNumber || '').trim(),
    accountName: String(method.accountName || '').trim(),
    instructions: String(method.instructions || '').trim(),
    iconName: method.provider === 'skrill' || method.provider === 'neteller' ? method.provider : 'paypal'
  })).filter((method: any) => method.account || method.accountName || method.instructions);
  const methods = {
    bankTransfer: {
      enabled: Boolean(incoming.bankTransfer?.enabled), bankName: String(incoming.bankTransfer?.bankName || '').trim(),
      accountName: String(incoming.bankTransfer?.accountName || '').trim(), accountNumber: String(incoming.bankTransfer?.accountNumber || '').trim(),
      routingNumber: String(incoming.bankTransfer?.routingNumber || '').trim(), swiftBic: String(incoming.bankTransfer?.swiftBic || '').trim(),
      currency: String(incoming.bankTransfer?.currency || '').trim(), instructions: String(incoming.bankTransfer?.instructions || '').trim()
    },
    instantTransfer: { enabled: instantMethods.some((method: any) => method.enabled), methods: instantMethods },
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
  const invalidCrypto = methods.crypto.find((wallet: any) => wallet.enabled && (!wallet.asset || !wallet.network || !wallet.address));
  if (invalidCrypto) return res.status(400).json({ success: false, error: 'Every enabled crypto wallet requires an asset, network, and wallet address.' });
  const invalidInstant = methods.instantTransfer.methods.find((method: any) => method.enabled && !method.account);
  if (invalidInstant) return res.status(400).json({ success: false, error: 'Every enabled instant transfer method requires a PayPal, Skrill or Neteller receiving account.' });
  const saved = await dbSavePaymentMethods(methods, String((req as any).adminEmail || 'unknown-admin')).catch((error) => {
    console.error('Postgres payment settings save failed:', error?.message || error); return false;
  });
  if (!saved) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
  await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor: String((req as any).adminEmail || 'unknown-admin'), metadata: methods }).catch(() => {});
  return res.json({ success: true, source: 'postgres', methods });
});

`;
  server = server.slice(0, postStart) + route + server.slice(postActivityStart);
}

const customerStart = server.indexOf("app.get('/api/payment-methods', requireAuth");
if (customerStart >= 0) {
  const customerEnd = server.indexOf('\n});', customerStart);
  if (customerEnd > customerStart) {
    const route = `app.get('/api/payment-methods', requireAuth, async (_req, res) => {
  try {
    const rows = await dbPaymentMethods().catch(() => null);
    if (!rows) return res.json({ success: true, source: 'unconfigured', methods: [] });
    const names: Record<string, string> = { bankTransfer: 'Bank Transfer', instantTransfer: 'Instant Transfer', crypto: 'Crypto', paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller' };
    const types: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'wallet', crypto: 'crypto', paypal: 'wallet', skrill: 'wallet', neteller: 'wallet' };
    const icons: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'instant-transfer', crypto: 'crypto', paypal: 'paypal', skrill: 'skrill', neteller: 'neteller' };
    const methods: any[] = [];
    for (const row of rows) {
      if (row.method_type === 'instantTransfer') {
        const list = Array.isArray(row.details?.methods) ? row.details.methods : [];
        for (const method of list) {
          if (!method.enabled || !method.account) continue;
          const provider = method.provider === 'skrill' || method.provider === 'neteller' ? method.provider : 'paypal';
          methods.push({ id: method.id || ('instant-' + provider), name: names[provider] + ' (Instant Transfer)', type: 'wallet', active: true, details: method, iconName: icons[provider], provider, account: method.account, accountName: method.accountName || '', instructions: method.instructions || '' });
        }
        continue;
      }
      methods.push({ id: row.method_type === 'crypto' ? (row.id || 'crypto') : row.method_type, name: names[row.method_type] || row.method_type, type: types[row.method_type] || 'other', active: Boolean(row.enabled), details: row.details || {}, iconName: icons[row.method_type] || row.method_type, ...((row.details && typeof row.details === 'object') ? row.details : {}) });
    }
    if (process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLISHABLE_KEY) methods.unshift({ id: 'card', name: 'Card', type: 'card', active: true, details: {}, iconName: 'card' });
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
console.log('Multiple PayPal/Skrill/Neteller instant transfer methods wired for admin and customer flows.');
