import fs from 'node:fs';

const path = 'server/controlPlane.ts';
let s = fs.readFileSync(path, 'utf8');
const marker = '// ADMIN_USER_DETAIL_AUDIT_V1';

if (!s.includes(marker)) {
  const routeStart = s.indexOf("app.get('/api/admin/users/:id'");
  if (routeStart === -1) throw new Error('User detail API route anchor not found');

  const routeEnd = s.indexOf("\n  app.post('/api/admin/users/:id/controls'", routeStart);
  if (routeEnd === -1) throw new Error('User detail API route end anchor not found');

  const route = s.slice(routeStart, routeEnd);
  const oldQuery = "const [ledger, withdrawals] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id])]);";
  const newQuery = "const [ledger, withdrawals, audit] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]), d.query('SELECT * FROM axi_audit_logs WHERE target_user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id])]);";
  const oldResponse = "return res.json({success:true, user, ledger: ledger.rows, withdrawals: withdrawals.rows });";
  const compactOldResponse = "return res.json({success:true,user,ledger: ledger.rows,withdrawals: withdrawals.rows});";
  const newResponse = "return res.json({success:true,user,ledger: ledger.rows,withdrawals: withdrawals.rows,audit: audit.rows});";

  if (route.includes(oldQuery)) {
    const updatedRoute = route.replace(oldQuery, newQuery).replace(oldResponse, newResponse).replace(compactOldResponse, newResponse);
    s = s.slice(0, routeStart) + updatedRoute.replace('{', `{\n      ${marker}`) + s.slice(routeEnd);
  } else if (route.includes('audit: audit.rows')) {
    // Already wired; keep the build idempotent.
  } else {
    throw new Error('User detail API query/response anchor not found');
  }
}

fs.writeFileSync(path, s);
console.log('Per-user audit activity wired into admin detail API.');
