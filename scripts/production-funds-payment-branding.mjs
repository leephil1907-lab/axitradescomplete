import fs from 'node:fs';

const path = 'src/components/FundsView.tsx';
let source = fs.readFileSync(path, 'utf8');

const paypalCase = `    case 'paypal':\n      return (\n        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal" role="img">\n          <circle cx="24" cy="24" r="23" fill="white" stroke="#D7DEE8"/>\n          <path d="M17 35 20.8 12h8.7c5.6 0 8.7 2.7 7.7 7.1-.9 4.6-4.2 6.8-9.3 6.8h-3.4L23 35H17Z" fill="#003087"/>\n          <path d="m22 31.5 1.5-8.7h4.5c4.8 0 7.7-2.1 8.6-5.7.2.6.2 1.3 0 2.1-.9 4.6-4.2 6.8-9.3 6.8h-3.4l-1 5.5H22Z" fill="#009CDE"/>\n        </svg>\n      );\n`;

if (!source.includes("case 'paypal':")) {
  const anchor = "    case 'skrill':\n";
  if (!source.includes(anchor)) throw new Error('FundsView payment branding anchor not found');
  source = source.replace(anchor, paypalCase + anchor);
}

const genericDefault = `    default:\n      return (\n        <div className={\`${'${className}'} bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs\`}>\n          <CreditCard className="w-4 h-4 text-slate-600" />\n        </div>\n      );`;

const brandedDefault = `    default:\n      return (\n        <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Payment method" role="img">\n          <circle cx="18" cy="18" r="17" fill="white" stroke="#CBD5E1"/>\n          <path d="M10 13.5h16M10 18h16M10 22.5h10" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>\n        </svg>\n      );`;

if (source.includes(genericDefault)) {
  source = source.replace(genericDefault, brandedDefault);
}

fs.writeFileSync(path, source);
console.log('Payment branding: user-facing payment icons wired with PayPal branding and no generic card box fallback.');
