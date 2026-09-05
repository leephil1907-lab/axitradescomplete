import fs from 'node:fs';

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    console.log(`KYC fix: ${label} already applied or source shape changed; skipping.`);
    return source;
  }
  return source.replace(from, to);
}

const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
admin = replaceRequired(admin, "setKyc(Array.isArray(d.documents)?d.documents:[]);", "setKyc(Array.isArray(d.submissions)?d.submissions:(Array.isArray(d.documents)?d.documents:[]));", 'admin KYC response mapping');
const oldEffect = "useEffect(()=>{if(!adminToken)return;if(activeTab==='users')void loadUsers();if(activeTab==='kyc')void loadKyc();},[activeTab,adminToken]);";
const newEffect = "useEffect(()=>{if(!adminToken)return;if(activeTab==='users')void loadUsers();if(activeTab==='kyc'){void loadKyc();const timer=window.setInterval(()=>void loadKyc(),10000);return()=>window.clearInterval(timer);}},[activeTab,adminToken]);";
admin = replaceRequired(admin, oldEffect, newEffect, 'admin KYC polling');
fs.writeFileSync(adminPath, admin);

const modalPath = 'src/components/IdentityVerificationModal.tsx';
let modal = fs.readFileSync(modalPath, 'utf8');
const start = modal.indexOf('  const handleSubmit = (e: React.FormEvent) => {');
const end = modal.indexOf('\n\n  return (', start);
if (start >= 0 && end >= 0) {
  const replacement = `  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      showToast?.('Please complete all personal details and upload all 3 required verification documents.', 'error');
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast?.('Please sign in before submitting KYC.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await currentUser.getIdToken();
      const submittedAt = new Date().toISOString();
      const kycData = {
        fullName: fullName.trim(), dob, streetAddress: streetAddress.trim(), city: city.trim(),
        postalCode: postalCode.trim(), country: country.trim(), docType, docNumber: docNumber.trim(),
        idFrontName: idFrontFile?.name || 'ID_Front.pdf', idBackName: idBackFile?.name || 'ID_Back.pdf',
        proofResName: proofResFile?.name || 'Proof_Of_Residence.pdf', submittedAt, level: 1, status: 'Pending'
      };
      const newDoc = {
        id: \`KYC-\${Date.now()}-\${currentUser.uid.slice(0,8)}\`, user: fullName.trim(), userEmail: currentUser.email || '',
        type: \`\${docType} & Proof of Address\`,
        fileName: \`\${idFrontFile?.name || 'Front_ID'}, \${idBackFile?.name || 'Back_ID'}, \${proofResFile?.name || 'Proof_Res'}\`,
        submittedAt, status: 'Pending', refCode: \`DOC-\${Math.floor(100000 + Math.random() * 900000)}\`, details: kycData
      };
      const response = await fetch('/api/kyc/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` }, body: JSON.stringify(newDoc) });
      const raw = await response.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(\`KYC service returned an invalid response (HTTP \${response.status}).\`); }
      if (!response.ok || !data.success) throw new Error(data.error || 'KYC submission could not be recorded.');
      localStorage.setItem('axi_kyc_level', '1'); localStorage.setItem('axi_kyc_status', 'pending'); localStorage.setItem('axi_kyc_details', JSON.stringify(kycData));
      const existingDocs = JSON.parse(localStorage.getItem('axi_kyc_docs') || '[]');
      localStorage.setItem('axi_kyc_docs', JSON.stringify([newDoc, ...existingDocs]));
      window.dispatchEvent(new Event('axi_kyc_update'));
      showToast?.('Level 1 KYC submitted successfully and sent to the administrator for review.', 'success'); onClose(); setStep(1);
    } catch (error) {
      showToast?.(error?.message || 'KYC submission failed. Nothing was marked as submitted.', 'error');
    } finally { setIsSubmitting(false); }
  };`;
  modal = modal.slice(0, start) + replacement + modal.slice(end);
  fs.writeFileSync(modalPath, modal);
} else console.log('KYC fix: IdentityVerificationModal submit handler already finalized; skipping.');

const uploaderPath = 'src/components/FirebaseKYCUpload.tsx';
let uploader = fs.readFileSync(uploaderPath, 'utf8');
uploader = uploader.replace("import { collection, addDoc, serverTimestamp } from 'firebase/firestore';\n", '');
uploader = uploader.replace("import { storage, db, auth } from '../firebase';", "import { storage, auth } from '../firebase';");
uploader = replaceRequired(uploader, "  docNumber: string;\n", "  docNumber: string;\n  dob?: string;\n  streetAddress?: string;\n  city?: string;\n  postalCode?: string;\n  country?: string;\n", 'KYC uploader address fields');
uploader = replaceRequired(uploader, "export default function FirebaseKYCUpload({ docType, fullName, docNumber, onUploadComplete, showToast }: FirebaseKYCUploadProps) {", "export default function FirebaseKYCUpload({ docType, fullName, docNumber, dob='', streetAddress='', city='', postalCode='', country='', onUploadComplete, showToast }: FirebaseKYCUploadProps) {", 'KYC uploader props');
const oldFirestore = "      await addDoc(collection(db, 'kyc_submissions'), { fullName: fullName.trim(), docType, docNumber: docNumber.trim(), userId: currentUser.uid, userEmail: currentUser.email || '', documents, status: 'Under Review', submittedAt: serverTimestamp() });\n      showToast?.('KYC documents uploaded and submitted for manual review.', 'success');\n      onUploadComplete?.(documents);";
const newBackend = `      const token = await currentUser.getIdToken();
      const response = await fetch('/api/kyc/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` }, body: JSON.stringify({
        id: \`KYC-\${currentUser.uid}-\${Date.now()}\`, fullName: fullName.trim(), dob, streetAddress, city, postalCode, country, docType, docNumber: docNumber.trim(), user: fullName.trim(), userEmail: currentUser.email || '', type: \`\${docType} & Proof of Address\`, documents,
        fileName: documents.map(document => document.fileName).join(', '), submittedAt: new Date().toISOString(), status: 'Pending', level: 1,
        refCode: \`DOC-\${Math.floor(100000 + Math.random() * 900000)}\`, details: { fullName: fullName.trim(), dob, streetAddress, city, postalCode, country, docType, docNumber: docNumber.trim() }
      }) });
      const raw = await response.text(); let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { throw new Error(\`KYC service returned an invalid response (HTTP \${response.status}).\`); }
      if (!response.ok || !result.success) throw new Error(result.error || 'KYC submission could not be recorded.');
      showToast?.('KYC documents uploaded and submitted for manual review.', 'success'); onUploadComplete?.(documents);`;
uploader = replaceRequired(uploader, oldFirestore, newBackend, 'Firestore KYC submission');
fs.writeFileSync(uploaderPath, uploader);

const opPath = 'server/postgresOperational.ts';
let op = fs.readFileSync(opPath, 'utf8');
if (!op.includes("import { verifyAdminSession } from './adminAuth';")) {
  const anchor = "import type { Express, NextFunction, Request, Response } from 'express';";
  op = replaceRequired(op, anchor, anchor + "\nimport { verifyAdminSession } from './adminAuth';", 'operational admin auth import');
}
const opStart = op.indexOf('async function requireAdminForOperational(');
if (opStart >= 0) {
  const opEnd = op.indexOf('\n\n', opStart);
  const opBody = `async function requireAdminForOperational(req: Request, res: Response, next: NextFunction) {
  const match = String(req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);
  const session = verifyAdminSession(match?.[1] || '');
  if (!session) return res.status(401).json({ success: false, error: 'Invalid administrator authentication token' });
  (req as any).adminEmail = session.email;
  return next();
}`;
  op = op.slice(0, opStart) + opBody + (opEnd >= 0 ? op.slice(opEnd) : '');
  fs.writeFileSync(opPath, op);
} else console.log('KYC fix: operational admin guard already finalized; skipping.');

console.log('KYC flow finalized: authenticated PostgreSQL persistence, Firebase document URLs, admin queue mapping/polling, and standalone admin authentication.');
