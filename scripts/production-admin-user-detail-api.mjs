import fs from 'node:fs';
const path='server/controlPlane.ts';
let s=fs.readFileSync(path,'utf8');
const marker='// ADMIN_USER_DETAIL_AUDIT_V1';
if(!s.includes(marker)){
  const old="const [ledger, withdrawals] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id])]); return res.json({success:true,user,ledger:ledger.rows,withdrawals:withdrawals.rows});";
  if(!s.includes(old)) throw new Error('User detail API query anchor not found');
  const replacement=`// ADMIN_USER_DETAIL_AUDIT_V1\n      const [ledger, withdrawals, audit] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]), d.query('SELECT * FROM axi_audit_logs WHERE target_user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id])]); return res.json({success:true,user,ledger:ledger.rows,withdrawals:withdrawals.rows,audit:audit.rows});`;
  s=s.replace(old,replacement);
}
fs.writeFileSync(path,s);
console.log('Per-user audit activity wired into admin detail API.');
