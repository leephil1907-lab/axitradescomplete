import type { Express, Request, Response } from 'express';
import { requireAdmin } from './adminAuth';
import pg from 'pg';

const { Pool } = pg;
let pool: pg.Pool | null = null;
let schemaReady: Promise<void> | null = null;

function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
  return pool;
}

async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const d = db();
    if (!d) return;
    await d.query(`
      CREATE INDEX IF NOT EXISTS axi_funding_pending_idx ON axi_funding_records(status, created_at ASC);
      CREATE INDEX IF NOT EXISTS axi_audit_target_idx ON axi_audit_logs(target_user_id, created_at DESC);
    `);
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

function actor(req: Request) { return String((req as any).adminEmail || 'admin'); }

function mapDeposit(row: any, user?: any) {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    amount: Number(row.amount || 0),
    currency: row.currency || 'USD',
    method: row.method || '',
    status: row.status || 'Awaiting Admin Credit',
    stripeRef: row.external_reference || undefined,
    receivedAt: row.created_at,
    creditedByAdmin: row.status === 'Credited',
    user: user ? { id: user.id, email: user.email, name: user.name, balance: Number(user.balance || 0) } : undefined
  };
}

export async function initFundingControlPlane() {
  if (!db()) return false;
  await ensureSchema();
  return true;
}

export function registerFundingControlPlane(app: Express) {
  app.get('/api/admin/funding/pending', requireAdmin, async (_req, res) => {
    try {
      await ensureSchema();
      const d = db();
      if (!d) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
      const { rows } = await d.query(`SELECT f.*, u.name, u.balance FROM axi_funding_records f LEFT JOIN axi_users u ON u.id=f.user_id WHERE f.status NOT IN ('Credited','Rejected') ORDER BY f.created_at ASC`);
      return res.json({ success: true, deposits: rows.map((r) => mapDeposit(r, { id: r.user_id, email: r.user_email, name: r.name, balance: r.balance })), source: 'postgres' });
    } catch (e) {
      console.error('Funding queue read failed:', e);
      return res.status(503).json({ success: false, error: 'Funding queue unavailable' });
    }
  });

  // Atomic approval: one transaction marks the deposit credited, increases the user balance,
  // creates the ledger entry, and records the audit event. The UI must never perform these steps separately.
  app.post('/api/admin/funding/:id/credit', requireAdmin, async (req, res) => {
    const d = db();
    if (!d) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    const id = String(req.params.id || '');
    const admin = actor(req);
    const client = await d.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT f.*, u.id AS account_id, u.email AS account_email, u.balance AS account_balance FROM axi_funding_records f LEFT JOIN axi_users u ON u.id=f.user_id WHERE f.id=$1 FOR UPDATE`, [id]);
      if (!found.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Funding record not found' }); }
      const f = found.rows[0];
      if (['Credited', 'Rejected'].includes(String(f.status))) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: `Funding record is already ${String(f.status).toLowerCase()}` }); }
      if (!f.account_id) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: 'Funding record has no valid user account' }); }
      const amount = Number(f.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'Funding record has an invalid amount' }); }
      const before = Number(f.account_balance || 0);
      const after = before + amount;
      const updated = await client.query(`UPDATE axi_users SET balance=$2,updated_at=NOW() WHERE id=$1 RETURNING id,email,balance`, [f.account_id, after]);
      await client.query(`UPDATE axi_funding_records SET status='Credited',credited_by=$2,credited_at=NOW(),updated_at=NOW() WHERE id=$1`, [id, admin]);
      const ledger = await client.query(`INSERT INTO axi_balance_ledger(user_id,user_email,entry_type,amount,balance_before,balance_after,reason,reference_id,actor) VALUES($1,$2,'DEPOSIT',$3,$4,$5,$6,$7,$8) RETURNING *`, [f.account_id, updated.rows[0].email, amount, before, after, `Approved ${f.method || 'funding'} deposit`, id, admin]);
      await client.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,'ADMIN_FUNDING_CREDIT',$2,$3,$4)`, [admin, f.account_id, updated.rows[0].email, JSON.stringify({ fundingId: id, amount, currency: f.currency, method: f.method, balanceBefore: before, balanceAfter: after, ledgerId: ledger.rows[0].id })]);
      await client.query('COMMIT');
      return res.json({ success: true, status: 'Credited', fundingId: id, balanceBefore: before, balanceAfter: after, ledger: ledger.rows[0] });
    } catch (e: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      console.error('Atomic funding credit failed:', e?.message || e);
      return res.status(500).json({ success: false, error: 'Funding approval failed' });
    } finally { client.release(); }
  });

  app.post('/api/admin/funding/:id/reject', requireAdmin, async (req, res) => {
    const d = db();
    if (!d) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    const id = String(req.params.id || '');
    const admin = actor(req);
    const reason = String(req.body?.reason || 'Funding rejected by administrator').trim().slice(0, 500);
    const client = await d.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query(`SELECT * FROM axi_funding_records WHERE id=$1 FOR UPDATE`, [id]);
      if (!found.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Funding record not found' }); }
      const f = found.rows[0];
      if (['Credited', 'Rejected'].includes(String(f.status))) { await client.query('ROLLBACK'); return res.status(409).json({ success: false, error: `Funding record is already ${String(f.status).toLowerCase()}` }); }
      await client.query(`UPDATE axi_funding_records SET status='Rejected',updated_at=NOW() WHERE id=$1`, [id]);
      await client.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,'ADMIN_FUNDING_REJECT',$2,$3,$4)`, [admin, f.user_id, f.user_email, JSON.stringify({ fundingId: id, amount: Number(f.amount || 0), currency: f.currency, method: f.method, reason })]);
      await client.query('COMMIT');
      return res.json({ success: true, status: 'Rejected', fundingId: id });
    } catch (e: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      console.error('Funding rejection failed:', e?.message || e);
      return res.status(500).json({ success: false, error: 'Funding rejection failed' });
    } finally { client.release(); }
  });
}
