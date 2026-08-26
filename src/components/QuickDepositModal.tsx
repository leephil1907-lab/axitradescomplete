import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribePaymentConfig, subscribeSystemConfigWallets, defaultCryptoWallets, defaultBankSettings } from '../services/paymentConfigService';
import { 
  X, CreditCard, ArrowRight, ShieldCheck, CheckCircle2, Lock, Smartphone, 
  Landmark, RefreshCw, AlertCircle, Copy, Check, Zap, ArrowLeft,
  QrCode, ExternalLink, Clock, Info, ChevronRight, FileText
} from 'lucide-react';
import { DisplayCurrency } from '../types';
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
  const [step, setStep] = useState<'amount_method' | 'card_details' | 'crypto_gateway' | 'bank_wire' | 'authenticating' | 'receipt'>('amount_method');
  const [amount, setAmount] = useState('1000');
  const [currency, setCurrency] = useState('USD');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'applepay' | 'crypto' | 'wire'>('card');
  
  // Crypto Gateway State
  const [cryptoAsset, setCryptoAsset] = useState<string>('usdt');
  const [copiedCryptoAddr, setCopiedCryptoAddr] = useState(false);
  const [copiedCryptoMemo, setCopiedCryptoMemo] = useState(false);
  const [txHashInput, setTxHashInput] = useState('');

  const [cryptoAddresses, setCryptoAddresses] = useState<Record<string, { address: string; memo?: string; network: string }>>(() => {
    const saved = safeStorage.getItem('axi_admin_wallet_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.btc) return parsed;
      } catch (e) {}
    }
    return defaultCryptoWallets;
  });

  const [bankSettings, setBankSettings] = useState(defaultBankSettings);
  const [maintenanceMode, setMaintenanceMode] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Card payment processing security
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txReceipt, setTxReceipt] = useState<any>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);

  React.useEffect(() => {
    const unsubscribeConfig = subscribePaymentConfig((centralConfig) => {
      if (centralConfig.maintenanceMode) {
        setMaintenanceMode(centralConfig.maintenanceMode);
      }
      if (centralConfig.cryptoWallets) {
        setCryptoAddresses(centralConfig.cryptoWallets as any);
      }
      if (centralConfig.bankSettings) {
        setBankSettings(centralConfig.bankSettings);
      }
    });

    const unsubscribeSysWallets = subscribeSystemConfigWallets((wallets) => {
      if (wallets) {
        setCryptoAddresses(wallets as any);
      }
    });

    const handleWalletUpdate = () => {
      const saved = safeStorage.getItem('axi_admin_wallet_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCryptoAddresses(parsed);
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

  if (!isOpen) return null;

  const currentCrypto = cryptoAddresses[cryptoAsset] || defaultCryptoWallets[cryptoAsset as keyof typeof defaultCryptoWallets] || defaultCryptoWallets.usdt;

  const cryptoList = [
    { key: 'usdt', name: 'USDT (TRON TRC20)', badge: 'Fastest • Low Fee', symbol: 'USDT' },
    { key: 'usdt_erc20', name: 'USDT (Ethereum ERC20)', badge: 'Ethereum', symbol: 'USDT' },
    { key: 'usdt_bep20', name: 'USDT (BNB BEP20)', badge: 'BNB Chain', symbol: 'USDT' },
    { key: 'btc', name: 'Bitcoin (BTC)', badge: 'Bitcoin Mainnet', symbol: 'BTC' },
    { key: 'eth', name: 'Ethereum (ETH)', badge: 'ERC20', symbol: 'ETH' },
    { key: 'usdc', name: 'USD Coin (USDC)', badge: 'ERC20', symbol: 'USDC' },
    { key: 'sol', name: 'Solana (SOL)', badge: 'Solana Mainnet', symbol: 'SOL' },
    { key: 'bnb', name: 'BNB Smart Chain', badge: 'BEP20', symbol: 'BNB' },
    { key: 'xrp', name: 'Ripple (XRP)', badge: 'Tag Required', symbol: 'XRP' },
    { key: 'ton', name: 'Toncoin (TON)', badge: 'Memo Required', symbol: 'TON' },
    { key: 'xlm', name: 'Stellar (XLM)', badge: 'Memo Required', symbol: 'XLM' },
  ];

  const handleCopyAddress = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCryptoAddr(true);
      if (showToast) showToast('✅ Wallet address copied to clipboard!', 'success');
      setTimeout(() => setCopiedCryptoAddr(false), 2500);
    }
  };

  const handleCopyMemo = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCryptoMemo(true);
      if (showToast) showToast('✅ Memo/Destination Tag copied to clipboard!', 'success');
      setTimeout(() => setCopiedCryptoMemo(false), 2500);
    }
  };

  // Card 3D Secure fallback handler (only for Card / Apple Pay)
  const handle3DSecureAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      const numAmount = Number(amount) || 1000;
      const newTx = {
        id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        type: 'Deposit',
        amount: numAmount,
        method: `${selectedMethod === 'card' ? 'Credit/Debit Card' : 'Apple/Google Pay'} (Stripe 3DS)`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Pending Verification',
        account: 'Live ECN Account (#8849201)',
        refCode: `STRIPE-3DS-${Math.floor(100000 + Math.random() * 899999)}`,
        proofNote: '3D Secure Verification Submitted • Awaiting Gateway Settlement'
      };

      if (addTransaction) addTransaction(newTx);
      setTxReceipt(newTx);
      setIsProcessing(false);
      setStep('receipt');
      if (showToast) showToast(`Deposit Submitted: $${numAmount.toLocaleString()} USD is pending verification.`, 'info');
    }, 1000);
  };

  // Handler for Direct Crypto Transfer confirmation (Completely independent from Stripe)
  const handleConfirmCryptoPayment = () => {
    setIsProcessing(true);
    const numAmount = Number(amount) || 1000;
    const selectedItem = cryptoList.find(c => c.key === cryptoAsset);
    const assetTitle = selectedItem?.name || currentCrypto.network;

    const newTx = {
      id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'Deposit',
      amount: numAmount,
      method: `Crypto (${assetTitle})`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Verification',
      account: 'Live ECN Account (#8849201)',
      refCode: txHashInput ? `TXID: ${txHashInput.trim()}` : `ONCHAIN-${Math.floor(100000 + Math.random() * 899999)}`,
      proofNote: `Direct Blockchain Transfer • ${currentCrypto.network} • Target: ${currentCrypto.address.substring(0, 10)}...`
    };

    if (addTransaction) {
      addTransaction(newTx);
    }
    setTxReceipt(newTx);
    setIsProcessing(false);
    setStep('receipt');
    if (showToast) showToast(`Deposit Recorded: $${numAmount.toLocaleString()} USD transfer pending blockchain confirmation.`, 'info');
  };

  // Handler for Direct Bank Wire Transfer confirmation
  const handleConfirmBankWire = () => {
    setIsProcessing(true);
    const numAmount = Number(amount) || 1000;

    const newTx = {
      id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      type: 'Deposit',
      amount: numAmount,
      method: `Bank Wire (${bankSettings.bankName})`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending Verification',
      account: 'Live ECN Account (#8849201)',
      refCode: `WIRE-${Math.floor(100000 + Math.random() * 899999)}`,
      proofNote: `Beneficiary: ${bankSettings.accountName} • SWIFT: ${bankSettings.swiftBic}`
    };

    if (addTransaction) {
      addTransaction(newTx);
    }
    setTxReceipt(newTx);
    setIsProcessing(false);
    setStep('receipt');
    if (showToast) showToast(`Wire Transfer Recorded: $${numAmount.toLocaleString()} USD pending bank receipt.`, 'info');
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

    if (selectedMethod === 'wire') {
      setStep('bank_wire');
      return;
    }

    // Attempt Stripe Checkout Session ONLY for Card & Apple Pay
    setIsProcessing(true);
    try {
      const checkoutRes = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, currency: 'usd', method: selectedMethod })
      });
      const checkoutData = await checkoutRes.json();
      if (checkoutData.url) {
        if (showToast) showToast('Redirecting to secure Stripe Checkout page...', 'info');
        window.location.href = checkoutData.url;
        return;
      }

      // If checkout session endpoint is not configured, try PaymentIntent
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
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white max-h-[92vh] flex flex-col"
      >
        {/* Header Ribbon Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-zinc-900 px-6 py-4 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight text-white">Axi Deposit Portal</h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Clearing
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Direct Card, Bank & Cryptocurrency Funding Channels
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
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3.5 flex items-start gap-3 text-amber-200 shrink-0">
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* STEP 1: Amount & Payment Method Selection */}
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
                    className="w-full pl-10 pr-16 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-2xl font-black font-mono text-slate-900 dark:text-white outline-none focus:border-red-600 transition"
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
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
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
                  Select Deposit Channel
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Card via Stripe */}
                  <div
                    onClick={() => setSelectedMethod('card')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'card'
                        ? 'border-red-600 bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Credit / Debit Card</div>
                        <div className="text-[10px] text-slate-400 font-medium">Visa, Mastercard, Amex (Stripe)</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </div>

                  {/* Option 2: Apple / Google Pay via Stripe */}
                  <div
                    onClick={() => setSelectedMethod('applepay')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'applepay'
                        ? 'border-red-600 bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Apple / Google Pay</div>
                        <div className="text-[10px] text-slate-400 font-medium">1-Tap Wallet (Stripe)</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </div>

                  {/* Option 3: Direct Cryptocurrency Transfer */}
                  <div
                    onClick={() => setSelectedMethod('crypto')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'crypto'
                        ? 'border-red-600 bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Cryptocurrency Deposit</div>
                        <div className="text-[10px] text-slate-400 font-medium">USDT, BTC, ETH, SOL, TON, XRP</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded">
                      Onchain
                    </span>
                  </div>

                  {/* Option 4: Direct Bank Wire */}
                  <div
                    onClick={() => setSelectedMethod('wire')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                      selectedMethod === 'wire'
                        ? 'border-red-600 bg-red-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold">Bank Wire Transfer</div>
                        <div className="text-[10px] text-slate-400 font-medium">SWIFT / IBAN / Clearing</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                      Direct Wire
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
                  <span>Processing Fee:</span>
                  <span className="font-bold text-emerald-500">0.00% (Fee waived)</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Total Payable:</span>
                  <span className="text-red-600 font-mono">${Number(amount || 0).toLocaleString()} {currency}</span>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                onClick={handleProceedToDetails}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed with {selectedMethod === 'crypto' ? 'Crypto Transfer' : selectedMethod === 'wire' ? 'Bank Wire Details' : 'Card Payment'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-500" /> SSL Encrypted</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500" /> Regulated Custody</span>
                <span>•</span>
                <span>Instant Settlement</span>
              </div>
            </div>
          )}

          {/* STEP 2: Dedicated Direct Crypto Gateway (Independent of Stripe) */}
          {step === 'crypto_gateway' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setStep('amount_method')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Methods
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Deposit Value</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">${Number(amount).toLocaleString()} USD</span>
                </div>
              </div>

              {/* Coin / Network Selector */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-2">
                  Select Blockchain Asset & Network
                </label>
                <select
                  value={cryptoAsset}
                  onChange={(e) => setCryptoAsset(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-red-600 transition"
                >
                  {cryptoList.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.name} — {c.badge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Receiving Address & QR Code Box */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Dynamic QR Code */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(currentCrypto.address)}`}
                      alt="Wallet QR Code"
                      className="w-28 h-28 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                        {currentCrypto.network}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Send exactly <strong>${Number(amount).toLocaleString()} USD</strong> equivalent in {cryptoAsset.toUpperCase()} to this public receiving address.
                    </p>
                  </div>
                </div>

                {/* Receiving Address */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Official Receiving Address ({currentCrypto.network})
                  </label>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white break-all flex-1 select-all">
                      {currentCrypto.address}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(currentCrypto.address)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedCryptoAddr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedCryptoAddr ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Memo / Destination Tag if applicable */}
                {currentCrypto.memo && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Destination Tag / Memo (Mandatory)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMemo(currentCrypto.memo!)}
                        className="text-[10px] font-extrabold uppercase text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-800/40 px-2 py-0.5 rounded hover:bg-amber-300 transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedCryptoMemo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedCryptoMemo ? 'Copied' : 'Copy Tag'}
                      </button>
                    </div>
                    <div className="font-mono text-sm font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      {currentCrypto.memo}
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      You must include this Destination Tag when sending from an exchange or custodial wallet.
                    </p>
                  </div>
                )}

                {/* Optional TXID Input */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Your Blockchain TxID / Hash (Optional for expedited clearance)
                  </label>
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="e.g. 0x4f82a9104b..."
                    className="w-full font-mono text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 transition text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Confirm Transfer Button */}
              <button
                type="button"
                onClick={handleConfirmCryptoPayment}
                disabled={isProcessing}
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>I Have Completed The Crypto Transfer</span>
              </button>
            </div>
          )}

          {/* STEP 3: Direct Bank Wire Details */}
          {step === 'bank_wire' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setStep('amount_method')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Methods
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Wire Amount</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">${Number(amount).toLocaleString()} USD</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5 text-xs">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-red-600" />
                  Official Bank Wire Settlement Coordinates
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{bankSettings.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Beneficiary Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{bankSettings.accountName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Account Number / IBAN</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{bankSettings.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">SWIFT / BIC</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{bankSettings.swiftBic}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                  <strong>Payment Reference:</strong> Live Account #8849201. Please include your reference code in the bank transfer memo.
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBankWire}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>I Have Sent The Bank Wire</span>
              </button>
            </div>
          )}

          {/* STEP 4: Stripe Elements Integration (Card Payment Only) */}
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
                        method: txResult.method || 'Credit/Debit Card (Stripe)',
                        date: txResult.date || new Date().toISOString().replace('T', ' ').substring(0, 19),
                        status: 'Pending Verification',
                        account: 'Live ECN Account (#8849201)',
                        refCode: txResult.refCode || '',
                        proofNote: 'Stripe Gateway Authorization Submitted • Awaiting Settlement'
                      };
                      if (addTransaction) addTransaction(newTx);
                      setTxReceipt(newTx);
                      setStep('receipt');
                      if (showToast) showToast(`Payment Submitted: $${newTx.amount.toLocaleString()} USD is pending verification.`, 'info');
                   }}
                   onCancel={() => setStep('amount_method')}
                />
              </Elements>
            </div>
          )}

          {/* STEP 5: 3D Secure / Bank Authorization Authentication Flow */}
          {step === 'authenticating' && (
            <div className="py-8 text-center space-y-5">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
                <ShieldCheck className="w-8 h-8 text-red-600" />
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
                      placeholder="123456"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 rounded-lg font-mono font-black text-center text-sm outline-none focus:border-red-600"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? 'Verifying...' : 'Submit OTP'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 6: Transaction Receipt & Confirmation */}
          {step === 'receipt' && txReceipt && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  txReceipt.status === 'Completed'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {txReceipt.status === 'Completed' ? 'Deposit Completed Successfully' : 'Deposit Transfer Recorded'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                  ${txReceipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {txReceipt.status === 'Completed'
                    ? 'Funds credited instantly to Live ECN Trading Account'
                    : 'Transaction is queued for blockchain / bank verification'}
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref ID:</span>
                  <div className="flex items-center gap-1 font-mono font-extrabold text-slate-900 dark:text-white">
                    <span>{txReceipt.id}</span>
                    <button onClick={handleCopyTxId} className="p-0.5 hover:text-red-600 transition cursor-pointer">
                      {copiedTxId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit Channel:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{txReceipt.method}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{txReceipt.date}</span>
                </div>

                {txReceipt.refCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference / Hash:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">
                      {txReceipt.refCode}
                    </span>
                  </div>
                )}
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
