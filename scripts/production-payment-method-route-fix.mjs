import fs from 'node:fs';

const serverPath = 'server.ts';
let source = fs.readFileSync(serverPath, 'utf8');

const pluralRoute = "app.post('/api/admin/payment-methods'";
const singularRoute = "app.post('/api/admin/payment-method'";

if (!source.includes(pluralRoute)) {
  const marker = "app.get('/api/admin/activity'";
  const markerPos = source.indexOf(marker);
  if (markerPos < 0) throw new Error('Admin activity route marker not found');

  const route = `app.post('/api/admin/payment-methods', requireAdmin, async (req, res) => {
  try {
    const incoming = req.body?.methods || req.body;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ success: false, error: 'Invalid payment methods payload' });
    }
    const actor = String((req as any).adminEmail || 'admin');
    const persisted = await dbSavePaymentMethods(incoming, actor);
    if (!persisted) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
    await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor, metadata: { methodTypes: Object.keys(incoming) } }).catch(() => {});
    return res.json({ success: true, source: 'postgres' });
  } catch (error: any) {
    console.error('Save payment methods failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save payment methods' });
  }
});

`;
  source = source.slice(0, markerPos) + route + source.slice(markerPos);
}

// Keep compatibility with older admin bundles that still POST to the singular endpoint.
if (!source.includes(singularRoute)) {
  const marker = "app.get('/api/admin/activity'";
  const markerPos = source.indexOf(marker);
  if (markerPos < 0) throw new Error('Admin activity route marker not found for compatibility route');

  const route = `app.post('/api/admin/payment-method', requireAdmin, async (req, res) => {
  try {
    const incoming = req.body?.methods || req.body;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return res.status(400).json({ success: false, error: 'Invalid payment methods payload' });
    }
    const actor = String((req as any).adminEmail || 'admin');
    const persisted = await dbSavePaymentMethods(incoming, actor);
    if (!persisted) return res.status(503).json({ success: false, error: 'Payment methods storage is unavailable' });
    await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor, metadata: { methodTypes: Object.keys(incoming), compatibilityRoute: true } }).catch(() => {});
    return res.json({ success: true, source: 'postgres' });
  } catch (error: any) {
    console.error('Save payment methods compatibility route failed:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to save payment methods' });
  }
});

`;
  source = source.slice(0, markerPos) + route + source.slice(markerPos);
}

fs.writeFileSync(serverPath, source);
console.log('Payment-method POST routes verified: plural endpoint plus singular compatibility endpoint.');
