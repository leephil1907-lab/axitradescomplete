import fs from 'node:fs';

const path = 'server/controlPlane.ts';
let s = fs.readFileSync(path, 'utf8');
const marker = '// ADMIN_USER_DETAIL_AUDIT_V1';

if (!s.includes(marker)) {
  const routePattern = /(app\.get\('\/api\/admin\/users\/:id'[\s\S]*?const \[ledger, withdrawals\] = await Promise\.all\(\[[\s\S]*?\]); return res\.json\(\{success:true,user,ledger: ledger\.rows,withdrawals: withdrawals\.rows\}\);)/;
  const match = s.match(routePattern);
  if (!match) throw new Error('User detail API query anchor not found');

  const original = match[1];
  const replacement = original
    .replace(
      /const \[ledger, withdrawals\] = await Promise\.all\(\[([\s\S]*?)\]\); return res\.json\(\{success:true,user,ledger: ledger\.rows,withdrawals: withdrawals\.rows\}\);/,
      "const [ledger, withdrawals, audit] = await Promise.all([d.query('SELECT * FROM axi_balance_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id]), d.query('SELECT * FROM axi_withdrawal_records WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]), d.query('SELECT * FROM axi_audit_logs WHERE target_user_id=$1 ORDER BY created_at DESC LIMIT 200',[user.id])]); return res.json({success:true,user,ledger: ledger.rows,withdrawals: withdrawals.rows,audit: audit.rows});"
    )
    .replace("try {", "try {\n      // ADMIN_USER_DETAIL_AUDIT_V1");

  s = s.replace(original, replacement);
}

fs.writeFileSync(path, s);
console.log('Per-user audit activity wired into admin detail API.');
