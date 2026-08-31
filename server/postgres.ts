import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initialized = false;

export function hasPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function initPostgres() {
  const db = getPool();
  if (!db || initialized) return false;
  await db.query(`
    CREATE TABLE IF NOT EXISTS axi_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      verification_status TEXT NOT NULL DEFAULT 'Pending',
      kyc_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      balance NUMERIC(20,8) NOT NULL DEFAULT 0,
      demo_balance NUMERIC(20,8) NOT NULL DEFAULT 0,
      provider TEXT NOT NULL DEFAULT 'Email / Portal Auth',
      registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS axi_audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor TEXT NOT NULL DEFAULT 'system',
      action TEXT NOT NULL,
      target_user_id TEXT,
      target_email TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS axi_payment_methods (
      id TEXT PRIMARY KEY,
      method_type TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by TEXT NOT NULL DEFAULT 'admin',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS axi_funding_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT NOT NULL DEFAULT '',
      amount NUMERIC(20,8) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      method TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Awaiting Admin Credit',
      external_reference TEXT,
      credited_by TEXT,
      credited_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS axi_audit_created_idx ON axi_audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS axi_funding_status_idx ON axi_funding_records(status);
  `);
  initialized = true;
  return true;
}

export async function dbUsers() {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query('SELECT * FROM axi_users ORDER BY registered_at DESC');
  return rows;
}

export async function dbUpsertUser(user: any) {
  const db = getPool();
  if (!db) return false;
  await db.query(`
    INSERT INTO axi_users (id,email,name,phone,country,status,verification_status,kyc_status,balance,demo_balance,provider,registered_at,last_active,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,NOW()),NOW(),NOW())
    ON CONFLICT (id) DO UPDATE SET
      email=EXCLUDED.email,name=EXCLUDED.name,phone=EXCLUDED.phone,country=EXCLUDED.country,
      status=axi_users.status,verification_status=axi_users.verification_status,kyc_status=axi_users.kyc_status,
      balance=axi_users.balance,demo_balance=axi_users.demo_balance,provider=EXCLUDED.provider,last_active=NOW(),updated_at=NOW()
  `, [user.id,user.email,user.name || '',user.phone || '',user.country || '',user.status || 'Pending',user.verificationStatus || 'Pending',user.kycStatus || 'NOT_STARTED',Number(user.balance || 0),Number(user.demoBalance || 0),user.provider || 'Email / Portal Auth',user.registeredAt ? new Date(user.registeredAt) : null]);
  return true;
}

export async function dbUpdateUser(id: string, patch: any) {
  const db = getPool();
  if (!db) return false;
  await db.query(`
    UPDATE axi_users SET
      balance=COALESCE($2,balance), demo_balance=COALESCE($3,demo_balance),
      status=COALESCE($4,status), verification_status=COALESCE($5,verification_status),
      kyc_status=COALESCE($6,kyc_status), updated_at=NOW()
    WHERE id=$1 OR LOWER(email)=LOWER($1)
  `, [id, patch.balance ?? null, patch.demoBalance ?? null, patch.status ?? null, patch.verificationStatus ?? null, patch.kycStatus ?? null]);
  return true;
}

export async function audit(action: string, data: any = {}) {
  const db = getPool();
  if (!db) return false;
  await db.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES ($1,$2,$3,$4,$5)`, [data.actor || 'system', action, data.userId || null, data.email || null, JSON.stringify(data.metadata || {})]);
  return true;
}

export async function dbAuditLogs(limit = 200) {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query('SELECT * FROM axi_audit_logs ORDER BY created_at DESC LIMIT $1', [Math.min(Math.max(limit,1),500)]);
  return rows;
}

export async function dbPaymentMethods() {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query('SELECT method_type, enabled, details, updated_by, updated_at FROM axi_payment_methods ORDER BY method_type');
  return rows;
}

export async function dbSavePaymentMethods(methods: any, actor = 'admin') {
  const db = getPool();
  if (!db) return false;
  const entries = [['bankTransfer',methods.bankTransfer],['instantTransfer',methods.instantTransfer],['crypto',methods.crypto]] as const;
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const [type, details] of entries) {
      await client.query(`INSERT INTO axi_payment_methods(id,method_type,enabled,details,updated_by,updated_at) VALUES ($1,$2,$3,$4,$5,NOW()) ON CONFLICT(id) DO UPDATE SET enabled=EXCLUDED.enabled,details=EXCLUDED.details,updated_by=EXCLUDED.updated_by,updated_at=NOW()`, [`${type}`, type, Boolean(details?.enabled), JSON.stringify(details || {}), actor]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
  return true;
}

export async function dbCreateFunding(record: any) {
  const db = getPool();
  if (!db) return false;
  await db.query(`INSERT INTO axi_funding_records(id,user_id,user_email,amount,currency,method,status,external_reference) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`, [record.id,record.userId || null,record.userEmail || '',Number(record.amount || 0),record.currency || 'USD',record.method || '',record.status || 'Awaiting Admin Credit',record.externalReference || record.stripeRef || null]);
  return true;
}

export async function dbFundingPending() {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query("SELECT * FROM axi_funding_records WHERE status NOT IN ('Credited','Rejected') ORDER BY created_at DESC");
  return rows;
}

export async function dbCreditFunding(id: string, actor: string, creditedAt = new Date()) {
  const db = getPool();
  if (!db) return null;
  const { rows } = await db.query(`UPDATE axi_funding_records SET status='Credited',credited_by=$2,credited_at=$3,updated_at=NOW() WHERE id=$1 AND status NOT IN ('Credited','Rejected') RETURNING *`, [id,actor,creditedAt]);
  return rows[0] || null;
}
