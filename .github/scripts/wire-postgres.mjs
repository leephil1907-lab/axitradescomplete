import fs from 'node:fs';

const path = 'server.ts';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes("from './server/postgres'")) {
  source = source.replace("import nodemailer from 'nodemailer';", "import nodemailer from 'nodemailer';\nimport { hasPostgres, initPostgres, dbUsers, dbUpsertUser, dbUpdateUser, audit, dbAuditLogs, dbPaymentMethods, dbSavePaymentMethods, dbCreateFunding, dbFundingPending, dbCreditFunding } from './server/postgres';");
}

if (!source.includes('POSTGRES_PERSISTENCE_MARKER')) {
  source = source.replace("const app = express();", `const app = express();\n\n// POSTGRES_PERSISTENCE_MARKER\ninitPostgres().then(() => { if (hasPostgres()) console.log('PostgreSQL persistence initialized'); }).catch((error) => {\n  console.error('PostgreSQL initialization failed; application will retain its existing fallback stores:', error);\n});`);
}

source = source.replace(
"app.get('/api/users', (req, res) => {\n  res.json({\n    success: true,\n    users: appUsersStore,\n    total: appUsersStore.length\n  });\n});",
`app.get('/api/users', async (req, res) => {\n  try {\n    const persisted = await dbUsers();\n    if (persisted) return res.json({ success: true, users: persisted.map((u) => ({ ...u, verificationStatus: u.verification_status, kycStatus: u.kyc_status, demoBalance: Number(u.demo_balance), balance: Number(u.balance) })), total: persisted.length, source: 'postgres' });\n  } catch (error) { console.error('Postgres users read failed:', error); }\n  res.json({ success: true, users: appUsersStore, total: appUsersStore.length, source: 'fallback' });\n});`);

source = source.replace("writeDataFile('users.json', appUsersStore);\n    // Return the MERGED record", "writeDataFile('users.json', appUsersStore);\n    await dbUpsertUser(merged).catch((error) => console.error('Postgres user sync failed:', error));\n    await audit('USER_LOGIN_SYNC', { userId: merged.id, email: merged.email }).catch(() => {});\n    // Return the MERGED record");
source = source.replace("app.post('/api/users/register', (req, res) => {", "app.post('/api/users/register', async (req, res) => {");
source = source.replace("writeDataFile('users.json', appUsersStore);\n  res.json({ success: true, user: userData", "writeDataFile('users.json', appUsersStore);\n  await dbUpsertUser(userData).catch((error) => console.error('Postgres new user sync failed:', error));\n  await audit('USER_REGISTERED', { userId: userData.id, email: userData.email, metadata: { provider: userData.provider } }).catch(() => {});\n  res.json({ success: true, user: userData");

source = source.replace("app.put('/api/users/:id/balance', (req, res) => {", "app.put('/api/users/:id/balance', async (req, res) => {");
source = source.replace("writeDataFile('users.json', appUsersStore);\n\n  notifyTelegram('ADMIN_USER_BALANCE_UPDATE'", "writeDataFile('users.json', appUsersStore);\n  await dbUpdateUser(userId, { balance: user.balance, demoBalance: user.demoBalance }).catch((error) => console.error('Postgres balance sync failed:', error));\n  await audit('ADMIN_BALANCE_UPDATE', { userId: user.id, email: user.email, metadata: { balance: user.balance, reason: reason || 'Admin balance adjustment' } }).catch(() => {});\n\n  notifyTelegram('ADMIN_USER_BALANCE_UPDATE'");
source = source.replace("app.put('/api/users/:id/status', (req, res) => {", "app.put('/api/users/:id/status', async (req, res) => {");
source = source.replace("writeDataFile('users.json', appUsersStore);\n  res.json({ success: true, user });\n});\n\n// Update user PnL", "writeDataFile('users.json', appUsersStore);\n  await dbUpdateUser(userId, { status: user.status, verificationStatus: user.verificationStatus, kycStatus: user.kycStatus }).catch((error) => console.error('Postgres status sync failed:', error));\n  await audit('ADMIN_USER_STATUS_UPDATE', { userId: user.id, email: user.email, metadata: { status: user.status, verificationStatus: user.verificationStatus, kycStatus: user.kycStatus } }).catch(() => {});\n  res.json({ success: true, user });\n});\n\n// Update user PnL");

source = source.replace("app.get('/api/admin/payment-methods', (_req, res) => {", "app.get('/api/admin/payment-methods', async (_req, res) => {");
source = source.replace("  const methods = readDataFile<any>(PAYMENT_METHODS_FILE, {", "  const persistedMethods = await dbPaymentMethods().catch(() => null);\n  if (persistedMethods) {\n    const methods = Object.fromEntries(persistedMethods.map((row) => [row.method_type, { ...(row.details || {}), enabled: row.enabled }]));\n    return res.json({ success: true, methods, source: 'postgres' });\n  }\n  const methods = readDataFile<any>(PAYMENT_METHODS_FILE, {");
source = source.replace("app.post('/api/admin/payment-methods', (req, res) => {", "app.post('/api/admin/payment-methods', async (req, res) => {");
source = source.replace("  writeDataFile(PAYMENT_METHODS_FILE, methods);\n  res.json({ success: true, methods });", "  writeDataFile(PAYMENT_METHODS_FILE, methods);\n  await dbSavePaymentMethods(methods, String(req.headers['x-admin-email'] || 'admin')).catch((error) => console.error('Postgres payment settings sync failed:', error));\n  await audit('ADMIN_PAYMENT_METHODS_UPDATED', { actor: String(req.headers['x-admin-email'] || 'admin'), metadata: methods }).catch(() => {});\n  res.json({ success: true, methods });");

source = source.replace("app.get('/api/admin/funding/pending', (_req, res) => {\n  const deposits = readDataFile<any[]>('pendingDeposits.json', []);\n  res.json({ deposits: deposits.filter(d => !d.creditedByAdmin && d.status !== 'Rejected') });\n});", "app.get('/api/admin/funding/pending', async (_req, res) => {\n  const persisted = await dbFundingPending().catch(() => null);\n  if (persisted) return res.json({ deposits: persisted, source: 'postgres' });\n  const deposits = readDataFile<any[]>('pendingDeposits.json', []);\n  res.json({ deposits: deposits.filter(d => !d.creditedByAdmin && d.status !== 'Rejected'), source: 'fallback' });\n});");

source = source.replace("app.get('/api/admin/payment-methods', async (_req, res) => {", "app.get('/api/admin/payment-methods', async (_req, res) => {");
source = source.replace("app.post('/api/admin/funding/:id/credit', (req, res) => {", "app.post('/api/admin/funding/:id/credit', async (req, res) => {");
source = source.replace("  const deposit = deposits[index];", "  const persistedCredit = await dbCreditFunding(id, String(req.headers['x-admin-email'] || 'admin')).catch(() => null);\n  const deposit = deposits[index];");
source = source.replace("  writeDataFile('pendingDeposits.json', deposits);\n  res.json({ success: true, deposit: deposits[index] });\n});\n\napp.post('/api/admin/funding/:id/reject'", "  writeDataFile('pendingDeposits.json', deposits);\n  await audit('ADMIN_FUNDING_CREDIT', { actor: String(req.headers['x-admin-email'] || 'admin'), userId: String(req.body?.userId || ''), metadata: { fundingId: id, creditedBalance } }).catch(() => {});\n  res.json({ success: true, deposit: deposits[index], persisted: Boolean(persistedCredit) });\n});\n\napp.post('/api/admin/funding/:id/reject'");

if (!source.includes("app.get('/api/admin/activity'")) {
  source = source.replace("const PORT = Number(process.env.PORT) || 3000;", `app.get('/api/admin/activity', async (req, res) => {\n  const logs = await dbAuditLogs(Number(req.query.limit || 200)).catch(() => null);\n  res.json({ success: true, logs: logs || [], source: logs ? 'postgres' : 'unavailable' });\n});\n\nconst PORT = Number(process.env.PORT) || 3000;`);
}

fs.writeFileSync(path, source);
console.log('Postgres persistence wiring applied');
