import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'); const write=(p,s)=>fs.writeFileSync(p,s);

// Never fabricate an identity for KYC submissions. The authenticated Firebase identity is authoritative.
let server=read('server.ts');
server=server.replace("const user = body.user || body.fullName || 'Active Trader';", "const user = body.fullName || String((req as any).authUser?.name || (req as any).authUser?.email || '').trim();\n  if (!user) return res.status(400).json({ error: 'Verified user identity is required' });");
server=server.replace("const userEmail = (body.userEmail || body.email || 'trader@axi.com').toLowerCase();", "const userEmail = String((req as any).authUser?.email || '').toLowerCase();\n  if (!userEmail) return res.status(400).json({ error: 'Verified user email is required' });");
server=server.replace("const docType = body.type || body.docType || 'Passport';", "const docType = body.type || body.docType;\n  if (!docType) return res.status(400).json({ error: 'Document type is required' });");
write('server.ts',server);

// Remove the remaining public demo CTA without affecting the real live-account CTA.
let footer=read('src/components/Footer.tsx');
footer=footer.replace(/\s*<button\s*\n?\s*onClick=\{\(\) => handleNav\('platforms'\)\}[\s\S]*?>\s*Try Demo\s*<\/button>/, '');
write('src/components/Footer.tsx',footer);

// Fail closed if a production build still contains explicit guest/demo identity fallbacks in KYC.
const kyc=read('src/components/FirebaseKYCUpload.tsx');
if (/guest_|trader@axi\.com|simProgress|storing document locally/i.test(kyc)) throw new Error('Production KYC hardening failed: simulated or guest fallback remains.');
console.log('Production finalization applied.');
