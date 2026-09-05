import fs from 'fs';

const file = 'server/postgres.ts';
let source = fs.readFileSync(file, 'utf8');

const marker = "export async function initPostgres(){";
if (!source.includes(marker)) throw new Error(`Cannot find ${marker}`);
if (source.includes('AXI_DEFAULT_PAYMENT_WALLETS')) {
  console.log('PostgreSQL payment wallet seed already installed');
  process.exit(0);
}

const seed = `\nconst AXI_DEFAULT_PAYMENT_WALLETS = [\n  { id: 'crypto-usdc-erc20', asset: 'USDC', network: 'Ethereum ERC20', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'USDC (ERC20)', instructions: '' },\n  { id: 'crypto-btc', asset: 'BTC', network: 'Bitcoin', address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', memo: '', label: 'Bitcoin', instructions: '' },\n  { id: 'crypto-usdt-trc20', asset: 'USDT', network: 'TRON TRC20', address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', memo: '', label: 'USDT (TRC20)', instructions: '' },\n  { id: 'crypto-sol', asset: 'SOL', network: 'Solana', address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', memo: '', label: 'Solana', instructions: '' },\n  { id: 'crypto-bnb', asset: 'BNB', network: 'BNB Smart Chain', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'BNB', instructions: '' },\n  { id: 'crypto-eth', asset: 'ETH', network: 'Ethereum', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'Ethereum', instructions: '' },\n  { id: 'crypto-xrp', asset: 'XRP', network: 'XRP Ledger', address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', memo: '1476340', label: 'XRP', instructions: '' }\n];\n\nasync function seedDefaultPaymentWallets(db:any){\n  let added = 0;\n  for (const wallet of AXI_DEFAULT_PAYMENT_WALLETS) {\n    const existing = await db.query(\"SELECT id FROM axi_payment_methods WHERE method_type='crypto' AND details->>'asset'=$1 AND details->>'network'=$2 AND details->>'address'=$3 LIMIT 1\", [wallet.asset, wallet.network, wallet.address]);\n    if (existing.rows?.length) continue;\n    await db.query(\`INSERT INTO axi_payment_methods(id,method_type,enabled,details,updated_by,updated_at) VALUES($1,'crypto',TRUE,$2,'system-seed',NOW()) ON CONFLICT(id) DO NOTHING\`, [wallet.id, JSON.stringify(wallet)]);\n    added++;\n  }\n  if (added) console.log(\`Seeded \${added} missing default crypto payment wallet(s) into PostgreSQL\`);\n}\n`;

source = source.replace(marker, seed + '\n' + marker);
const createEnd = "`);initialized=true;return true;}";
if (!source.includes(createEnd)) throw new Error('Cannot find PostgreSQL initialization completion marker');
source = source.replace(createEnd, "`);await seedDefaultPaymentWallets(db);initialized=true;return true;}");

fs.writeFileSync(file, source);
console.log('Installed PostgreSQL payment wallet initialization');
