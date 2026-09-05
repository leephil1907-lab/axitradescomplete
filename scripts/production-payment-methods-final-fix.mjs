import fs from 'node:fs';

const serverPath = 'server.ts';
let source = fs.readFileSync(serverPath, 'utf8');

// The admin UI submits multiple PayPal/Skrill/Neteller entries under
// instantTransfer.methods. Keep that array intact in PostgreSQL instead of
// collapsing it to a single legacy account.
const oldInstant = `    instantTransfer: {\n      enabled: Boolean(incoming.instantTransfer?.enabled), providerName: String(incoming.instantTransfer?.providerName || '').trim(),\n      accountName: String(incoming.instantTransfer?.accountName || '').trim(), accountNumber: String(incoming.instantTransfer?.accountNumber || '').trim(),\n      instructions: String(incoming.instantTransfer?.instructions || '').trim()\n    },`;
const newInstant = `    instantTransfer: {\n      enabled: Boolean(incoming.instantTransfer?.enabled || (Array.isArray(incoming.instantTransfer?.methods) && incoming.instantTransfer.methods.some((m: any) => Boolean(m?.enabled)))),\n      methods: (Array.isArray(incoming.instantTransfer?.methods) ? incoming.instantTransfer.methods : []).map((m: any, index: number) => ({\n        id: String(m?.id || ('instant-' + index + '-' + Date.now().toString(36))),\n        enabled: Boolean(m?.enabled),\n        provider: (m?.provider === 'skrill' || m?.provider === 'neteller' ? m.provider : 'paypal'),\n        account: String(m?.account || m?.email || m?.accountNumber || '').trim(),\n        accountName: String(m?.accountName || '').trim(),\n        instructions: String(m?.instructions || '').trim()\n      })).filter((m: any) => m.account || m.accountName || m.instructions)\n    },`;
if (source.includes(oldInstant)) source = source.replace(oldInstant, newInstant);

// Validate every enabled instant-transfer entry and return the exact persisted
// shape to the admin UI after saving.
const oldInvalid = `  const invalid = methods.crypto.find((wallet: any) => wallet.enabled && (!wallet.asset || !wallet.network || !wallet.address));\n  if (invalid) return res.status(400).json({ success: false, error: 'Every enabled crypto wallet requires an asset, network, and wallet address.' });`;
const newInvalid = `  const invalid = methods.crypto.find((wallet: any) => wallet.enabled && (!wallet.asset || !wallet.network || !wallet.address));\n  if (invalid) return res.status(400).json({ success: false, error: 'Every enabled crypto wallet requires an asset, network, and wallet address.' });\n  const invalidInstant = (methods.instantTransfer.methods || []).find((m: any) => m.enabled && !m.account);\n  if (invalidInstant) return res.status(400).json({ success: false, error: 'Every enabled instant transfer method requires a receiving account.' });`;
if (source.includes(oldInvalid) && !source.includes('const invalidInstant = (methods.instantTransfer.methods || [])')) source = source.replace(oldInvalid, newInvalid);

// The customer endpoint should expose each manual instant-transfer method as
// its own customer-facing method, while retaining the existing singleton
// PayPal/Skrill/Neteller compatibility fields.
const oldCustomer = `    const methods = rows.map((row: any) => ({\n      id: row.method_type === 'crypto' ? (row.id || 'crypto') : row.method_type,\n      name: names[row.method_type] || row.method_type, type: types[row.method_type] || 'other', active: Boolean(row.enabled),\n      details: row.details || {}, iconName: icons[row.method_type] || row.method_type,\n      ...((row.details && typeof row.details === 'object') ? row.details : {})\n    }));`;
const newCustomer = `    const methods = rows.flatMap((row: any) => {\n      if (row.method_type === 'instantTransfer' && Array.isArray(row.details?.methods)) {\n        return row.details.methods.map((entry: any, index: number) => ({\n          id: String(entry.id || ('instant-' + index)),\n          name: String(entry.provider || 'Instant Transfer').replace(/^./, (c: string) => c.toUpperCase()) + ' Instant Transfer',\n          type: 'wallet', active: Boolean(row.enabled && entry.enabled),\n          details: entry, iconName: String(entry.provider || 'instant')\n        }));\n      }\n      return [{\n        id: row.method_type === 'crypto' ? (row.id || 'crypto') : row.method_type,\n        name: names[row.method_type] || row.method_type, type: types[row.method_type] || 'other', active: Boolean(row.enabled),\n        details: row.details || {}, iconName: icons[row.method_type] || row.method_type,\n        ...((row.details && typeof row.details === 'object') ? row.details : {})\n      }];\n    });`;
if (source.includes(oldCustomer)) source = source.replace(oldCustomer, newCustomer);

fs.writeFileSync(serverPath, source);
console.log('Final payment-method persistence/customer exposure fix applied.');
