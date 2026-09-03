import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const protectedPrefixes = [
  '/api/transactions/create',
  '/api/stripe/create-checkout-session',
  '/api/stripe/create-payment-intent',
  '/api/stripe/verify-deposit',
  '/api/kyc/submit',
  '/api/withdraw',
  '/api/funding',
  '/api/payment-methods'
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const file of walk(root)) {
  let source = fs.readFileSync(file, 'utf8');
  const original = source;
  const needsAuth = protectedPrefixes.some(prefix => source.includes(`fetch('${prefix}'`) || source.includes(`fetch("${prefix}"`));
  if (!needsAuth) continue;

  if (!source.includes("from '../utils/authHeaders'") && !source.includes("from './authHeaders'")) {
    const depth = path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).length;
    const importPath = depth === 0 ? './utils/authHeaders' : '../'.repeat(depth) + 'utils/authHeaders';
    source = `import { authHeaders } from '${importPath}';\n` + source;
  }

  source = source.replace(/fetch\((['"])(\/api\/(?:transactions\/create|stripe\/create-checkout-session|stripe\/create-payment-intent|stripe\/verify-deposit|kyc\/submit|withdraw|funding|payment-methods)[^'"]*)\1/g, 'authenticatedFetch($1$2$1');

  if (source.includes('authenticatedFetch(') && !source.includes('const authenticatedFetch')) {
    const marker = source.indexOf('\n', source.indexOf("import { authHeaders"));
    const helper = `\nconst authenticatedFetch = async (input, init = {}) => {\n  const headers = await authHeaders(init.headers || {});\n  return fetch(input, { ...init, headers });\n};\n`;
    source = source.slice(0, marker + 1) + helper + source.slice(marker + 1);
  }

  if (source !== original) fs.writeFileSync(file, source);
}
