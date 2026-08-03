const fs = require('fs');

let fundsCode = fs.readFileSync('src/components/FundsView.tsx', 'utf8');

const target = `{bankSettings.instructions.replace('axicustomersupport@gmail.com', '')} <a href={\`mailto:\${bankSettings.supportEmail}\`} className="font-bold underline text-brand-red hover:text-red-700">{bankSettings.supportEmail}</a>`;

const replacement = `{bankSettings.instructions} <br/><br/><a href={\`mailto:\${bankSettings.supportEmail}\`} className="font-bold underline text-brand-red hover:text-red-700">{bankSettings.supportEmail}</a>`;

fundsCode = fundsCode.replace(target, replacement);

fs.writeFileSync('src/components/FundsView.tsx', fundsCode);
console.log('Fixed Bank instructions in FundsView.tsx');
