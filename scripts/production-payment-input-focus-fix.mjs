import fs from 'node:fs';

// Payment inputs must be stable React components. The previous build patch depended
// on a fragile source marker (const emptyBank=), which could disappear after another
// production-hardening transform and abort the entire Railway build. The component
// is now fixed directly in source; this script is intentionally idempotent and never
// fails merely because an old marker is absent.
const paymentPath='src/components/AdminPaymentMethods.tsx';
let payment=fs.readFileSync(paymentPath,'utf8');

if (!payment.includes('const PaymentField=')) {
  const fieldMarker='const providerLabel=';
  const idx=payment.indexOf(fieldMarker);
  if (idx>=0) {
    const end=payment.indexOf('\n',idx);
    const field=`\nconst paymentInput='w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white';\ntype PaymentFieldProps={label:string;value:string;onChange:(v:string)=>void;placeholder?:string};\nconst PaymentField=({label,value,onChange,placeholder='' }:PaymentFieldProps)=><label className="block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><input className={paymentInput} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;\n`;
    payment=payment.slice(0,end+1)+field+payment.slice(end+1);
  }
}

// If an old inline Field remains, remove only that declaration and use the stable field.
const inlineStart=payment.indexOf(" const Field=({label,value,onChange,placeholder=''}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string})=>");
if (inlineStart>=0) {
  const inlineEnd=payment.indexOf(';\n if(loading)',inlineStart);
  if (inlineEnd>=0) payment=payment.slice(0,inlineStart)+payment.slice(inlineEnd+2);
}
payment=payment.replace(/<Field\b/g,'<PaymentField').replace(/<\/Field>/g,'</PaymentField>');
payment=payment.replace(/\n const input='[^']*';/, "\n const input=paymentInput;");
fs.writeFileSync(paymentPath,payment);

// Admin funding endpoints use the same authenticated admin session as the dashboard.
const fundingPath='src/components/AdminFundingQueue.tsx';
let funding=fs.readFileSync(fundingPath,'utf8');
if(!funding.includes("from '../utils/authHeaders'")){
  funding=funding.replace("import React", "import { authHeaders } from '../utils/authHeaders';\nimport React");
}
funding=funding.replace("fetch('/api/admin/funding/pending')","fetch('/api/admin/funding/pending',{headers:await authHeaders()})");
funding=funding.replace("headers:{'Content-Type':'application/json'}","headers:await authHeaders({'Content-Type':'application/json'})");
funding=funding.replace("method:'POST'});if(!res.ok)throw new Error('Could not reject payment.')","method:'POST',headers:await authHeaders()});if(!res.ok)throw new Error('Could not reject payment.')");
fs.writeFileSync(fundingPath,funding);

console.log('Payment input focus and funding admin authentication checks applied.');
