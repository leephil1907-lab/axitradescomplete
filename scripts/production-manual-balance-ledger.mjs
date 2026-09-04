import fs from 'node:fs';

let server = fs.readFileSync('server.ts','utf8');
const oldImport = "import { hasPostgres, initPostgres, dbUsers, dbUpsertUser, dbUpdateUser, audit, dbAuditLogs, dbPaymentMethods, dbSavePaymentMethods, dbCreateFunding, dbFundingPending, dbCreditFunding } from './server/postgres';";
const newImport = "import { hasPostgres, initPostgres, dbUsers, dbUpsertUser, dbUpdateUser, dbAdjustBalance, dbBalanceLedger, audit, dbAuditLogs, dbPaymentMethods, dbSavePaymentMethods, dbCreateFunding, dbFundingPending, dbCreditFunding } from './server/postgres';";
if (server.includes(oldImport)) server = server.replace(oldImport,newImport);
if (!server.includes("/api/admin/balance-ledger/:userId")) {
  const marker = "// Update specific user balance";
  if (!server.includes(marker)) throw new Error('Balance route marker not found');
  const routes = `app.get('/api/admin/balance-ledger/:userId', requireAdmin, async (req,res)=>{try{const rows=await dbBalanceLedger(String(req.params.userId||''));return res.json({success:true,entries:rows||[]});}catch(error){console.error('Balance ledger load failed:',error);return res.status(500).json({success:false,error:'Unable to load balance ledger'});}});\n\napp.post('/api/admin/users/:id/balance-adjustment', requireAdmin, async (req,res)=>{try{const amount=Number(req.body?.amount);const reason=String(req.body?.reason||'').trim();if(!Number.isFinite(amount)||amount===0)return res.status(400).json({success:false,error:'Enter a non-zero adjustment amount'});if(!reason)return res.status(400).json({success:false,error:'A reason is required'});const result=await dbAdjustBalance(String(req.params.id||''),amount,String((req as any).adminEmail||'admin'),reason,String(req.body?.referenceId||'')||undefined);return res.json({success:true,result});}catch(error:any){console.error('Manual balance adjustment failed:',error);return res.status(400).json({success:false,error:error?.message||'Manual balance adjustment failed'});}});\n\n`;
  server = server.replace(marker, routes + marker);
}
fs.writeFileSync('server.ts',server);
console.log('Production manual balance ledger routes applied.');
