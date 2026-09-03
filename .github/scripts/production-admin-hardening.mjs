import fs from 'node:fs';

// This migration used to require legacy demo/default blocks that no longer exist
// in the production AdminDashboardView. Keep the step idempotent so every push
// can validate the repository without failing on already-hardened code.
const path = 'src/components/AdminDashboardView.tsx';
if (!fs.existsSync(path)) throw new Error(`Required file not found: ${path}`);
const source = fs.readFileSync(path, 'utf8');

const forbiddenDefaults = [
  "useState('1000')",
  "useState('Verified')",
  "smtp.gmail.com",
  "axicustomersupport@gmail.com",
  'Axi Neural Quant Bot v4',
  'High Frequency Arbitrage',
  'Starter Alpha Plan',
  'Pro Growth Quant Plan',
  'Institutional Prime Plan'
];

const remaining = forbiddenDefaults.filter((value) => source.includes(value));
if (remaining.length) {
  throw new Error(`Production demo/default values remain in ${path}: ${remaining.join(', ')}`);
}

console.log(`Production admin hardening check passed for ${path}`);
