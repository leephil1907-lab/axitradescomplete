import fs from 'node:fs';

// Keep the existing admin dashboard source intact. It is already wired to the
// protected production APIs; this build step only normalizes promotion copy.
const promoPath = 'src/components/PromotionsView.tsx';

if (fs.existsSync(promoPath)) {
  let promo = fs.readFileSync(promoPath, 'utf8');
  const replacements = [
    ['50% Welcome Trading Credit', '100% Deposit Bonus'],
    ['50% Welcome Tradable Credit', '100% Deposit Bonus'],
    ['50% Deposit Booster', '100% Deposit Bonus'],
    ['Claim 50% Welcome Bonus', 'Claim 100% Deposit Bonus'],
    ['50% tradable margin credit', '100% promotional credit'],
    ['+50%', '+100%']
  ];

  for (const [from, to] of replacements) {
    promo = promo.split(from).join(to);
  }

  fs.writeFileSync(promoPath, promo);
}

console.log('Production UI hardening applied without regex transforms.');
