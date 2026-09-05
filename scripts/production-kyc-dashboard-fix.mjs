import fs from 'node:fs';

// KYC dashboard/API consistency: the operational API returns `submissions`, not `documents`.
const adminPath = 'src/components/AdminDashboardView.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
admin = admin.replace("setKyc(Array.isArray(d.documents)?d.documents:[]);", "setKyc(Array.isArray(d.submissions)?d.submissions:(Array.isArray(d.documents)?d.documents:[]));");
// Refresh the KYC queue while the admin is viewing it so newly submitted requests appear without a manual reload.
const oldEffect = "useEffect(()=>{if(!adminToken)return;if(activeTab==='users')void loadUsers();if(activeTab==='kyc')void loadKyc();},[activeTab,adminToken]);";
const newEffect = "useEffect(()=>{if(!adminToken)return;if(activeTab==='users')void loadUsers();if(activeTab==='kyc'){void loadKyc();const timer=window.setInterval(()=>void loadKyc(),10000);return()=>window.clearInterval(timer);}},[activeTab,adminToken]);";
if (admin.includes(oldEffect)) admin = admin.replace(oldEffect, newEffect);
fs.writeFileSync(adminPath, admin);

// Real KYC submission: use the authenticated Firebase ID token, await the server result,
// and only mark the request locally after PostgreSQL has accepted it.
const modalPath = 'src/components/IdentityVerificationModal.tsx';
let modal = fs.readFileSync(modalPath, 'utf8');
const start = modal.indexOf('  const handleSubmit = (e: React.FormEvent) => {');
const end = modal.indexOf('\n\n  return (', start);
if (start < 0 || end < 0) throw new Error('IdentityVerificationModal submit handler markers not found');
const replacement = `  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    if (!isFormComplete) {\n      showToast?.('Please complete all personal details and upload all 3 required verification documents.', 'error');\n      return;\n    }\n    const currentUser = auth.currentUser;\n    if (!currentUser) {\n      showToast?.('Please sign in before submitting KYC.', 'error');\n      return;\n    }\n    setIsSubmitting(true);\n    try {\n      const token = await currentUser.getIdToken();\n      const submittedAt = new Date().toISOString();\n      const kycData = {\n        fullName: fullName.trim(), dob, streetAddress: streetAddress.trim(), city: city.trim(),\n        postalCode: postalCode.trim(), country: country.trim(), docType, docNumber: docNumber.trim(),\n        idFrontName: idFrontFile?.name || 'ID_Front.pdf', idBackName: idBackFile?.name || 'ID_Back.pdf',\n        proofResName: proofResFile?.name || 'Proof_Of_Residence.pdf', submittedAt, level: 1, status: 'Pending'\n      };\n      const newDoc = {\n        id: \\`KYC-\\${Date.now()}-\\${currentUser.uid.slice(0,8)}\\`,\n        user: fullName.trim(), userEmail: currentUser.email || '',\n        type: \\`\\${docType} & Proof of Address\\`,\n        fileName: \\`\\${idFrontFile?.name || 'Front_ID'}, \\${idBackFile?.name || 'Back_ID'}, \\${proofResFile?.name || 'Proof_Res'}\\`,\n        submittedAt, status: 'Pending', refCode: \\`DOC-\\${Math.floor(100000 + Math.random() * 900000)}\\`, details: kycData\n      };\n      const response = await fetch('/api/kyc/submit', {\n        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: \\`Bearer \\${token}\\` }, body: JSON.stringify(newDoc)\n      });\n      const raw = await response.text();\n      let data: any = {};\n      try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(\\`KYC service returned an invalid response (HTTP \\${response.status}).\\`); }\n      if (!response.ok || !data.success) throw new Error(data.error || 'KYC submission could not be recorded.');\n\n      localStorage.setItem('axi_kyc_level', '1');\n      localStorage.setItem('axi_kyc_status', 'pending');\n      localStorage.setItem('axi_kyc_details', JSON.stringify(kycData));\n      const existingDocs = JSON.parse(localStorage.getItem('axi_kyc_docs') || '[]');\n      localStorage.setItem('axi_kyc_docs', JSON.stringify([newDoc, ...existingDocs]));\n      window.dispatchEvent(new Event('axi_kyc_update'));\n      showToast?.('Level 1 KYC submitted successfully and sent to the administrator for review.', 'success');\n      onClose();\n      setStep(1);\n    } catch (error: any) {\n      showToast?.(error?.message || 'KYC submission failed. Nothing was marked as submitted.', 'error');\n    } finally {\n      setIsSubmitting(false);\n    }\n  };`;
modal = modal.slice(0, start) + replacement + modal.slice(end);
fs.writeFileSync(modalPath, modal);

// Make the operational admin guard deterministic even if an earlier build script changes it.
const opPath = 'server/postgresOperational.ts';
let op = fs.readFileSync(opPath, 'utf8');
if (!op.includes("import { verifyAdminSession } from './adminAuth';")) {
  const anchor = "import type { Express, NextFunction, Request, Response } from 'express';";
  if (!op.includes(anchor)) throw new Error('Operational import anchor not found');
  op = op.replace(anchor, anchor + "\nimport { verifyAdminSession } from './adminAuth';");
}
const opStart = op.indexOf('async function requireAdminForOperational(');
if (opStart < 0) throw new Error('Operational admin guard not found');
const opEnd = op.indexOf('\n\n', opStart);
const opBody = `async function requireAdminForOperational(req: Request, res: Response, next: NextFunction) {\n  const match = String(req.headers.authorization || '').match(/^Bearer\\s+(.+)$/i);\n  const session = verifyAdminSession(match?.[1] || '');\n  if (!session) return res.status(401).json({ success: false, error: 'Invalid administrator authentication token' });\n  (req as any).adminEmail = session.email;\n  return next();\n}`;
op = op.slice(0, opStart) + opBody + (opEnd >= 0 ? op.slice(opEnd) : '');
fs.writeFileSync(opPath, op);

console.log('KYC submission persistence, admin response mapping, polling, and standalone admin authentication finalized.');
