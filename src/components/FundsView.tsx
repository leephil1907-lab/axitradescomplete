import { safeStorage } from '../utils/storage';
import { loadStripe } from '@stripe/stripe-js';
import React, { useState, useEffect } from 'react';
import { subscribePaymentConfig, subscribeSystemConfigWallets } from '../services/paymentConfigService';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowLeft, ShieldCheck, AlertCircle, Clock, CheckCircle2, FileText, QrCode, ExternalLink, CreditCard, X, Copy, Check, RefreshCw, Landmark, HelpCircle, Info, AlertTriangle } from 'lucide-react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import { copyToClipboard } from '../utils/copy';

export function PaymentMethodBrandIcon({ id, className = "w-6 h-6" }: { id: string; className?: string }) {
  switch (id) {
    case 'visa':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#0E4595"/>
          <path d="M13.52 16.32L15.34 7.68H18.2L16.38 16.32H13.52ZM23.86 7.92C23.3 7.7 22.42 7.5 21.36 7.5C18.66 7.5 16.76 8.94 16.74 10.98C16.72 12.5 18.08 13.34 19.12 13.86C20.18 14.38 20.54 14.72 20.54 15.18C20.52 15.88 19.68 16.18 18.9 16.18C17.58 16.18 16.82 15.8 16.22 15.52L15.68 18.06C16.38 18.38 17.68 18.66 19.04 18.66C21.9 18.66 23.76 17.24 23.78 15.04C23.8 13.26 22.72 12.38 21.08 11.58C20.08 11.08 19.48 10.74 19.48 10.2C19.5 9.72 20.04 9.22 21.14 9.22C22.04 9.2 22.68 9.4 23.18 9.62L23.86 7.92ZM29.28 7.68H27.06C26.36 7.68 25.84 7.88 25.56 8.52L21.84 16.32H24.84L25.44 14.68H29.12L29.46 16.32H32.1L29.28 7.68ZM26.26 12.44L27.52 9.02L28.26 12.44H26.26ZM11.88 7.68L9.08 13.58L8.78 12.04C8.28 10.34 6.78 8.44 5.06 7.68L11.88 7.68Z" fill="white"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#141824"/>
          <circle cx="13" cy="12" r="7" fill="#EB001B"/>
          <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
          <path d="M18 6.9A6.97 6.97 0 0 0 15.5 12A6.97 6.97 0 0 0 18 17.1A6.97 6.97 0 0 0 20.5 12A6.97 6.97 0 0 0 18 6.9Z" fill="#FF5F00"/>
        </svg>
      );
    case 'maestro':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#0F172A"/>
          <circle cx="13" cy="12" r="7" fill="#0064E0"/>
          <circle cx="23" cy="12" r="7" fill="#EB001B"/>
          <path d="M18 6.9A6.97 6.97 0 0 0 15.5 12A6.97 6.97 0 0 0 18 17.1A6.97 6.97 0 0 0 20.5 12A6.97 6.97 0 0 0 18 6.9Z" fill="#734BA1"/>
        </svg>
      );
    case 'amex':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#006FCF"/>
          <path d="M7 16l1.2-3.2h2.6L12 16h2.8l-3.3-8H8.5L5.2 16H7zm2.5-5.2l.8 2.2h-1.6l.8-2.2zM14.5 8v8h2.6v-5.2l1.8 5.2h1.6l1.8-5.2V16h2.6V8h-3.4l-1.8 5-1.8-5h-3.4zM25.5 8v8h5.5v-2.2h-3V13h2.6v-2h-2.6V10.2h3V8h-5.5z" fill="white"/>
        </svg>
      );
    case 'discover':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#231F20"/>
          <text x="3" y="15" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="system-ui, sans-serif">DISCOVER</text>
          <circle cx="28" cy="12" r="4" fill="#FF6000"/>
        </svg>
      );
    case 'jcb':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <rect x="5" y="5" width="8" height="14" rx="2" fill="#003780"/>
          <rect x="14" y="5" width="8" height="14" rx="2" fill="#E60012"/>
          <rect x="23" y="5" width="8" height="14" rx="2" fill="#008837"/>
          <text x="6" y="15" fill="#FFFFFF" fontSize="7" fontWeight="900" fontFamily="sans-serif">J</text>
          <text x="15" y="15" fill="#FFFFFF" fontSize="7" fontWeight="900" fontFamily="sans-serif">C</text>
          <text x="24" y="15" fill="#FFFFFF" fontSize="7" fontWeight="900" fontFamily="sans-serif">B</text>
        </svg>
      );
    case 'diners':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#004A97"/>
          <circle cx="18" cy="12" r="7" fill="#FFFFFF"/>
          <circle cx="15.5" cy="12" r="5" fill="#004A97"/>
          <circle cx="20.5" cy="12" r="5" fill="#004A97"/>
          <path d="M18 7v10" stroke="#FFFFFF" strokeWidth="1.5"/>
        </svg>
      );
    case 'unionpay':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#1C2024"/>
          <path d="M6 6h8l-3 12H3l3-12z" fill="#E21B23"/>
          <path d="M12 6h8l-3 12h-8l3-12z" fill="#00447C"/>
          <path d="M18 6h8l-3 12h-8l3-12z" fill="#007B78"/>
          <text x="5" y="15" fill="#FFFFFF" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">UnionPay</text>
        </svg>
      );
    case 'cartebleue':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#0B2B6B"/>
          <rect x="4" y="4" width="28" height="6" fill="#D4AF37" rx="1"/>
          <text x="5" y="17" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="sans-serif">CARTE BLEUE</text>
        </svg>
      );
    case 'elo':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#000000"/>
          <circle cx="12" cy="12" r="4.5" fill="#FF0000"/>
          <circle cx="18" cy="12" r="4.5" fill="#FFCC00"/>
          <circle cx="24" cy="12" r="4.5" fill="#0099FF"/>
          <text x="12" y="15" fill="#FFFFFF" fontSize="8" fontWeight="900" fontFamily="sans-serif">elo</text>
        </svg>
      );
    case 'applepay':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#000000"/>
          <path d="M13.2 10.4c-.4.5-1 .8-1.6.8-.1 0-.2 0-.3 0 .4-1.2 1.5-1.9 2.6-2-.1.6-.3 1.1-.7 1.2zm.7.6c-.6 0-1.2-.3-1.6-.3-.4 0-.9.3-1.4.3-.8 0-1.6-.5-2.1-1.2-1-1.6-.2-4.1 1.4-4.1.7 0 1.2.4 1.6.4.4 0 1.1-.4 1.8-.4.3 0 1.1 0 1.7.8-.1.1-.9.6-.9 1.8 0 1.4 1.2 1.9 1.2 1.9-.1.2-.2.5-.4.8-.4.6-.9 1.2-1.3 1.2z" fill="#FFFFFF"/>
          <text x="18" y="15" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="system-ui, sans-serif">Pay</text>
        </svg>
      );
    case 'googlepay':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#FFFFFF" stroke="#CBD5E1"/>
          <path d="M13.2 11.2v1.8h2.6c-.1.7-.8 2-2.6 2-1.6 0-2.9-1.3-2.9-2.9s1.3-2.9 2.9-2.9c.9 0 1.5.4 1.8.7l1.2-1.2C15.4 8.1 14.4 7.6 13.2 7.6 10.8 7.6 8.8 9.6 8.8 12s2 4.4 4.4 4.4c2.5 0 4.2-1.8 4.2-4.3 0-.3 0-.6-.1-.9h-4.1z" fill="#4285F4"/>
          <text x="19" y="15" fill="#5F6368" fontSize="9" fontWeight="bold" fontFamily="system-ui, sans-serif">Pay</text>
        </svg>
      );
    case 'paypal':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#003087"/>
          <path d="M12 6.5h4.2c2.1 0 3.5 1.1 3.2 2.8-.3 1.9-1.9 2.9-3.7 2.9h-1.8l-.9 5.3h-2.5l1.7-11zm2.3 3.9h1.3c.9 0 1.8-.4 1.9-1.3.1-.8-.5-1.2-1.4-1.2h-1.2l-.6 2.5z" fill="#0079C1"/>
          <text x="18" y="16" fill="#0079C1" fontSize="10" fontWeight="bold" fontFamily="system-ui, sans-serif">Pal</text>
        </svg>
      );
    case 'skrill':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#811E46"/>
          <text x="6" y="16" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.5">skrill</text>
        </svg>
      );
    case 'neteller':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#80B82D"/>
          <text x="3" y="16" fill="#111827" fontSize="8.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.3">NETELLER</text>
        </svg>
      );
    case 'manual_bank':
      return (
        <div className={`${className} bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-800`}>
          <Landmark className="w-5 h-5 text-slate-700" />
        </div>
      );
    case 'usdt':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#26A17B"/>
          <path d="M18 6.5v2.8h5.5V11H18v1.5c3.2.1 5.8.7 5.8 1.5 0 .8-2.6 1.4-5.8 1.5V18h-2v-2.5c-3.2-.1-5.8-.7-5.8-1.5 0-.8 2.6-1.4 5.8-1.5V11h-5.5V9.3H16V6.5h2z" fill="#FFFFFF"/>
        </svg>
      );
    case 'btc':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#F7931A"/>
          <circle cx="18" cy="12" r="7" fill="#FFFFFF" opacity="0.2"/>
          <path d="M20.2 11.2c.4-.3.6-.8.5-1.4 0-1.1-.9-1.6-2.2-1.6h-3V16h3.4c1.3 0 2.4-.6 2.4-1.8 0-.8-.5-1.4-1.1-1.6zM17 9.5h.8c.4 0 .8.2.8.6s-.4.6-.8.6H17V9.5zm1.1 5.1H17v-1.4h1.1c.5 0 .9.2.9.7s-.4.7-.9.7z" fill="#FFFFFF"/>
        </svg>
      );
    case 'eth':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#627EEA"/>
          <path d="M18 5l-4.5 7.5L18 15l4.5-2.5L18 5z" fill="#FFFFFF" opacity="0.9"/>
          <path d="M18 15.8l-4.5-2.5L18 19l4.5-5.7-4.5 2.5z" fill="#FFFFFF" opacity="0.7"/>
        </svg>
      );
    case 'usdc':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#2775CA"/>
          <circle cx="18" cy="12" r="6.5" stroke="#FFFFFF" strokeWidth="1.2"/>
          <path d="M18 8.5c-1.5 0-2.5.8-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1 2-2.5 2m0-8V7m0 8v1.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      );
    case 'sol':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#14151E"/>
          <path d="M12 15.5h11.5l1.5-2H13.5l-1.5 2zm0-7h11.5l1.5-2H13.5l-1.5 2zm12 3.5H12.5l-1.5 2H22.5l1.5-2z" fill="url(#solGrad)"/>
          <defs>
            <linearGradient id="solGrad" x1="11" y1="6.5" x2="25" y2="15.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00FFA3"/>
              <stop offset="1" stopColor="#DC1FFF"/>
            </linearGradient>
          </defs>
        </svg>
      );
    case 'bnb':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#F3BA2F"/>
          <path d="M18 7l2.2 2.2-2.2 2.2-2.2-2.2L18 7zm-5.2 5.2L15 10l2.2 2.2-2.2 2.2-2.2-2.2zm10.4 0L21 10l-2.2 2.2 2.2 2.2 2.2-2.2zM18 15.6l2.2 2.2-2.2 2.2-2.2-2.2 2.2-2.2z" fill="#FFFFFF"/>
        </svg>
      );
    case 'xrp':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#23292F"/>
          <path d="M13 8l5 5 5-5h2.5l-7.5 7.5L10.5 8H13zm0 8l5-5 5 5h2.5l-7.5-7.5L10.5 16H13z" fill="#FFFFFF"/>
        </svg>
      );
    default:
      return (
        <div className={`${className} bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs uppercase`}>
          {id?.slice(0, 3)}
        </div>
      );
  }
}

interface FundsViewProps {
  addTransaction?: (tx: any) => void;
  updateTransactionStatus?: (txId: string, status: string) => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  setView: (view: ViewType) => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
  convertFromUSD?: (usdAmount: number, targetCurrency?: DisplayCurrency) => number;
}

export default function FundsView({ 
  balance, 
  setBalance, 
  liveBalance, 
  setLiveBalance, 
  showToast, 
  transactions, 
  setTransactions, 
  addTransaction, 
  updateTransactionStatus,
  setView,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  convertFromUSD = (amt) => amt
}: FundsViewProps) {
  const [activeTab, setActiveTab] = useState<'Deposit' | 'Withdraw' | 'Transfers' | 'Funding History' | 'Manage'>('Deposit');
  const [step, setStep] = useState<'methods' | 'amount'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [refCode, setRefCode] = useState<string>('');
  const [proofNote, setProofNote] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [selectedFiatGateway, setSelectedFiatGateway] = useState<'moonpay' | 'transak' | 'banxa' | 'ramp'>('moonpay');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardModalBrand, setCardModalBrand] = useState<'visa' | 'mastercard'>('visa');

  const [methodCategory, setMethodCategory] = useState<'all' | 'cards' | 'wallets' | 'bank' | 'crypto'>('all');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardBillingCountry, setCardBillingCountry] = useState('United States');
  const [cardProcessingMode, setCardProcessingMode] = useState<'direct' | 'stripe'>('direct');

  
  const defaultDepositDetails: Record<string, { address: string; memo?: string; network: string }> = {
    'btc': { address: 'bc1qndch4p2dm8hdv4e4t0zm7jaf7ajasnjum25dhu', network: 'Bitcoin (BTC) Mainnet' },
    'eth': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum (ERC20)' },
    'usdt': { address: 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4', network: 'TRON (TRC20)' },
    'usdc': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'Ethereum (ERC20)' },
    'sol': { address: '7ds3cKbJNVXTLcsUea6qj1WsisdqRuqBTYENYi9vsd7F', network: 'Solana Mainnet' },
    'bnb': { address: '0x12107F3eB874442301756daFBd3360418ae3C366', network: 'BNB Smart Chain (BEP20)' },
    'xrp': { address: 'rwyQp3eC5j6AumcptZhfmiXAykpeswZKeJ', memo: '1476340', network: 'Ripple (XRP) Ledger' }
  };


  const [bankSettings, setBankSettings] = useState(() => {
    const saved = safeStorage.getItem('axi_admin_bank_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      instructions: 'Please contact customer support via email at axicustomersupport@gmail.com to receive personalized bank wire routing instructions and account details for your deposit.',
      supportEmail: 'axicustomersupport@gmail.com'
    };
  });

  const [depositDetails, setDepositDetails] = useState<Record<string, { address: string; memo?: string; network: string }>>(() => {
    const saved = safeStorage.getItem('axi_admin_wallet_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return defaultDepositDetails;
  });

    const [customMethods, setCustomMethods] = useState<any[]>(() => {
    const saved = safeStorage.getItem('axi_payment_methods');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  
  const [maintenanceMode, setMaintenanceMode] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribeConfig = subscribePaymentConfig((centralConfig) => {
      if (centralConfig.maintenanceMode) {
        setMaintenanceMode(centralConfig.maintenanceMode);
      }
      if (centralConfig.paymentMethods && centralConfig.paymentMethods.length > 0) {
        setCustomMethods(centralConfig.paymentMethods);
      }
      if (centralConfig.cryptoWallets) {
        setDepositDetails(centralConfig.cryptoWallets as any);
      }
      if (centralConfig.bankSettings) {
        setBankSettings(centralConfig.bankSettings as any);
      }
    });

    const unsubscribeSysWallets = subscribeSystemConfigWallets((wallets) => {
      if (wallets) {
        setDepositDetails(wallets as any);
      }
    });

    const handleUpdate = () => {
       const saved = safeStorage.getItem('axi_payment_methods');
       if (saved) {
         try { setCustomMethods(JSON.parse(saved)); } catch (e) {}
       }
       const savedWallets = safeStorage.getItem('axi_admin_wallet_settings');
       if (savedWallets) {
         try { setDepositDetails(JSON.parse(savedWallets)); } catch (e) {}
       }
    };
    window.addEventListener('axi_payment_methods_updated', handleUpdate);
    window.addEventListener('axi_admin_wallet_settings_updated', handleUpdate);
    return () => {
      unsubscribeConfig();
      unsubscribeSysWallets();
      window.removeEventListener('axi_payment_methods_updated', handleUpdate);
      window.removeEventListener('axi_admin_wallet_settings_updated', handleUpdate);
    };
  }, []);

  const cryptoRates: Record<string, number> = {
    'btc': 65000,
    'eth': 3500,
    'usdt': 1,
    'usdc': 1,
    'sol': 150,
    'bnb': 600,
    'xrp': 0.55
  };

  const getCryptoEquivalent = () => {
    if (!amount || !selectedMethod || !cryptoRates[selectedMethod]) return null;
    const usd = parseFloat(amount);
    if (isNaN(usd) || usd <= 0) return null;
    return (usd / cryptoRates[selectedMethod]).toFixed(selectedMethod === 'usdt' || selectedMethod === 'usdc' ? 2 : 6);
  };
  
  const handleCopyAddress = async (addrOverride?: string | React.MouseEvent) => {
    const targetAddress = typeof addrOverride === 'string' ? addrOverride : (selectedMethod && depositDetails[selectedMethod]?.address);
    if (targetAddress) {
      const ok = await copyToClipboard(targetAddress);
      if (ok) {
        setCopiedAddress(true);
        showToast('Wallet address copied to clipboard!', 'success');
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        showToast('Please select and copy the wallet address manually.', 'error');
      }
    }
  };

  const handleCopyMemo = async () => {
    if (selectedMethod && depositDetails[selectedMethod]?.memo) {
      const ok = await copyToClipboard(depositDetails[selectedMethod].memo!);
      if (ok) {
        setCopiedMemo(true);
        showToast('Memo copied to clipboard!', 'success');
        setTimeout(() => setCopiedMemo(false), 2000);
      }
    }
  };

  // Safe external gateway redirection wrapper with error handling & logging
  const handleGatewayRedirection = (gateway: 'moonpay' | 'transak' | 'banxa' | 'ramp') => {
    try {
      const targetAddress = depositDetails['usdt']?.address || 'TBcivkHbpBh3fa14pPwYemqtNzg7bDQJZ4';
      const targetUrl = 
        gateway === 'moonpay' ? `https://buy.moonpay.com/?walletAddress=${targetAddress}&currencyCode=usdt_tron` :
        gateway === 'transak' ? `https://global.transak.com/?cryptoCurrencyCode=USDT&walletAddress=${targetAddress}` :
        gateway === 'banxa' ? `https://checkout.banxa.com/` :
        `https://buy.ramp.network/`;

      console.log(`[Deposit Gateway] Attempting redirection to ${gateway.toUpperCase()} checkout URL: ${targetUrl}`);

      const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        throw new Error(`Pop-up blocker prevented connection to ${gateway.toUpperCase()}. Please allow pop-ups for this domain and try again.`);
      }

      showToast(`Redirecting to ${gateway.toUpperCase()} Fiat-to-Crypto Gateway...`, 'info');
    } catch (err: any) {
      console.error(`[Deposit Gateway Redirection Error] Connection to gateway failed:`, err);
      showToast(err?.message || `Failed to establish connection with external payment gateway.`, 'error');
    }
  };

  // Use live balance to prevent invalid updates
  const accountType = 'live';

  
  const standardMethods = [
    { id: 'visa', name: 'Visa Credit / Debit Card', category: 'cards', fee: 'Instant, 0% Fee', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg', brandColor: 'border-blue-200 bg-blue-50/50 hover:border-blue-600', tooltip: 'Deposit directly with your Visa card securely' },
    { id: 'mastercard', name: 'MasterCard Credit / Debit', category: 'cards', fee: 'Instant, 0% Fee', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg', brandColor: 'border-orange-200 bg-orange-50/50 hover:border-amber-600', tooltip: 'Deposit directly with your MasterCard securely' }
  ];
  
  const customPaymentMethods = customMethods.map(m => ({
     id: m.id,
     name: m.name,
     category: m.type === 'crypto' ? 'crypto' : (m.type === 'bank' ? 'bank' : 'wallets'),
     fee: 'Instant, 0% Fee',
     icon: m.icon || (m.type === 'crypto' ? 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025' : 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png'),
     brandColor: 'border-slate-200 bg-slate-50/50 hover:border-black',
     tooltip: `Deposit with ${m.name}`,
     walletAddress: m.walletAddress,
     bankName: m.bankName,
     accountName: m.accountName,
     accountNumber: m.accountNumber,
     walletIdentifier: m.walletIdentifier
  }));

  const paymentMethods = [...standardMethods, ...customPaymentMethods];


  // Active Pending Deposit directly pulled from Firestore transactions array
  const activePendingDeposit = transactions.find(t => 
    t.type === 'Deposit' && 
    (t.status === 'Pending Verification' || 
     t.status === 'Pending' || 
     t.status === 'Processing' || 
     t.status === 'Awaiting Payment Confirmation' ||
     t.status === 'Pending Admin Instructions' ||
     (typeof t.status === 'string' && t.status.toLowerCase().includes('pending')))
  );

  const fetchUpdatedTransactions = async () => {
    setIsProcessing(true);
    // In a real app this would query the backend
    setTimeout(() => {
      setIsProcessing(false);
      showToast('Status refreshed from server. Awaiting Stripe payment confirmation.', 'info');
    }, 1500);
  };

  const handleCancelPendingDeposit = (depositId: string) => {
    if (updateTransactionStatus) {
      updateTransactionStatus(depositId, 'Cancelled');
    } else {
      setTransactions(prev => prev.map(t => t.id === depositId ? { ...t, status: 'Cancelled' } : t));
    }
    showToast(`Deposit request #${depositId} marked as Cancelled. Deposit submission form unlocked.`, 'info');
  };

  const handleTabChange = (tabName: 'Deposit' | 'Withdraw' | 'Transfers' | 'Funding History' | 'Manage') => {
    setIsLoadingTab(true);
    setActiveTab(tabName);
    setStep('methods');
    setTimeout(() => setIsLoadingTab(false), 300);
  };

  const handleMethodSelect = (methodId: string) => {
    if (activePendingDeposit) {
      showToast(`Active deposit #${activePendingDeposit.id} is pending payment/audit confirmation. Please complete or cancel it before initiating a new deposit.`, 'info');
      return;
    }
    setSelectedMethod(methodId);
    setStep('amount');
  };

  const handleDeposit = () => {
    if (activePendingDeposit) {
      showToast(`Deposit form disabled: Active deposit #${activePendingDeposit.id} is awaiting confirmation.`, 'error');
      return;
    }
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }
    const selectedObj = paymentMethods.find(m => m.id === selectedMethod);
    const methodName = selectedObj ? selectedObj.name : 'Crypto Deposit';
    const txStatus = 'Pending Verification';
    const newTx = {
      id: `DEP-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
      type: 'Deposit',
      amount: val,
      method: methodName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: txStatus,
      account: 'Live Account',
      refCode: refCode.trim() || `TXN-${Math.floor(Math.random() * 899999 + 100000)}`,
      proofNote: proofNote.trim() || undefined
    };
    if (addTransaction) {
      addTransaction(newTx);
    } else {
      setTransactions(prev => [newTx, ...prev]);
    }
    showToast(`DEPOSIT PENDING: Your deposit request of ${val.toLocaleString()} via ${methodName} is recorded and pending audit review.`, 'info');
    setStep('methods');
    setAmount('');
    setRefCode('');
    setProofNote('');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
  };

  const handleWithdraw = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      showToast('Please enter a valid withdrawal amount', 'error');
      return;
    }

    if (!withdrawAddress.trim()) {
      showToast('Please enter your destination receiving wallet address or account details', 'error');
      return;
    }

    if (val > liveBalance) {
      showToast('Insufficient funds for this withdrawal', 'error');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      
      const newTx = {
        id: `WD-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
        type: 'Withdrawal',
        amount: val,
        method: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Credit / Wire',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Pending Admin Instructions',
        account: 'Live Account',
        refCode: withdrawAddress.trim()
      };
      
      if (addTransaction) {
        addTransaction(newTx);
      }
      
      setLiveBalance(liveBalance - val); // Deduct from balance optimistically
      showToast(`🚨 WITHDRAWAL REQUEST SUBMITTED: Our admin will review and process your payout to ${withdrawAddress.trim()}.`, 'success');
      setStep('methods');
      setAmount('');
      setWithdrawAddress('');
      setActiveTab('Funding History' as any);
    }, 1200);
  };

  return (
    <div className="bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 min-h-[calc(100vh-80px)] pb-24 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Anti-Misfunding Compliance Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-zinc-900 border border-slate-800 rounded-2xl p-5 mb-8 text-white shadow-xl flex items-start justify-between gap-4 flex-col sm:flex-row backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-3.5 z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-white tracking-wide text-sm uppercase">
                  Strict Anti-Misfunding Protocol Active
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ADMIN VERIFIED
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed font-medium">
                To guarantee zero misfunding errors and maintain top-tier FCA & ASIC regulatory compliance, all deposits submitted are verified by Axi Compliance before account trading balance activation.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setView('settings')}
            className="z-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center transition-all hover:scale-102"
          >
            <FileText className="w-4 h-4" /> Track Verification Status
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-gradient-to-r from-[#E3000F] to-[#CC000D] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-xs">
                Official Gateway
              </span>
              <span className="text-slate-400 text-xs font-semibold">• 0% Axi Deposit Fee</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deposit & Account Funding</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Instantly top up trading capital via 256-bit encrypted global payment channels</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl shadow-inner self-start lg:self-auto">
            {setDisplayCurrency && (
              <CurrencySelector
                displayCurrency={displayCurrency}
                setDisplayCurrency={setDisplayCurrency}
                variant="compact"
              />
            )}

            <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs min-w-[130px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Live Balance</span>
              </div>
              <span className="text-xl font-black text-emerald-600 font-mono tracking-tight">
                {formatCurrency(liveBalance)}
              </span>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-2xs min-w-[140px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pending Audit</span>
              </div>
              <span className="text-xl font-black text-amber-500 font-mono tracking-tight">
                {formatCurrency(transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending Verification').reduce((acc, curr) => acc + (curr.amount || 0), 0))}
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar mb-8 border border-slate-200">
          {[
            { id: 'Deposit', label: '💳 Deposit Capital', badge: '0% Fee' },
            { id: 'Withdraw', label: '🏧 Withdrawal', badge: null },
            { id: 'Transfers', label: '🔄 Internal Transfer', badge: null },
            { id: 'Funding History', label: '📜 Funding History', badge: transactions.length > 0 ? transactions.length : null },
            { id: 'Manage', label: '⚙️ Payment Settings', badge: null }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setStep('methods');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-102' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-[#E3000F] text-white' 
                    : 'bg-slate-300/80 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'Deposit' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Global Maintenance Alert Banner */}
            {maintenanceMode?.active && maintenanceMode?.disableDeposits !== false && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 text-amber-900 shadow-md flex items-start gap-3.5">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="font-extrabold text-amber-800 uppercase tracking-wide flex items-center gap-2">
                    <span>Platform Deposit Maintenance Active</span>
                    <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                      PAUSED
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {maintenanceMode.message || 'Deposit requests are temporarily paused for scheduled maintenance.'}
                  </p>
                </div>
              </div>
            )}
            {/* Visual Status Indicator: Pulls live status directly from Firestore document */}
            {activePendingDeposit && (
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border-2 border-amber-500/50 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-start justify-between gap-4 flex-col sm:flex-row relative z-10 border-b border-amber-500/20 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
                      <Clock className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full border border-amber-500/30">
                          ⚡ LIVE FIRESTORE TRANSACTION MONITOR
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          FIRESTORE SYNCED
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-white mt-1">
                        Active Deposit Awaiting Payment & Audit Confirmation
                      </h3>
                    </div>
                  </div>

                  <div className="text-right self-end sm:self-auto bg-slate-900/90 border border-amber-500/30 px-4 py-2 rounded-xl shadow-xs relative group">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center justify-end gap-1">
                      Document Status
                      <HelpCircle className="w-3 h-3 text-amber-400 cursor-help" />
                    </span>
                    <span className="text-xs font-black font-mono text-amber-400 flex items-center justify-end gap-1.5 cursor-help">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      {activePendingDeposit.status}
                    </span>

                    {/* Tooltip Popup */}
                    <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-amber-500/40 text-[11px] font-medium z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 text-left">
                      <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                        <Info className="w-3.5 h-3.5 text-amber-400" /> Clearance Window Notice
                      </div>
                      <p className="text-slate-300 leading-snug">
                        Transactions may take 1-3 business days to clear depending on your bank or payment provider. Once verified, funds are automatically credited to your live balance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid pulled directly from document */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Ref ID</span>
                    <span className="font-mono font-extrabold text-amber-300">{activePendingDeposit.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Amount</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">${activePendingDeposit.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Payment Method</span>
                    <span className="font-bold text-slate-200">{activePendingDeposit.method}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Timestamp</span>
                    <span className="font-mono text-slate-300">{activePendingDeposit.date}</span>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Payment Gateway & Audit Status</span>
                    <span className="text-amber-400 font-mono text-[10px]">Step 2 of 3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-300 font-bold flex flex-col items-center">
                      <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-400" />
                      <span>1. Request Recorded</span>
                    </div>
                    <div className="bg-amber-950/60 border border-amber-500/50 p-2.5 rounded-xl text-amber-300 font-bold flex flex-col items-center shadow-lg">
                      <RefreshCw className="w-4 h-4 mb-1 text-amber-400 animate-spin" />
                      <span>2. Webhook / Bank Audit</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-slate-500 font-medium flex flex-col items-center">
                      <ShieldCheck className="w-4 h-4 mb-1 text-slate-600" />
                      <span>3. Firestore Credit</span>
                    </div>
                  </div>
                </div>

                {/* Stripe Live Webhook Audit */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <button
                    onClick={fetchUpdatedTransactions}
                    disabled={isProcessing}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 px-4 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Refresh Payment Status
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCancelPendingDeposit(activePendingDeposit.id)}
                    className="bg-slate-800 hover:bg-red-950/80 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800 font-bold text-xs py-3.5 px-4 rounded-xl transition cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </div>
              </div>
            )}

            {/* High-Tech Stepper Header */}
            <div className="grid grid-cols-3 gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 'methods' 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-emerald-50 text-emerald-900 font-semibold'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  step === 'methods' ? 'bg-[#E3000F] text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {step === 'methods' ? '1' : '✓'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black uppercase tracking-wider">Step 1</div>
                  <div className="text-[11px] opacity-80">Select Channel</div>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 'amount' 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-slate-100 text-slate-500 font-medium'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  step === 'amount' ? 'bg-[#E3000F] text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  2
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black uppercase tracking-wider">Step 2</div>
                  <div className="text-[11px] opacity-80">Enter Amount</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 text-slate-500 font-medium">
                <div className="w-7 h-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black uppercase tracking-wider">Step 3</div>
                  <div className="text-[11px] opacity-80">Admin Verification</div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'methods' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">Select Funding Method</h2>
                      <p className="text-xs text-slate-500 font-semibold">Zero deposit fees. Instant processing on cards & crypto gateways.</p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 text-xs font-bold overflow-x-auto">
                      {[
                        { id: 'all', label: 'All Channels' },
                        { id: 'cards', label: '💳 Cards' },
                        { id: 'wallets', label: '👛 E-Wallets' },
                        { id: 'bank', label: '🏦 Bank Wire' },
                        { id: 'crypto', label: '🪙 Crypto' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setMethodCategory(cat.id as any)}
                          className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer text-xs font-bold ${
                            methodCategory === cat.id
                              ? 'bg-gradient-to-r from-[#E3000F] to-[#C62828] text-white shadow-md shadow-red-500/20'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods
                      .filter(method => methodCategory === 'all' || method.category === methodCategory)
                      .map(method => (
                      <button 
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-[#E3000F] rounded-2xl p-4.5 flex items-center justify-between transition-all duration-200 text-left cursor-pointer group shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                        title={method.tooltip || method.name}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-13 h-13 flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl p-2 shrink-0 shadow-2xs group-hover:bg-white group-hover:border-red-200 transition-all overflow-hidden">
                            <PaymentMethodBrandIcon id={method.id} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-extrabold text-slate-900 text-sm group-hover:text-[#E3000F] transition-colors">{method.name}</span>
                              {method.category === 'cards' && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  INSTANT
                                </span>
                              )}
                              {method.category === 'crypto' && (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  24/7
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {method.fee}
                            </span>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#E3000F] text-slate-400 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'amount' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col gap-6"
                >
                  <button 
                    onClick={() => setStep('methods')}
                    className="flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors self-start bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to channel selection
                  </button>
                  
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 flex items-center justify-center bg-slate-50 border border-slate-200/90 rounded-2xl p-2 shrink-0 shadow-xs overflow-hidden">
                        <PaymentMethodBrandIcon id={selectedMethod || ''} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-lg">{paymentMethods.find(m => m.id === selectedMethod)?.name}</h3>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                            0% Axi Fee
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Instant secure channel • 256-Bit SSL Encrypted</p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Trading Wallet</span>
                      <span className="text-xs font-black text-slate-800 font-mono">Live USD Wallet</span>
                    </div>
                  </div>

                  {/* Amount Input with Quick Preset Chips */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Deposit Amount (USD) *</label>
                      <span className="text-xs font-semibold text-slate-500">Min: $10.00 • Max: $100,000</span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 font-mono">$</span>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="1,000"
                        className="w-full border-2 border-slate-200 focus:border-[#E3000F] rounded-2xl pl-10 pr-4 py-4 outline-none font-mono text-2xl font-black text-slate-900 bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Quick Select:</span>
                      {['100', '500', '1000', '2500', '5000', '10000'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs border transition-all cursor-pointer ${
                            amount === preset 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          +${parseInt(preset).toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {getCryptoEquivalent() && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Live Market Crypto Conversion:</span>
                        <span className="font-mono text-sm text-emerald-700">{getCryptoEquivalent()} {selectedMethod?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  
                  {(paymentMethods.find(m => m.id === selectedMethod)?.category === 'cards') && (
                    <div className="flex flex-col gap-4 mt-1">
                      {/* Express Mobile Wallet Buttons (Apple Pay & Google Pay) */}
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedMethod('applepay');
                            showToast('Apple Pay Express Checkout initiated', 'info');
                          }}
                          className="w-full bg-black hover:bg-zinc-800 active:bg-zinc-900 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                        >
                          <span className="text-base flex items-center gap-1 font-semibold">
                             <span className="font-bold">Pay</span>
                          </span>
                        </button>

                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedMethod('googlepay');
                            showToast('Google Pay Express Checkout initiated', 'info');
                          }}
                          className="w-full bg-black hover:bg-zinc-800 active:bg-zinc-900 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
                        >
                          <span className="text-base flex items-center gap-1.5 font-semibold">
                            <span className="text-blue-400 font-black">G</span> <span className="font-bold">Pay</span>
                          </span>
                        </button>
                      </div>

                      {/* Main Stripe Card Checkout Container */}
                      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col text-slate-900">
                        {/* Header Row: Card Details & Supported Brands */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">Credit or Debit Card</div>
                              <div className="text-[11px] text-slate-500 font-medium">PCI-DSS Level 1 Encrypted via Stripe</div>
                            </div>
                          </div>

                          {/* Card Brand Logos */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="bg-blue-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">VISA</span>
                            <div className="flex items-center bg-slate-900 px-1.5 py-0.5 rounded shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-red-500 -mr-1"></span>
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            </div>
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">AMEX</span>
                            <span className="bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">DISCOVER</span>
                            <span className="bg-blue-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">JCB</span>
                            <span className="bg-teal-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">UNIONPAY</span>
                            <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter shadow-2xs">ELO</span>
                          </div>
                        </div>

                        {/* Card Form Inputs */}
                        <div className="p-5 flex flex-col gap-4 bg-white">
                          {/* Name on Card */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Name on card</label>
                            <input
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="e.g. JOHN H. SMITH"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                            />
                          </div>

                          {/* Card Number */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Card number</label>
                            <div className="relative">
                              <input
                                type="text"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                                  const formatted = raw.replace(/(.{4})/g, '$1 ').trim();
                                  setCardNumber(formatted);
                                }}
                                placeholder="1234  5678  9101  1121"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-28 py-2.5 text-sm font-mono font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                <span className="text-[9px] font-bold bg-blue-900 text-white px-1 py-0.5 rounded">VISA</span>
                                <span className="text-[9px] font-bold bg-blue-600 text-white px-1 py-0.5 rounded">AMEX</span>
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block -mr-1"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                              </div>
                            </div>
                          </div>

                          {/* Expiration + CVC */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Expiry date</label>
                                <span className="text-[10px] text-slate-400 font-normal">MM/YY</span>
                              </div>
                              <input
                                type="text"
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                                  setCardExpiry(val);
                                }}
                                placeholder="MM / YY"
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Security code (CVV)</label>
                                <span className="text-[10px] text-slate-400 font-normal">3-4 digits</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="password"
                                  maxLength={4}
                                  value={cardCvc}
                                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                                  placeholder="CVC"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-8 py-2.5 text-sm font-mono font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                                />
                                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          {/* Billing Country */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Billing Country</label>
                            <select
                              value={cardBillingCountry}
                              onChange={(e) => setCardBillingCountry(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
                            >
                              {['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Austria', 'Belgium', 'Ireland', 'New Zealand', 'Singapore', 'Japan', 'South Korea', 'United Arab Emirates', 'Saudi Arabia', 'Israel', 'South Africa', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'India', 'China', 'Hong Kong', 'Taiwan', 'Malaysia', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines', 'Turkey', 'Egypt', 'Nigeria', 'Kenya'].map(country => (
                                <option key={country} value={country}>{country}</option>
                              ))}
                            </select>
                          </div>

                          {/* Primary Payment Action Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              const val = parseFloat(amount);
                              if (!val || val <= 0) {
                                showToast('Please enter a valid deposit amount first', 'error');
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                const res = await fetch('/api/stripe/create-checkout-session', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ amount: val, currency: 'usd' })
                                });
                                const data = await res.json();
                                if (data.url) {
                                  showToast('Redirecting to secure Stripe Checkout...', 'info');
                                  window.location.href = data.url;
                                  return;
                                } else {
                                  showToast(data.error || 'Stripe Checkout Error. Please check API key configuration.', 'error');
                                }
                              } catch (e: any) {
                                console.error('Stripe Checkout Error:', e);
                                showToast(`Stripe Payment Error: ${e.message || 'Connection failed'}`, 'error');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full mt-2 bg-[#E3000F] hover:bg-[#CC000D] active:bg-[#B3000B] text-white font-extrabold py-3.5 px-4 rounded-xl text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              `Pay $${parseFloat(amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })} with Stripe`
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Security Trust Badges Footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
                        </span>
                        <span>3D Secure (3DS v2) Verified</span>
                        <span>PCI-DSS Level 1 Compliant</span>
                      </div>
                    </div>
                  )}

                  {['manual_bank', 'bank'].includes(selectedMethod || '') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3 shadow-xs">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed font-medium">
                        <span className="font-extrabold text-amber-950 uppercase tracking-wider block mb-1">Manual Bank Transfer Instructions</span> 
                        {bankSettings.instructions} <br/><br/><a href={`mailto:${bankSettings.supportEmail}`} className="font-bold underline text-brand-red hover:text-red-700">{bankSettings.supportEmail}</a>
                      </div>
                    </div>
                  )}

                  {selectedMethod && depositDetails[selectedMethod] && !['visa', 'mastercard', 'applepay', 'googlepay', 'paypal', 'skrill'].includes(selectedMethod) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Send {paymentMethods.find(m => m.id === selectedMethod)?.name} Deposit
                        </span>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase font-mono">
                          Network: {depositDetails[selectedMethod].network}
                        </span>
                      </div>

                      {/* Deposit Barcode QR Code */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                        <div className="bg-white p-2 border border-slate-200 rounded-lg shrink-0 shadow-xs flex flex-col items-center">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(depositDetails[selectedMethod].address)}`} 
                            alt={`${paymentMethods.find(m => m.id === selectedMethod)?.name} Barcode QR`} 
                            className="w-32 h-32 object-contain"
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">SCAN QR BARCODE</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-brand-red" />
                            Crypto Deposit Address Barcode
                          </span>
                          <p>Scan this barcode QR with your Mobile Crypto Wallet App (Trust Wallet, Binance App, Coinbase, Metamask, SafePal) to deposit directly without manual typing errors.</p>
                          <div className="text-[10px] font-mono text-slate-800 bg-slate-100 p-2 rounded border border-slate-200 break-all mt-1.5 font-bold">
                            {depositDetails[selectedMethod].address}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Official Wallet Deposit Address</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            readOnly 
                            value={depositDetails[selectedMethod].address}
                            className="w-full border border-slate-300 rounded-lg bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 select-all shadow-xs"
                          />
                          <button
                            onClick={() => handleCopyAddress()}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
                          >
                            {copiedAddress ? 'COPIED!' : 'COPY ADDRESS'}
                          </button>
                        </div>
                      </div>

                      {depositDetails[selectedMethod].memo && (
                        <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Destination Memo / Tag (REQUIRED FOR XRP)</label>
                            <span className="text-[10px] text-amber-800 font-bold">Must include when sending XRP</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={depositDetails[selectedMethod].memo}
                              className="w-full border border-amber-300 rounded-lg bg-white px-3.5 py-2 font-mono text-sm font-black text-amber-950 select-all"
                            />
                            <button
                              onClick={handleCopyMemo}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                            >
                              {copiedMemo ? 'COPIED!' : 'COPY MEMO'}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 font-medium">
                        ⚠️ Important: Send only <strong className="text-slate-800">{paymentMethods.find(m => m.id === selectedMethod)?.name}</strong> via <strong className="text-slate-800">{depositDetails[selectedMethod].network}</strong> to this address.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Payment Transaction Hash / Reference (Optional)</label>
                    <input 
                      type="text"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      placeholder="e.g. TXN-892341908 or Crypto Hash 0x..."
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-[#E3000F] font-mono text-sm font-bold text-slate-800 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Proof Note / Bank Wire Sender Name (Optional)</label>
                    <textarea 
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="Add payment verification note or bank wire sender name for the admin..."
                      rows={2}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-[#E3000F] text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed font-semibold">
                      <span className="font-extrabold uppercase tracking-wider text-amber-950 block mb-0.5">Automated Admin Verification:</span> 
                      Once you submit this deposit notification, Axi Compliance will audit your transaction details and credit your account live trading balance immediately.
                    </div>
                  </div>

                  {activePendingDeposit ? (
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black text-xl">
                        🔒
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Deposit Form Submission Locked</h4>
                        <p className="text-xs text-slate-600 font-medium max-w-md mt-1">
                          You currently have an active pending deposit (<span className="font-mono font-bold text-amber-700">{activePendingDeposit.id}</span>) of <strong className="text-slate-900 font-mono">${activePendingDeposit.amount?.toLocaleString()}</strong> awaiting payment confirmation.
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep('methods')}
                        className="mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md"
                      >
                        Return & View Active Transaction Monitor
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={async () => {
                        if (maintenanceMode?.active && maintenanceMode?.disableDeposits !== false) {
                          showToast(`⚠️ ${maintenanceMode.message || 'Deposits are disabled for maintenance.'}`, 'error');
                          return;
                        }
                        const isStripeMethod = ['visa', 'mastercard', 'applepay', 'googlepay', 'paypal', 'skrill', 'card'].includes(selectedMethod || '');
                        if (isStripeMethod) {
                          const val = parseFloat(amount);
                          if (!val || val <= 0) {
                            showToast('Please enter a valid deposit amount first', 'error');
                            return;
                          }
                          setIsProcessing(true);
                          try {
                            const res = await fetch('/api/stripe/create-checkout-session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ amount: val, currency: 'usd' })
                            });
                            const data = await res.json();
                            if (data.url) {
                              showToast('Redirecting to secure Stripe Checkout...', 'info');
                              window.location.href = data.url;
                              return;
                            } else {
                              showToast(data.error || 'Stripe Checkout Error. Please check API key configuration.', 'error');
                            }
                          } catch (e: any) {
                            console.error('Stripe Checkout Error:', e);
                            showToast(`Stripe Payment Error: ${e.message || 'Connection failed'}`, 'error');
                          } finally {
                            setIsProcessing(false);
                          }
                        } else {
                          handleDeposit();
                        }
                      }}
                      disabled={isProcessing || !amount || (maintenanceMode?.active && maintenanceMode?.disableDeposits !== false)}
                      className="bg-gradient-to-r from-[#E3000F] via-[#EB1C24] to-[#C62828] hover:from-[#FF1E27] hover:to-[#B71C1C] disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-xl transition-all w-full uppercase tracking-wider text-base mt-2 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {maintenanceMode?.active && maintenanceMode?.disableDeposits !== false
                        ? 'Deposits Paused (Maintenance Mode Active)'
                        : isProcessing 
                          ? 'Processing Securely...' 
                          : ['visa', 'mastercard', 'applepay', 'googlepay', 'paypal', 'skrill'].includes(selectedMethod || '') 
                            ? `Pay $${amount || '0.00'} Securely` 
                            : `Submit Deposit Notification ($${amount || '0.00'})`}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'Withdraw' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 'methods' 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-emerald-50 text-emerald-900 font-semibold'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  step === 'methods' ? 'bg-[#E3000F] text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {step === 'methods' ? '1' : '✓'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black uppercase tracking-wider">Step 1</div>
                  <div className="text-[11px] opacity-80">Select Channel</div>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 'amount' 
                  ? 'bg-slate-900 text-white font-bold shadow-sm' 
                  : 'bg-slate-100 text-slate-500 font-medium'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                  step === 'amount' ? 'bg-[#E3000F] text-white' : 'bg-slate-300 text-slate-700'
                }`}>
                  2
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black uppercase tracking-wider">Step 2</div>
                  <div className="text-[11px] opacity-80">Details & Request</div>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 'methods' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6"
                >
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h2 className="text-lg font-black text-slate-900">Select Withdrawal Channel</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Withdraw earnings to your verified personal bank account or crypto wallet.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map(method => (
                      <button 
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-[#E3000F] rounded-2xl p-4.5 flex items-center justify-between transition-all duration-200 text-left cursor-pointer group shadow-xs hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-13 h-13 flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl p-2 shrink-0 shadow-2xs group-hover:bg-white group-hover:border-red-200 transition-all overflow-hidden">
                            <PaymentMethodBrandIcon id={method.id} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-[#E3000F] transition-colors">{method.name}</span>
                            <span className="text-xs text-slate-500 font-semibold">{method.fee}</span>
                          </div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#E3000F] text-slate-400 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'amount' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col gap-6"
                >
                  <button 
                    onClick={() => setStep('methods')}
                    className="flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition-colors self-start bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to withdrawal options
                  </button>
                  
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                    <div className="w-14 h-14 flex items-center justify-center bg-slate-50 border border-slate-200/90 rounded-2xl p-2 shrink-0 shadow-xs overflow-hidden">
                      <PaymentMethodBrandIcon id={selectedMethod || ''} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{paymentMethods.find(m => m.id === selectedMethod)?.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Provide payout amount and destination details for compliance audit approval.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Withdrawal Amount (USD) *</label>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Available Balance: ${liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 font-mono">$</span>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="1,000.00"
                        className="w-full border-2 border-slate-200 focus:border-[#E3000F] rounded-2xl pl-10 pr-4 py-4 outline-none font-mono text-2xl font-black text-slate-900 bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Your Receiving {paymentMethods.find(m => m.id === selectedMethod)?.name} Destination Address / IBAN *
                    </label>
                    <input 
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={
                        selectedMethod === 'btc' ? 'Enter your BTC wallet receiving address...' :
                        selectedMethod === 'eth' || selectedMethod === 'usdc' ? 'Enter your Ethereum (0x...) receiving wallet address...' :
                        selectedMethod === 'usdt' ? 'Enter your Tether TRC20 (T...) receiving wallet address...' :
                        selectedMethod === 'sol' ? 'Enter your Solana receiving wallet address...' :
                        selectedMethod === 'xrp' ? 'Enter your Ripple (XRP) receiving address and Memo if required...' :
                        selectedMethod === 'manual_bank' || selectedMethod === 'bank' ? 'Enter your Bank Name, IBAN / Account Number, and SWIFT code...' :
                        'Enter your receiving wallet address or account details...'
                      }
                      className="w-full border-2 border-slate-200 focus:border-[#E3000F] rounded-2xl px-4 py-3.5 outline-none font-mono text-sm font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed font-semibold">
                      <span className="font-extrabold uppercase tracking-wider text-amber-950 block mb-0.5">Fast-Track Compliance Payout:</span> 
                      Withdrawal requests are processed within 1-2 hours upon confirmation by Axi compliance.
                    </div>
                  </div>

                  <button 
                    onClick={handleWithdraw}
                    disabled={isProcessing || !amount}
                    className="bg-gradient-to-r from-[#E3000F] via-[#EB1C24] to-[#C62828] hover:from-[#FF1E27] hover:to-[#B71C1C] disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-xl transition-all w-full uppercase tracking-wider text-base mt-2 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? 'Submitting Request...' : 'Request Payout Confirmation'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'Funding History' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-4 shadow-md">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider">Deposit & Funding History Log</h3>
                <p className="text-xs text-slate-400 font-medium">Real-time status tracking and audit receipts</p>
              </div>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold px-3 py-1 rounded-lg">
                Total Records: {transactions.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Method & Ref</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500 font-semibold">
                        No deposit history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 text-sm font-mono font-black text-slate-900">{tx.id}</td>
                        <td className="p-4 text-xs font-medium text-slate-600">{tx.date}</td>
                        <td className="p-4 text-sm font-extrabold text-slate-800">{tx.type}</td>
                        <td className="p-4 text-xs text-slate-600">
                          <div className="font-extrabold text-slate-900">{tx.method}</div>
                          {tx.refCode && <div className="text-[10px] font-mono text-slate-500 mt-0.5">Ref: {tx.refCode}</div>}
                        </td>
                        <td className="p-4 text-sm font-black text-slate-900 font-mono">${(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right">
                          <div className="relative group inline-block text-right">
                            <span 
                              className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-full border shadow-2xs inline-flex items-center gap-1 cursor-help ${
                              (tx.status === 'Completed' || tx.status === 'Approved')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : tx.status === 'Rejected' 
                                ? 'bg-rose-50 text-rose-800 border-rose-300' 
                                : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                            }`}>
                              {tx.status || 'Pending Verification'}
                              {(tx.status !== 'Completed' && tx.status !== 'Approved' && tx.status !== 'Rejected') && (
                                <HelpCircle className="w-3 h-3 text-amber-700 shrink-0" />
                              )}
                            </span>

                            {(tx.status !== 'Completed' && tx.status !== 'Approved' && tx.status !== 'Rejected') && (
                              <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] font-normal z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-700 text-left">
                                <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                                  <Info className="w-3.5 h-3.5 text-amber-400" /> Pending Clearance
                                </div>
                                <p className="text-slate-300 leading-snug">
                                  Transactions may take 1-3 business days to clear depending on your bank/provider.
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab !== 'Deposit' && activeTab !== 'Withdraw' && activeTab !== 'Funding History' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center mt-4 shadow-md flex flex-col items-center gap-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Privileged Feature Locked</h3>
              <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">Please complete your Level 1 KYC identity verification to unlock internal transfers and custom wallet management privileges.</p>
            </div>
            <button 
              onClick={() => setView('settings')}
              className="mt-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md"
            >
              <FileText className="w-4 h-4 text-amber-400" /> Complete Identity Verification
            </button>
          </div>
        )}
      </div>

      {/* Visa / MasterCard Redirection Modal */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-900"
            >
              {/* Modal Header */}
              <div className={`p-5 text-white flex items-center justify-between border-b ${
                cardModalBrand === 'visa' ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-800' : 'bg-gradient-to-r from-slate-900 to-stone-900 border-amber-900/40'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-lg shrink-0 border border-slate-200 shadow-xs">
                    <PaymentMethodBrandIcon id={cardModalBrand} className="w-10 h-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base uppercase tracking-wider text-white">
                      {cardModalBrand === 'visa' ? 'Visa' : 'MasterCard'} Deposit Gateway
                    </h3>
                    <p className="text-[11px] text-slate-300 font-medium">Fiat-to-Crypto Direct Checkout</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCardModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Explanation Process */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-2">
                  <div className="font-extrabold flex items-center gap-1.5 text-blue-900">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    How {cardModalBrand === 'visa' ? 'Visa' : 'MasterCard'} Fiat-to-Crypto Works
                  </div>
                  <p className="leading-relaxed">
                    To deposit via <strong>{cardModalBrand === 'visa' ? 'Visa' : 'MasterCard'}</strong>, select a verified checkout partner below. You will purchase USDT or Bitcoin directly with your debit/credit card, which is delivered instantly to your Axi deposit wallet address below.
                  </p>
                </div>

                {/* Deposit Address Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Target Axi Deposit Wallet Address (USDT TRC20)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={depositDetails['usdt']?.address}
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 font-mono text-xs font-bold text-slate-900 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(depositDetails['usdt']?.address)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                </div>

                {/* Dynamic Barcode QR */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4">
                  <div className="bg-white p-2 border border-slate-200 rounded-lg shrink-0 shadow-xs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(depositDetails['usdt']?.address || '')}`} 
                      alt="Deposit Barcode QR" 
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <span className="font-extrabold text-slate-900 block text-xs flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-brand-red" />
                      Scan QR Barcode with Wallet
                    </span>
                    <p className="text-[11px] leading-snug">Or scan this QR barcode with your mobile crypto wallet (Trust Wallet, Binance, Metamask, SafePal) to transfer instantly.</p>
                  </div>
                </div>

                {/* Gateway Provider Options */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    Select Licensed Card Gateway Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'moonpay', name: 'MoonPay' },
                      { id: 'transak', name: 'Transak' },
                      { id: 'banxa', name: 'Banxa' },
                      { id: 'ramp', name: 'Ramp' }
                    ].map(gateway => (
                      <button
                        key={gateway.id}
                        type="button"
                        onClick={() => setSelectedFiatGateway(gateway.id as any)}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                          selectedFiatGateway === gateway.id 
                            ? 'bg-brand-red text-white border-brand-red shadow-xs' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{gateway.name}</span>
                        <span className="text-[9px] font-mono opacity-80">0% Card Fee</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Redirection Action Button */}
                <button
                  type="button"
                  onClick={() => handleGatewayRedirection(selectedFiatGateway)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Proceed to Buy Crypto & Deposit via {selectedFiatGateway.toUpperCase()}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

