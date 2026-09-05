import fs from 'node:fs';

const wallets = [
  { id: 'crypto-usdc-erc20', enabled: true, asset: 'USDC', network: 'Ethereum ERC20', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'USDC (ERC20)', instructions: '' },
  { id: 'crypto-btc', enabled: true, asset: 'BTC', network: 'Bitcoin', address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', memo: '', label: 'Bitcoin', instructions: '' },
  { id: 'crypto-usdt-trc20', enabled: true, asset: 'USDT', network: 'TRON TRC20', address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', memo: '', label: 'USDT (TRC20)', instructions: '' },
  { id: 'crypto-sol', enabled: true, asset: 'SOL', network: 'Solana', address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', memo: '', label: 'Solana', instructions: '' },
  { id: 'crypto-bnb', enabled: true, asset: 'BNB', network: 'BNB Smart Chain', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'BNB (BSC)', instructions: '' },
  { id: 'crypto-eth', enabled: true, asset: 'ETH', network: 'Ethereum', address: '0x12107F3eB874442301756daFBd3360418ae3C366', memo: '', label: 'Ethereum', instructions: '' },
  { id: 'crypto-xrp', enabled: true, asset: 'XRP', network: 'XRP Ledger', address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', memo: '1476340', label: 'XRP', instructions: '' }
];

const componentPath = 'src/components/AdminPaymentMethods.tsx';
let component = fs.readFileSync(componentPath, 'utf8');
const defaultBlock = `const defaultCryptoMethods:CryptoWallet[]=${JSON.stringify(wallets)};`;
if (!component.includes('const defaultCryptoMethods:CryptoWallet[]=')) {
  component = component.replace(/const emptyEWallet:EWallet=\{[^;]+;\n/, match => match + defaultBlock + '\n');
}
component = component.replace(
  "const [methods,setMethods]=useState<PaymentMethods>({bankTransfer:emptyBank,instantTransfer:[],crypto:[],paypal:emptyEWallet,skrill:emptyEWallet,neteller:emptyEWallet});",
  "const [methods,setMethods]=useState<PaymentMethods>({bankTransfer:emptyBank,instantTransfer:[],crypto:defaultCryptoMethods,paypal:emptyEWallet,skrill:emptyEWallet,neteller:emptyEWallet});"
);
component = component.replace(
  "const raw=Array.isArray(data.methods?.crypto)?data.methods.crypto:(data.methods?.crypto?[data.methods.crypto]:[]);",
  "const rawFromServer=Array.isArray(data.methods?.crypto)?data.methods.crypto:(data.methods?.crypto?[data.methods.crypto]:[]);const raw=rawFromServer.length?rawFromServer:defaultCryptoMethods;"
);
component = component.replace(
  "if(loading)return <div",
  "if(loading)return <div"
);
fs.writeFileSync(componentPath, component);

const serverPath = 'server.ts';
let server = fs.readFileSync(serverPath, 'utf8');
const defaultsLiteral = JSON.stringify(wallets);

// The admin/customer API should expose the shipped receiving addresses even when
// the Postgres payment-method table has not yet been customized. Admin can then
// edit any address and save the changed configuration; blank storage is not a
// reason to hide the payment methods from customers.
const marker = "const persistedMethods = await dbPaymentMethods().catch(() => null);";
if (server.includes(marker) && !server.includes("const defaultCryptoWalletsForPaymentMethods =")) {
  server = server.replace(marker, `${marker}\n  const defaultCryptoWalletsForPaymentMethods = ${defaultsLiteral};`);
}

server = server.replace(
  "const crypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));",
  "const persistedCrypto = persistedMethods.filter((row) => row.method_type === 'crypto').map((row) => ({ id: row.id, ...(row.details || {}), enabled: Boolean(row.enabled), iconName: 'crypto' }));\n  const crypto = persistedCrypto.length ? persistedCrypto : defaultCryptoWalletsForPaymentMethods;"
);

// The multi-wallet customer route has its own rows lookup. Seed the response
// from the same known addresses whenever no custom crypto rows exist.
const customerNeedle = "const methods = rows.map((row: any) => ({";
if (server.includes(customerNeedle) && !server.includes("const defaultCryptoCustomerWallets =")) {
  server = server.replace(customerNeedle, `const defaultCryptoCustomerWallets = ${defaultsLiteral};\n    const hasCryptoRows = rows.some((row: any) => row.method_type === 'crypto');\n    const sourceRows = hasCryptoRows ? rows : [...rows, ...defaultCryptoCustomerWallets.map((wallet: any) => ({ id: wallet.id, method_type: 'crypto', enabled: true, details: wallet }))];\n    const methods = sourceRows.map((row: any) => ({`);
}
fs.writeFileSync(serverPath, server);
console.log('Default crypto receiving wallets are now visible and editable; persisted admin changes remain authoritative.');
