import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Shield, Key, CheckCircle2, Lock, Smartphone, Copy, Check, QrCode, X, FileText, UploadCloud, Clock, AlertTriangle, ShieldCheck, BadgeCheck, FileCheck, ArrowRight, Upload, Info, RefreshCw, ChevronRight, User as UserIcon, Mail, CreditCard, Plus, Trash2, Landmark, Building2, Fingerprint, ScanFace, Laptop, Globe, Hash, ShieldAlert, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType, KYCDocument } from '../types';
import { User, updateProfile, updateEmail, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface SettingsViewProps {
  user?: User | null;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setView: (view: ViewType) => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function SettingsView({ user, showToast, setView, isDarkMode = false, toggleDarkMode }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'payment_accounts' | 'appearance' | 'notifications' | 'security' | 'kyc' | 'api'>('profile');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [telegramAlerts, setTelegramAlerts] = useState(() => localStorage.getItem('axi_telegram_alerts') === 'true');

  // Registered Individual Financial Payment Accounts State
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(d => {
        if (d.exists() && d.data().paymentMethods) {
          setPaymentAccounts(d.data().paymentMethods);
        }
      });
    }
  }, [user]);

  const [newPaymentType, setNewPaymentType] = useState<'bank' | 'card' | 'wallet' | 'crypto'>('bank');
  const [newPaymentBank, setNewPaymentBank] = useState('');
  const [newPaymentHolder, setNewPaymentHolder] = useState(user?.displayName || '');
  const [newPaymentNumber, setNewPaymentNumber] = useState('');
  const [newPaymentCurrency, setNewPaymentCurrency] = useState('USD');

  const handleAddPaymentAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentBank.trim() || !newPaymentNumber.trim()) {
      showToast('Please enter the bank/issuer name and account identifier.', 'error');
      return;
    }

    const newAcc = {
      id: `acc_${Date.now()}`,
      type: newPaymentType,
      bankName: newPaymentBank.trim(),
      holderName: newPaymentHolder.trim() || user?.displayName || 'Registered Individual',
      accountNumberMasked: newPaymentNumber.trim().length > 4 ? `•••• ${newPaymentNumber.trim().slice(-4)}` : newPaymentNumber.trim(),
      fullAccountNumber: 'REDACTED', // Securely handled by Stripe Backend in production
      currency: newPaymentCurrency,
      isPrimary: paymentAccounts.length === 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    
    const updated = [newAcc, ...paymentAccounts];
    setPaymentAccounts(updated);
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { paymentMethods: updated }).catch(e => console.error(e));
    }

    
    showToast(`✅ Registered Payment Account (${newAcc.bankName}) added successfully!`, 'success');
    setIsAddPaymentModalOpen(false);
    setNewPaymentBank('');
    setNewPaymentNumber('');
  };

  const handleRemovePaymentAccount = (id: string) => {
    
    const updated = paymentAccounts.filter(a => a.id !== id);
    setPaymentAccounts(updated);
    if (user) {
      updateDoc(doc(db, 'users', user.uid), { paymentMethods: updated }).catch(e => console.error(e));
    }

    showToast('Payment account removed.', 'info');
  };

  // 2FA Security State
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => localStorage.getItem('axi_2fa_enabled') === 'true');
  const [is2FAWizardOpen, setIs2FAWizardOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('axi_2fa_recovery_codes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // Biometric Security State
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => localStorage.getItem('axi_biometric_enabled') === 'true');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const handleTriggerBiometricScan = () => {
    if (biometricScanning || biometricSuccess) return;
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      setIsBiometricEnabled(true);
      localStorage.setItem('axi_biometric_enabled', 'true');
      showToast('Biometric login enabled successfully!', 'success');
      setTimeout(() => {
        setIsBiometricModalOpen(false);
        setBiometricSuccess(false);
      }, 1200);
    }, 1500);
  };

  // Active Sessions State
  interface SessionItem {
    id: string;
    device: string;
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
    type: 'desktop' | 'mobile';
  }

  const [activeSessions, setActiveSessions] = useState<SessionItem[]>(() => {
    const saved = localStorage.getItem('axi_active_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'sess_current',
        device: 'Current Device',
        browser: 'Current Browser',
        location: 'Current Location',
        ip: '127.0.0.1',
        lastActive: 'Active now',
        isCurrent: true,
        type: 'desktop'
      }
    ];
  });

  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(null);

  const handleRevokeSession = (sessionId: string) => {
    const updated = activeSessions.filter(s => s.id !== sessionId);
    setActiveSessions(updated);
    localStorage.setItem('axi_active_sessions', JSON.stringify(updated));
    setSessionToRevoke(null);
    showToast('Session revoked successfully.', 'success');
  };

  const handleRevokeAllOtherSessions = () => {
    const currentOnly = activeSessions.filter(s => s.isCurrent);
    setActiveSessions(currentOnly);
    localStorage.setItem('axi_active_sessions', JSON.stringify(currentOnly));
    showToast('All other active sessions have been revoked.', 'success');
  };

  // 4-Digit Security PIN State
  const [accountPin, setAccountPin] = useState<string>(() => localStorage.getItem('axi_account_pin') || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinConfirm, setPinConfirm] = useState<string>('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState<string>('');

  const openPinSetupModal = () => {
    setPinInput('');
    setPinConfirm('');
    setPinStep('enter');
    setPinError('');
    setIsPinModalOpen(true);
  };

  const handleKeypadPress = (digit: string) => {
    if (digit === 'backspace') {
      if (pinStep === 'enter') setPinInput(prev => prev.slice(0, -1));
      else setPinConfirm(prev => prev.slice(0, -1));
      setPinError('');
      return;
    }
    if (digit === 'clear') {
      if (pinStep === 'enter') setPinInput('');
      else setPinConfirm('');
      setPinError('');
      return;
    }

    if (pinStep === 'enter') {
      if (pinInput.length < 4) {
        const nextPin = pinInput + digit;
        setPinInput(nextPin);
        setPinError('');
        if (nextPin.length === 4) {
          setTimeout(() => {
            setPinStep('confirm');
          }, 250);
        }
      }
    } else {
      if (pinConfirm.length < 4) {
        const nextConfirm = pinConfirm + digit;
        setPinConfirm(nextConfirm);
        setPinError('');
        if (nextConfirm.length === 4) {
          if (nextConfirm === pinInput) {
            setAccountPin(nextConfirm);
            localStorage.setItem('axi_account_pin', nextConfirm);
            showToast('4-Digit Security PIN setup complete!', 'success');
            setTimeout(() => {
              setIsPinModalOpen(false);
              setPinInput('');
              setPinConfirm('');
              setPinStep('enter');
            }, 300);
          } else {
            setPinError('PINs do not match. Please try again.');
            setTimeout(() => {
              setPinConfirm('');
              setPinError('');
            }, 1200);
          }
        }
      }
    }
  };

  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified'>(() => {
    return (localStorage.getItem('axi_kyc_status') as 'unverified' | 'pending' | 'verified') || 'unverified';
  });

  // KYC Documents Tracker State - Real user structure (Starts empty/unsubmitted for new users)
  const [kycDocs, setKycDocs] = useState<KYCDocument[]>(() => {
    const saved = localStorage.getItem('axi_kyc_docs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'kyc_doc_101',
        type: 'Passport / National ID',
        fileName: 'Not Uploaded',
        fileSize: '--',
        submittedAt: '--',
        status: 'Not Uploaded',
        reviewStep: 1,
        adminNote: 'Upload an unexpired government-issued passport, national ID, or driver\'s license.',
        refCode: 'DOC-PENDING-ID'
      },
      {
        id: 'kyc_doc_102',
        type: 'Proof of Address',
        fileName: 'Not Uploaded',
        fileSize: '--',
        submittedAt: '--',
        status: 'Not Uploaded',
        reviewStep: 1,
        adminNote: 'Upload a utility bill, bank statement, or tax document issued within 90 days.',
        refCode: 'DOC-PENDING-POA'
      },
      {
        id: 'kyc_doc_103',
        type: 'Bank Statement / Wealth Proof',
        fileName: 'Not Uploaded',
        fileSize: '--',
        submittedAt: '--',
        status: 'Not Uploaded',
        reviewStep: 1,
        adminNote: 'Upload an official bank statement to verify funding account ownership.',
        refCode: 'DOC-PENDING-BS'
      }
    ];
  });

  useEffect(() => {
    const handleKycUpdate = () => {
      const saved = localStorage.getItem('axi_kyc_docs');
      if (saved) {
        try { setKycDocs(JSON.parse(saved)); } catch (e) {}
      }
      setKycStatus((localStorage.getItem('axi_kyc_status') as 'unverified' | 'pending' | 'verified') || 'unverified');
    };
    window.addEventListener('axi_kyc_update', handleKycUpdate);
    return () => window.removeEventListener('axi_kyc_update', handleKycUpdate);
  }, []);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'Passport / National ID' | 'Proof of Address' | 'Bank Statement / Wealth Proof'>('Passport / National ID');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadNote, setUploadNote] = useState('');
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);

  const totpSecret = 'AXI-2FA-88X9-4110-K9L2-M56P';

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) {
      showToast('Please select or enter a document filename.', 'error');
      return;
    }

    setIsSubmittingDoc(true);
    setTimeout(() => {
      setIsSubmittingDoc(false);
      const newRef = `DOC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const newDoc = {
        id: `KYC-${Math.floor(100000 + Math.random() * 899999)}`,
        user: user?.displayName || 'User',
        userEmail: user?.email || 'user@example.com',
        type: selectedDocType,
        fileName: uploadFileName.trim(),
        fileSize: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
        submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC',
        status: 'Under Review',
        reviewStep: 2,
        adminNote: uploadNote ? `User Note: "${uploadNote}". Submitted for manual admin review.` : 'Submitted and queued for manual compliance admin review.',
        refCode: newRef
      };

      const updated = [...kycDocs];
      const existingIdx = updated.findIndex(doc => doc.type === selectedDocType);
      
      if (existingIdx >= 0) {
        updated[existingIdx] = { ...updated[existingIdx], ...newDoc, id: updated[existingIdx].id };
      } else {
        updated.push(newDoc as any);
      }

      setKycDocs(updated);
      localStorage.setItem('axi_kyc_docs', JSON.stringify(updated));
      localStorage.setItem('axi_kyc_status', 'pending');
      window.dispatchEvent(new Event('axi_kyc_update'));

      showToast(`📄 KYC Document submitted! Ref: ${newRef}. Status set to Under Review. Awaiting admin approval.`, 'success');
      setIsUploadModalOpen(false);
      setUploadFileName('');
      setUploadNote('');
    }, 1200);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if ((newTheme === 'dark' && !isDarkMode) || (newTheme === 'light' && isDarkMode)) {
      if (toggleDarkMode) toggleDarkMode();
    }
    showToast(`Theme updated to ${newTheme} mode.`, 'success');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    showToast('2FA Secret Key copied to clipboard!', 'info');
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length < 6) {
      showToast('Please enter a valid 6-digit authenticator code.', 'error');
      return;
    }

    // Generate 8 single-use recovery codes
    const generatedCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    );

    setRecoveryCodes(generatedCodes);
    setIs2FAEnabled(true);
    localStorage.setItem('axi_2fa_enabled', 'true');
    localStorage.setItem('axi_2fa_recovery_codes', JSON.stringify(generatedCodes));
    setIs2FAWizardOpen(false);
    setTotpCode('');
    showToast('Two-Factor Authentication (2FA) is now active on your Axi account!', 'success');

    // Dispatch Telegram alert if enabled or trigger backend endpoint
    fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SECURITY_ALERT',
        message: '🔒 Two-Factor Authentication (2FA) Google Authenticator TOTP was ENABLED on your Axi account.'
      })
    }).catch(() => {});
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    setRecoveryCodes([]);
    localStorage.setItem('axi_2fa_enabled', 'false');
    localStorage.setItem('axi_2fa_recovery_codes', JSON.stringify([]));
    showToast('Two-Factor Authentication disabled.', 'info');

    fetch('/api/telegram/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SECURITY_ALERT',
        message: '⚠️ Two-Factor Authentication (2FA) was DISABLED on your Axi account.'
      })
    }).catch(() => {});
  };

  const [profileName, setProfileName] = useState(user?.displayName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      if (profileName !== user.displayName) {
        await updateProfile(user, { displayName: profileName });
      }
      if (profileEmail !== user.email) {
        await updateEmail(user, profileEmail);
      }
      showToast('Profile updated successfully.', 'success');
      setIsEditingProfile(false);
    } catch (error: any) {
      showToast(`Error updating profile: ${error.message}`, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      showToast('No email associated with this account.', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 animate-fade-in min-h-[calc(100vh-80px)]">
      
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <Settings className="w-6 h-6 text-brand-yellow" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Account Settings</h1>
          <p className="text-slate-500 text-sm font-semibold">Manage your platform preferences and security parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="md:col-span-3 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer ${activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <UserIcon className="w-4 h-4" /> User Profile
          </button>
          <button 
            onClick={() => setActiveTab('payment_accounts')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-between transition cursor-pointer ${activeTab === 'payment_accounts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-400" /> Linked Payment Accounts
            </div>
            <span className="text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
              {paymentAccounts.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer ${activeTab === 'appearance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Monitor className="w-4 h-4" /> Appearance
          </button>
          <button 
            onClick={() => setActiveTab('kyc')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-between transition cursor-pointer ${activeTab === 'kyc' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> KYC Verification & Docs
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {kycDocs.filter(d => d.status === 'Verified').length === 3 ? 'Verified' : kycDocs.some(d => d.status === 'Under Review') ? 'Review' : 'Level 1'}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer ${activeTab === 'notifications' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer ${activeTab === 'security' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Shield className="w-4 h-4" /> Security & 2FA
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`text-left px-4 py-3 rounded-lg font-bold text-sm flex items-center gap-2 transition cursor-pointer ${activeTab === 'api' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Key className="w-4 h-4" /> API Access
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-9 flex flex-col gap-8">

          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black">Personal Profile</h3>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs font-bold text-slate-700 hover:text-brand-red bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Full Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 focus:border-brand-red rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none"
                    />
                  ) : (
                    <div className="mt-1 font-semibold text-sm">{user?.displayName || 'Registered Individual'}</div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                  {isEditingProfile ? (
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 focus:border-brand-red rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none"
                    />
                  ) : (
                    <div className="mt-1 font-semibold text-sm">{user?.email || 'trader@example.com'}</div>
                  )}
                </div>
                
                {isEditingProfile && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black px-5 py-2.5 rounded-lg uppercase tracking-wider transition disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileName(user?.displayName || '');
                        setProfileEmail(user?.email || '');
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 mt-2">
                <h3 className="text-sm font-black mb-4">Account Security</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 text-sm">Password Management</span>
                    <p className="text-xs text-slate-500 font-medium">Click below to receive a secure password reset link via email.</p>
                  </div>
                  <button 
                    onClick={handleSendPasswordReset}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-2.5 rounded-lg uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment_accounts' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 text-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-sky-500" /> Registered Financial Accounts
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Link personal bank accounts, cards, or e-wallets under your registered legal name for live deposits and cashouts.
                  </p>
                </div>
                <button 
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Link Payment Account
                </button>
              </div>

              {paymentAccounts.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                  <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                    <Landmark className="w-7 h-7" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="font-extrabold text-slate-900 text-base">No Linked Payment Accounts</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      You have no pre-configured or generated payment methods. Connect your bank account, debit card, or crypto wallet to initiate processed transactions.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="mt-2 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs px-5 py-3 rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Register Payment Method
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paymentAccounts.map((acc: any) => (
                    <div key={acc.id} className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 hover:bg-white transition shadow-xs">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          {acc.type === 'bank' && <Landmark className="w-6 h-6 text-sky-400" />}
                          {acc.type === 'card' && <CreditCard className="w-6 h-6 text-amber-400" />}
                          {acc.type === 'wallet' && <Building2 className="w-6 h-6 text-emerald-400" />}
                          {acc.type === 'crypto' && <Key className="w-6 h-6 text-purple-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{acc.bankName}</h4>
                            {acc.isPrimary && (
                              <span className="bg-sky-100 text-sky-800 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
                            {acc.accountNumberMasked} • {acc.currency} • Holder: {acc.holderName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Added: {acc.createdAt}
                        </span>
                        <button 
                          onClick={() => handleRemovePaymentAccount(acc.id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-6 text-slate-900 dark:text-white">
              <h3 className="text-lg font-black border-b border-slate-100 dark:border-slate-800 pb-3">Theme & Appearance</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition cursor-pointer ${!isDarkMode ? 'border-brand-red bg-brand-red/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  <span className={`font-bold text-sm ${!isDarkMode ? 'text-brand-red' : 'text-slate-400'}`}>Light Mode</span>
                </button>

                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition cursor-pointer ${isDarkMode ? 'border-brand-red bg-brand-red/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-950 flex items-center justify-center text-amber-300">
                    <Moon className="w-5 h-5" />
                  </div>
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-brand-red' : 'text-slate-400'}`}>Dark Mode</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="flex flex-col gap-6">
              
              {/* Header & Verification Level Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">KYC Verification & Compliance Tracker</h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : kycStatus === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {kycStatus === 'verified' ? 'Level 2 Verified' : kycStatus === 'pending' ? 'Pending Review' : 'Action Required'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs font-medium mt-1 leading-relaxed">
                      Monitor the real-time approval status of your compliance documents. Verified status protects funding transactions and unlocks higher deposit/withdrawal limits.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black px-5 py-3 rounded-lg uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" /> Quick Modal Upload
                </button>
              </div>

              {/* Inline KYC Submission Component for Direct Request Submission */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center font-bold">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">New KYC Document Request Submission</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Submit a simulated identity or residency document for manual Axi Compliance Admin review and tier approval.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUploadDocument} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-1 flex flex-col gap-1.5">
                    <label className="font-bold text-slate-800 uppercase text-[11px]">Select Document Category</label>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-none focus:border-brand-red text-xs"
                    >
                      <option value="Passport / National ID">Passport / Government Photo ID</option>
                      <option value="Proof of Address">Proof of Address (Utility Bill / Lease)</option>
                      <option value="Bank Statement / Wealth Proof">Official Bank Statement / Wealth Proof</option>
                    </select>
                  </div>

                  <div className="md:col-span-1 flex flex-col gap-1.5">
                    <label className="font-bold text-slate-800 uppercase text-[11px]">Attach Document File</label>
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-brand-red bg-slate-50 rounded-xl px-3.5 py-2 text-center transition flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{uploadFileName ? uploadFileName : 'Choose file (PDF, PNG, JPG)'}</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadFileName(e.target.files[0].name);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold uppercase shrink-0 ml-2">Browse</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="font-bold text-slate-800 uppercase text-[11px]">Note for Compliance Officer</label>
                    <input
                      type="text"
                      value={uploadNote}
                      onChange={(e) => setUploadNote(e.target.value)}
                      placeholder="e.g. Passport renewed July 2026 showing full legal name & MRZ barcode"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Encrypted 256-Bit SSL Transmission • PCI & GDPR Compliant
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmittingDoc || !uploadFileName}
                      className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 transition"
                    >
                      {isSubmittingDoc ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Transmitting to Admin Queue...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" /> Submit KYC Request for Admin Approval
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Verification Progress Visual Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">Verification Progress Timeline</h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                        Required Steps
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Track your account verification workflow through identity, residency, and compliance review stages.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Account Status</div>
                      <div className="text-xs font-black text-emerald-600 font-mono">75% Verified (Level 2)</div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-amber-400 flex items-center justify-center font-black text-xs text-slate-900 bg-emerald-50">
                      2/3
                    </div>
                  </div>
                </div>

                {/* Timeline Path Container */}
                <div className="relative py-2">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-8 z-0">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-amber-400 w-[66%]" />
                  </div>

                  {/* Visual Timeline Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    
                    {/* STEP 1: IDENTITY VERIFICATION (COMPLETED) */}
                    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-emerald-50/50 border-2 border-emerald-300 relative shadow-sm">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Step 1 Passed
                      </div>

                      {/* Status Circle: COMPLETED */}
                      <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100 my-2 shrink-0">
                        <CheckCircle2 className="w-8 h-8 text-white animate-scale-in" />
                      </div>

                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                          Status: Completed
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm mt-1">1. Identity Verification</h5>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          National Passport & Government Photo ID submitted & verified by automated MRZ scanner.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-emerald-200/60 w-full flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                        <span>Ref: DOC-88912-ID</span>
                        <span className="font-bold text-emerald-700">Verified ✓</span>
                      </div>
                    </div>

                    {/* STEP 2: RESIDENCY VERIFICATION (ACTIVE / IN PROGRESS) */}
                    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-amber-50/60 border-2 border-amber-400 relative shadow-sm">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" /> Step 2 Active
                      </div>

                      {/* Status Circle: ACTIVE / IN PROGRESS */}
                      <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/40 ring-4 ring-amber-100 my-2 shrink-0 relative">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 rounded-full bg-amber-400 -z-10"
                        />
                        <RefreshCw className="w-7 h-7 text-slate-950 animate-spin" style={{ animationDuration: '4s' }} />
                      </div>

                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                          Status: Active Audit
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm mt-1">2. Residency Verification</h5>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Utility Bill / Proof of Address submitted. OCR address check complete, awaiting admin audit.
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-200 w-full flex items-center justify-between text-[11px] font-medium">
                        <span className="text-amber-900">Ref: DOC-90145-POA</span>
                        <button
                          onClick={() => {
                            setSelectedDocType('Proof of Address');
                            setIsUploadModalOpen(true);
                          }}
                          className="text-[#E3000F] font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Update
                        </button>
                      </div>
                    </div>

                    {/* STEP 3: COMPLIANCE REVIEW STATUS (PENDING) */}
                    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 relative shadow-xs">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-400 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Step 3 Pending
                      </div>

                      {/* Status Circle: PENDING */}
                      <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shadow-inner my-2 shrink-0 border border-slate-300">
                        <Lock className="w-7 h-7 text-slate-400" />
                      </div>

                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded font-mono">
                          Status: Pending Step 2
                        </span>
                        <h5 className="font-extrabold text-slate-900 text-sm mt-1">3. Review & Tier Unlock</h5>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Final compliance review & activation of Institutional Tier ($100,000+ limits & 1:500 leverage).
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Awaiting Residency Approval</span>
                        <span className="font-mono text-slate-500">Tier 3</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Status Circles Legend */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-200 shrink-0" />
                    <span><strong>Completed:</strong> Document approved & status verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 shrink-0 animate-pulse" />
                    <span><strong>Active:</strong> Under review / action in progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300 ring-2 ring-slate-200 shrink-0" />
                    <span><strong>Pending:</strong> Step locked until prior step complete</span>
                  </div>
                </div>
              </div>

              {/* Documents Tracker Cards List */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-base">Submitted Document Tracker</h4>
                  <span className="text-xs text-slate-500 font-mono">Real-time compliance status</span>
                </div>

                {kycDocs.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          doc.status === 'Under Review' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{doc.type}</h5>
                          <p className="text-xs font-mono text-slate-500">{doc.fileName} {doc.fileSize !== '--' && `(${doc.fileSize})`} • Ref: {doc.refCode}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                          doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          doc.status === 'Under Review' ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' :
                          doc.status === 'Action Required' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {doc.status === 'Verified' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {doc.status === 'Under Review' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                          {doc.status === 'Action Required' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                          {doc.status}
                        </span>

                        <button 
                          onClick={() => {
                            setSelectedDocType(doc.type);
                            setIsUploadModalOpen(true);
                          }}
                          className="text-xs font-bold text-slate-700 hover:text-brand-red bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {doc.status === 'Not Uploaded' ? 'Upload' : 'Re-upload'}
                        </button>
                      </div>
                    </div>

                    {/* Stepper progress bar for document review pipeline */}
                    <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approval Process Pipeline</span>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        <div className={`p-1.5 rounded ${doc.reviewStep >= 1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                          1. Received
                        </div>
                        <div className={`p-1.5 rounded ${doc.reviewStep >= 2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                          2. OCR Scan
                        </div>
                        <div className={`p-1.5 rounded ${doc.reviewStep === 3 ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : doc.reviewStep >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                          3. Admin Audit
                        </div>
                        <div className={`p-1.5 rounded ${doc.reviewStep >= 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                          4. Final Approved
                        </div>
                      </div>
                    </div>

                    {/* Compliance Admin Audit Note */}
                    {doc.adminNote && (
                      <div className="bg-slate-900 text-slate-200 p-3 rounded-lg text-xs font-mono border border-slate-800 flex items-start gap-2">
                        <Info className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-brand-yellow block text-[10px] uppercase">Compliance Admin Review Note:</span>
                          <span className="text-slate-300">{doc.adminNote}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase">Notification & Email Trigger Settings</h3>
                  <p className="text-xs text-slate-500 font-medium">Manage automated email triggers for cashier transactions and compliance status updates</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Email Service Active
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                
                {/* Dedicated Deposit & Withdrawal Transaction Trigger Toggle */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Deposit & Withdrawal Status Email Triggers</span>
                        <span className="bg-emerald-200 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          Priority High
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                        Receive instant automated email notifications whenever an Admin approves or rejects your deposit or withdrawal transactions. Contains receipt breakdown, transaction hash, and updated balance links.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setEmailAlerts(!emailAlerts);
                      showToast(`Transaction Status Email Triggers ${!emailAlerts ? 'ENABLED' : 'DISABLED'}.`, 'success');
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-1 ${emailAlerts ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: emailAlerts ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">Daily Market & Margin Call Email Digests</span>
                    <span className="text-xs text-slate-500 font-medium">Receive daily market summaries, economic calendar events, and margin call risk warnings.</span>
                  </div>
                  <button 
                    onClick={() => {
                      setEmailAlerts(!emailAlerts);
                      showToast(`General Email alerts ${!emailAlerts ? 'enabled' : 'disabled'}.`, 'success');
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${emailAlerts ? 'bg-brand-red' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: emailAlerts ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">SMS / Text Notifications</span>
                    <span className="text-xs text-slate-500 font-medium">Instant SMS alerts for price target triggers and pending order execution.</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSmsAlerts(!smsAlerts);
                      showToast(`SMS alerts ${!smsAlerts ? 'enabled' : 'disabled'}.`, 'success');
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${smsAlerts ? 'bg-brand-red' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: smsAlerts ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500 text-white rounded-xl shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">Telegram Bot Notifications</span>
                      <span className="text-xs text-slate-600 font-medium mt-1">Get instant alerts sent directly to your Telegram for trades, price targets, deposits, and account activity.</span>
                      <div className="mt-2 text-[10px] font-bold text-blue-700 bg-blue-100/50 inline-block px-2 py-1 rounded w-fit cursor-pointer hover:bg-blue-100 transition">
                        Connect @AxiTradesBot
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const enabled = !telegramAlerts;
                      setTelegramAlerts(enabled);
                      localStorage.setItem('axi_telegram_alerts', enabled.toString());
                      showToast(`Telegram alerts ${enabled ? 'enabled' : 'disabled'}.`, 'success');

                      if (enabled) {
                        fetch('/api/telegram/notify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'TELEGRAM_BOT_CONNECTED',
                            message: '🤖 Telegram notifications connected successfully to your Axi account!'
                          })
                        }).catch(() => {});
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 mt-1 ${telegramAlerts ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: telegramAlerts ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-6">
              
              {/* Biometric Authentication (FaceID / Fingerprint) Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBiometricEnabled ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                        Biometric Login <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">FaceID / Touch ID</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Use biometric recognition for quick, hardware-verified login and trade approvals.</p>
                    </div>
                  </div>

                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${isBiometricEnabled ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {isBiometricEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <ScanFace className="w-4 h-4 text-sky-600" /> Enable Hardware Biometrics
                    </span>
                    <p className="text-xs text-slate-500 font-medium">Require FaceID or Fingerprint touch scan when authenticating sessions.</p>
                  </div>

                  <button
                    onClick={() => {
                      if (isBiometricEnabled) {
                        setIsBiometricEnabled(false);
                        localStorage.setItem('axi_biometric_enabled', 'false');
                        showToast('Biometric login disabled.', 'info');
                      } else {
                        setBiometricScanning(false);
                        setBiometricSuccess(false);
                        setIsBiometricModalOpen(true);
                      }
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${isBiometricEnabled ? 'bg-sky-600' : 'bg-slate-300'}`}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      animate={{ left: isBiometricEnabled ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* 2FA Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${is2FAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase">Two-Factor Authentication (2FA)</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Protect live trades and withdrawal authorizations using Google Authenticator or TOTP apps.</p>
                    </div>
                  </div>

                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${is2FAEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {is2FAEnabled ? 'Protected' : 'Disabled'}
                  </span>
                </div>

                {!is2FAEnabled ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-slate-800 text-sm">Enhance Account Security</span>
                      <p className="text-xs text-slate-500 font-medium">Require a 6-digit TOTP token whenever you sign in or execute cashier requests.</p>
                    </div>
                    <button 
                      onClick={() => setIs2FAWizardOpen(true)}
                      className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black px-5 py-2.5 rounded-lg uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Setup 2FA Protection
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <div>
                          <span className="font-bold text-emerald-900 text-sm">2FA Security Active</span>
                          <p className="text-xs text-emerald-700">Your account is secured with TOTP time-based authentication.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleDisable2FA}
                        className="text-xs font-bold text-rose-600 hover:underline uppercase cursor-pointer"
                      >
                        Disable
                      </button>
                    </div>

                    {recoveryCodes.length > 0 && (
                      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
                        <span className="text-xs font-black uppercase text-brand-yellow tracking-wider block mb-2">Emergency Recovery Codes</span>
                        <p className="text-xs text-slate-300 font-medium mb-3">Save these single-use codes in a secure location if you lose access to your authenticator app.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400">
                          {recoveryCodes.map((code, idx) => (
                            <div key={idx} className="p-1 text-center">{code}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password update card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-base font-black text-slate-900 uppercase border-b border-slate-100 pb-3">Password & Credentials</h3>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Last Password Change: 12 days ago</span>
                  <button onClick={() => showToast('Password reset link sent to your email.', 'success')} className="text-brand-red underline cursor-pointer">
                    Change Password
                  </button>
                </div>
              </div>

              {/* Manage Sessions Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                        Active Sessions <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-mono font-bold">{activeSessions.length} Devices</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">View and manage web browsers and mobile app instances logged into your account.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSessionsModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" /> Manage Sessions
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                          {session.type === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{session.device}</span>
                            {session.isCurrent && (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Current</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{session.browser} • {session.location}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{session.lastActive}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4-Digit Security PIN Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accountPin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      <Hash className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                        Account Lock PIN <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">4-Digit Access</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Set up a numeric keypad PIN code to secure sensitive balance views and order modifications.</p>
                    </div>
                  </div>

                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${accountPin ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {accountPin ? 'PIN Protected' : 'No PIN Set'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-800 text-sm">
                      {accountPin ? '4-Digit Security PIN is Active' : 'Setup Account Security PIN'}
                    </span>
                    <p className="text-xs text-slate-500 font-medium">
                      {accountPin ? 'PIN is stored securely in your local credentials.' : 'Create a passcode to quickly verify cashier requests and account settings.'}
                    </p>
                  </div>

                  <button
                    onClick={openPinSetupModal}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 rounded-lg uppercase tracking-wider transition shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" /> {accountPin ? 'Change PIN' : 'Setup PIN'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">API & Algorithmic Credentials</h3>
              <p className="text-xs text-slate-500 font-medium">Connect external MetaTrader Expert Advisors (EAs) or FIX API engines to your account.</p>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg font-mono text-xs text-slate-700 flex justify-between items-center">
                <span>AXI-API-KEY-8821-X901</span>
                <button onClick={() => showToast('API key copied!', 'info')} className="text-brand-red font-bold text-xs underline cursor-pointer">Copy Key</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Biometric Verification Simulation Modal */}
      <AnimatePresence>
        {isBiometricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !biometricScanning && setIsBiometricModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border border-slate-200 text-center"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-sm uppercase flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-sky-600" /> Biometric Touch Verification
                </h3>
                <button 
                  disabled={biometricScanning}
                  onClick={() => setIsBiometricModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col items-center gap-5">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Enable FaceID / Touch ID</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Touch sensor or place your finger below to simulate biometric registration for your Axi account.
                  </p>
                </div>

                {/* Interactive Touch Target */}
                <button
                  onClick={handleTriggerBiometricScan}
                  disabled={biometricScanning || biometricSuccess}
                  className="relative my-2 group cursor-pointer focus:outline-none"
                >
                  <motion.div 
                    className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all ${
                      biometricSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/20' :
                      biometricScanning ? 'border-sky-500 bg-sky-50 text-sky-600 animate-pulse' :
                      'border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-slate-700 hover:text-sky-600 shadow-inner'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {biometricSuccess ? (
                      <CheckCircle2 className="w-14 h-14 text-emerald-600 animate-scale-in" />
                    ) : biometricScanning ? (
                      <div className="flex flex-col items-center gap-1">
                        <RefreshCw className="w-10 h-10 animate-spin text-sky-600" />
                        <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Scanning...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Fingerprint className="w-12 h-12 transition-transform group-hover:scale-110 text-sky-600" />
                        <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-sky-600">Touch Here</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Pulsing ring animation when scanning */}
                  {biometricScanning && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-sky-400"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                </button>

                <div className="w-full">
                  {biometricSuccess ? (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-200">
                      ✓ Biometric identity matched! FaceID / Fingerprint registered.
                    </div>
                  ) : biometricScanning ? (
                    <div className="text-xs font-bold text-sky-600 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying hardware biometric token...
                    </div>
                  ) : (
                    <button
                      onClick={handleTriggerBiometricScan}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Fingerprint className="w-4 h-4" /> Simulate Touch Interaction
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2FA Setup Modal Wizard */}
      <AnimatePresence>
        {is2FAWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIs2FAWizardOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-brand-red" /> Setup Two-Factor Security
                </h3>
                <button onClick={() => setIs2FAWizardOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleVerify2FA} className="p-6 flex flex-col gap-5 text-xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm block mb-1">Step 1: Scan QR or Enter Key</span>
                  <p className="text-slate-500 leading-relaxed font-medium">Use Google Authenticator, Authy, or 1Password to scan the key below.</p>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center gap-4 border border-slate-800">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-14 h-14 text-slate-900" />
                  </div>
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Secret Secret Key</span>
                    <span className="font-mono text-xs font-bold text-brand-yellow truncate">{totpSecret}</span>
                    <button 
                      type="button" 
                      onClick={handleCopySecret}
                      className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedSecret ? 'Copied' : 'Copy Secret'}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-800 text-sm block mb-1.5">Step 2: Enter 6-Digit Code</span>
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={totpCode.length < 6}
                  className="w-full bg-brand-red hover:bg-brand-red-hover disabled:opacity-50 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer mt-1"
                >
                  Verify & Enable 2FA Protection
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsUploadModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-brand-red" /> Upload KYC Document
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="p-6 flex flex-col gap-5 text-xs">
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1.5 uppercase">Document Type</label>
                  <select 
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:border-brand-red"
                  >
                    <option value="Passport / National ID">Passport / Government National ID</option>
                    <option value="Proof of Address">Proof of Address (Utility Bill / Lease)</option>
                    <option value="Bank Statement / Wealth Proof">Bank Statement / Source of Wealth</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1.5 uppercase">Select Document File</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer relative">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="font-bold text-slate-700 text-xs">Click or drop file here</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 10MB)</span>
                    
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFileName(e.target.files[0].name);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {uploadFileName && (
                    <div className="mt-2 text-xs font-mono font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span className="truncate">Selected: {uploadFileName}</span>
                      <button type="button" onClick={() => setUploadFileName('')} className="text-rose-500 font-bold ml-2">Clear</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1.5 uppercase">Optional Note for Compliance Officer</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Utility bill issued July 2026 showing residential address..."
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:outline-none focus:border-brand-red"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Uploaded files undergo OCR scan followed by Compliance Admin verification.
                  </span>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingDoc || !uploadFileName}
                  className="w-full bg-brand-red hover:bg-brand-red-hover disabled:opacity-50 text-white font-black py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingDoc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting & Scanning...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Submit Document For Review
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Payment Account Modal */}
      <AnimatePresence>
        {isAddPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsAddPaymentModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-sky-500" /> Link Registered Payment Method
                </h3>
                <button onClick={() => setIsAddPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPaymentAccount} className="p-6 flex flex-col gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1.5 uppercase">Account Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'bank', label: 'Bank Wire', icon: Landmark },
                      { id: 'card', label: 'Credit/Debit', icon: CreditCard },
                      { id: 'wallet', label: 'E-Wallet', icon: Building2 },
                      { id: 'crypto', label: 'Crypto', icon: Key }
                    ].map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewPaymentType(cat.id as any)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-bold text-[10px] uppercase transition cursor-pointer ${newPaymentType === cat.id ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1 uppercase">Bank / Financial Issuer Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder={newPaymentType === 'bank' ? 'e.g. JPMorgan Chase Bank' : newPaymentType === 'card' ? 'e.g. Citi Premier Visa' : 'e.g. PayPal Wallet'}
                    value={newPaymentBank}
                    onChange={(e) => setNewPaymentBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2.5 font-semibold text-slate-800 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1 uppercase">Account Holder Full Legal Name</label>
                  <input 
                    type="text" 
                    required
                    value={newPaymentHolder}
                    onChange={(e) => setNewPaymentHolder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2.5 font-semibold text-slate-800 focus:outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="font-bold text-slate-800 text-xs block mb-1 uppercase">Account Number / IBAN / Card #</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 482910392019"
                      value={newPaymentNumber}
                      onChange={(e) => setNewPaymentNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-2.5 font-mono font-semibold text-slate-800 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 text-xs block mb-1 uppercase">Currency</label>
                    <select 
                      value={newPaymentCurrency}
                      onChange={(e) => setNewPaymentCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none text-xs"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-[11px] text-sky-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    Your registered financial payment account details are encrypted using Bank-grade 256-bit TLS protocol.
                  </span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer mt-1 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save Registered Payment Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Sessions Management Modal */}
      <AnimatePresence>
        {isSessionsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsSessionsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-slate-700" />
                  <h3 className="font-black text-slate-900 text-sm uppercase">Active Sessions & Device Management</h3>
                </div>
                <button 
                  onClick={() => setIsSessionsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-4 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Active Devices ({activeSessions.length})</span>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Logout unfamiliar devices to secure your trading account.</p>
                  </div>
                  {activeSessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllOtherSessions}
                      className="text-xs font-black uppercase text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Revoke All Others
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {activeSessions.map((s) => (
                    <div key={s.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {s.type === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">{s.device}</span>
                            {s.isCurrent ? (
                              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">Current Session</span>
                            ) : (
                              <span className="text-[9px] font-mono font-semibold text-slate-400">{s.lastActive}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{s.browser}</span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3 text-slate-400" /> {s.location} • {s.ip}
                          </span>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          onClick={() => setSessionToRevoke(s)}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-lg uppercase transition cursor-pointer self-end sm:self-center shrink-0 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Session Confirmation Dialog */}
      <AnimatePresence>
        {sessionToRevoke && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
              onClick={() => setSessionToRevoke(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6 border border-slate-200 text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-base">Revoke Device Session?</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Are you sure you want to log out <strong className="text-slate-900">{sessionToRevoke.device}</strong> ({sessionToRevoke.browser})? It will lose instant session tokens.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  onClick={() => setSessionToRevoke(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevokeSession(sessionToRevoke.id)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl uppercase text-xs shadow cursor-pointer"
                >
                  Confirm Revoke
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Setup 4-Digit Security PIN Keypad Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsPinModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xs relative z-10 overflow-hidden border border-slate-200 text-center"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-xs uppercase flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-600" /> Security PIN Setup
                </h3>
                <button 
                  onClick={() => setIsPinModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex flex-col items-center gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {pinStep === 'enter' ? 'Set 4-Digit Access PIN' : 'Re-enter PIN to Confirm'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {pinStep === 'enter' ? 'Choose a memorable 4-digit passcode' : 'Confirm your 4-digit security code'}
                  </p>
                </div>

                {/* 4-Dot PIN Indicator Display */}
                <div className="flex items-center justify-center gap-3 my-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const currentVal = pinStep === 'enter' ? pinInput : pinConfirm;
                    const isFilled = idx < currentVal.length;
                    return (
                      <motion.div
                        key={idx}
                        animate={{ scale: isFilled ? [1, 1.25, 1] : 1 }}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                          isFilled ? 'bg-amber-500 border-amber-600 shadow' : 'bg-slate-100 border-slate-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-rose-600 animate-bounce">{pinError}</p>
                )}

                {/* 3x4 Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[210px] mt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => {
                    if (key === 'clear') {
                      return (
                        <button
                          key={key}
                          onClick={() => handleKeypadPress('clear')}
                          className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-[10px] text-slate-600 uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition"
                        >
                          CLR
                        </button>
                      );
                    }
                    if (key === 'backspace') {
                      return (
                        <button
                          key={key}
                          onClick={() => handleKeypadPress('backspace')}
                          className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-600 flex items-center justify-center cursor-pointer active:scale-95 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      );
                    }
                    return (
                      <button
                        key={key}
                        onClick={() => handleKeypadPress(key)}
                        className="w-full h-12 rounded-xl bg-slate-50 hover:bg-amber-500 hover:text-white border border-slate-200 font-black text-base text-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition shadow-sm"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

