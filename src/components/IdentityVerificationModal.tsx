import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, ShieldCheck, AlertCircle, FileText, CheckCircle2, User, MapPin, Calendar, CreditCard, Lock, ChevronDown, Check } from 'lucide-react';
import CountrySelect from './CountrySelect';
import FirebaseKYCUpload from './FirebaseKYCUpload';

interface IdentityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function IdentityVerificationModal({ isOpen, onClose, showToast }: IdentityVerificationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields for Level 1 Verification
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [docType, setDocType] = useState('Passport');
  const [docNumber, setDocNumber] = useState('');

  // File Upload States
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [proofResFile, setProofResFile] = useState<File | null>(null);

  if (!isOpen) return null;

  // Validation checks
  const isDetailsValid = Boolean(
    fullName.trim() &&
    dob.trim() &&
    streetAddress.trim() &&
    city.trim() &&
    postalCode.trim() &&
    country.trim() &&
    docNumber.trim()
  );

  const isDocsUploaded = Boolean(idFrontFile && idBackFile && proofResFile);
  const isFormComplete = isDetailsValid && isDocsUploaded;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      if (showToast) showToast('Please complete all personal details and upload all 3 required verification documents.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      
      const kycData = {
        fullName,
        dob,
        streetAddress,
        city,
        postalCode,
        country,
        docType,
        docNumber,
        idFrontName: idFrontFile?.name || 'ID_Front.pdf',
        idBackName: idBackFile?.name || 'ID_Back.pdf',
        proofResName: proofResFile?.name || 'Proof_Of_Residence.pdf',
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        level: 1,
        status: 'Under Review'
      };

      localStorage.setItem('axi_kyc_level', '1');
      localStorage.setItem('axi_kyc_status', 'pending');
      localStorage.setItem('axi_kyc_details', JSON.stringify(kycData));

      const newDoc = {
        id: `KYC-${Date.now().toString().slice(-6)}`,
        user: fullName || 'Active Trader',
        userEmail: 'trader@axi.com',
        type: `${docType} & Proof of Address`,
        fileName: `${idFrontFile?.name || 'Front_ID'}, ${proofResFile?.name || 'Proof_Res'}`,
        submittedAt: kycData.submittedAt,
        status: 'Under Review',
        refCode: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
        details: kycData
      };
      
      const existingDocs = JSON.parse(localStorage.getItem('axi_kyc_docs') || '[]');
      localStorage.setItem('axi_kyc_docs', JSON.stringify([newDoc, ...existingDocs]));
      window.dispatchEvent(new Event('axi_kyc_update'));

      if (showToast) {
        showToast('Level 1 Document Verification submitted! Status updated to Pending Review.', 'success');
      }
      
      onClose();
      setStep(1);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />
        <motion.div 
          initial={{ scale: 0.96, opacity: 0, y: 12 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] w-full max-w-[800px] relative z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 max-h-[92vh] flex flex-col font-sans"
        >
          {/* Dark Navy Gradient Header */}
          <div className="bg-gradient-to-r from-[#0B1220] via-[#0E172A] to-[#111827] text-white p-6 sm:p-8 shrink-0 relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[24px] sm:text-[28px] text-white tracking-tight leading-none">
                    Level 1 KYC Verification
                  </h3>
                  <p className="text-[14px] text-white/70 font-normal mt-1.5">
                    Regulatory compliance manual identity and residency verification
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all hover:scale-105 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Horizontal Connected Stepper */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center max-w-md mx-auto">
              {/* Step 1 Circle & Label */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                  step === 1 
                    ? 'bg-[#E53935] text-white ring-4 ring-red-500/20' 
                    : isDetailsValid 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/10 text-white/60'
                }`}>
                  {isDetailsValid && step === 2 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className={`text-xs font-bold ${step === 1 ? 'text-white' : 'text-white/70'}`}>
                    Step 1
                  </div>
                  <div className={`text-[11px] ${step === 1 ? 'text-white/90' : 'text-white/50'}`}>
                    Personal Details
                  </div>
                </div>
              </button>

              {/* Connecting Bar */}
              <div className="flex-1 mx-4 sm:mx-6 h-1 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#E53935] to-[#C62828] transition-all duration-300"
                  style={{ width: step === 2 ? '100%' : '0%' }}
                />
              </div>

              {/* Step 2 Circle & Label */}
              <button
                type="button"
                onClick={() => { if (isDetailsValid) setStep(2); }}
                className={`flex items-center gap-3 ${isDetailsValid ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                  step === 2 
                    ? 'bg-[#E53935] text-white ring-4 ring-red-500/20' 
                    : 'bg-white/10 text-white/60'
                }`}>
                  2
                </div>
                <div className="text-left hidden sm:block">
                  <div className={`text-xs font-bold ${step === 2 ? 'text-white' : 'text-white/70'}`}>
                    Step 2
                  </div>
                  <div className={`text-[11px] ${step === 2 ? 'text-white/90' : 'text-white/50'}`}>
                    Upload Documents
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Content Body */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 sm:space-y-8 bg-white dark:bg-slate-900">
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Modern Soft Gray Alert Box */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-100 dark:border-blue-900/50">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    Please provide your <strong>full legal name, date of birth, and official residence address</strong> matching your government-issued identity documents for regulatory compliance verification.
                  </p>
                </div>

                {/* Form Fields Two-Column Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Legal Name (Full Width) */}
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Alexander Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-4 text-sm font-medium text-slate-900 dark:text-white focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                    />
                  </div>

                  {/* ID Type & ID Number */}
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      ID Type & Document Number <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5 relative">
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="Passport">Passport</option>
                          <option value="Driver License">Driver License</option>
                          <option value="National ID">National ID</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <div className="col-span-7">
                        <input 
                          type="text"
                          required
                          placeholder="Document ID #"
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Residential Street Address (Full Width) */}
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      Residential Street Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 124 Baker Street, Suite 4B"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                    />
                  </div>

                  {/* City */}
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      Postal / Zip Code <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. NW1 6XE"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full h-[56px] bg-white dark:bg-slate-800 border border-[#D9DEE8] dark:border-slate-700 rounded-[14px] px-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/15 outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Country of Residence (Searchable Premium Country Dropdown) */}
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                      Country of Residence <span className="text-red-500">*</span>
                    </label>
                    <CountrySelect
                      value={country}
                      onChange={(val) => setCountry(val)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Next Step Premium Action Button */}
                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (!isDetailsValid) {
                        if (showToast) showToast('Please complete all personal and address details first.', 'error');
                        return;
                      }
                      setStep(2);
                    }}
                    disabled={!isDetailsValid}
                    className="w-full h-[56px] bg-gradient-to-r from-[#E53935] to-[#C62828] hover:from-[#EF5350] hover:to-[#D32F2F] active:from-[#C62828] active:to-[#B71C1C] text-white font-bold text-base rounded-[14px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    Proceed to Upload Identification Documents
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Modern Alert Banner */}
                <div className="bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E5E7EB] dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-slate-600 dark:text-slate-300">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-100 dark:border-amber-900/50">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm leading-relaxed font-medium">
                    Upload clear, high-resolution scans or photos of your government ID (Front & Back) and a recent utility bill or bank statement (issued within 3 months).
                  </p>
                </div>

                {/* Firebase Storage Uploader Component */}
                <FirebaseKYCUpload
                  docType={docType}
                  fullName={fullName}
                  docNumber={docNumber}
                  showToast={showToast}
                  onUploadComplete={(results) => {
                    const kycData = {
                      fullName,
                      dob,
                      streetAddress,
                      city,
                      postalCode,
                      country,
                      docType,
                      docNumber,
                      idFrontName: results[0]?.fileName || 'ID_Front.pdf',
                      idBackName: results[1]?.fileName || 'ID_Back.pdf',
                      proofResName: results[2]?.fileName || 'Proof_Of_Residence.pdf',
                      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
                      level: 1,
                      status: 'Under Review'
                    };

                    localStorage.setItem('axi_kyc_level', '1');
                    localStorage.setItem('axi_kyc_status', 'pending');
                    localStorage.setItem('axi_kyc_details', JSON.stringify(kycData));

                    const newDoc = {
                      id: `KYC-${Date.now().toString().slice(-6)}`,
                      user: fullName || 'Active Trader',
                      userEmail: 'trader@axi.com',
                      type: `${docType} & Proof of Address`,
                      fileName: `${results[0]?.fileName || 'Front_ID'}, ${results[2]?.fileName || 'Proof_Res'}`,
                      submittedAt: kycData.submittedAt,
                      status: 'Under Review',
                      refCode: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
                      details: kycData
                    };
                    
                    const existingDocs = JSON.parse(localStorage.getItem('axi_kyc_docs') || '[]');
                    localStorage.setItem('axi_kyc_docs', JSON.stringify([newDoc, ...existingDocs]));
                    window.dispatchEvent(new Event('axi_kyc_update'));

                    if (showToast) {
                      showToast('Level 1 Document Verification submitted! Status updated to Pending Review.', 'success');
                    }
                    
                    onClose();
                    setStep(1);
                  }}
                />

                <div className="pt-1">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-bold py-2 transition cursor-pointer text-center"
                  >
                    ← Edit Personal Information
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


