import pg from 'pg';
import type { Express, NextFunction, Request, Response } from 'express';
import { requireAuth, requireAdmin } from './adminAuth';

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
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS allow_login BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS allow_trading BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS allow_deposits BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS allow_withdrawals BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS risk_status TEXT NOT NULL DEFAULT 'NORMAL';
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS session_status TEXT NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS admin_notes TEXT NOT NULL DEFAULT '';
      CREATE TABLE IF NOT EXISTS axi_withdrawal_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL DEFAULT '',
        amount NUMERIC(20,8) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        method TEXT NOT NULL DEFAULT '',
        destination JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS axi_withdrawal_status_idx ON axi_withdrawal_records(status,created_at DESC);
      CREATE INDEX IF NOT EXISTS axi_withdrawal_user_idx ON axi_withdrawal_records(user_id,created_at DESC);
    `);
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

function identity(req: Request) {
  const u = (req as any).user || {};
  return { id: String(u.uid || ''), email: String(u.email || '').trim().toLowerCase() };
}

async function findUser(id: string, email = '') {
  const d = db();
  if (!d) throw new Error('PostgreSQL is not configured');
  const { rows } = await d.query(`SELECT * FROM axi_users WHERE id=$1 OR ($2<>'' AND LOWER(email)=LOWER($2)) LIMIT 1`, [id, email]);
  return rows[0] || null;
}

async function auditEvent(actor: string, action: string, user: any, metadata: any = {}) {
  const d = db();
  if (!d || !user) return;
  await d.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,$2,$3,$4,$5)`, [actor || 'system', action, user.id || null, user.email || null, JSON.stringify(metadata)]);
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) { return requireAdmin(req, res, next); }

export async function initControlPlane() {
  if (!db()) return false;
  await ensureSchema();
  return true;
}

export function registerControlPlane(app: Express) {
  // The middleware is registered before the legacy withdraw handler so this authoritative path owns /api/withdraw.
  app.post('/api/withdraw', requireAuth, async (req, res) => {
    try {
      await ensureSchema();
      const d = db();
      if (!d) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
      const me = identity(req);
      if (!me.id) return res.status(401).json({ success: false, error: 'Authenticated user is required' });
      const user = await findUser(me.id, me.email);
      if (!user) return res.status(404).json({ success: false, error: 'Trading account not found' });
      if (!user.allow_login || String(user.status || '').toLowerCase() === 'suspended' || String(user.status || '').toLowerCase() === 'frozen') return res.status(403).json({ success: false, code: 'ACCOUNT_RESTRICTED', error: 'Account access is restricted' });
      if (String(user.kyc_status || '').toUpperCase() !== 'APPROVED') return res.status(403).json({ success: false, code: 'KYC_REQUIRED', error: 'Verified KYC is required before withdrawals' });
      if (!user.allow_withdrawals) return res.status(403).json({ success: false, code: 'WITHDRAWALS_DISABLED', error: 'Withdrawals are currently disabled for this account' });
      if (String(user.risk_status || '').toUpperCase() === 'RESTRICTED') return res.status(403).json({ success: false, code: 'RISK_RESTRICTED', error: 'Withdrawals are restricted pending account review' });
      const amount = Number(req.body?.amount);
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'A valid withdrawal amount is required' });
      const currency = String(req.body?.currency || 'USD').trim().toUpperCase().slice(0, 12);
      const method = String(req.body?.method || '').trim().slice(0, 80);
      if (!method) return res.status(400).json({ success: false, error: 'Withdrawal method is required' });
      const destination = { address: String(req.body?.address || '').trim().slice(0, 200), memo: String(req.body?.memo || '').trim().slice(0, 200), bankName: String(req.body?.bankName || '').trim().slice(0, 120), accountName: String(req.body?.accountName || '').trim().slice(0, 120), accountNumber: String(req.body?.accountNumber || '').trim().slice(0, 120), swift: String(req.body?.swift || '').trim().slice(0, 40), walletEmail: String(req.body?.walletEmail || '').trim().toLowerCase().slice(0, 160) };
      const id = `WD-${Date.now()}-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
      const client = await d.connect();
      try {
        await client.query('BEGIN');
        const locked = await client.query('SELECT id,email,balance FROM axi_users WHERE id=$1 FOR UPDATE', [user.id]);
        if (!locked.rows[0]) throw new Error('Trading account not found');
        const balance = Number(locked.rows[0].balance || 0);
        if (amount > balance) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, code: 'INSUFFICIENT_BALANCE', error: 'Insufficient available balance' }); }
        const nextBalance = balance - amount;
        await client.query('UPDATE axi_users SET balance=$2,updated_at=NOW() WHERE id=$1', [user.id, nextBalance]);
        await client.query(`INSERT INTO axi_withdrawal_records(id,user_id,user_email,amount,currency,method,destination,status) VALUES($1,$2,$3,$4,$5,$6,$7,'PENDING_REVIEW')`, [id, user.id, user.email, amount, currency, method, JSON.stringify(destination)]);
        await client.query(`INSERT INTO axi_balance_ledger(user_id,user_email,entry_type,amount,balance_before,balance_after,reason,reference_id,actor) VALUES($1,$2,'WITHDRAWAL_HOLD',$3,$4,$5,$6,$7,'system')`, [user.id, user.email, -amount, balance, nextBalance, 'Withdrawal request placed on administrative review hold', id]);
        await client.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES('system','WITHDRAWAL_REQUESTED',$1,$2,$3)`, [user.id, user.email, JSON.stringify({ withdrawalId: id, amount, currency, method })]);
        await client.query('COMMIT');
        return res.status(201).json({ success: true, withdrawal: { id, status: 'PENDING_REVIEW', amount, currency, method }, balance: nextBalance });
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    } catch (e: any) { console.error('Authoritative withdrawal failed:', e?.message || e); return res.status(500).json({ success: false, error: 'Withdrawal request could not be created' }); }
  });

  app.get('/api/me/capabilities', requireAuth, async (req, res) => {
    try {
      await ensureSchema();
      const me = identity(req);
      const user = await findUser(me.id, me.email);
      if (!user) return res.status(404).json({ success: false, error: 'Account not found' });
      const accountStatus = String(user.status || 'Pending');
      const kycStatus = String(user.kyc_status || 'NOT_STARTED');
      return res.json({ success: true, capabilities: { accountStatus, kycStatus, trading: Boolean(user.allow_trading), deposits: Boolean(user.allow_deposits), withdrawals: Boolean(user.allow_withdrawals), riskStatus: String(user.risk_status || 'NORMAL'), sessionStatus: String(user.session_status || 'ACTIVE'), canLogin: Boolean(user.allow_login), balance: Number(user.balance || 0) }, source: 'postgres' });
    } catch (e) { console.error('Capabilities read failed:', e); return res.status(503).json({ success: false, error: 'Account controls unavailable' }); }
  });

  app.get('/api/admin/users/:id', adminMiddleware, async (req, res) => {
    try { await ensureSchema(); const user = await findUser(String(req.params.id)); if (!user) return res.status(404).json({ success: false, error: 'User not found' }); const d = db()!; const [ledger, withdrawals] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id])]); return res.json({ success:true, user, ledger: ledger.rows, withdrawals: withdrawals.rows }); }
    catch(e){ return res.status(503).json({success:false,error:'User control data unavailable'}); }
  });

  app.post('/api/admin/users/:id/controls', adminMiddleware, async (req, res) => {
    try { await ensureSchema(); const d=db(); if(!d) return res.status(503).json({success:false,error:'PostgreSQL is not configured'}); const id=String(req.params.id); const before=await findUser(id); if(!before) return res.status(404).json({success:false,error:'User not found'}); const allowed=['allow_login','allow_trading','allow_deposits','allow_withdrawals','risk_status','session_status','status','admin_notes']; const patch:any={}; for(const key of allowed){if(Object.prototype.hasOwnProperty.call(req.body||{},key)) patch[key]=req.body[key];} if(!Object.keys(patch).length) return res.status(400).json({success:false,error:'No account control changes supplied'}); const fields=Object.keys(patch); const values:any[]=[]; const sets:string[]=[]; fields.forEach((k,i)=>{values.push(patch[k]);sets.push(`${k}=$${i+2}`)}); values.unshift(id); const result=await d.query(`UPDATE axi_users SET ${sets.join(',')},updated_at=NOW() WHERE id=$1 RETURNING *`,values); const after=result.rows[0]; await auditEvent(String((req as any).adminEmail||'admin'),'ACCOUNT_CONTROLS_CHANGED',after,{changes:patch,previous:{allow_login:before.allow_login,allow_trading:before.allow_trading,allow_deposits:before.allow_deposits,allow_withdrawals:before.allow_withdrawals,risk_status:before.risk_status,session_status:before.session_status,status:before.status}}); return res.json({success:true,user:after}); }
    catch(e:any){ return res.status(400).json({success:false,error:e?.message||'Account controls could not be updated'}); }
  });

  app.post('/api/admin/users/:id/balance-adjustment', adminMiddleware, async (req,res)=>{
    try { const id=String(req.params.id); const amount=Number(req.body?.amount); const reason=String(req.body?.reason||'').trim(); if(!Number.isFinite(amount)||amount===0||!reason) return res.status(400).json({success:false,error:'Non-zero amount and reason are required'}); const { dbAdjustBalance }=await import('./postgres'); const result=await dbAdjustBalance(id,amount,String((req as any).adminEmail||'admin'),reason,String(req.body?.referenceId||'')); return res.json({success:true,result}); }
    catch(e:any){ return res.status(400).json({success:false,error:e?.message||'Balance adjustment failed'}); }
  });

  app.get('/api/admin/withdrawals/pending', adminMiddleware, async (_req,res)=>{ try{await ensureSchema();const d=db();if(!d)return res.status(503).json({success:false,error:'PostgreSQL is not configured'});const {rows}=await d.query("SELECT * FROM axi_withdrawal_records WHERE status='PENDING_REVIEW' ORDER BY created_at ASC");return res.json({success:true,withdrawals:rows});}catch(e){return res.status(503).json({success:false,error:'Withdrawal queue unavailable'});} });

  app.post('/api/admin/withdrawals/:id/approve', adminMiddleware, async (req,res)=>{ try{await ensureSchema();const d=db();if(!d)return res.status(503).json({success:false,error:'PostgreSQL is not configured'});const id=String(req.params.id);const actor=String((req as any).adminEmail||'admin');const c=await d.connect();try{await c.query('BEGIN');const q=await c.query("SELECT * FROM axi_withdrawal_records WHERE id=$1 AND status='PENDING_REVIEW' FOR UPDATE",[id]);if(!q.rows[0]){await c.query('ROLLBACK');return res.status(404).json({success:false,error:'Pending withdrawal not found'});}const w=q.rows[0];await c.query("UPDATE axi_withdrawal_records SET status='APPROVED',reviewed_by=$2,reviewed_at=NOW(),updated_at=NOW() WHERE id=$1",[id,actor]);await c.query("INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,'WITHDRAWAL_APPROVED',$2,$3,$4)",[actor,w.user_id,w.user_email,JSON.stringify({withdrawalId:id,amount:Number(w.amount),currency:w.currency})]);await c.query('COMMIT');return res.json({success:true,status:'APPROVED',withdrawalId:id});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}catch(e){return res.status(503).json({success:false,error:'Withdrawal approval failed'});} });

  app.post('/api/admin/withdrawals/:id/reject', adminMiddleware, async (req,res)=>{ try{await ensureSchema();const d=db();if(!d)return res.status(503).json({success:false,error:'PostgreSQL is not configured'});const id=String(req.params.id);const actor=String((req as any).adminEmail||'admin');const reason=String(req.body?.reason||'Withdrawal rejected by administrator').trim().slice(0,500);const c=await d.connect();try{await c.query('BEGIN');const q=await c.query("SELECT * FROM axi_withdrawal_records WHERE id=$1 AND status='PENDING_REVIEW' FOR UPDATE",[id]);if(!q.rows[0]){await c.query('ROLLBACK');return res.status(404).json({success:false,error:'Pending withdrawal not found'});}const w=q.rows[0];const user=await c.query('SELECT id,email,balance FROM axi_users WHERE id=$1 FOR UPDATE',[w.user_id]);if(!user.rows[0])throw new Error('User account not found');const before=Number(user.rows[0].balance||0);const after=before+Number(w.amount||0);await c.query('UPDATE axi_users SET balance=$2,updated_at=NOW() WHERE id=$1',[w.user_id,after]);await c.query("UPDATE axi_withdrawal_records SET status='REJECTED',reviewed_by=$2,reviewed_at=NOW(),rejection_reason=$3,updated_at=NOW() WHERE id=$1",[id,actor,reason]);await c.query("INSERT INTO axi_balance_ledger(user_id,user_email,entry_type,amount,balance_before,balance_after,reason,reference_id,actor) VALUES($1,$2,'WITHDRAWAL_RELEASE',$3,$4,$5,$6,$7,$8)",[w.user_id,w.user_email,Number(w.amount),before,after,reason,id,actor]);await c.query("INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,'WITHDRAWAL_REJECTED',$2,$3,$4)",[actor,w.user_id,w.user_email,JSON.stringify({withdrawalId:id,amount:Number(w.amount),reason})]);await c.query('COMMIT');return res.json({success:true,status:'REJECTED',withdrawalId:id,balance:after});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}catch(e:any){return res.status(400).json({success:false,error:e?.message||'Withdrawal rejection failed'});} });
}
