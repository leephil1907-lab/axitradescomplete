import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribePaymentConfig, subscribeSystemConfigWallets } from '../services/paymentConfigService';
import { 
  X, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Lock, Smartphone, 
  Landmark, RefreshCw, AlertCircle, Copy, Check, Download, Zap, ChevronRight,
  Globe, Sparkles, Building2, HelpCircle, QrCode, ExternalLink, Clock, Info
} from 'lucide-react';
import { DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import { PaymentMethodBrandIcon } from './FundsView';
import { copyToClipboard } from '../utils/copy';
import { sendTelegramAlert } from '../utils/telegram';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripeCheckoutForm } from './StripeCheckoutForm';

const getStripePromise = () => {
  const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!pubKey) return Promise.resolve(null);
  return loadStripe(pubKey).catch(() => null);
};

const stripePromise = getStripePromise();







interface QuickDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  balance: number;
  setBalance: (newBalance: number) => void;
  liveBalance: number;
  setLiveBalance: (newBalance: number) => void;
  addTransaction?: (t: any) => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
}

export default function QuickDepositModal({ 
  isOpen, 
  onClose, 
  showToast, 
  balance, 
  setBalance, 
  liveBalance, 
  setLiveBalance, 
  addTransaction,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}: QuickDepositModalProps) {
  const [step, setStep] = useState<'amount_method' | 'card_details' | 'crypto_gateway' | 'authenticating' | 'receipt'>('amount_method');
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'applepay' | 'crypto' | 'wire' | 'wallet'>('card');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex'>('visa');
  
  // Crypto Gateway State
  const [cryptoProvider, setCryptoProvider] = useState<'bitpay' | 'coinbase'>('bitpay');
  const [cryptoAsset, setCryptoAsset] = useState<'usdt' | 'btc' | 'eth' | 'usdc'>('usdt');
  const [copiedCryptoAddr, setCopiedCryptoAddr] = useState(false);

  const [cryptoAddresses, setCryptoAddresses] = useState<Record<string, string>>(() => {
    const saved = safeStorage.getItem('axi_admin_wallet_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          usdt: parsed.usdt?.address || 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
          btc: parsed.btc?.address || 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
          eth: parsed.eth?.address || '0x12107F3eB874442301756daFBd3360418ae3C366',
          usdc: parsed.usdc?.address || '0x12107F3eB874442301756daFBd3360418ae3C366'
        };
      } catch (e) {}
    }
    return {
      usdt: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
      btc: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
      eth: '0x12107F3eB874442301756daFBd3360418ae3C366',
      usdc: '0x12107F3eB874442301756daFBd3360418ae3C366'
    };
  });

  const [maintenanceMode, setMaintenanceMode] = useState<any>(null);

  React.useEffect(() => {
    const unsubscribeConfig = subscribePaymentConfig((centralConfig) => {
      if (centralConfig.maintenanceMode) {
        setMaintenanceMode(centralConfig.maintenanceMode);
      }
      if (centralConfig.cryptoWallets) {
        setCryptoAddresses({
          usdt: centralConfig.cryptoWallets.usdt?.address || 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
          btc: centralConfig.cryptoWallets.btc?.address || 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
          eth: centralConfig.cryptoWallets.eth?.address || '0x12107F3eB874442301756daFBd3360418ae3C366',
          usdc: centralConfig.cryptoWallets.usdc?.address || '0x12107F3eB874442301756daFBd3360418ae3C366'
        });
      }
    });

    const unsubscribeSysWallets = subscribeSystemConfigWallets((wallets) => {
      if (wallets) {
        setCryptoAddresses({
          usdt: wallets.usdt?.address || 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
          btc: wallets.btc?.address || 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
          eth: wallets.eth?.address || '0x12107F3eB874442301756daFBd3360418ae3C366',
          usdc: wallets.usdc?.address || '0x12107F3eB874442301756daFBd3360418ae3C366'
        });
      }
    });

    const handleWalletUpdate = () => {
      const saved = safeStorage.getItem('axi_admin_wallet_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCryptoAddresses({
            usdt: parsed.usdt?.address || 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4',
            btc: parsed.btc?.address || 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu',
            eth: parsed.eth?.address || '0x12107F3eB874442301756daFBd3360418ae3C366',
            usdc: parsed.usdc?.address || '0x12107F3eB874442301756daFBd3360418ae3C366'
          });
        } catch (e) {}
      }
    };
    window.addEventListener('axi_admin_wallet_settings_updated', handleWalletUpdate);
    window.addEventListener('axi_payment_methods_updated', handleWalletUpdate);
    return () => {
      unsubscribeConfig();
      unsubscribeSysWallets();
      window.removeEventListener('axi_admin_wallet_settings_updated', handleWalletUpdate);
      window.removeEventListener('axi_payment_methods_updated', handleWalletUpdate);
    };
  }, []);

  const cryptoRates = {
    usdt: 1,
    btc: 65400,
    eth: 3450,
    usdc: 1
  };

  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Auth Simulation & Receipt
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txReceipt, setTxReceipt] = useState<any>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);

  if (!isOpen) return null;

  // Format Card Number input nicely


  const handleCopyCryptoAddress = async () => {
    const addr = cryptoAddresses[cryptoAsset];
    const ok = await copyToClipboard(addr);
    if (ok) {
      setCopiedCryptoAddr(true);
      if (showToast) showToast(`✅ ${cryptoAsset.toUpperCase()} deposit address copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCryptoAddr(false), 2500);
    } else {
      if (showToast) showToast('Failed to copy. Please select address text manually.', 'error');
    }
  };

  const handle3DSecureAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      const numAmount = Number(amount) || 1000;
      const newTx = {
        id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        type: 'Deposit',
        amount: numAmount,
        method: `${selectedMethod === 'card' ? 'Credit/Debit Card' : selectedMethod === 'applepay' ? 'Apple/Google Pay' : 'Bank Wire Direct'} (3DS Verified)`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Completed',
        account: 'Live ECN Account (#8849201)',
        refCode: `3DS-${Math.floor(100000 + Math.random() * 899999)}`,
        proofNote: '3D Secure Bank Verified & Authorized'
      };

      if (addTransaction) addTransaction(newTx);
      setTxReceipt(newTx);
      setBalance(balance + numAmount);
      setLiveBalance(liveBalance + numAmount);
      setIsProcessing(false);
      setStep('receipt');
      if (showToast) showToast(`Payment Successful! Credited $${numAmount.toLocaleString()} USD to your account.`, 'success');
    }, 1000);
  };

  const handleProceedToDetails = async () => {
    if (maintenanceMode?.active && maintenanceMode?.disableDeposits !== false) {
      if (showToast) {
        showToast(`⚠️ ${maintenanceMode.message || 'Deposit requests are currently disabled for maintenance.'}`, 'error');
      }
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      if (showToast) showToast('Minimum deposit amount is $10 USD', 'error');
      return;
    }

    sendTelegramAlert('DEPOSIT_BUTTON_CLICKED', `💳 User Initiated Deposit: ${numAmount.toLocaleString()} USD`, {
      'Amount': `${numAmount.toLocaleString()} USD`,
      'Payment Method': selectedMethod.toUpperCase(),
      'Target Account': 'Live ECN Account (#8849201)'
    });

    if (selectedMethod === 'crypto') {
      setStep('crypto_gateway');
      return;
    }

    // Try fetching PaymentIntent or fallback to 3DS authentication
    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, currency: 'usd' })
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep('card_details');
      } else {
        setStep('authenticating');
      }
    } catch (e) {
      setStep('authenticating');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (receiptInfo: any) => {
    if (addTransaction) {
      const newTx = {
        ...receiptInfo,
        type: 'Deposit',
        account: 'Live ECN Account (#8849201)',
        status: 'Completed',
        proofNote: 'Stripe Secure Payment Processed'
      };
      addTransaction(newTx);
      setTxReceipt(newTx);
    } else {
      setTxReceipt(receiptInfo);
    }
    
    // Update local balance
    setBalance(balance + receiptInfo.amount);
    setLiveBalance(liveBalance + receiptInfo.amount);
    setStep('receipt');
  };


  const handleConfirmCryptoPayment = () => {
    setIsProcessing(true);
    const providerName = cryptoProvider === 'bitpay' ? 'BitPay Crypto Gateway' : 'Coinbase Commerce';
    const assetLabel = `${cryptoAsset.toUpperCase()} (${cryptoProvider === 'bitpay' ? 'Merchant Invoice' : 'Coinbase Ledger'})`;
    
    const numAmount = Number(amount);
    const newTx = {
      id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'Deposit',
      amount: numAmount,
      method: `${providerName} - ${assetLabel}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Verification',
      account: 'Live ECN Account (#8849201)',
      refCode: `CRYPTO-${Math.floor(100000 + Math.random() * 899999)}`,
      proofNote: `Verified Gateway Transaction • PENDING Clearance Audit`
    };

    if (addTransaction) {
      addTransaction(newTx);
    }
    setTxReceipt(newTx);
    setIsProcessing(false);
    setStep('receipt');
    if (showToast) showToast(`DEPOSIT PENDING: Your deposit of $${numAmount.toLocaleString()} is recorded and pending clearance.`, 'info');
  };



  const handleCopyTxId = async () => {
    if (txReceipt) {
      const ok = await copyToClipboard(txReceipt.id);
      if (ok) {
        setCopiedTxId(true);
        setTimeout(() => setCopiedTxId(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Dark Overlay with Blur */}
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white"
      >
        {/* Header Ribbon Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-zinc-900 px-6 py-4 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E3000F]/20 text-[#E3000F] border border-[#E3000F]/30">
              <ShieldCheck className="w-5 h-5 text-[#FFD250]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Axi Premium Payment Gateway</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PCI-DSS Level 1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                256-Bit Bank Grade SSL Encrypted Deposit Processing
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Maintenance Alert Banner */}
        {maintenanceMode?.active && maintenanceMode?.disableDeposits !== false && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3.5 flex items-start gap-3 text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span>System Maintenance Active</span>
                <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 text-[9px] rounded">DEPOSITS PAUSED</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed font-medium">
                {maintenanceMode.message || 'Deposit requests are temporarily paused for scheduled maintenance.'}
              </p>
            </div>
          </div>
        )}

        {/* Multi-Step Checkout Body */}
        <div className="p-6">

          {/* Step 1: Amount & Payment Method Selection */}
          {step === 'amount_method' && (
            <div className="space-y-5">
              
              {/* Account Selector Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Account</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live ECN Account (#8849201)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Balance</span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Deposit Amount Input & Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Deposit Amount
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
                    {['USD', 'EUR', 'GBP', 'AUD'].map(c => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-2 py-0.5 rounded transition cursor-pointer text-[11px] ${
                          currency === c ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-2xl">
                    {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-16 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-black font-mono text-slate-900 dark:text-white outline-none focus:border-[#E3000F] transition"
                    placeholder="1000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                    0% FEE
                  </span>
                </div>

                {/* Quick Preset Amount Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {['250', '500', '1000', '5000'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`py-2 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                        amount === preset
                          ? 'bg-[#E3000F] text-white border-[#E3000F] shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector Grid */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">
                  Select Payment Processing Method
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Card */}
                  <div
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'card'
                        ? 'border-[#E3000F] bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Credit / Debit Card</div>
                        <div className="text-[10px] text-slate-400 font-medium">Visa, Mastercard, Amex</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </div>

                  {/* Option 2: Apple / Google Pay */}
                  <div
                    onClick={() => setSelectedMethod('applepay')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'applepay'
                        ? 'border-[#E3000F] bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Apple / Google Pay</div>
                        <div className="text-[10px] text-slate-400 font-medium">1-Tap Wallet Checkout</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </div>

                  {/* Option 3: Crypto USDT */}
                  <div
                    onClick={() => setSelectedMethod('crypto')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'crypto'
                        ? 'border-[#E3000F] bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Instant Crypto USDT</div>
                        <div className="text-[10px] text-slate-400 font-medium">TRC20 / ERC20 Web3</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
                      Direct
                    </span>
                  </div>

                  {/* Option 4: Bank Wire */}
                  <div
                    onClick={() => setSelectedMethod('wire')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'wire'
                        ? 'border-[#E3000F] bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Bank Wire Direct</div>
                        <div className="text-[10px] text-slate-400 font-medium">Barclays / HSBC Account</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                      VIP
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Line Items Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs font-medium">
                <div className="flex justify-between text-slate-500">
                  <span>Deposit Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${Number(amount || 0).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Axi Processing Overhead:</span>
                  <span className="font-bold text-emerald-500">$0.00 (Waived)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Credit Time:</span>
                  <span className="font-bold text-slate-900 dark:text-white">&lt; 30 Seconds</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Total Payable:</span>
                  <span className="text-[#E3000F] font-mono">${Number(amount || 0).toLocaleString()} {currency}</span>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                onClick={handleProceedToDetails}
                className="w-full bg-gradient-to-r from-[#FFD250] to-[#FFC518] hover:from-[#FFC518] hover:to-[#E0AC00] text-slate-950 font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition cursor-pointer"
              >
                <span>Continue to Secure Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-500" /> SSL Encrypted</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500" /> FCA Regulated</span>
                <span>•</span>
                <span>Instant Credit</span>
              </div>
            </div>
          )}

          
          {/* Step 2: Stripe Elements Integration */}
          {step === 'card_details' && clientSecret && (
            <div className="space-y-5">
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripeCheckoutForm 
                   amount={Number(amount)} 
                   currency={currency}
                   onSuccess={(txResult) => {
                      const newTx = {
                        id: txResult.id || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        type: 'Deposit',
                        amount: txResult.amount || Number(amount),
                        method: txResult.method || 'Stripe Secure Payment',
                        date: txResult.date || new Date().toISOString().replace('T', ' ').substring(0, 19),
                        status: 'Completed',
                        account: 'Live ECN Account (#8849201)',
                        refCode: txResult.refCode || '',
                        proofNote: 'Stripe Gateway Authorized'
                      };
                      if (addTransaction) addTransaction(newTx);
                      setTxReceipt(newTx);
                      setBalance(balance + Number(amount));
                      setLiveBalance(liveBalance + Number(amount));
                      setStep('receipt');
                      if (showToast) showToast(`Payment Successful! Credited ${newTx.amount.toLocaleString()} USD.`, 'success');
                   }}
                   onCancel={() => setStep('amount_method')}
                />
              </Elements>
            </div>
          )}

          {/* Step 3: 3D Secure/ Bank Authorization Animation */}
          {step === 'authenticating' && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-[#E3000F] border-t-transparent animate-spin" />
                <ShieldCheck className="w-8 h-8 text-[#E3000F]" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  3D Secure Bank Verification
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Communicating with issuing bank server via Visa Secure / Mastercard Identity Check...
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto text-left space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Merchant:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">AXI FINANCIAL MARKETS</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Transaction Amount:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">${Number(amount).toLocaleString()} {currency}</span>
                </div>

                <form onSubmit={handle3DSecureAuthorize} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Enter Bank SMS OTP Verification Code:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg font-mono font-black text-center text-sm outline-none focus:border-[#E3000F]"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-[#E3000F] hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? 'Verifying...' : 'Submit OTP'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 4: Transaction Receipt & Confirmation */}
          {step === 'receipt' && txReceipt && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  Deposit Completed Successfully
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  ${txReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Funds credited instantly to Live ECN Trading Account
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref ID:</span>
                  <div className="flex items-center gap-1 font-mono font-extrabold text-slate-900 dark:text-white">
                    <span>{txReceipt.id}</span>
                    <button onClick={handleCopyTxId} className="p-0.5 hover:text-[#E3000F] transition cursor-pointer">
                      {copiedTxId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{txReceipt.method}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{txReceipt.date}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Auth Code:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{txReceipt.refCode}</span>
                </div>
              </div>

              {/* Action Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold py-3.5 rounded-xl transition hover:opacity-90 cursor-pointer text-xs"
              >
                Close & Return to Trading Terminal
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
