import pg from 'pg';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Express, NextFunction, Request, Response } from 'express';

const { Pool } = pg;
let pool: pg.Pool | null = null;
let initialized = false;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
  return pool;
}

export async function initOperationalPostgres() {
  const db = getPool();
  if (!db || initialized) return false;
  await db.query(`
    CREATE TABLE IF NOT EXISTS axi_operational_records (
      id TEXT PRIMARY KEY,
      record_type TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      amount NUMERIC(20,8),
      currency TEXT NOT NULL DEFAULT 'USD',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS axi_operational_type_idx ON axi_operational_records(record_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS axi_operational_user_idx ON axi_operational_records(user_id, created_at DESC);
  `);
  initialized = true;
  return true;
}

function firebaseAuth() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key) serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\n/g, '\n');
    const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
    return getAuth(app);
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    return null;
  }
}

async function requireUser(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ success: false, error: 'Authentication required' });
  const auth = firebaseAuth();
  if (!auth) return res.status(503).json({ success: false, error: 'Server authentication is not configured' });
  try {
    const decoded = await auth.verifyIdToken(match[1]);
    (req as any).user = { uid: decoded.uid, email: decoded.email || '' };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}

function asRecord(value: any) { return value && typeof value === 'object' ? value : {}; }
function recordUser(req: Request, body: any) {
  const user = (req as any).user || {};
  return { userId: String(user.uid || body.userId || ''), userEmail: String(user.email || body.userEmail || body.email || '').trim().toLowerCase() };
}

export function postgresOperationalRoutes(app: Express) {
  app.get('/api/transactions', requireUser, async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    try {
      const { userId } = recordUser(req, {});
      const { rows } = await db.query("SELECT id, record_type AS type, user_id, user_email, status, amount, currency, payload, created_at, updated_at FROM axi_operational_records WHERE record_type='transaction' AND user_id=$1 ORDER BY created_at DESC", [userId]);
      return res.json({ success: true, transactions: rows.map((r) => ({ ...r.payload, id: r.id, status: r.status, amount: r.amount === null ? r.payload?.amount : Number(r.amount), currency: r.currency, createdAt: r.created_at })), source: 'postgres' });
    } catch (error) {
      console.error('Postgres transaction read failed:', error);
      return res.status(503).json({ success: false, error: 'Transaction storage is unavailable' });
    }
  });

  app.post('/api/transactions/create', requireUser, async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    const body = asRecord(req.body);
    const identity = recordUser(req, body);
    if (!identity.userId) return res.status(401).json({ success: false, error: 'Authenticated user is required' });
    const id = String(body.id || `TX-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    try {
      await db.query(`INSERT INTO axi_operational_records(id,record_type,user_id,user_email,status,amount,currency,payload) VALUES($1,'transaction',$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, [id, identity.userId, identity.userEmail, String(body.status || 'Pending'), Number.isFinite(Number(body.amount)) ? Number(body.amount) : null, String(body.currency || 'USD'), JSON.stringify({ ...body, id, userId: identity.userId, userEmail: identity.userEmail })]);
      const { rows } = await db.query('SELECT * FROM axi_operational_records WHERE id=$1', [id]);
      return res.status(201).json({ success: true, transaction: rows[0], source: 'postgres' });
    } catch (error) {
      console.error('Postgres transaction create failed:', error);
      return res.status(503).json({ success: false, error: 'Transaction could not be persisted' });
    }
  });

  app.get('/api/kyc/list', requireAdminForOperational, async (_req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    try {
      const { rows } = await db.query("SELECT id,user_id,user_email,status,payload,created_at,updated_at FROM axi_operational_records WHERE record_type='kyc' ORDER BY created_at DESC");
      return res.json({ success: true, submissions: rows.map((r) => ({ ...r.payload, id: r.id, userId: r.user_id, userEmail: r.user_email, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at })), source: 'postgres' });
    } catch (error) {
      console.error('Postgres KYC read failed:', error);
      return res.status(503).json({ success: false, error: 'KYC storage is unavailable' });
    }
  });

  app.post('/api/kyc/submit', requireUser, async (req, res) => {
    const db = getPool();
    if (!db) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
    const body = asRecord(req.body);
    const identity = recordUser(req, body);
    if (!identity.userId || !identity.userEmail) return res.status(400).json({ success: false, error: 'Authenticated user identity is required' });
    const id = String(body.id || `KYC-${identity.userId}-${Date.now()}`);
    try {
      await db.query(`INSERT INTO axi_operational_records(id,record_type,user_id,user_email,status,payload) VALUES($1,'kyc',$2,$3,'Pending',$4) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`, [id, identity.userId, identity.userEmail, JSON.stringify({ ...body, id, userId: identity.userId, userEmail: identity.userEmail, status: 'Pending' })]);
      const { rows } = await db.query('SELECT * FROM axi_operational_records WHERE id=$1', [id]);
      return res.status(201).json({ success: true, submission: rows[0], status: 'Pending', source: 'postgres' });
    } catch (error) {
      console.error('Postgres KYC submit failed:', error);
      return res.status(503).json({ success: false, error: 'KYC submission could not be persisted' });
    }
  });

  app.post('/api/kyc/approve', requireAdminForOperational, async (req, res) => updateKycStatus(req, res, 'Approved'));
  app.post('/api/kyc/reject', requireAdminForOperational, async (req, res) => updateKycStatus(req, res, 'Rejected'));
}

async function updateKycStatus(req: Request, res: Response, status: string) {
  const db = getPool();
  if (!db) return res.status(503).json({ success: false, error: 'PostgreSQL is not configured' });
  const id = String(req.body?.id || req.body?.submissionId || '');
  if (!id) return res.status(400).json({ success: false, error: 'KYC submission id is required' });
  try {
    const { rows } = await db.query(`UPDATE axi_operational_records SET status=$2,payload=jsonb_set(payload,'{status}',to_jsonb($2::text),true),updated_at=NOW() WHERE id=$1 AND record_type='kyc' RETURNING *`, [id, status]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'KYC submission not found' });
    return res.json({ success: true, submission: rows[0], status, source: 'postgres' });
  } catch (error) {
    console.error('Postgres KYC status update failed:', error);
    return res.status(503).json({ success: false, error: 'KYC status could not be persisted' });
  }
}

async function requireAdminForOperational(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ success: false, error: 'Authentication required' });
  const auth = firebaseAuth();
  if (!auth) return res.status(503).json({ success: false, error: 'Server authentication is not configured' });
  try {
    const decoded: any = await auth.verifyIdToken(match[1]);
    const emails = String(process.env.ADMIN_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const uids = String(process.env.ADMIN_UIDS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const email = String(decoded.email || '').toLowerCase();
    if (!uids.includes(String(decoded.uid).toLowerCase()) && !emails.includes(email)) return res.status(403).json({ success: false, error: 'Administrator access required' });
    (req as any).adminEmail = email || decoded.uid;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}
