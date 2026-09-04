import fs from 'node:fs';

// React was recreating the Field component on every parent render because it was
// declared inside AdminPaymentMethods. Every keystroke therefore unmounted the
// focused input. Keep the field component at module scope so its identity is stable.
const paymentPath='src/components/AdminPaymentMethods.tsx';
let payment=fs.readFileSync(paymentPath,'utf8');
if(!payment.includes('AXI_STABLE_PAYMENT_FIELD_V1')){
  const old=` const Field=({label,value,onChange,placeholder='' }:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string})=>`;
  const old2=` const Field=({label,value,onChange,placeholder=''}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string})=>`;
  const field=`\n// AXI_STABLE_PAYMENT_FIELD_V1\ntype PaymentFieldProps={label:string;value:string;onChange:(v:string)=>void;placeholder?:string};\nconst PaymentField=({label,value,onChange,placeholder='' }:PaymentFieldProps)=><label className="block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;\n`;
  const idx=payment.indexOf("const emptyBank=");
  if(idx<0)throw new Error('Payment constants marker not found');
  payment=payment.slice(0,idx)+field+payment.slice(idx);
  const fieldStart=payment.indexOf(' const Field=');
  if(fieldStart>=0){const fieldEnd=payment.indexOf(';\n if(loading)',fieldStart);if(fieldEnd<0)throw new Error('Inline payment Field marker not found');payment=payment.slice(0,fieldStart)+' const input=\'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white\';'+payment.slice(fieldEnd+2);}
  payment=payment.replace(/<Field\b/g,'<PaymentField').replace(/<\/Field>/g,'</PaymentField>');
  fs.writeFileSync(paymentPath,payment);
}

// Funding queue endpoints are administrator-only; send the same standalone admin
// session token used by the rest of the admin dashboard.
const fundingPath='src/components/AdminFundingQueue.tsx';
let funding=fs.readFileSync(fundingPath,'utf8');
if(!funding.includes("from '../utils/authHeaders'")){
  funding=funding.replace("import { CheckCircle2, Clock3, CreditCard, RefreshCw, XCircle } from 'lucide-react';","import { CheckCircle2, Clock3, CreditCard, RefreshCw, XCircle } from 'lucide-react';\nimport { authHeaders } from '../utils/authHeaders';");
}
funding=funding.replace("fetch('/api/admin/funding/pending')","fetch('/api/admin/funding/pending',{headers:await authHeaders()})");
funding=funding.replace("headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:Number(deposit.amount||0)","headers:await authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({amount:Number(deposit.amount||0)");
funding=funding.replace("headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,creditedBalance:adjustment.result.balanceAfter})","headers:await authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({userId,creditedBalance:adjustment.result.balanceAfter})");
funding=funding.replace("method:'POST'});if(!res.ok)throw new Error('Could not reject payment.')","method:'POST',headers:await authHeaders()});if(!res.ok)throw new Error('Could not reject payment.')");
fs.writeFileSync(fundingPath,funding);
console.log('Payment input focus and funding admin authentication fixed.');
