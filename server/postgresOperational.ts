import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { verifyAdminSession } from './adminAuth';
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
  // Schema-drift hardening: upgrade tables created by older app versions so
  // column references in the handlers below can never fail at runtime.
  await db.query(`ALTER TABLE axi_operational_records ADD COLUMN IF NOT EXISTS user_id TEXT, ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending', ADD COLUMN IF NOT EXISTS amount NUMERIC(20,8), ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD', ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  initialized = true;
  return true;
}

// ---------------------------------------------------------------------------
// File-backed fallback stores for operational KYC/transaction records.
// When PostgreSQL is not configured (or temporarily unreachable / schema-drifted)
// these keep the admin + customer flows working instead of returning 503s.
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
function readDataFile<T = any>(filename: string, defaultVal: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch (err) { console.warn(`Notice reading ${filename}:`, err); }
  return defaultVal;
}
function writeDataFile(filename: string, data: any) {
  const filePath = path.join(DATA_DIR, filename);
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8'); }
  catch (err) { console.warn(`Notice writing ${filename}:`, err); }
}
function kycFileRows() {
  const records = readDataFile<any[]>('kyc.json', []);
  return records.map((r) => ({
    ...(r.payload && typeof r.payload === 'object' ? r.payload : {}),
    id: String(r.id || r.payload?.id || ''),
    userId: String(r.userId || r.user_id || ''),
    userEmail: String(r.userEmail || r.user_email || r.payload?.userEmail || ''),
    status: String(r.status || r.payload?.status || 'Pending'),
    createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    updatedAt: r.updatedAt || r.updated_at || r.createdAt || new Date().toISOString()
  }));
}
function kycFileWriteOne(id: string, patch: Partial<any> = {}, body: any = null) {
  const records = readDataFile<any[]>('kyc.json', []);
  const index = records.findIndex((r) => String(r.id) === String(id));
  let record: any;
  if (index >= 0) {
    record = { ...records[index], ...patch, id, updatedAt: new Date().toISOString() };
    if (body && record.payload && typeof record.payload === 'object') record.payload = { ...record.payload, ...body };
    records[index] = record;
  } else {
    record = {
      id, userId: String(body?.userId || ''), userEmail: String(body?.userEmail || '').toLowerCase(),
      status: String(patch.status || body?.status || 'Pending'), payload: { ...(body || {}) },
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    records.unshift(record);
  }
  writeDataFile('kyc.json', records);
  return {
    ...(record.payload && typeof record.payload === 'object' ? record.payload : {}),
    id: record.id, userId: record.userId, userEmail: record.userEmail,
    status: record.status, createdAt: record.createdAt, updatedAt: record.updatedAt
  };
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
    if (!db) return res.json({ success: true, submissions: kycFileRows(), source: 'file' });
    try {
      const { rows } = await db.query("SELECT id,user_id,user_email,status,payload,created_at,updated_at FROM axi_operational_records WHERE record_type='kyc' ORDER BY created_at DESC");
      return res.json({ success: true, submissions: rows.map((r) => ({ ...r.payload, id: r.id, userId: r.user_id, userEmail: r.user_email, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at })), source: 'postgres' });
    } catch (error) {
      console.error('Postgres KYC read failed; using file fallback:', error);
      return res.json({ success: true, submissions: kycFileRows(), source: 'file' });
    }
  });

  app.post('/api/kyc/submit', requireUser, async (req, res) => {
    const body = asRecord(req.body);
    const identity = recordUser(req, body);
    if (!identity.userId || !identity.userEmail) return res.status(400).json({ success: false, error: 'Authenticated user identity is required' });
    const id = String(body.id || `KYC-${identity.userId}-${Date.now()}`);
    const payload = { ...body, id, userId: identity.userId, userEmail: identity.userEmail, status: 'Pending' };
    const db = getPool();
    if (!db) {
      return res.status(201).json({ success: true, submission: kycFileWriteOne(id, {}, payload), status: 'Pending', source: 'file' });
    }
    try {
      await db.query(`INSERT INTO axi_operational_records(id,record_type,user_id,user_email,status,payload) VALUES($1,'kyc',$2,$3,'Pending',$4) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`, [id, identity.userId, identity.userEmail, JSON.stringify(payload)]);
      const { rows } = await db.query('SELECT * FROM axi_operational_records WHERE id=$1', [id]);
      return res.status(201).json({ success: true, submission: rows[0], status: 'Pending', source: 'postgres' });
    } catch (error) {
      console.error('Postgres KYC submit failed; using file fallback:', error);
      return res.status(201).json({ success: true, submission: kycFileWriteOne(id, {}, payload), status: 'Pending', source: 'file' });
    }
  });

  app.post('/api/kyc/approve', requireAdminForOperational, async (req, res) => updateKycStatus(req, res, 'Approved'));
  app.post('/api/kyc/reject', requireAdminForOperational, async (req, res) => updateKycStatus(req, res, 'Rejected'));
}

async function updateKycStatus(req: Request, res: Response, status: string) {
  const id = String(req.body?.id || req.body?.submissionId || '');
  if (!id) return res.status(400).json({ success: false, error: 'KYC submission id is required' });
  const db = getPool();
  if (!db) {
    const existing = kycFileRows().find((k) => String(k.id) === String(id));
    if (!existing) return res.status(404).json({ success: false, error: 'KYC submission not found' });
    const updated = kycFileWriteOne(id, { status, ...(status === 'Rejected' ? { rejectedReason: String(req.body?.reason || '') } : {}) });
    return res.json({ success: true, submission: updated, status, source: 'file' });
  }
  try {
    const { rows } = await db.query(`UPDATE axi_operational_records SET status=$2,payload=jsonb_set(payload,'{status}',to_jsonb($2::text),true),updated_at=NOW() WHERE id=$1 AND record_type='kyc' RETURNING *`, [id, status]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'KYC submission not found' });
    return res.json({ success: true, submission: rows[0], status, source: 'postgres' });
  } catch (error) {
    console.error('Postgres KYC status update failed; using file fallback:', error);
    const existing = kycFileRows().find((k) => String(k.id) === String(id));
    if (!existing) return res.status(404).json({ success: false, error: 'KYC submission not found' });
    const updated = kycFileWriteOne(id, { status, ...(status === 'Rejected' ? { rejectedReason: String(req.body?.reason || '') } : {}) });
    return res.json({ success: true, submission: updated, status, source: 'file' });
  }
}

async function requireAdminForOperational(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  const session = verifyAdminSession(match?.[1] || '');
  if (session) {
    (req as any).adminEmail = session.email;
    (req as any).admin = { email: session.email };
    return next();
  }
  // Also accept Firebase ID tokens from admin emails/uids, mirroring server.ts requireAdmin.
  const auth = firebaseAuth();
  if (!auth) return res.status(401).json({ success: false, error: 'Invalid administrator authentication token' });
  try {
    const decoded = await auth.verifyIdToken(match?.[1] || '', true);
    const email = String(decoded.email || '').toLowerCase();
    const admins = new Set(String(process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean));
    const uids = new Set(String(process.env.ADMIN_UIDS || '').split(',').map((v) => v.trim()).filter(Boolean));
    if (!admins.has(email) && !uids.has(decoded.uid)) return res.status(403).json({ success: false, error: 'Administrator access required' });
    (req as any).authUser = decoded;
    (req as any).adminEmail = email || decoded.uid;
    return next();
  } catch (error) {
    console.error('Operational admin token verification failed:', error);
    return res.status(401).json({ success: false, error: 'Invalid administrator authentication token' });
  }
}