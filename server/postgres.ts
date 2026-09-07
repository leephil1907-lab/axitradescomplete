import pg from 'pg';
const { Pool } = pg;
let pool: pg.Pool | null = null;
let initialized = false;
export function hasPostgres(){return Boolean(process.env.DATABASE_URL);}
function getPool(){if(!process.env.DATABASE_URL)return null;if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined,max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:5000});return pool;}

const AXI_DEFAULT_PAYMENT_WALLETS = [
  { id: 'crypto-usdc-erc20', asset: 'USDC', network: 'Ethereum ERC20', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'USDC (ERC20)', instructions: '' },
  { id: 'crypto-btc', asset: 'BTC', network: 'Bitcoin', address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', memo: '', label: 'Bitcoin', instructions: '' },
  { id: 'crypto-usdt-trc20', asset: 'USDT', network: 'TRON TRC20', address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', memo: '', label: 'USDT (TRC20)', instructions: '' },
  { id: 'crypto-sol', asset: 'SOL', network: 'Solana', address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', memo: '', label: 'Solana', instructions: '' },
  { id: 'crypto-bnb', asset: 'BNB', network: 'BNB Smart Chain', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'BNB', instructions: '' },
  { id: 'crypto-eth', asset: 'ETH', network: 'Ethereum', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'Ethereum', instructions: '' },
  { id: 'crypto-xrp', asset: 'XRP', network: 'XRP Ledger', address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', memo: '1476340', label: 'XRP', instructions: '' }
];

async function seedDefaultPaymentWallets(db:any){
  // Seed defaults ONLY on a fresh database (no crypto rows at all). If an admin has
  // already saved payment configuration, never resurrect wallets they removed.
  const existingAny = await db.query("SELECT 1 FROM axi_payment_methods WHERE method_type='crypto' LIMIT 1");
  if (existingAny.rows?.length) return;
  let added = 0;
  for (const wallet of AXI_DEFAULT_PAYMENT_WALLETS) {
    const existing = await db.query("SELECT id FROM axi_payment_methods WHERE method_type='crypto' AND details->>'asset'=$1 AND details->>'network'=$2 AND details->>'address'=$3 LIMIT 1", [wallet.asset, wallet.network, wallet.address]);
    if (existing.rows?.length) continue;
    await db.query(`INSERT INTO axi_payment_methods(id,method_type,enabled,details,updated_by,updated_at) VALUES($1,'crypto',TRUE,$2,'system-seed',NOW()) ON CONFLICT(id) DO NOTHING`, [wallet.id, JSON.stringify(wallet)]);
    added++;
  }
  if (added) console.log(`Seeded ${added} default crypto payment wallet(s) into PostgreSQL`);
}

export async function initPostgres(){const db=getPool();if(!db||initialized)return false;await db.query(`CREATE TABLE IF NOT EXISTS axi_users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',country TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'Pending',verification_status TEXT NOT NULL DEFAULT 'Pending',kyc_status TEXT NOT NULL DEFAULT 'NOT_STARTED',balance NUMERIC(20,8) NOT NULL DEFAULT 0,demo_balance NUMERIC(20,8) NOT NULL DEFAULT 0,provider TEXT NOT NULL DEFAULT 'Email / Portal Auth',registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS axi_audit_logs(id BIGSERIAL PRIMARY KEY,actor TEXT NOT NULL DEFAULT 'system',action TEXT NOT NULL,target_user_id TEXT,target_email TEXT,metadata JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS axi_payment_methods(id TEXT PRIMARY KEY,method_type TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT FALSE,details JSONB NOT NULL DEFAULT '{}'::jsonb,updated_by TEXT NOT NULL DEFAULT 'admin',updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS axi_funding_records(id TEXT PRIMARY KEY,user_id TEXT,user_email TEXT NOT NULL DEFAULT '',amount NUMERIC(20,8) NOT NULL DEFAULT 0,currency TEXT NOT NULL DEFAULT 'USD',method TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'Awaiting Admin Credit',external_reference TEXT,credited_by TEXT,credited_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS axi_balance_ledger(id BIGSERIAL PRIMARY KEY,user_id TEXT NOT NULL,user_email TEXT NOT NULL DEFAULT '',entry_type TEXT NOT NULL,amount NUMERIC(20,8) NOT NULL,balance_before NUMERIC(20,8) NOT NULL,balance_after NUMERIC(20,8) NOT NULL,reason TEXT NOT NULL DEFAULT '',reference_id TEXT,actor TEXT NOT NULL DEFAULT 'system',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE INDEX IF NOT EXISTS axi_audit_created_idx ON axi_audit_logs(created_at DESC);CREATE INDEX IF NOT EXISTS axi_funding_status_idx ON axi_funding_records(status);CREATE INDEX IF NOT EXISTS axi_payment_methods_type_idx ON axi_payment_methods(method_type);CREATE INDEX IF NOT EXISTS axi_balance_ledger_user_idx ON axi_balance_ledger(user_id,created_at DESC);`);
  // Schema-drift hardening: tables created by older app versions can be missing
  // columns that newer queries reference (which made admin payment saves and KYC
  // reads fail with runtime errors even though Postgres was "configured").
  await db.query(`ALTER TABLE axi_payment_methods ADD COLUMN IF NOT EXISTS method_type TEXT NOT NULL DEFAULT 'other', ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN IF NOT EXISTS updated_by TEXT NOT NULL DEFAULT 'admin', ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  ALTER TABLE axi_funding_records ADD COLUMN IF NOT EXISTS user_id TEXT, ADD COLUMN IF NOT EXISTS user_email TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS amount NUMERIC(20,8) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD', ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Awaiting Admin Credit', ADD COLUMN IF NOT EXISTS external_reference TEXT, ADD COLUMN IF NOT EXISTS credited_by TEXT, ADD COLUMN IF NOT EXISTS credited_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  ALTER TABLE axi_users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending', ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'Pending', ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'NOT_STARTED', ADD COLUMN IF NOT EXISTS demo_balance NUMERIC(20,8) NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'Email / Portal Auth', ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(), ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await seedDefaultPaymentWallets(db);initialized=true;return true;}
export async function dbUsers(){const db=getPool();if(!db)return null;const {rows}=await db.query('SELECT * FROM axi_users ORDER BY registered_at DESC');return rows;}
export async function dbFindUser(query:string){const db=getPool();if(!db)return null;if(!String(query||'').trim())return null;const {rows}=await db.query('SELECT * FROM axi_users WHERE id=$1 OR LOWER(email)=LOWER($1) ORDER BY registered_at DESC LIMIT 1',[String(query).trim()]);return rows[0]||null;}
export async function dbUpsertUser(user:any){const db=getPool();if(!db)return false;await db.query(`INSERT INTO axi_users(id,email,name,phone,country,status,verification_status,kyc_status,balance,demo_balance,provider,registered_at,last_active,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,NOW()),NOW(),NOW()) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,phone=EXCLUDED.phone,country=EXCLUDED.country,status=axi_users.status,verification_status=axi_users.verification_status,kyc_status=axi_users.kyc_status,balance=axi_users.balance,demo_balance=axi_users.demo_balance,provider=EXCLUDED.provider,last_active=NOW(),updated_at=NOW()`,[user.id,user.email,user.name||'',user.phone||'',user.country||'',user.status||'Pending',user.verificationStatus||'Pending',user.kycStatus||'NOT_STARTED',Number(user.balance||0),Number(user.demoBalance||0),user.provider||'Email / Portal Auth',user.registeredAt?new Date(user.registeredAt):null]);return true;}
export async function dbUpdateUser(id:string,patch:any){const db=getPool();if(!db)return false;await db.query(`UPDATE axi_users SET balance=COALESCE($2,balance),demo_balance=COALESCE($3,demo_balance),status=COALESCE($4,status),verification_status=COALESCE($5,verification_status),kyc_status=COALESCE($6,kyc_status),updated_at=NOW() WHERE id=$1 OR LOWER(email)=LOWER($1)`,[id,patch.balance??null,patch.demoBalance??null,patch.status??null,patch.verificationStatus??null,patch.kycStatus??null]);return true;}
export async function dbAdjustBalance(userId:string,delta:number,actor:string,reason:string,referenceId?:string){const db=getPool();if(!db)return null;if(!Number.isFinite(delta)||delta===0)throw new Error('Balance adjustment must be a non-zero number');const client=await db.connect();try{await client.query('BEGIN');const found=await client.query('SELECT id,email,balance FROM axi_users WHERE id=$1 OR LOWER(email)=LOWER($1) FOR UPDATE',[userId]);if(!found.rows[0])throw new Error('User not found');const u=found.rows[0];const before=Number(u.balance||0);const after=before+delta;if(after<0)throw new Error('Balance cannot be reduced below zero');const updated=await client.query('UPDATE axi_users SET balance=$2,updated_at=NOW() WHERE id=$1 RETURNING balance',[u.id,after]);const entry=await client.query(`INSERT INTO axi_balance_ledger(user_id,user_email,entry_type,amount,balance_before,balance_after,reason,reference_id,actor) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[u.id,u.email,delta>0?'ADMIN_CREDIT':'ADMIN_DEBIT',delta,before,after,reason||'Admin balance adjustment',referenceId||null,actor||'admin']);await client.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,'ADMIN_BALANCE_ADJUSTMENT',$2,$3,$4)`,[actor||'admin',u.id,u.email,JSON.stringify({amount:delta,balanceBefore:before,balanceAfter:after,reason:reason||'Admin balance adjustment',referenceId:referenceId||null})]);await client.query('COMMIT');return {userId:u.id,email:u.email,balanceBefore:before,balanceAfter:Number(updated.rows[0].balance),entry:entry.rows[0]};}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
export async function dbBalanceLedger(userId:string,limit=100){const db=getPool();if(!db)return null;const {rows}=await db.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2',[userId,Math.min(Math.max(limit,1),500)]);return rows;}
export async function audit(action:string,data:any={}){const db=getPool();if(!db)return false;await db.query(`INSERT INTO axi_audit_logs(actor,action,target_user_id,target_email,metadata) VALUES($1,$2,$3,$4,$5)`,[data.actor||'system',action,data.userId||null,data.email||null,JSON.stringify(data.metadata||{})]);return true;}
export async function dbAuditLogs(limit=200){const db=getPool();if(!db)return null;const {rows}=await db.query('SELECT * FROM axi_audit_logs ORDER BY created_at DESC LIMIT $1',[Math.min(Math.max(limit,1),500)]);return rows;}
export async function dbPaymentMethods(){const db=getPool();if(!db)return null;const {rows}=await db.query('SELECT id,method_type,enabled,details,updated_by,updated_at FROM axi_payment_methods ORDER BY method_type,id');return rows;}
export async function dbSavePaymentMethods(methods:any,actor='admin'){
  const db=getPool();if(!db)return false;
  const slug=(v:string)=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'-').slice(0,32)||'CRYPTO';
  const fixed:[string,any][]=[['bankTransfer',methods?.bankTransfer],['instantTransfer',methods?.instantTransfer],['paypal',methods?.paypal],['skrill',methods?.skrill],['neteller',methods?.neteller]];
  const crypto=Array.isArray(methods?.crypto)?methods.crypto:(methods?.crypto?[methods.crypto]:[]);
  const client=await db.connect();
  try{
    await client.query('BEGIN');
    for(const [type,details] of fixed){
      const d=(details&&typeof details==='object'&&!Array.isArray(details))?details:{};
      // Details are stored verbatim (the admin read path understands the same
      // shape, including instantTransfer: { enabled, methods: [...] }).
      await client.query(`INSERT INTO axi_payment_methods(id,method_type,enabled,details,updated_by,updated_at) VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(id) DO UPDATE SET enabled=EXCLUDED.enabled,details=EXCLUDED.details,updated_by=EXCLUDED.updated_by,updated_at=NOW()`,[type,type,Boolean(d.enabled),JSON.stringify(d),actor]);
    }
    // Idempotent crypto upsert: match existing wallets by (asset|network|address)
    // so saved ids are stable across saves (no delete + re-insert with new ids).
    const existing=await client.query("SELECT id,details FROM axi_payment_methods WHERE method_type='crypto'");
    const byAssetNetAddr=new Map<string,string>();
    const used=new Set<string>(existing.rows.map((r:any)=>String(r.id)));
    for(const r of existing.rows){const det=(r.details&&typeof r.details==='object')?r.details:{};byAssetNetAddr.set(`${slug(det.asset)}|${slug(det.network)}|${String(det.address||det.walletAddress||'').trim()}`,String(r.id));}
    const kept:string[]=[];
    for(let i=0;i<crypto.length;i++){
      const d=(crypto[i]&&typeof crypto[i]==='object')?crypto[i]:{};
      const asset=slug(d.asset);const network=slug(d.network);const address=String(d.address||d.walletAddress||'').trim();
      const key=`${asset}|${network}|${address}`;
      let id=byAssetNetAddr.get(key)||'';
      if(!id){
        const supplied=String(d.id||'').trim();
        id=(supplied&&!used.has(supplied))?supplied:`crypto-${asset}-${network}-${i+1}`;
      }
      id=String(id||'').replace(/[^A-Za-z0-9_.:-]/g,'-');
      if(!id.startsWith('crypto-'))id=`crypto-${id}`;
      used.add(id);kept.push(id);
      await client.query(`INSERT INTO axi_payment_methods(id,method_type,enabled,details,updated_by,updated_at) VALUES($1,'crypto',$2,$3,$4,NOW()) ON CONFLICT(id) DO UPDATE SET enabled=EXCLUDED.enabled,details=EXCLUDED.details,updated_by=EXCLUDED.updated_by,updated_at=NOW()`,[id,Boolean(d.enabled!==false),JSON.stringify({...d,id}),actor]);
    }
    if(kept.length){await client.query("DELETE FROM axi_payment_methods WHERE method_type='crypto' AND NOT (id = ANY($1::text[]))",[kept]);}
    else{await client.query("DELETE FROM axi_payment_methods WHERE method_type='crypto'");}
    await client.query('COMMIT');
  }catch(error){try{await client.query('ROLLBACK');}catch(_e){/*noop*/}throw error;}
  finally{client.release();}
  return true;
}
export async function dbCreateFunding(record:any){const db=getPool();if(!db)return false;await db.query(`INSERT INTO axi_funding_records(id,user_id,user_email,amount,currency,method,status,external_reference) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`,[record.id,record.userId||null,record.userEmail||'',Number(record.amount||0),record.currency||'USD',record.method||'',record.status||'Awaiting Admin Credit',record.externalReference||record.stripeRef||null]);return true;}
export async function dbFundingPending(){const db=getPool();if(!db)return null;const {rows}=await db.query("SELECT * FROM axi_funding_records WHERE status NOT IN ('Credited','Rejected') ORDER BY created_at DESC");return rows;}
export async function dbCreditFunding(id:string,actor:string,creditedAt=new Date()){const db=getPool();if(!db)return null;const {rows}=await db.query(`UPDATE axi_funding_records SET status='Credited',credited_by=$2,credited_at=$3,updated_at=NOW() WHERE id=$1 AND status NOT IN ('Credited','Rejected') RETURNING *`,[id,actor,creditedAt]);return rows[0]||null;}
