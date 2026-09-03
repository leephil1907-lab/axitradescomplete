import fs from 'node:fs';

const adminPath = 'src/components/AdminPaymentMethods.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');

if (!admin.includes("PaymentMethodLogo")) {
  admin = admin.replace(
    "import { authHeaders } from '../utils/authHeaders';",
    "import { authHeaders } from '../utils/authHeaders';\nimport PaymentMethodLogo from './PaymentMethodLogo';"
  );
}

admin = admin.replace(
  '<Banknote className="h-5 w-5"/> Bank Transfer',
  '<PaymentMethodLogo brand="bank" size="sm"/> Bank Transfer'
);
admin = admin.replace(
  '<Smartphone className="h-5 w-5"/> Instant Transfer',
  '<PaymentMethodLogo brand="instant" size="sm"/> Instant Transfer'
);
admin = admin.replace(
  '<Bitcoin className="h-5 w-5"/> Crypto Wallets',
  '<PaymentMethodLogo brand="crypto" size="sm"/> Crypto Wallets'
);
admin = admin.replace(
  '<WalletCards className="h-5 w-5"/>{title}',
  '<PaymentMethodLogo brand={id} size="sm"/>{title}'
);

fs.writeFileSync(adminPath, admin);
console.log('Payment branding: admin payment method logos wired.');
