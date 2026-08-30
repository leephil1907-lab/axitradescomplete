import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  RefreshCcw, 
  FileText, 
  Award,
  Wallet,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  Mail,
  Globe,
  MapPin,
  Building2,
  Briefcase,
  PiggyBank,
  ArrowRight,
  Info,
  Maximize2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ACCOUNT_TYPES } from '../data';
import CountrySelect from './CountrySelect';

interface AccountsViewProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openSignUp: () => void;
  signUpStep: number;
  setSignUpStep: React.Dispatch<React.SetStateAction<number>>;
  setView?: (view: any) => void;
  user?: any;
  balance?: number;
  liveBalance?: number;
}

export default function AccountsView({ 
  showToast, 
  openSignUp, 
  signUpStep, 
  setSignUpStep, 
  setView,
  user,
  balance = 0,
  liveBalance = 0
}: AccountsViewProps) {
  const [selectedSubPlatform, setSelectedSubPlatform] = useState<'MT5' | 'MT4'>('MT5');
  const [selectedSubTier, setSelectedSubTier] = useState<'Standard' | 'Pro'>('Standard');
  const [isCreatingSubAccount, setIsCreatingSubAccount] = useState(false);
  const [subAccountsList, setSubAccountsList] = useState<any[]>([]);

  const handleCreateSubAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSubAccount(false);
    showToast('Sub-account request recorded. A broker-side account must be provisioned before credentials are issued.', 'info');
  };

  // If user is already logged in, show their Axi Account Management Hub
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E61C3F] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Client Profile</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                Axi Trading Accounts
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage your live trading accounts, create MT4/MT5 sub-accounts, and launch the WebTrader terminal.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setView && setView('dashboard')}
                className="bg-[#FFCC00] hover:bg-[#E6B800] text-slate-950 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <span>Launch Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setView && setView('funds')}
                className="bg-[#E61C3F] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Deposit Funds</span>
              </button>
            </div>
          </div>

          {/* Accounts List Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Active Trading Accounts ({subAccountsList.length})
              </h3>

              <button
                type="button"
                onClick={() => setIsCreatingSubAccount(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Additional Sub-Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {subAccountsList.map((acc) => (
                <div 
                  key={acc.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#E61C3F]/40 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Account No.</span>
                        <div className="font-mono font-black text-slate-900 text-base">#{acc.id}</div>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        acc.type === 'Live' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        acc.type === 'Funded' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {acc.tier}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Platform:</span>
                        <span className="font-bold text-slate-900">{acc.platform} STP</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Server Host:</span>
                        <span className="font-mono text-slate-700 font-bold">{acc.server}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Leverage:</span>
                        <span className="font-mono text-slate-700 font-bold">{acc.leverage}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Currency:</span>
                        <span className="font-mono text-slate-700 font-bold">{acc.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Available Balance</div>
                    <div className="font-mono font-black text-xl text-slate-950 mt-0.5">
                      ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setView && setView('dashboard')}
                        className="bg-[#FFCC00] hover:bg-[#E6B800] text-slate-950 text-xs font-black uppercase py-2 rounded-xl transition cursor-pointer text-center"
                      >
                        Trade
                      </button>
                      <button
                        type="button"
                        onClick={() => setView && setView('funds')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase py-2 rounded-xl transition cursor-pointer text-center border border-slate-200"
                      >
                        Fund
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Sub-Account Modal */}
          {isCreatingSubAccount && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Open Additional Sub-Account
                  </h3>
                  <button onClick={() => setIsCreatingSubAccount(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubAccount} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Trading Platform:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['MT5', 'MT4'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedSubPlatform(p)}
                          className={`py-2.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer border ${
                            selectedSubPlatform === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          MetaTrader {p === 'MT5' ? '5' : '4'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Account Pricing Tier:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Standard', 'Pro'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedSubTier(t)}
                          className={`py-2.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer border ${
                            selectedSubTier === t ? 'bg-[#E61C3F] text-white border-[#E61C3F]' : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {t} ECN
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Base Currency:</span>
                      <strong className="text-slate-900 font-mono">USD ($)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Default Leverage:</span>
                      <strong className="text-slate-900 font-mono">1:500 (STP)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Server:</span>
                      <strong className="text-slate-900 font-mono">AxiCorp-Live</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingSubAccount(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#E61C3F] hover:bg-red-700 text-white font-black py-3 rounded-xl text-xs uppercase cursor-pointer shadow-md"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Account Tier Comparison Below */}
          <div className="w-full text-center pt-8 border-t border-slate-200">
            <div className="mb-6">
              <span className="text-[#E61C3F] text-xs font-black tracking-widest uppercase bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full">
                Account Parameters
              </span>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2.5">
                Axi STP Liquidity Feed Comparison
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {ACCOUNT_TYPES.map((tier) => (
                <div 
                  key={tier.name}
                  className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between bg-white text-left shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <h4 className="text-sm font-black text-slate-950 uppercase">{tier.name}</h4>
                      <span className="text-[9px] font-black text-[#E61C3F] bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">
                        {tier.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mb-4">
                      {tier.description}
                    </p>

                    <div className="flex flex-col gap-2.5 text-[10px] font-bold text-slate-500 mb-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span>Spreads from</span>
                        <span className="text-slate-850 font-black font-mono">{tier.spreadsFrom}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span>Commission</span>
                        <span className="text-slate-850 font-black font-mono">{tier.commission}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span>Max Leverage</span>
                        <span className="text-slate-850 font-black font-mono">{tier.maxLeverage}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span>Min Deposit</span>
                        <span className="text-slate-850 font-black font-mono">{tier.minDeposit}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubTier(tier.name.includes('Pro') ? 'Pro' : 'Standard');
                      setIsCreatingSubAccount(true);
                    }}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  >
                    Open {tier.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }
  // Master Onboarding Wizard Steps:
  // 0: Welcome greeting
  // 1: Interest checklist
  // 2: Country selection
  // 3: Email & password credential signup
  // 4: 2FA Selection (Keep Safe)
  // 5: 2FA Google Authenticator setup
  // 6: Personal details (Name & Title)
  // 7: Date of Birth (cont.)
  // 8: Residential Address
  // 9: Employment status
  // 10: Finances
  // 11: Source of Funds
  // 12: Set-up Account (Platform MT4/MT5, Tier, Axi Select toggle)
  // 13: Password for trading account
  // 14: Leverage and currency configuration
  // 15: Success explore platform
  // 16: Live Generated ECN credentials output screen
  
  const [wizardStep, setWizardStep] = useState<number>(0);

  // Synchronize master application triggers (e.g. Header Open Account click)
  React.useEffect(() => {
    if (signUpStep === 1) {
      setWizardStep(1); // Jump to interest checklist step immediately
      setSignUpStep(0); // Reset master trigger so it can fire again
    }
  }, [signUpStep, setSignUpStep]);
  
  // Registration and wizard state
  const [formData, setFormData] = useState({
    country: '',
    email: '',
    password: '',
    consentPrivacy: false,
    consentPromo: false,
    authMethod: 'Pending server-side 2FA setup',
    authCode: '',
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    employment: '',
    avgIncome: '',
    savingsValue: '',
    sourceFunds: [] as string[],
    tradingPlatform: 'MT5', // 'MT5' or 'MT4'
    accountType: 'Standard', // 'Standard', 'Pro', 'USD Cent'
    joinAxiSelect: false,
    tradingPassword: '',
    currency: 'USD',
    leverage: '1:1000'
  });

  // Checklist of interests
  const [interests, setInterests] = useState<Record<string, boolean>>({
    'Copy Trading': false,
    'Crypto Perpetual Futures': false,
    'Automated strategies': false,
    'MT4/ MT5': false,
    'Axi Select': false,
    "I'm not sure yet": false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showTradingPassword, setShowTradingPassword] = useState(false);


  // State to generate secure live credentials
  const [generatedAccount, setGeneratedAccount] = useState<{
    loginId: number;
    server: string;
    passkey: string;
    tier: string;
    currency: string;
    platform: string;
    leverage: string;
  } | null>(null);

  // Helper validation for Password Requirements
  const passwordRules = {
    lengthMin: formData.password.length >= 8,
    lengthMax: formData.password.length <= 15 && formData.password.length > 0,
    hasLower: /[a-z]/.test(formData.password),
    hasUpper: /[A-Z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[#%@!$*&_+\-=]/.test(formData.password)
  };

  const tradingPasswordRules = {
    lengthMin: formData.tradingPassword.length >= 8,
    lengthMax: formData.tradingPassword.length <= 15 && formData.tradingPassword.length > 0,
    hasLower: /[a-z]/.test(formData.tradingPassword),
    hasUpper: /[A-Z]/.test(formData.tradingPassword),
    hasNumber: /[0-9]/.test(formData.tradingPassword),
    hasSpecial: /[#%@!$*&_+\-=]/.test(formData.tradingPassword)
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleInterest = (key: string) => {
    setInterests(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSourceFundsToggle = (val: string) => {
    setFormData(prev => {
      const current = [...prev.sourceFunds];
      if (current.includes(val)) {
        return { ...prev, sourceFunds: current.filter(x => x !== val) };
      } else {
        return { ...prev, sourceFunds: [...current, val] };
      }
    });
  };

  const validateAndNext = () => {
    // Custom validation logic per step
    if (wizardStep === 1) {
      // Interest survey
      const selectedCount = Object.values(interests).filter(Boolean).length;
      if (selectedCount === 0) {
        showToast('Please select at least one interest to proceed or click skip.', 'info');
        return;
      }
      setWizardStep(2);
    } 
    else if (wizardStep === 2) {
      // Country of residence modal
      if (!formData.country) {
        showToast('Please specify your country of residence.', 'error');
        return;
      }
      setWizardStep(3);
    } 
    else if (wizardStep === 3) {
      // Email and password sign-up credentials
      if (!formData.email || !formData.password) {
        showToast('Please provide your email address and password credentials.', 'error');
        return;
      }
      if (!formData.email.includes('@')) {
        showToast('Please provide a valid email structure.', 'error');
        return;
      }
      // Check password rules
      const isValid = Object.values(passwordRules).every(Boolean);
      if (!isValid) {
        showToast('Your password must fulfill all specified baseline safety requirements.', 'error');
        return;
      }
      if (!formData.consentPrivacy) {
        showToast('Consent to the GDPR Privacy Policy is mandatory.', 'error');
        return;
      }
      

      setWizardStep(4);
    } 
    else if (wizardStep === 5) {
      // Authenticator code setup verification
      if (!formData.authCode || formData.authCode.length < 4) {
        showToast('Please enter the 6-digit validation code from your authenticator application.', 'error');
        return;
      }
      showToast('Two-factor security profile successfully calibrated!', 'success');
      setWizardStep(6);
    } 
    else if (wizardStep === 6) {
      // Legal name
      if (!formData.title || !formData.firstName || !formData.lastName) {
        showToast('Please specify your title, first name, and last name.', 'error');
        return;
      }
      setWizardStep(7);
    } 
    else if (wizardStep === 7) {
      // DOB check (basic check)
      const day = parseInt(formData.dobDay);
      const month = parseInt(formData.dobMonth);
      const year = parseInt(formData.dobYear);
      if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 1920 || year > 2008) {
        showToast('Please specify a valid Date of Birth. Retail CFD accounts require ages 18 or above.', 'error');
        return;
      }
      setWizardStep(8);
    } 
    else if (wizardStep === 8) {
      // Residential Address
      if (!formData.addressLine1 || !formData.city) {
        showToast('Please specify your residential address line and city.', 'error');
        return;
      }
      setWizardStep(9);
    } 
    else if (wizardStep === 9) {
      // Employment
      if (!formData.employment) {
        showToast('Please select your current employment categorization status.', 'error');
        return;
      }
      setWizardStep(10);
    } 
    else if (wizardStep === 10) {
      // Finances
      if (!formData.avgIncome || !formData.savingsValue) {
        showToast('Please specify your approximate financial ranges.', 'error');
        return;
      }
      setWizardStep(11);
    } 
    else if (wizardStep === 11) {
      // Source of funds
      if (formData.sourceFunds.length === 0) {
        showToast('Please select at least one primary source of funding.', 'error');
        return;
      }
      setWizardStep(12);
    } 
    else if (wizardStep === 12) {
      // Trading Platform & Account Type
      setWizardStep(13);
    } 
    else if (wizardStep === 13) {
      // Trading Account Password setup
      if (!formData.tradingPassword) {
        showToast('Please configure a password for your terminal interface.', 'error');
        return;
      }
      const isValid = Object.values(tradingPasswordRules).every(Boolean);
      if (!isValid) {
        showToast('Terminal access code must satisfy all security parameters.', 'error');
        return;
      }
      setWizardStep(14);
    } 
    else if (wizardStep === 14) {
      // Final application step: create the real Firebase identity first.
      // Broker credentials are never fabricated in the browser; they must come from the broker/execution backend.
      try {
        const displayName = formData.firstName ? `${formData.firstName} ${formData.lastName}`.trim() : formData.email.split('@')[0];
        const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
        await updateProfile(userCred.user, { displayName });

        const newUserPayload = {
          id: userCred.user.uid,
          uid: userCred.user.uid,
          name: displayName,
          email: formData.email.trim().toLowerCase(),
          country: formData.country,
          status: 'Pending',
          verificationStatus: 'Pending',
          kycStatus: 'NOT_STARTED',
          balance: 0,
          liveBalance: 0,
          accountNo: '',
          accountType: `${formData.accountType} — awaiting broker provisioning`,
          tradingPlatform: formData.tradingPlatform,
          leverage: formData.leverage,
          currency: formData.currency,
          employment: formData.employment,
          avgIncome: formData.avgIncome,
          savingsValue: formData.savingsValue,
          sourceFunds: formData.sourceFunds,
          authMethod: formData.authMethod,
          registeredAt: new Date().toISOString()
        };

        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUserPayload)
        });
        if (!response.ok) throw new Error('The registration service did not accept the new account record.');

        setGeneratedAccount(null);
        showToast('Account registration completed. Your application is pending KYC/admin review; broker credentials will only appear after real provisioning.', 'success');
        setWizardStep(15);
      } catch (err: any) {
        showToast((err?.message || 'Unable to complete registration. Please try again.').replace('Firebase: ', ''), 'error');
      }
    }
  };

  // Skip step 1 interest survey
  const handleSkipInterests = () => {
    setWizardStep(2);
    showToast('Survey skipped. Redirecting to country residence checklist...', 'info');
  };

  // Reset helper
  const handleResetWizard = () => {
    setFormData({
      country: '',
      email: '',
      password: '',
      consentPrivacy: false,
      consentPromo: false,
      authMethod: 'Authenticator',
      authCode: '',
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      employment: '',
      avgIncome: '',
      savingsValue: '',
      sourceFunds: [],
      tradingPlatform: 'MT5',
      accountType: 'Standard',
      joinAxiSelect: false,
      tradingPassword: '',
      currency: 'USD',
      leverage: '1:1000'
    });
    setInterests({
      'Copy Trading': false,
      'Crypto Perpetual Futures': false,
      'Automated strategies': false,
      'MT4/ MT5': false,
      'Axi Select': true,
      "I'm not sure yet": false
    });
    setGeneratedAccount(null);
    setWizardStep(0);
  };

  const getProgressPercentage = () => {
    // Calculate progress as wizardStep goes from 0 to 15
    return Math.floor((wizardStep / 15) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col items-center justify-start py-8 px-4 relative overflow-hidden">
      
      {/* Absolute floating background shapes matching brand red/yellow/white colors */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Real-time brand red header progress bar */}
      {wizardStep > 0 && wizardStep < 15 && (
        <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-200 z-50">
          <motion.div 
            className="h-full bg-[#E61C3F]" 
            initial={{ width: '0%' }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>
      )}

      {/* Main interactive Wizard Card Container */}
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/80 shadow-xl relative overflow-hidden flex flex-col">
        
        {/* Onboarding top branding banner */}
        <div className="bg-white border-b border-slate-100 py-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-2xl tracking-tight text-[#E61C3F] flex items-center gap-1">
              axi <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded tracking-widest bg-slate-50">STP LIVE</span>
            </span>
          </div>
          {wizardStep > 0 && wizardStep < 15 && (
            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full tracking-wider">
              Step {wizardStep} of 14
            </span>
          )}
        </div>

        {/* Dynamic Screen View Controller via Framer Motion */}
        <div className="p-6 sm:p-8 flex-grow">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: WELCOME GREETING SCREEN */}
            {wizardStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center text-center py-6"
              >
                <div className="relative mb-6">
                  {/* Floating particles visual container */}
                  <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shadow-inner">
                    <Sparkles className="w-12 h-12 text-[#E61C3F]" />
                  </div>
                  <span className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-brand-yellow flex items-center justify-center text-[10px] text-brand-dark font-black shadow border border-white">★</span>
                </div>

                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase mb-3">
                  Welcome to Axi!
                </h1>
                
                <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-md leading-relaxed mb-8">
                  You've joined thousands of savvy traders with access to round-the-clock trading. Complete your application to start exploring the global markets.
                </p>

                <div className="w-full flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWizardStep(1)}
                    className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs sm:text-sm py-4 rounded-xl shadow-md uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Start Onboarding Application <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </motion.button>
                  
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Segregated Trust Accounts • FCA & ASIC Monitored
                  </span>
                </div>

                {/* Aesthetic image preview representing onboarding dashboard screen */}
                <div className="mt-8 border border-slate-150 rounded-xl p-3 w-full bg-slate-50/50 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">FCA Segregation Guaranteed</span>
                    <span className="text-[9px] text-slate-400 font-semibold">Tier-1 custodial banking protection in absolute secure isolation.</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: INTEREST SURVEY */}
            {wizardStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    What are you interested in?
                  </h2>
                  <p className="text-slate-400 text-[11px] font-semibold mt-1">
                    Select your trading goals so we can optimize your MetaTrader interface parameters.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 my-2">
                  {Object.keys(interests).map((key) => {
                    const isChecked = interests[key];
                    return (
                      <div
                        key={key}
                        onClick={() => toggleInterest(key)}
                        className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition shadow-xs ${
                          isChecked 
                            ? 'bg-red-50/30 border-[#E61C3F] ring-1 ring-[#E61C3F]' 
                            : 'bg-white border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{key}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked ? 'bg-[#E61C3F] border-[#E61C3F] text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSkipInterests}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: COUNTRY SELECTION MODAL */}
            {wizardStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6 text-left"
              >
                <div className="text-center py-2 flex flex-col items-center">
                  <Globe className="w-10 h-10 text-[#E61C3F] mb-2" />
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Create your account in minutes
                  </h2>
                  <p className="text-slate-400 text-xs font-semibold">Verify compliance guidelines based on residency parameters.</p>
                </div>

                <div className="flex flex-col gap-2 font-bold text-xs relative z-20">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Country of Residence</label>
                  <CountrySelect
                    value={formData.country}
                    onChange={(val) => setFormData(prev => ({...prev, country: val}))}
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <button
                    onClick={validateAndNext}
                    className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-4 rounded-xl uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    Continue <ChevronRight className="w-4 h-4 stroke-[3.5]" />
                  </button>

                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                    By creating an account, you agree to the <span className="text-[#E61C3F] underline cursor-pointer hover:text-red-700">Privacy Policy</span> and to receive economic and marketing communications from Axi. You can remove yourself from the mailing list at any time.
                  </p>

                  <div className="text-center border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500 font-bold">
                      Already an Axi client? <span onClick={() => setView && setView('login')} className="text-[#E61C3F] font-black underline cursor-pointer hover:text-red-700">Log in here</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: EMAIL & PASSWORD CREDENTIAL SIGNUP */}
            {wizardStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Sign up
                  </h2>
                  <p className="text-slate-400 text-[11px] font-semibold mt-1">
                    Enter your email credentials to establish your master onboarding access.
                  </p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInput}
                      placeholder="e.g. name@example.com"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInput}
                        placeholder="Create password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner pr-12 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Safety Rules */}
                    {formData.password.length > 0 && (
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] mt-1.5">
                        <div className="col-span-2 text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Password Strength Checklist:</div>
                        <div className="flex items-center gap-1.5 font-bold">
                          {passwordRules.lengthMin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          <span className={passwordRules.lengthMin ? 'text-emerald-600' : 'text-slate-500'}>Min 8 chars</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          {passwordRules.lengthMax ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          <span className={passwordRules.lengthMax ? 'text-emerald-600' : 'text-slate-500'}>Max 15 chars</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          {passwordRules.hasLower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          <span className={passwordRules.hasLower ? 'text-emerald-600' : 'text-slate-500'}>Lower case (a-z)</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          {passwordRules.hasUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          <span className={passwordRules.hasUpper ? 'text-emerald-600' : 'text-slate-500'}>Upper case (A-Z)</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold col-span-2">
                          {passwordRules.hasNumber && passwordRules.hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                          <span className={passwordRules.hasNumber && passwordRules.hasSpecial ? 'text-emerald-600' : 'text-slate-500'}>Numbers & special chars (# % @ ! etc.)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Consents boxes */}
                  <div className="flex flex-col gap-2.5 mt-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer font-bold text-[10px] text-slate-500 select-none">
                      <input
                        type="checkbox"
                        name="consentPrivacy"
                        checked={formData.consentPrivacy}
                        onChange={handleInput}
                        className="mt-0.5 accent-[#E61C3F] rounded cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <span>I have read and consent to my data being used in accordance with the <span className="text-[#E61C3F] underline">Privacy Policy</span>. *</span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer font-bold text-[10px] text-slate-500 select-none">
                      <input
                        type="checkbox"
                        name="consentPromo"
                        checked={formData.consentPromo}
                        onChange={handleInput}
                        className="mt-0.5 accent-[#E61C3F] rounded cursor-pointer w-3.5 h-3.5 shrink-0"
                      />
                      <span>I would like to receive free market analysis or promotional content from Axi.</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <button
                    onClick={validateAndNext}
                    className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-4 rounded-xl uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    Continue <ChevronRight className="w-4 h-4 stroke-[3.5]" />
                  </button>

                  <div className="text-center">
                    <span className="text-[11px] text-slate-500 font-bold">
                      Already have an Axi account? <span onClick={() => setView && setView('login')} className="text-[#E61C3F] font-black underline cursor-pointer hover:text-red-700">Log in here</span>
                    </span>
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 4: KEEP YOUR ACCOUNT SAFE (2FA ENTRY) */}
            {wizardStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6 text-left"
              >
                <div className="text-center py-2 flex flex-col items-center">
                  <Lock className="w-12 h-12 text-[#E61C3F] mb-2" />
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Keep Your Account Safe
                  </h2>
                  <p className="text-slate-400 text-xs font-semibold">Add another authentication method for securing raw capital funds.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, authMethod: 'Authenticator' }));
                      setWizardStep(6);
                    }}
                    className="border border-slate-200 hover:border-[#E61C3F] bg-white rounded-xl p-5 flex items-center justify-between cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-50 text-[#E61C3F] rounded-lg">
                        <ShieldCheck className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide group-hover:text-[#E61C3F]">Google Authenticator or similar</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Highly secure software token synchronizer</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 stroke-[3]" />
                  </div>

                  <div
                    onClick={() => {
                      setFormData(prev => ({ ...prev, authMethod: 'SMS' }));
                      setWizardStep(6);
                    }}
                    className="border border-slate-200 hover:border-slate-350 bg-white/65 rounded-xl p-5 flex items-center justify-between cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 text-slate-450 rounded-lg">
                        <Mail className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wide">SMS Text Handshake</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Validate with custom carrier SMS code</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 stroke-[3]" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-3 rounded-xl uppercase transition cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: SECURE YOUR ACCOUNT (2FA SETUP) */}
            {wizardStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Secure Your Account
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-relaxed">
                    Manually enter the following code into your preferred authenticator app and then enter the provided one-time code below.
                  </p>
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-center font-mono font-bold text-xs tracking-wider text-slate-800 break-all select-all select-none">
                    {authSetupCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(authSetupCode);
                      showToast('Security verification code copied to clipboard!', 'success');
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-[10px] py-2.5 rounded-lg uppercase transition cursor-pointer shadow-xs"
                  >
                    Copy code
                  </button>
                </div>

                <div className="text-center my-1">
                  <span 
                    onClick={() => showToast('Initializing secure QR scanner connection...', 'info')}
                    className="text-xs font-black text-[#E61C3F] underline cursor-pointer uppercase tracking-wide hover:text-red-700"
                  >
                    Scan QR code instead
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 font-bold text-xs border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enter your one-time code *</label>
                  <input
                    type="text"
                    name="authCode"
                    value={formData.authCode}
                    onChange={handleInput}
                    placeholder="e.g. 123456"
                    maxLength={6}
                    className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono text-slate-800 focus:outline-none transition font-black shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(4)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                <div className="text-center">
                  <span 
                    onClick={() => setWizardStep(4)}
                    className="text-[11px] font-black text-slate-400 underline cursor-pointer uppercase tracking-wider hover:text-slate-600"
                  >
                    Try another method
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 6: PERSONAL DETAILS (NAME & TITLE) */}
            {wizardStep === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Personal details
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    Please enter your full legal name exactly as it appears on your ID document. We'll use this to verify your identity.
                  </p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Title *</label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleInput}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition font-extrabold cursor-pointer"
                    >
                      <option value="">Please select</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">First Name (as shown on your ID) *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInput}
                      placeholder="Enter legal first name"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Middle Name (optional, as shown on your ID)</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInput}
                      placeholder="Enter legal middle name"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Last Name (as shown on your ID) *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInput}
                      placeholder="Enter legal last name"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(5)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 7: DATE OF BIRTH */}
            {wizardStep === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Personal Details (cont.)
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    Please enter your date of birth as shown on your ID.
                  </p>
                  <p className="text-[#E61C3F] text-[10px] font-bold uppercase tracking-wide mt-1 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                    (Note: We can only consider applications from individuals who are over 18 years of age or older)
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono font-bold text-xs my-2">
                  <div className="flex flex-col gap-1.5 text-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">Day</label>
                    <input
                      type="text"
                      name="dobDay"
                      value={formData.dobDay}
                      onChange={handleInput}
                      placeholder="16"
                      maxLength={2}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-3 py-3.5 text-center text-sm focus:outline-none transition font-black text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">Month</label>
                    <input
                      type="text"
                      name="dobMonth"
                      value={formData.dobMonth}
                      onChange={handleInput}
                      placeholder="09"
                      maxLength={2}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-3 py-3.5 text-center text-sm focus:outline-none transition font-black text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-center">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">Year</label>
                    <input
                      type="text"
                      name="dobYear"
                      value={formData.dobYear}
                      onChange={handleInput}
                      placeholder="1995"
                      maxLength={4}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-3 py-3.5 text-center text-sm focus:outline-none transition font-black text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(6)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 8: RESIDENTIAL ADDRESS */}
            {wizardStep === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Residential Address
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    For regulatory purposes, please confirm your current residential address. (Note: Post Office boxes cannot be accepted as residential address)
                  </p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Address Line 1 *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInput}
                      placeholder="Street name and house number"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Address Line 2 (optional)</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInput}
                      placeholder="Apartment, suite, unit, etc."
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">City or Province (optional) *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInput}
                      placeholder="Enter city"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Postcode (optional)</label>
                    <input
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInput}
                      placeholder="e.g. 100001"
                      className="bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(7)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 9: EMPLOYMENT STATUS */}
            {wizardStep === 9 && (
              <motion.div
                key="step-9"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Employment
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    Before you start trading, we need to understand your employment status.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 my-2">
                  {[
                    'Full Time',
                    'Part Time',
                    'Self Employed',
                    'Retired',
                    'Unemployed',
                    'Student'
                  ].map((emp) => {
                    const isSelected = formData.employment === emp;
                    return (
                      <div
                        key={emp}
                        onClick={() => setFormData(prev => ({ ...prev, employment: emp }))}
                        className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition shadow-xs ${
                          isSelected 
                            ? 'bg-red-50/30 border-[#E61C3F] ring-1 ring-[#E61C3F]' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{emp}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                          isSelected ? 'bg-[#E61C3F] border-[#E61C3F] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(8)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 10: FINANCES */}
            {wizardStep === 10 && (
              <motion.div
                key="step-10"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Finances
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    We understand this is personal, but to adhere to financial regulations, we kindly need to ask about your income
                  </p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs my-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Average Annual Income *</label>
                    <select
                      name="avgIncome"
                      value={formData.avgIncome}
                      onChange={handleInput}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none transition font-extrabold cursor-pointer"
                    >
                      <option value="">Please select range</option>
                      <option value="Under USD 30,000">Under USD 30,000</option>
                      <option value="USD 30,001 - USD 75,000">USD 30,001 - USD 75,000</option>
                      <option value="USD 75,001 - USD 150,000">USD 75,001 - USD 150,000</option>
                      <option value="Over USD 150,000">Over USD 150,000</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approx Value of Savings/Investments *</label>
                    <select
                      name="savingsValue"
                      value={formData.savingsValue}
                      onChange={handleInput}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none transition font-extrabold cursor-pointer"
                    >
                      <option value="">Please select range</option>
                      <option value="Under USD 60,000">Under USD 60,000</option>
                      <option value="USD 60,001 - USD 200,000">USD 60,001 - USD 200,000</option>
                      <option value="USD 200,001 - USD 500,000">USD 200,001 - USD 500,000</option>
                      <option value="Over USD 500,000">Over USD 500,000</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(9)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 11: SOURCE OF FUNDS */}
            {wizardStep === 11 && (
              <motion.div
                key="step-11"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Source of Funds
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    We understand this is personal, but to adhere to financial regulations, we kindly need to ask about your income
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">What is your main source of funds?</p>
                </div>

                <div className="flex flex-col gap-2.5 my-2">
                  {[
                    'Borrowing',
                    'Savings',
                    'Income',
                    'Inheritance'
                  ].map((fund) => {
                    const isChecked = formData.sourceFunds.includes(fund);
                    return (
                      <div
                        key={fund}
                        onClick={() => handleSourceFundsToggle(fund)}
                        className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition shadow-xs ${
                          isChecked 
                            ? 'bg-red-50/30 border-[#E61C3F] ring-1 ring-[#E61C3F]' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{fund}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked ? 'bg-[#E61C3F] border-[#E61C3F] text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(10)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 12: SET PLATFORM & ACCOUNT TYPE */}
            {wizardStep === 12 && (
              <motion.div
                key="step-12"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Set-up your new account
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1">Configure your terminal and raw liqudity specifications.</p>
                </div>

                <div className="flex flex-col gap-3 font-bold text-xs">
                  {/* Platform Choice */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trading Platform</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, tradingPlatform: 'MT5' }))}
                        className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center relative ${
                          formData.tradingPlatform === 'MT5' 
                            ? 'border-[#E61C3F] bg-red-50/10' 
                            : 'border-slate-200 bg-white hover:border-slate-350'
                        }`}
                      >
                        <span className="text-[#E61C3F] text-sm font-black tracking-tighter">MT5</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">MetaTrader 5</span>
                        {formData.tradingPlatform === 'MT5' && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E61C3F] rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                        )}
                      </div>

                      <div
                        onClick={() => setFormData(prev => ({ ...prev, tradingPlatform: 'MT4' }))}
                        className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center relative ${
                          formData.tradingPlatform === 'MT4' 
                            ? 'border-blue-600 bg-blue-50/5' 
                            : 'border-slate-200 bg-white hover:border-slate-350'
                        }`}
                      >
                        <span className="text-blue-600 text-sm font-black tracking-tighter">MT4</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">MetaTrader 4</span>
                        {formData.tradingPlatform === 'MT4' && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Type Card */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Type</label>
                    
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-3">
                      <div className="flex gap-2">
                        {['Standard', 'Pro', 'USD Cent'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setFormData(prev => ({ ...prev, accountType: type }))}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition border cursor-pointer ${
                              formData.accountType === type
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic parameters details display inside Standard/Pro/USD Cent selection */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex flex-col gap-2 text-[10px] font-bold text-slate-500">
                        {formData.accountType === 'Standard' && (
                          <>
                            <div className="text-slate-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                              Standard <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] tracking-widest font-black uppercase">Popular</span>
                            </div>
                            <p className="text-slate-400 text-[9px] font-semibold">Perfect for retail investors. Low spreads without commissions.</p>
                            <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-slate-100 font-mono">
                              <div>Spread: <span className="font-extrabold text-slate-800">From 0.9 pips</span></div>
                              <div>Commission: <span className="font-extrabold text-slate-800">No Commission</span></div>
                              <div>Min Trade: <span className="font-extrabold text-slate-800">0.01 Lot</span></div>
                              <div>Min Deposit: <span className="font-extrabold text-slate-800">No Minimum</span></div>
                            </div>
                          </>
                        )}
                        {formData.accountType === 'Pro' && (
                          <>
                            <div className="text-slate-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                              Pro ECN <span className="bg-red-100 text-[#E61C3F] px-1.5 py-0.5 rounded text-[8px] tracking-widest font-black uppercase">Low Spreads</span>
                            </div>
                            <p className="text-slate-400 text-[9px] font-semibold">Preferential raw market feeds. Ideal for wholesale scaling.</p>
                            <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-slate-100 font-mono">
                              <div>Spread: <span className="font-extrabold text-slate-800">From 0.0 pips</span></div>
                              <div>Commission: <span className="font-extrabold text-slate-800">$4.50 Round-Trip</span></div>
                              <div>Min Trade: <span className="font-extrabold text-slate-800">0.01 Lot</span></div>
                              <div>Min Deposit: <span className="font-extrabold text-slate-800">No Minimum</span></div>
                            </div>
                          </>
                        )}
                        {formData.accountType === 'USD Cent' && (
                          <>
                            <div className="text-slate-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                              Cent Account <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] tracking-widest font-black uppercase">Micro Sizing</span>
                            </div>
                            <p className="text-slate-400 text-[9px] font-semibold">Excellent for testing strategies under lower notional limits.</p>
                            <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-slate-100 font-mono">
                              <div>Spread: <span className="font-extrabold text-slate-800">From 0.9 pips</span></div>
                              <div>Commission: <span className="font-extrabold text-slate-800">No Commission</span></div>
                              <div>Min Trade: <span className="font-extrabold text-slate-800">0.01 Cent Lot</span></div>
                              <div>Min Deposit: <span className="font-extrabold text-slate-800">No Minimum</span></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Join Axi Select toggle - custom styled as in the screenshot */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#E61C3F]/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex flex-col gap-1 pr-6 z-10">
                      <div className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1">
                        axi <span className="text-[#E61C3F] font-black">SELECT</span>
                      </div>
                      <p className="text-slate-400 text-[9px] font-semibold leading-relaxed">
                        Add an MT5 Axi Select account to join our free capital allocation programme. <span className="text-[#E61C3F] underline cursor-pointer">Learn More</span>
                      </p>
                    </div>
                    {/* Toggle Switch */}
                    <div 
                      onClick={() => setFormData(prev => ({ ...prev, joinAxiSelect: !prev.joinAxiSelect }))}
                      className={`w-12 h-6 rounded-full p-0.5 transition cursor-pointer flex items-center shrink-0 ${
                        formData.joinAxiSelect ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-md"></motion.div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(11)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Create Account <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 13: PASSWORD FOR TRADING ACCOUNT */}
            {wizardStep === 13 && (
              <motion.div
                key="step-13"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Set a password
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1 leading-normal">
                    You are setting a password for both your trading account AND your Axi Select account. You can change them later.
                  </p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs relative my-1">
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trading Terminal Password *</label>
                    <div className="relative">
                      <input
                        type={showTradingPassword ? 'text' : 'password'}
                        name="tradingPassword"
                        value={formData.tradingPassword}
                        onChange={handleInput}
                        placeholder="Configure master MT4/MT5 password"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition shadow-inner pr-12 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTradingPassword(!showTradingPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showTradingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Requirements checklist exactly styled as in screenshot */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 mt-2 font-sans font-semibold text-xs text-slate-600 shadow-inner">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Your password must contain:</span>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.lengthMin ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.lengthMin && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.lengthMin ? 'text-emerald-600' : 'text-slate-500'}>At least 8 characters</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.lengthMax ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.lengthMax && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.lengthMax ? 'text-emerald-600' : 'text-slate-500'}>Not longer than 15 characters</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.hasLower ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.hasLower && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.hasLower ? 'text-emerald-600' : 'text-slate-500'}>Lower case letters (a-z)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.hasUpper ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.hasUpper && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.hasUpper ? 'text-emerald-600' : 'text-slate-500'}>Upper case letters (A-Z)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.hasNumber ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.hasNumber && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.hasNumber ? 'text-emerald-600' : 'text-slate-500'}>Numbers (0-9)</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${tradingPasswordRules.hasSpecial ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-300'}`}>
                          {tradingPasswordRules.hasSpecial && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                        </div>
                        <span className={tradingPasswordRules.hasSpecial ? 'text-emerald-600' : 'text-slate-500'}>Special characters (# % @ ! etc.)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(12)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 14: CURRENCY AND LEVERAGE CONFIGURATION */}
            {wizardStep === 14 && (
              <motion.div
                key="step-14"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-5 text-left"
              >
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Set up your account
                  </h2>
                  <p className="text-slate-450 text-[11px] font-semibold mt-1">Customise your Metatrader account settings.</p>
                </div>

                <div className="flex flex-col gap-4 font-bold text-xs my-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInput}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none transition font-extrabold cursor-pointer font-mono"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="NGN">NGN (₦)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leverage</label>
                    <select
                      name="leverage"
                      value={formData.leverage}
                      onChange={handleInput}
                      className="bg-slate-50 border-2 border-slate-200 focus:border-[#E61C3F] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none transition font-extrabold cursor-pointer font-mono"
                    >
                      <option value="1:100">1:100 (Conservative)</option>
                      <option value="1:500">1:500 (STP Standard)</option>
                      <option value="1:1000">1:1000 (Axi Max ECN)</option>
                    </select>
                  </div>

                  {formData.joinAxiSelect && (
                    <p className="text-slate-400 text-[9px] font-semibold leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-lg">
                      (Please note, your Axi Select MT5 account currency is non-configurable and will default to USD)
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(13)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={validateAndNext}
                    className="flex-1 bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Continue <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 15: PLATFORM EXPLORATION & SUCCESS WELCOME */}
            {wizardStep === 15 && (
              <motion.div
                key="step-15"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-white">✓</span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase mb-2">
                  Application submitted — provisioning pending
                </h2>
                
                <p className="text-slate-500 text-xs font-semibold max-w-sm mb-6">
                  Your identity has been registered. Complete KYC and wait for administrator/broker approval before live trading credentials are issued.
                </p>

                <div className="w-full flex flex-col gap-3 max-w-xs mb-8">
                  <button
                    onClick={() => { showToast('Broker credentials are issued only after real backend provisioning.', 'info'); }}
                    className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black text-xs py-4 rounded-xl uppercase tracking-wider shadow-md cursor-pointer transition-colors"
                  >
                    View application status
                  </button>
                  
                  <button
                    onClick={() => {
                      showToast('Live trading access is available only after verified account provisioning.', 'info');
                      if (setView) setView('dashboard');
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>

                {/* Floating 3D Coin elements */}
                <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/60 w-full relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">Supported Liquidity Assets:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {['BTC', 'ETH', 'SOL', 'XAU', 'EUR', 'GBP'].map((coin) => (
                      <span key={coin} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-slate-700 font-mono flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E61C3F]"></span> {coin}/USD
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 16: FINAL CREDENTIALS DISPLAY */}

          </AnimatePresence>
        </div>

        {/* Bottom micro-copy safeguards disclosures */}
        <div className="bg-slate-50 border-t border-slate-100 py-4 px-6 text-center text-[10px] text-slate-400 font-semibold tracking-wide">
          Secured with 256-Bit SSL Encryption • Axi Segregation Trust Guarantee
        </div>

      </div>

      {/* Baseline Comparative account tiers displayed nicely beneath the wizard */}
      <div className="w-full max-w-4xl mt-16 text-center">
        <div className="mb-8">
          <span className="text-[#E61C3F] text-xs font-black tracking-widest uppercase bg-red-50 border border-red-100 px-3.5 py-1.5 rounded-full">
            Account Parameters
          </span>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mt-2.5">
            Axi STP Liquidity Feed Comparison
          </h3>
          <p className="text-slate-400 text-xs font-semibold max-w-xl mx-auto mt-1">
            Compare account details. All configurations feature segregated FCA accounts, standard instant matching, and direct market routing protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {ACCOUNT_TYPES.map((tier) => {
            const isPro = tier.name === 'Pro Account';
            return (
              <div 
                key={tier.name}
                className={`border rounded-2xl p-6 flex flex-col justify-between bg-white text-left transition-all ${
                  isPro ? 'border-[#E61C3F] ring-2 ring-red-50' : 'border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <h4 className="text-sm font-black text-slate-950 uppercase">{tier.name}</h4>
                    <span className="text-[9px] font-black text-[#E61C3F] bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mb-4">
                    {tier.description}
                  </p>

                  <div className="flex flex-col gap-2.5 text-[10px] font-bold text-slate-500 mb-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>Spreads from</span>
                      <span className="text-slate-850 font-black font-mono">{tier.spreadsFrom}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>Commission</span>
                      <span className="text-slate-850 font-black font-mono">{tier.commission}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>Max Leverage</span>
                      <span className="text-slate-850 font-black font-mono">{tier.maxLeverage}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>Min Deposit</span>
                      <span className="text-slate-850 font-black font-mono">{tier.minDeposit}</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5">
                      <span>Order Execution</span>
                      <span className="text-slate-700">{tier.orderExecution}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWizardStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full py-3 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition ${
                    isPro 
                      ? 'bg-[#E61C3F] hover:bg-red-700 text-white shadow-sm shadow-red-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Choose {tier.name.split(' ')[0]}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
