import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '../firebase';
import { Upload, FileText, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2, X, ShieldCheck } from 'lucide-react';

interface FirebaseKYCUploadProps {
  docType: string;
  fullName: string;
  docNumber: string;
  onUploadComplete?: (results: Array<{ label: string; url: string; fileName: string }>) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}
type SlotKey = 'idFront' | 'idBack' | 'proofRes';
interface Slot { key: SlotKey; label: string; file: File | null; previewUrl: string | null; progress: number; uploading: boolean; downloadUrl: string | null; error: string | null; }

export default function FirebaseKYCUpload({ docType, fullName, docNumber, onUploadComplete, showToast }: FirebaseKYCUploadProps) {
  const makeSlot = (key: SlotKey, label: string): Slot => ({ key, label, file: null, previewUrl: null, progress: 0, uploading: false, downloadUrl: null, error: null });
  const [slots, setSlots] = useState<Record<SlotKey, Slot>>({ idFront: makeSlot('idFront', `${docType} Front Page`), idBack: makeSlot('idBack', `${docType} Back Page`), proofRes: makeSlot('proofRes', 'Proof of Address') });
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const handleFileChange = (key: SlotKey, file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast?.('Each verification document must be 10MB or smaller.', 'error'); return; }
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') { showToast?.('Please upload a PNG, JPG, or PDF document.', 'error'); return; }
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setSlots(prev => ({ ...prev, [key]: { ...prev[key], file, previewUrl, progress: 0, downloadUrl: null, error: null } }));
  };

  const uploadSingle = (key: SlotKey): Promise<string> => {
    const slot = slots[key];
    const currentUser = auth.currentUser;
    if (!currentUser) return Promise.reject(new Error('You must be signed in to submit identity verification.'));
    if (!slot.file) return Promise.reject(new Error(`Select ${slot.label} before submitting.`));
    return new Promise((resolve, reject) => {
      setSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: true, progress: 0, error: null } }));
      const safeName = slot.file!.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `kyc_documents/${currentUser.uid}/${Date.now()}_${key}_${safeName}`;
      try {
        const task = uploadBytesResumable(ref(storage, storagePath), slot.file!);
        task.on('state_changed', snapshot => {
          const progress = snapshot.totalBytes ? Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100) : 0;
          setSlots(prev => ({ ...prev, [key]: { ...prev[key], progress } }));
        }, error => {
          setSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, error: error.message, progress: 0 } }));
          reject(new Error(`Upload failed for ${slot.label}. ${error.message}`));
        }, async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            setSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, progress: 100, downloadUrl: url } }));
            resolve(url);
          } catch (error: any) {
            setSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, error: error?.message || 'Could not verify uploaded document.' } }));
            reject(new Error(`Upload completed but the document URL could not be verified for ${slot.label}.`));
          }
        });
      } catch (error: any) {
        setSlots(prev => ({ ...prev, [key]: { ...prev[key], uploading: false, error: error?.message || 'Upload could not start.' } }));
        reject(new Error(`Could not start upload for ${slot.label}.`));
      }
    });
  };

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) { showToast?.('Please sign in before submitting KYC.', 'error'); return; }
    if (!fullName.trim() || !docNumber.trim()) { showToast?.('Complete your legal name and document number first.', 'error'); return; }
    if (!slots.idFront.file || !slots.idBack.file || !slots.proofRes.file) { showToast?.('Please select all 3 required verification documents.', 'error'); return; }
    setIsSubmittingAll(true);
    try {
      const [idFrontUrl, idBackUrl, proofResUrl] = await Promise.all([uploadSingle('idFront'), uploadSingle('idBack'), uploadSingle('proofRes')]);
      const documents = [
        { label: slots.idFront.label, url: idFrontUrl, fileName: slots.idFront.file!.name },
        { label: slots.idBack.label, url: idBackUrl, fileName: slots.idBack.file!.name },
        { label: slots.proofRes.label, url: proofResUrl, fileName: slots.proofRes.file!.name }
      ];
      await addDoc(collection(db, 'kyc_submissions'), { fullName: fullName.trim(), docType, docNumber: docNumber.trim(), userId: currentUser.uid, userEmail: currentUser.email || '', documents, status: 'Under Review', submittedAt: serverTimestamp() });
      showToast?.('KYC documents uploaded and submitted for manual review.', 'success');
      onUploadComplete?.(documents);
    } catch (error: any) {
      showToast?.(error?.message || 'KYC submission failed. No verification was recorded.', 'error');
    } finally { setIsSubmittingAll(false); }
  };

  return <div className="space-y-5">
    <div className="bg-slate-900/90 text-white p-4 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs font-semibold"><ShieldCheck className="w-5 h-5 text-emerald-400" /><div><div className="font-extrabold">Secure identity document upload</div><div className="text-slate-400 mt-0.5">Documents are uploaded to your authenticated Firebase Storage path. Failed uploads are never marked as successful.</div></div></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(['idFront','idBack','proofRes'] as SlotKey[]).map(key => { const slot = slots[key]; return <div key={key} className="rounded-2xl p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-3"><div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><FileText className="w-4 h-4 text-[#E3000F]" />{slot.label}</div>{slot.downloadUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <span className="text-[10px] font-bold text-slate-400 uppercase">Required</span>}</div>
        {slot.file ? <div className="relative rounded-xl bg-slate-100 dark:bg-slate-900 border p-3 min-h-[120px]">{slot.previewUrl ? <img src={slot.previewUrl} alt="Document preview" className="w-full h-20 object-cover rounded-lg mb-2" /> : <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />}<div className="text-xs font-bold truncate">{slot.file.name}</div><button type="button" onClick={() => setSlots(prev => ({ ...prev, [key]: { ...prev[key], file: null, previewUrl: null, downloadUrl: null, progress: 0, error: null } }))} className="absolute top-2 right-2 p-1 rounded-full bg-slate-900 text-white"><X className="w-3 h-3" /></button></div> : <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[120px]"><Upload className="w-6 h-6 text-[#E3000F] mb-2" /><span className="text-xs font-bold">Choose document</span><span className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</span><input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFileChange(key, e.target.files?.[0] || null)} /></label>}
        {slot.uploading && <div className="mt-3"><div className="flex justify-between text-[10px] font-bold"><span>Uploading…</span><span>{slot.progress}%</span></div><div className="h-1.5 bg-slate-200 rounded-full mt-1"><div className="h-full bg-[#E3000F] rounded-full" style={{ width: `${slot.progress}%` }} /></div></div>}
        {slot.error && <div className="mt-2 text-[10px] text-rose-500 flex gap-1"><AlertCircle className="w-3 h-3 shrink-0" />{slot.error}</div>}
      </div>; })}
    </div>
    <button type="button" onClick={handleSubmit} disabled={isSubmittingAll} className="w-full h-14 bg-[#E3000F] hover:bg-[#c9000d] text-white font-extrabold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">{isSubmittingAll ? <><Loader2 className="w-5 h-5 animate-spin" />Uploading and submitting…</> : <><Upload className="w-5 h-5" />Upload documents & submit for verification</>}</button>
  </div>;
}
