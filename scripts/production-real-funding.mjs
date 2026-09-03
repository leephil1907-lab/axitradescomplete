import fs from 'node:fs';

// Production funding wiring: customer funding reads server-side configuration,
// and withdrawals are submitted to the server without browser-side balance edits.
const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');

// Keep the customer payment-method API authoritative and expose all configured
// manual providers, including PayPal, Skrill and Neteller.
const customerRouteStart = server.indexOf("app.get('/api/payment-methods', requireAuth");
if (customerRouteStart >= 0) {
  const customerRouteEnd = server.indexOf('\n});', customerRouteStart);
  if (customerRouteEnd >= 0) {
    const customerRoute = `app.get('/api/payment-methods', requireAuth, async (_req, res) => {
  try {
    const rows = await dbPaymentMethods().catch(() => null);
    if (!rows) return res.json({ success: true, source: 'unconfigured', methods: [] });
    const names: Record<string, string> = { bankTransfer: 'Bank Transfer', instantTransfer: 'Instant Transfer', crypto: 'Crypto', paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller' };
    const types: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'wallet', skrill: 'wallet', neteller: 'wallet' };
    const methods = rows.map((row: any) => ({
      id: row.id || row.method_type,
      name: names[row.method_type] || row.method_type,
      type: types[row.method_type] || 'other',
      active: Boolean(row.enabled),
      details: row.details || {},
      ...((row.details && typeof row.details === 'object') ? row.details : {})
    }));
    return res.json({ success: true, source: 'postgres', methods });
  } catch (error: any) {
    console.error('Customer payment-method read failed:', error?.message || error);
    return res.status(500).json({ error: 'Payment configuration unavailable' });
  }
});`;
    server = server.slice(0, customerRouteStart) + customerRoute + server.slice(customerRouteEnd + '\n});'.length);
  }
} else {
  const marker = "app.use(express.json());";
  if (!server.includes(marker)) throw new Error('Express JSON middleware marker not found');
  const route = `
app.get('/api/payment-methods', requireAuth, async (_req, res) => {
  try {
    const rows = await dbPaymentMethods().catch(() => null);
    if (!rows) return res.json({ success: true, source: 'unconfigured', methods: [] });
    const names: Record<string, string> = { bankTransfer: 'Bank Transfer', instantTransfer: 'Instant Transfer', crypto: 'Crypto', paypal: 'PayPal', skrill: 'Skrill', neteller: 'Neteller' };
    const types: Record<string, string> = { bankTransfer: 'bank', instantTransfer: 'bank', crypto: 'crypto', paypal: 'wallet', skrill: 'wallet', neteller: 'wallet' };
    const methods = rows.map((row: any) => ({ id: row.id || row.method_type, name: names[row.method_type] || row.method_type, type: types[row.method_type] || 'other', active: Boolean(row.enabled), details: row.details || {}, ...((row.details && typeof row.details === 'object') ? row.details : {}) }));
    return res.json({ success: true, source: 'postgres', methods });
  } catch (error: any) { console.error('Customer payment-method read failed:', error?.message || error); return res.status(500).json({ error: 'Payment configuration unavailable' }); }
});
`;
  server = server.replace(marker, marker + route);
}

// Older generated admin routes only normalized bank/instant/crypto. Extend the
// existing normalized object with the three e-wallet providers before saving.
const adminPostStart = server.indexOf("app.post('/api/admin/payment-methods'");
if (adminPostStart >= 0 && !server.includes('AXI_EWALLET_PAYMENT_METHODS_V1')) {
  const writePos = server.indexOf('writeDataFile(PAYMENT_METHODS_FILE, methods);', adminPostStart);
  if (writePos >= 0) {
    const injection = `  // AXI_EWALLET_PAYMENT_METHODS_V1
  (methods as any).paypal = { enabled: Boolean(incoming.paypal?.enabled), account: String(incoming.paypal?.account || '').trim(), accountName: String(incoming.paypal?.accountName || '').trim(), instructions: String(incoming.paypal?.instructions || '').trim() };
  (methods as any).skrill = { enabled: Boolean(incoming.skrill?.enabled), account: String(incoming.skrill?.account || '').trim(), accountName: String(incoming.skrill?.accountName || '').trim(), instructions: String(incoming.skrill?.instructions || '').trim() };
  (methods as any).neteller = { enabled: Boolean(incoming.neteller?.enabled), account: String(incoming.neteller?.account || '').trim(), accountName: String(incoming.neteller?.accountName || '').trim(), instructions: String(incoming.neteller?.instructions || '').trim() };
`;
    server = server.slice(0, writePos) + injection + server.slice(writePos);
  }
}
fs.writeFileSync(serverPath, server);

const fundsPath = 'src/components/FundsView.tsx';
let funds = fs.readFileSync(fundsPath, 'utf8');
if (!funds.includes('AXI_REAL_FUNDING_CONFIG_V1')) {
  const marker = `  useEffect(() => {\n    const unsubscribe = subscribePaymentConfig((cfg) => {`;
  const start = funds.indexOf(marker);
  if (start < 0) throw new Error('FundsView payment config effect marker not found');
  const endMarker = `  }, []);\n\n  const cryptoWallets = paymentConfig.cryptoWallets || defaultCryptoWallets;`;
  const end = funds.indexOf(endMarker, start);
  if (end < 0) throw new Error('FundsView payment config effect end marker not found');
  const endLength = `  }, []);`.length;
  const serverEffect = `

  // AXI_REAL_FUNDING_CONFIG_V1: server-side admin configuration is authoritative for customers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payment-methods');
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data.methods) || cancelled) return;
        const methods = data.methods;
        const crypto = methods.find((m: any) => m.type === 'crypto' && m.id === 'crypto');
        const bank = methods.find((m: any) => m.id === 'bankTransfer');
        const instant = methods.find((m: any) => m.id === 'instantTransfer');
        const normalizedMethods = methods.filter((m: any) => m.active).map((m: any) => ({
          id: m.id, name: m.name, type: m.type, currency: m.currency || 'USD', active: true,
          minDeposit: Number(m.minDeposit || 0), maxDeposit: Number(m.maxDeposit || 0), feePercent: Number(m.feePercent || 0),
          processingTime: m.processingTime || 'Manual verification', walletAddress: m.walletAddress || m.address, network: m.network, memo: m.memo,
          bankName: m.bankName, accountName: m.accountName, accountNumber: m.accountNumber, swiftBic: m.swiftBic, routingNumber: m.routingNumber, bankAddress: m.bankAddress,
          walletIdentifier: m.account || m.walletIdentifier, instructions: m.instructions || 'Follow the payment instructions shown for this method.', iconName: m.iconName || m.id
        }));
        const next = { ...paymentConfig, paymentMethods: normalizedMethods, updatedAt: Date.now() } as CentralPaymentConfig;
        if (crypto) {
          const d = crypto.details || crypto; const asset = String(d.asset || 'usdt').toLowerCase();
          next.cryptoWallets = { ...next.cryptoWallets, [asset]: { address: String(d.walletAddress || d.address || ''), network: String(d.network || ''), memo: d.memo || undefined, active: true } };
        }
        if (bank || instant) {
          const d = (bank || instant).details || (bank || instant);
          next.bankSettings = { ...next.bankSettings, bankName: String(d.bankName || ''), accountName: String(d.accountName || ''), accountNumber: String(d.accountNumber || ''), swiftBic: String(d.swiftBic || ''), routingNumber: String(d.routingNumber || ''), bankAddress: String(d.bankAddress || ''), instructions: String(d.instructions || ''), supportEmail: d.supportEmail || '', active: Boolean((bank || instant).active) };
        }
        setPaymentConfig(next);
      } catch (error) { console.warn('[FundsView] server payment configuration unavailable:', error); }
    })();
    return () => { cancelled = true; };
  }, []);`;
  funds = funds.slice(0, end + endLength) + serverEffect + funds.slice(end + endLength);
}

const withdrawStart = funds.indexOf('  // Withdraw Submission\\n  const handleWithdrawSubmit');
if (withdrawStart >= 0 && !funds.includes('AXI_REAL_WITHDRAWAL_REQUEST_V1')) {
  const bodyStart = funds.indexOf('  const handleWithdrawSubmit =', withdrawStart);
  const bodyEnd = funds.indexOf('\\n  // Add User-Defined Saved Method', bodyStart);
  if (bodyStart < 0 || bodyEnd < 0) throw new Error('Withdrawal handler boundaries not found');
  const replacement = `  // AXI_REAL_WITHDRAWAL_REQUEST_V1
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) return showToast('Please enter a valid withdrawal amount', 'error');
    if (amountNum > liveBalance) return showToast('Insufficient funds for this withdrawal amount', 'error');
    if (withdrawMethod === 'crypto' && !withdrawAddress.trim()) return showToast('Please enter your recipient wallet address', 'error');
    if (withdrawMethod === 'bank' && (!withdrawAccountNumber.trim() || !withdrawBankName.trim())) return showToast('Please complete all required bank settlement fields', 'error');
    if ((withdrawMethod === 'skrill' || withdrawMethod === 'neteller') && !withdrawEWalletEmail.trim()) return showToast('Please enter your receiving account email', 'error');
    const user = auth.currentUser;
    if (!user) return showToast('Please sign in before requesting a withdrawal.', 'error');
    setIsProcessingWithdraw(true);
    try {
      const response = await fetch('/api/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amountNum, currency: 'USD', method: withdrawMethod, asset: withdrawCryptoAsset, address: withdrawAddress.trim(), memo: withdrawMemo.trim(), bankName: withdrawBankName.trim(), accountName: withdrawAccountName.trim(), accountNumber: withdrawAccountNumber.trim(), swift: withdrawSwift.trim(), walletEmail: withdrawEWalletEmail.trim(), userId: user.uid, userEmail: user.email || '' }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Withdrawal request could not be submitted');
      const txId = String(data.id || data.reference || ('WTH-' + Date.now().toString(36).toUpperCase()));
      addTransaction({ id: txId, type: 'Withdrawal', amount: -amountNum, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), status: data.status || 'In Review', method: withdrawMethod, recipient: withdrawMethod === 'crypto' ? withdrawAddress : withdrawMethod === 'bank' ? withdrawAccountNumber : withdrawEWalletEmail });
      setWithdrawAmount(''); setWithdrawAddress(''); setWithdrawEWalletEmail(''); setWithdrawMemo(''); showToast(data.message || 'Withdrawal request submitted for review.', 'success'); setActiveTab('history');
    } catch (error: any) { showToast(error?.message || 'Withdrawal request failed. No balance was changed.', 'error'); }
    finally { setIsProcessingWithdraw(false); }
  };
`;
  funds = funds.slice(0, bodyStart) + replacement + funds.slice(bodyEnd);
}
fs.writeFileSync(fundsPath, funds);
console.log('Real customer funding configuration and withdrawal request flow applied.');
