import fs from 'node:fs';
const path='src/components/AdminDashboardView.tsx';
let s=fs.readFileSync(path,'utf8');
const importLine="import AdminPaymentMethods from './AdminPaymentMethods';";
const detailImport="import AdminUserDetailDrawer from './AdminUserDetailDrawer';";
if(!s.includes(detailImport)){if(!s.includes(importLine))throw new Error('Admin payment import anchor missing');s=s.replace(importLine,importLine+'\n'+detailImport);}
if(!s.includes('adminUserDetailId')){
  const anchor="const [ledgerUser,setLedgerUser]=useState<UserRecord|null>(null); const [ledger,setLedger]=useState<LedgerEntry[]>([]); const [ledgerLoading,setLedgerLoading]=useState(false);";
  if(!s.includes(anchor))throw new Error('Admin user state anchor missing');
  s=s.replace(anchor,anchor+"\n  const [adminUserDetailId,setAdminUserDetailId]=useState<string|null>(null);");
}
const actionNeedle='<button type="button" onClick={()=>void openLedger(u)} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-2 text-xs"><History className="h-3.5 w-3.5"/>Ledger</button>';
const actionReplacement=actionNeedle+'<button type="button" onClick={()=>setAdminUserDetailId(u.id)} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-2 text-xs"><UserRound className="h-3.5 w-3.5"/>View</button>';
if(!s.includes('setAdminUserDetailId(u.id)')){
  if(!s.includes(actionNeedle))throw new Error('User actions anchor missing');
  s=s.replace(actionNeedle,actionReplacement);
}
if(!s.includes('<AdminUserDetailDrawer userId={adminUserDetailId}')){
  const close='</main></div>;';
  const injected='<AdminUserDetailDrawer userId={adminUserDetailId} onClose={()=>setAdminUserDetailId(null)} showToast={showToast}/>';
  const idx=s.lastIndexOf(close);
  if(idx<0)throw new Error('Admin dashboard closing marker missing');
  s=s.slice(0,idx)+injected+s.slice(idx);
}
// Ensure the icon is imported even though the existing dashboard may not use it yet.
if(!s.includes('UserRound')){
  s=s.replace('Activity, Plus, Minus, History','Activity, Plus, Minus, History, UserRound');
}
fs.writeFileSync(path,s);
console.log('Admin user detail drawer wired into user actions.');
