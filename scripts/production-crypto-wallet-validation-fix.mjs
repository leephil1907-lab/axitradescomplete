import fs from 'node:fs';
const files = ['src/components/AdminPaymentMethods.tsx', 'src/components/FundsView.tsx'];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace(/\s+pattern=\{[^}]+\}/g, '');
  source = source.replace(/\s+pattern="[^"]*"/g, '');
  source = source.replace(/\s+type="url"/g, ' type="text"');
  source = source.replace(/\s+type='url'/g, " type='text'");
  fs.writeFileSync(file, source);
}
console.log('Crypto wallet browser validation fix applied.');
