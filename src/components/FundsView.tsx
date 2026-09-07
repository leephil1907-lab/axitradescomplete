import { authHeaders } from '../utils/authHeaders';

const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = await authHeaders(init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {});
  return fetch(input, { ...init, headers });
};
import React, { useState, useEffect } from 'react';

async function readApiJson(response: Response) {
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 180);
    throw new Error(`Payment API returned an invalid response (HTTP ${response.status})${preview ? ': ' + preview : '.'}`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error(`Payment API returned an unexpected response (HTTP ${response.status}).`);
  }
  return data;
}
import { 
  CreditCard, 
  ArrowDownRight, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Wallet, 
  DollarSign, 
  Plus, 
  Trash2, 
  Upload, 
  Info,
  Layers,
  ChevronRight,
  Sparkles,
  FileCheck,
  Send,
  X,
  Globe,
  SlidersHorizontal,
  Coins
} from 'lucide-react';
import { ViewType, DisplayCurrency } from '../types';
import CurrencySelector from './CurrencySelector';
import { copyToClipboard } from '../utils/copy';
import { defaultCryptoWallets, defaultBankSettings, subscribePaymentConfig, getLocalPaymentConfig, CentralPaymentConfig } from '../services/paymentConfigService';
import { safeStorage } from '../utils/storage';
import { auth } from '../firebase';

export function PaymentMethodBrandIcon({ id, className = "w-6 h-6" }: { id: string; className?: string }) {
  switch (id) {
    case 'visa':
    case 'card':
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
    case 'paypal':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal" role="img">
          <circle cx="24" cy="24" r="23" fill="white" stroke="#D7DEE8"/>
          <path d="M17 35 20.8 12h8.7c5.6 0 8.7 2.7 7.7 7.1-.9 4.6-4.2 6.8-9.3 6.8h-3.4L23 35H17Z" fill="#003087"/>
          <path d="m22 31.5 1.5-8.7h4.5c4.8 0 7.7-2.1 8.6-5.7.2.6.2 1.3 0 2.1-.9 4.6-4.2 6.8-9.3 6.8h-3.4l-1 5.5H22Z" fill="#009CDE"/>
        </svg>
      );
    case 'skrill':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#811243"/>
          <text x="18" y="16" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">SKRILL</text>
        </svg>
      );
    case 'neteller':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#86B817"/>
          <text x="18" y="16" fill="white" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">NETELLER</text>
        </svg>
      );
    case 'perfectmoney':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#ED1C24"/>
          <text x="18" y="16" fill="white" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">PM</text>
        </svg>
      );
    case 'astropay':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#E62529"/>
          <text x="18" y="15" fill="white" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">ASTROPAY</text>
        </svg>
      );
    case 'bank':
    case 'bank_wire':
    case 'bank_instant':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#1E293B"/>
          <path d="M18 5L9 9v2h18V9L18 5zM11 12v6h2v-6h-2zm5 0v6h2v-6h-2zm5 0v6h2v-6h-2zM9 19v2h18v-2H9z" fill="#F8FAFC"/>
        </svg>
      );
    case 'btc':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#F7931A"/>
          <path d="M21.5 11.2c.4-.3.6-.8.6-1.5 0-1.4-1.1-2.2-2.8-2.2H14v9h5.6c1.8 0 3.1-.9 3.1-2.4 0-.9-.4-1.6-1.2-1.9zm-4.9-2.1h2.3c.8 0 1.3.3 1.3 1 0 .6-.5 1-1.3 1h-2.3V9.1zm2.7 5.4h-2.7v-2.2h2.7c.9 0 1.5.4 1.5 1.1 0 .7-.6 1.1-1.5 1.1z" fill="white"/>
        </svg>
      );
    case 'eth':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#627EEA"/>
          <path d="M18 4l-5 8.5L18 15l5-2.5L18 4zm0 12l-5-2.5L18 20l5-6.5L18 16z" fill="white" fillOpacity="0.9"/>
        </svg>
      );
    case 'usdt':
    case 'usdt_trc20':
    case 'usdt_erc20':
    case 'usdt_bep20':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#26A17B"/>
          <path d="M19.8 12.2v-.01c1.8-.1 3.2-.5 3.2-1 0-.6-1.5-1.1-3.4-1.1s-3.4.5-3.4 1.1c0 .5 1.4.9 3.2 1v3.8h.4v-3.8zm-.2-3.1h-4.6V7.5H23v1.6h-4.6v1.4c1.7.1 3 .4 3 .9 0 .6-1.6 1.1-3.6 1.1s-3.6-.5-3.6-1.1c0-.5 1.3-.8 3-1V9.1h-1.6z" fill="white"/>
        </svg>
      );
    case 'usdc':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#2775CA"/>
          <circle cx="18" cy="12" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M18 7.5v9M15.5 10c0-1.1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5c0 2-5 1.5-5 3.5 0 1.1 1.1 1.5 2.5 1.5s2.5-.4 2.5-1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'sol':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#030303"/>
          <path d="M11 16.5l2-2h12l-2 2H11zm0-4.5l2-2h12l-2 2H11zm2-4.5h12l-2 2H11l2-2z" fill="#14F195"/>
        </svg>
      );
    case 'bnb':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#F3BA2F"/>
          <path d="M18 7l2.5 2.5-2.5 2.5-2.5-2.5L18 7zm-4.5 4.5l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5zm9 0l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5zM18 12l2.5 2.5-2.5 2.5-2.5-2.5L18 12z" fill="white"/>
        </svg>
      );
    case 'xrp':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#23292F"/>
          <path d="M13 8l5 5 5-5h2.5l-7.5 7.5L10.5 8H13zm0 8l5-5 5 5h2.5l-7.5-7.5L10.5 16H13z" fill="#FFFFFF"/>
        </svg>
      );
    case 'ton':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#0088CC"/>
          <path d="M11 9.5L18 6l7 3.5-7 11.5L11 9.5zm7 8.5l4.8-8H13.2l4.8 8z" fill="#FFFFFF"/>
        </svg>
      );
    case 'xlm':
      return (
        <svg className={className} viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="24" rx="4" fill="#14B6EC"/>
          <path d="M10 14.5l16-7m-16 10l16-7M12 9a6 6 0 1012 6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Payment method" role="img">
          <circle cx="18" cy="18" r="17" fill="white" stroke="#CBD5E1"/>
          <path d="M10 13.5h16M10 18h16M10 22.5h10" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
  }
}

export interface UserSavedMethod {
  id: string;
  type: 'card' | 'bank' | 'crypto' | 'ewallet';
  name: string;
  detail: string;
  subDetail?: string;
  brandIcon: string;
  addedAt: string;
}

interface FundsViewProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  addTransaction: (tx: any) => void;
  updateTransactionStatus?: (id: string, status: string) => void;
  setView: (view: ViewType) => void;
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  formatCurrency: (amount: number, override?: DisplayCurrency) => string;
  convertFromUSD: (amount: number, target?: DisplayCurrency) => number;
}

type TabType = 'add_funds' | 'withdraw' | 'history' | 'my_methods';

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
  displayCurrency,
  setDisplayCurrency,
  formatCurrency,
  convertFromUSD
}: FundsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('add_funds');
  
  // Add Funds State
  const [depositAmount, setDepositAmount] = useState<string>('500');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('card');
  const [isProcessingDeposit, setIsProcessingDeposit] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Transfer Proof Verification State (Real-world transaction requirement)
  const [txHashOrRef, setTxHashOrRef] = useState<string>('');
  const [senderAccountName, setSenderAccountName] = useState<string>('');
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofNotes, setProofNotes] = useState<string>('');

  // E-Wallet Specific Form States (Skrill, Neteller, PerfectMoney)
  const [eWalletAccount, setEWalletAccount] = useState<string>('');

  // Withdraw State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'crypto' | 'card' | 'skrill' | 'neteller'>('crypto');
  const [withdrawCryptoAsset, setWithdrawCryptoAsset] = useState<string>('usdt_trc20');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawMemo, setWithdrawMemo] = useState<string>('');
  const [withdrawBankName, setWithdrawBankName] = useState<string>('');
  const [withdrawAccountName, setWithdrawAccountName] = useState<string>('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState<string>('');
  const [withdrawSwift, setWithdrawSwift] = useState<string>('');
  const [withdrawEWalletEmail, setWithdrawEWalletEmail] = useState<string>('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState<boolean>(false);

  // History State
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [historySearch, setHistorySearch] = useState<string>('');

  // User-Managed Saved Payment Methods (Empty by default until the user explicitly adds their own)
  const [userSavedMethods, setUserSavedMethods] = useState<UserSavedMethod[]>(() => {
    const saved = safeStorage.getItem('axi_user_saved_payment_methods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modal to Add Custom Payment Method
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState<boolean>(false);
  const [newMethodType, setNewMethodType] = useState<'card' | 'bank' | 'crypto' | 'ewallet'>('card');
  const [newMethodName, setNewMethodName] = useState<string>('');
  const [newMethodIdentifier, setNewMethodIdentifier] = useState<string>('');
  const [newMethodNetworkOrBank, setNewMethodNetworkOrBank] = useState<string>('');

  const [paymentConfig, setPaymentConfig] = useState<CentralPaymentConfig>(() => getLocalPaymentConfig());

  useEffect(() => {
    const unsubscribe = subscribePaymentConfig((cfg) => {
      if (cfg) {
        setPaymentConfig(cfg);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // AXI_REAL_FUNDING_CONFIG_V1: server-side admin configuration is authoritative for customers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/payment-methods');
        const data = await readApiJson(res).catch(() => ({}));
        if (!res.ok || !Array.isArray(data.methods) || cancelled) return;
        const methods = data.methods;
        const cryptoMethods = methods.filter((m: any) => m.type === 'crypto' && m.active);
        const crypto = cryptoMethods[0];
        const bank = methods.find((m: any) => m.id === 'bankTransfer');
        const instant = methods.find((m: any) => m.id === 'instantTransfer');
        // Expand the admin "Instant Transfer" container (per-provider Skrill / Neteller /
        // PayPal receiving accounts) into individual customer-facing methods, so every
        // manually-configured receiving account becomes selectable and shows its destination.
        const instantProviderMeta: Record<string, { name: string; icon: string }> = {
          skrill: { name: 'Skrill', icon: 'skrill' },
          neteller: { name: 'Neteller', icon: 'neteller' },
          paypal: { name: 'PayPal', icon: 'paypal' }
        };
        const baseRows = methods.filter((m: any) => String(m.id) !== 'instantTransfer');
        const instantContainer = instant && instant.active === true ? instant : null;
        const sourceMethods = (() => {
          const rows = [...baseRows];
          if (instantContainer && Array.isArray(instantContainer.methods) && instantContainer.methods.length) {
            const existingIds = new Set(rows.filter((r: any) => r.active).map((m: any) => String(m.id)));
            for (const sub of instantContainer.methods) {
              if (!sub || typeof sub !== 'object' || sub.enabled === false) continue;
              const provider = String(sub.provider || '').trim().toLowerCase();
              if (!instantProviderMeta[provider] || existingIds.has(provider)) continue;
              const meta = instantProviderMeta[provider];
              rows.push({
                id: provider, name: meta.name, type: 'wallet',
                account: String(sub.account || sub.email || ''),
                accountName: String(sub.accountName || ''),
                instructions: String(sub.instructions || instantContainer.instructions || ''),
                processingTime: 'Provider confirmation', iconName: meta.icon, active: true,
                minDeposit: Number(instantContainer.minDeposit || 0),
                maxDeposit: Number(instantContainer.maxDeposit || 0),
                feePercent: Number(instantContainer.feePercent || 0)
              });
            }
          }
          return rows;
        })();
        const normalizeCategory = (t: string) => t === 'crypto' ? 'crypto' : t === 'card' ? 'card' : t === 'bank' ? 'bank' : t === 'wallet' ? 'wallet' : 'other';
        const normalizedMethods = sourceMethods.filter((m: any) => m.active).map((m: any) => {
          const det: any = (m.details && typeof m.details === 'object') ? m.details : {};
          const isCrypto = m.type === 'crypto';
          const isEwallet = m.type === 'wallet';
          const assetLabel = String(isCrypto
            ? (m.label || det.label || (m.asset || det.asset ? `${m.asset || det.asset}${m.network || det.network ? ` (${m.network || det.network})` : ''}` : ''))
            : '');
          const fallbackInstruction = 'Follow the payment instructions shown for this method.';
          const ewalletAccount = isEwallet ? String(det.account || det.email || m.account || m.email || '') : '';
          return {
            id: m.id,
            name: isCrypto && assetLabel ? assetLabel : (m.name || m.id),
            type: m.type, category: normalizeCategory(m.type), currency: m.currency || 'USD', active: true,
            asset: isCrypto ? String(det.asset || m.asset || '').toLowerCase() : undefined,
            minDeposit: Number(m.minDeposit || 0), maxDeposit: Number(m.maxDeposit || 0), feePercent: Number(m.feePercent || 0),
            processingTime: m.processingTime || (isCrypto ? 'Blockchain confirmation' : isEwallet ? 'Provider confirmation' : 'Manual verification'),
            walletAddress: m.walletAddress || det.walletAddress || det.address || m.address,
            walletIdentifier: m.account || m.walletIdentifier || ewalletAccount,
            account: m.account || ewalletAccount,
            accountName: m.accountName || det.accountName,
            bankName: m.bankName, accountNumber: m.accountNumber, swiftBic: m.swiftBic, routingNumber: m.routingNumber, bankAddress: m.bankAddress,
            network: m.network || det.network, memo: m.memo || det.memo,
            instructions: String(m.instructions || det.instructions || (isCrypto && assetLabel
              ? `Send ${assetLabel} to the displayed receiving wallet, then confirm with the transaction proof below.`
              : fallbackInstruction)),
            iconName: m.iconName || m.id
          };
        });
        const next = { ...paymentConfig, paymentMethods: normalizedMethods, updatedAt: Date.now() } as CentralPaymentConfig;
        next.cryptoWallets = { ...(next.cryptoWallets || {}) };
        if (cryptoMethods.length) {
          for (let index = 0; index < cryptoMethods.length; index++) {
            const method: any = cryptoMethods[index];
            const d: any = method.details || method;
            const asset = String(d.asset || ('crypto-' + index)).toLowerCase();
            const network = String(d.network || '');
            const id = String(d.id || method.id || ('crypto-' + asset + '-' + index));
            const entry: any = {
              id, asset, address: String(d.walletAddress || d.address || ''), network,
              memo: d.memo || undefined, active: true,
              label: d.label || d.asset || network, instructions: String(d.instructions || ''),
              iconName: method.iconName || 'crypto'
            };
            if (id) next.cryptoWallets[id] = entry;
            const slugKey = asset + '-' + network.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + String(index);
            next.cryptoWallets[slugKey] = entry;
            if (!next.cryptoWallets[asset]) next.cryptoWallets[asset] = entry;
          }
        }
        if (bank || instant) {
          const d = (bank || instant).details || (bank || instant);
          next.bankSettings = { ...next.bankSettings, bankName: String(d.bankName || ''), accountName: String(d.accountName || ''), accountNumber: String(d.accountNumber || ''), swiftBic: String(d.swiftBic || ''), routingNumber: String(d.routingNumber || ''), bankAddress: String(d.bankAddress || ''), instructions: String(d.instructions || ''), supportEmail: d.supportEmail || '', active: Boolean((bank?.active || instant?.active)) };
        }
        setPaymentConfig(next);
      } catch (error) { console.warn('[FundsView] server payment configuration unavailable:', error); }
    })();
    return () => { cancelled = true; };
  }, []);

  const cryptoWallets = paymentConfig.cryptoWallets || defaultCryptoWallets;
  const bankSettings = paymentConfig.bankSettings || defaultBankSettings;

  // Keep the selected deposit method valid once the server list arrives (the
  // default 'card' may not exist when card processing is unconfigured).
  useEffect(() => {
    const availableIds = (paymentConfig.paymentMethods || [])
      .filter((m: any) => m && m.active).map((m: any) => String(m.id));
    if (availableIds.length && !availableIds.includes(String(selectedMethodId))) {
      setSelectedMethodId(availableIds[0]);
    }
  }, [paymentConfig, selectedMethodId]);

  // Detect Stripe Return Parameters on Page Load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const depositSuccess = urlParams.get('deposit_success');
    const sessionId = urlParams.get('session_id');
    const depositCancelled = urlParams.get('deposit_cancelled');

    if (depositSuccess && sessionId) {
      // The confirmed Stripe Checkout payment is verified server-side by the app-wide
      // useStripePayment hook (it records the "Awaiting Admin Credit" funding entry, alerts
      // the admin on Telegram and cleans the URL). Nothing extra is recorded here — that
      // would create a duplicate transaction and a misleading "Compliance clearance" state.
      return;
    }
    if (depositCancelled) {
      showToast('Card deposit session was cancelled.', 'info');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const quickAmounts = ['100', '250', '500', '1000', '2500', '5000', '10000'];

  // Only payment methods explicitly configured by the platform are offered.
  // No wallet, bank account, processor or fee is fabricated in the client.
  const depositMethods = (paymentConfig.paymentMethods || [])
    .filter((method: any) => method && method.active)
    .map((method: any) => ({
      ...method,
      iconId: method.iconName || method.id,
      description: method.instructions || 'Payment method configured by the platform.',
      badge: method.processingTime || 'Configured',
      fee: `${Number(method.feePercent || 0)}% fee`,
    }));

  const activeMethod = depositMethods.find(m => m.id === selectedMethodId) || depositMethods[0];
  const activeCryptoWallet = cryptoWallets[selectedMethodId]
    || (selectedMethodId === 'usdt_trc20' ? cryptoWallets.usdt : null)
    || (selectedMethodId && cryptoWallets[String(selectedMethodId).toLowerCase()] ? cryptoWallets[String(selectedMethodId).toLowerCase()] : null)
    || (activeMethod && (activeMethod.type === 'crypto' || activeMethod.category === 'crypto') && activeMethod.walletAddress
        ? { id: String(activeMethod.id || ''), asset: String(activeMethod.asset || '').toLowerCase(), address: String(activeMethod.walletAddress), network: String(activeMethod.network || ''), memo: activeMethod.memo || undefined, active: true, label: activeMethod.name || '' } : null);

  // Asset-aware proof copy: server crypto rows are keyed crypto-<asset>-<network>,
  // so hint text is derived from the resolved wallet instead of legacy method ids.
  const cryptoProofMeta = (() => {
    const a = String(activeCryptoWallet?.asset || activeMethod?.asset || '').toLowerCase();
    const n = String(activeCryptoWallet?.network || activeMethod?.network || '').toLowerCase();
    const m = String(selectedMethodId).toLowerCase();
    if (m === 'ton' || a === 'ton') return { label: 'TON Transaction Hash / Message Hash *', hint: 'Paste TON transaction hash or message hash' };
    if (m === 'usdt_trc20' || (a === 'usdt' && (n.includes('trc') || n.includes('tron')))) return { label: 'TRON (TRC20) Transaction ID (TXID) *', hint: 'Paste TRON (TRC20) transaction ID (TXID)' };
    if (m === 'btc' || a === 'btc') return { label: 'Bitcoin Transaction Hash (TXID) *', hint: 'Paste Bitcoin transaction hash (TXID)' };
    if (m === 'eth' || m === 'usdt_erc20' || m === 'usdc' || a === 'eth' || a === 'usdc' || (a === 'usdt' && n.includes('erc'))) return { label: 'Ethereum (ERC20) Transaction Hash (TXID) *', hint: 'Paste Ethereum (ERC20) transaction hash (0x...)' };
    if (a === 'bnb' || n.includes('bsc') || n.includes('smart') || n.includes('bep')) return { label: 'BNB Chain (BEP20) Transaction Hash (TXID) *', hint: 'Paste BNB Chain (BEP20) transaction hash (0x...)' };
    if (m === 'sol' || a === 'sol') return { label: 'Solana Transaction Signature *', hint: 'Paste Solana transaction signature' };
    if (m === 'xrp' || a === 'xrp') return { label: 'XRP Transaction Hash (TXID) *', hint: 'Paste Ripple (XRP) transaction hash' };
    return { label: 'Blockchain Transaction Hash (TXID) / Proof *', hint: 'Paste blockchain transaction hash (TXID)' };
  })();
  const walletDisplayLabel = activeCryptoWallet?.label
    || (activeCryptoWallet?.asset ? String(activeCryptoWallet.asset).toUpperCase() : '')
    || activeMethod?.name || selectedMethodId;

  // Diagnostic logging: payment configuration can legitimately load asynchronously.
  if (import.meta.env.DEV) console.debug('[FundsView] activeMethod:', activeMethod);

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert USD deposit to the user's selected Display Currency for clear transparency
  const numericDepositUSD = parseFloat(depositAmount) || 0;
  const depositInSelectedCurrency = convertFromUSD(numericDepositUSD, displayCurrency);

  // File upload handler for payment receipt/proof
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setProofFile(reader.result as string);
        showToast(`Payment receipt attached: ${file.name}`, 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-world Transfer Confirmation Handler with Mandatory Validation
  const handleTransferCompletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      showToast('Please sign in before submitting a funding request.', 'error');
      return;
    }
    if (!auth.currentUser) {
      showToast('Please sign in before submitting a funding request.', 'error');
      return;
    }
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please specify a valid deposit amount', 'error');
      return;
    }

    // Strict validation: Require actual reference, hash or sender name
    if (!txHashOrRef.trim() && !senderAccountName.trim() && !proofFile) {
      showToast('Please provide your Transaction ID / Hash, Sender Account Name, or upload a payment receipt to confirm payment.', 'error');
      return;
    }

    const txId = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx = {
      id: txId,
      type: 'Deposit',
      amount: amountNum,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'Pending Verification',
      method: activeMethod?.name || selectedMethodId,
      network: activeCryptoWallet?.network || activeMethod?.name || selectedMethodId,
      recipient: activeCryptoWallet?.address || bankSettings.accountNumber,
      txHash: txHashOrRef.trim() || 'Provided via receipt',
      senderName: senderAccountName.trim() || 'Authorized Client Account',
      notes: proofNotes.trim() || undefined
    };

    addTransaction(newTx);
    authenticatedFetch('/api/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx)
    }).catch(e => console.info('Transaction sync:', e));

    showToast(`Payment reference ${txId} submitted. Under review by Axi Compliance.`, 'success');
    
    // Reset confirmation inputs
    setTxHashOrRef('');
    setSenderAccountName('');
    setProofFile(null);
    setProofFileName('');
    setProofNotes('');

    setActiveTab('history');
  };

  // Real-world Stripe Deposit Submission
  const handleStripeDeposit = async () => {
    const amountNum = parseFloat(depositAmount);
    if (!amountNum || amountNum < 10) {
      showToast('Minimum deposit amount is $10.00', 'error');
      return;
    }

    setIsProcessingDeposit(true);
    try {
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid || currentUser?.email || '';
      const depositId = `DEP-${Date.now()}`;
      const res = await authenticatedFetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          currency: 'usd',
          method: selectedMethodId === 'bank_instant' ? 'bank_transfer' : 'card',
          userId,
          depositId
        })
      });

      const data = await readApiJson(res);
      if (data.url) {
        showToast('Redirecting to secure card processing gateway...', 'info');
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Direct card processing session initialized. Please complete payment.', 'error');
      }
    } catch (e: any) {
      console.error('Stripe Deposit Error:', e);
      showToast(e.message || 'Payment processor unreachable. Please retry.', 'error');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Withdraw Submission
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid withdrawal amount', 'error');
      return;
    }

    if (amountNum > liveBalance) {
      showToast('Insufficient funds for this withdrawal amount', 'error');
      return;
    }

    if (withdrawMethod === 'crypto' && !withdrawAddress.trim()) {
      showToast('Please enter your recipient wallet address', 'error');
      return;
    }

    if (withdrawMethod === 'bank' && (!withdrawAccountNumber.trim() || !withdrawBankName.trim())) {
      showToast('Please complete all required bank settlement fields', 'error');
      return;
    }

    if ((withdrawMethod === 'skrill' || withdrawMethod === 'neteller') && !withdrawEWalletEmail.trim()) {
      showToast(`Please enter your ${withdrawMethod === 'skrill' ? 'Skrill' : 'Neteller'} account email`, 'error');
      return;
    }

    setIsProcessingWithdraw(true);

    setTimeout(() => {
      // Deduct balance
      const newBal = Math.max(0, liveBalance - amountNum);
      setLiveBalance(newBal);
      setBalance(newBal);

      const txId = `WTH-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTx = {
        id: txId,
        type: 'Withdrawal',
        amount: -amountNum,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'In Review',
        method: withdrawMethod === 'crypto' 
          ? `Crypto (${cryptoWallets[withdrawCryptoAsset]?.network || withdrawCryptoAsset.toUpperCase()})` 
          : withdrawMethod === 'bank' 
          ? `Bank Wire (${withdrawBankName})` 
          : withdrawMethod === 'skrill'
          ? `Skrill Wallet (${withdrawEWalletEmail})`
          : withdrawMethod === 'neteller'
          ? `Neteller Account (${withdrawEWalletEmail})`
          : 'Card Settlement Refund',
        recipient: withdrawMethod === 'crypto' ? withdrawAddress : withdrawMethod === 'bank' ? withdrawAccountNumber : withdrawEWalletEmail || 'Card'
      };

      addTransaction(newTx);
      authenticatedFetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      }).catch(e => console.info('Transaction sync:', e));
      setIsProcessingWithdraw(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawEWalletEmail('');
      showToast(`Withdrawal request for $${amountNum.toLocaleString()} submitted successfully (Ref: ${txId})`, 'success');
      setActiveTab('history');
    }, 800);
  };

  // Add User-Defined Saved Method
  const handleSaveUserMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim() || !newMethodIdentifier.trim()) {
      showToast('Please provide a method name and account number/address', 'error');
      return;
    }

    const createdMethod: UserSavedMethod = {
      id: `USR-MTH-${Date.now()}`,
      type: newMethodType,
      name: newMethodName.trim(),
      detail: newMethodIdentifier.trim(),
      subDetail: newMethodNetworkOrBank.trim() || undefined,
      brandIcon: newMethodType === 'card' ? 'visa' : newMethodType === 'crypto' ? 'usdt_trc20' : newMethodType === 'ewallet' ? 'skrill' : 'bank',
      addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const updated = [...userSavedMethods, createdMethod];
    setUserSavedMethods(updated);
    safeStorage.setItem('axi_user_saved_payment_methods', JSON.stringify(updated));
    showToast(`Payment method "${createdMethod.name}" added to your saved methods.`, 'success');
    
    // Reset Form
    setNewMethodName('');
    setNewMethodIdentifier('');
    setNewMethodNetworkOrBank('');
    setIsAddMethodModalOpen(false);
  };

  // Delete User Saved Method
  const handleDeleteUserMethod = (id: string) => {
    const updated = userSavedMethods.filter(m => m.id !== id);
    setUserSavedMethods(updated);
    safeStorage.setItem('axi_user_saved_payment_methods', JSON.stringify(updated));
    showToast('Payment method removed.', 'info');
  };

  const filteredTransactions = transactions.filter(t => {
    const isDeposit = t.type === 'Deposit' || t.amount > 0;
    if (historyFilter === 'deposit' && !isDeposit) return false;
    if (historyFilter === 'withdraw' && isDeposit) return false;

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      return (
        t.id?.toLowerCase().includes(q) ||
        t.method?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        t.amount?.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-400 mb-1">
                <span>Client Portal</span>
                <span>/</span>
                <span className="text-brand-red font-extrabold">Funds Management</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Funds & Payment Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">Real-world multi-currency deposit, withdrawal, and verified ledger</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5 font-black" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Available Balance</span>
                  <div className="text-lg font-black text-slate-900 leading-none">
                    {formatCurrency(liveBalance)}
                  </div>
                </div>
              </div>
              
              {/* Live Interactive Currency Selector Component */}
              <CurrencySelector displayCurrency={displayCurrency} setDisplayCurrency={setDisplayCurrency} />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-200 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('add_funds')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'add_funds'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Add Funds / Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'withdraw'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw Funds
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'history'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              Transaction History ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('my_methods')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'my_methods'
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              My Payment Methods ({userSavedMethods.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ================= TAB 1: ADD FUNDS ================= */}
        {activeTab === 'add_funds' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Method Selection */}
            <div className="lg:col-span-7 space-y-6">
              {/* Amount Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
                    1. Deposit Amount
                  </label>
                  <span className="text-xs font-bold text-slate-500">
                    Selected Currency: <strong className="text-brand-red">{displayCurrency}</strong>
                  </span>
                </div>

                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    {displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : '$'}
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="500.00"
                    min="10"
                    className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {quickAmounts.map((amt) => {
                    const sym = displayCurrency === 'EUR' ? '€' : displayCurrency === 'GBP' ? '£' : '$';
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`py-2 px-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sym}{parseInt(amt).toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method Selection Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    2. Select Official Axi Payment Method
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    0% Broker Fee
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {depositMethods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-red-50/40 border-brand-red ring-1 ring-brand-red'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <PaymentMethodBrandIcon id={method.iconId} className="w-10 h-7 shrink-0 shadow-xs rounded" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{method.name}</span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {method.badge}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">{method.description}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-600">{method.fee}</div>
                          <div className="text-[10px] text-slate-400">{method.processingTime}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Payment Instructions & Transaction Proof Session */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs sticky top-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900">Payment Session</h3>
                  <span className="text-xs font-bold text-slate-600">
                    Status: <strong className="text-amber-600">Active</strong>
                  </span>
                </div>

                {/* Amount Summary */}
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Deposit Amount (USD)</span>
                    <span className="font-bold text-slate-900">${numericDepositUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Equivalent in {displayCurrency}</span>
                    <span className="font-bold text-brand-red">{formatCurrency(numericDepositUSD)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Axi Processing Fee</span>
                    <span className="font-bold text-emerald-600">$0.00 (Free)</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Credited to Balance</span>
                    <span className="text-emerald-600">${numericDepositUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
                  </div>
                </div>

                {/* Method 1: Credit/Debit Card */}
                {selectedMethodId === 'card' && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed">
                      <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-brand-red" />
                        Direct Card Gateway
                      </div>
                      Instant deposit via Visa / Mastercard 3D Secure checkout. Your live balance will update upon successful completion.
                    </div>

                    <button
                      type="button"
                      onClick={handleStripeDeposit}
                      disabled={isProcessingDeposit}
                      className="w-full bg-brand-red hover:bg-red-700 active:bg-red-800 text-white font-black py-4 px-6 rounded-xl text-sm uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isProcessingDeposit ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing Card Gateway...
                        </>
                      ) : (
                        <>
                          Pay ${numericDepositUSD.toLocaleString()} with Card
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Method 2: Skrill / Neteller / Perfect Money */}
                {['skrill', 'neteller', 'perfectmoney', 'paypal'].includes(selectedMethodId) && (() => {
                  const customMethodConfig = paymentConfig.paymentMethods?.find(m => m.id === selectedMethodId);
                  // Only ever show a destination the platform configured server-side.
                  // If none is configured the merchant block is hidden below, never a fabricated account.
                  const merchantAccount = customMethodConfig?.walletIdentifier || customMethodConfig?.walletAddress || customMethodConfig?.account || '';
                  const methodInstructions = customMethodConfig?.instructions || (
                    merchantAccount
                      ? `Transfer funds to the official Axi ${activeMethod?.name || selectedMethodId} account below, then enter your transaction reference ID to confirm:`
                      : `The Axi ${activeMethod?.name || selectedMethodId} receiving account is being configured by the platform. Please contact support to complete your deposit.`
                  );

                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <PaymentMethodBrandIcon id={selectedMethodId} className="w-6 h-4" />
                          {activeMethod?.name || selectedMethodId} Instructions
                        </div>
                        <p>{methodInstructions}</p>
                        {merchantAccount ? (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold">
                            <span>Axi Merchant Account</span>
                            <span className="text-brand-red font-semibold">Click to copy</span>
                          </div>
                          <div 
                            onClick={() => handleCopy(merchantAccount, selectedMethodId)}
                            className="font-mono text-sm font-black text-slate-900 select-all p-2 rounded hover:bg-slate-100 transition cursor-pointer flex items-center justify-between border border-transparent hover:border-slate-200"
                            title="Click to copy account ID"
                          >
                            <span>{merchantAccount}</span>
                            <span className="text-xs text-slate-400">
                              {copiedKey === selectedMethodId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </span>
                          </div>
                        </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 font-semibold">
                            No receiving account is configured for this method yet. Contact support before transferring funds.
                          </div>
                        )}
                      </div>

                      {/* Proof Form */}
                      <form onSubmit={handleTransferCompletionSubmit} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                            Your {activeMethod?.name || selectedMethodId} Transaction ID / Ref *
                          </label>
                          <input
                            type="text"
                            required
                            value={txHashOrRef}
                            onChange={(e) => setTxHashOrRef(e.target.value)}
                            placeholder={`e.g. ${selectedMethodId === 'skrill' ? 'SKR-99201948' : selectedMethodId === 'neteller' ? 'NET-88291048' : 'PM-Batch-849201'}`}
                            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-brand-red"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                            Sender Account Email / Name
                          </label>
                          <input
                            type="text"
                            value={senderAccountName}
                            onChange={(e) => setSenderAccountName(e.target.value)}
                            placeholder="Your registered email on the payment platform"
                            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-brand-red"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                            Upload Payment Receipt / Screenshot (Optional)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition">
                              <Upload className="w-3.5 h-3.5" />
                              {proofFileName ? 'Change Receipt' : 'Attach Screenshot'}
                              <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                            </label>
                            {proofFileName && (
                              <span className="text-xs font-mono text-emerald-600 truncate max-w-[180px]">{proofFileName}</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Confirm {activeMethod?.name || selectedMethodId} Transfer
                        </button>
                      </form>
                    </div>
                  );
                })()}

                {/* Method 3: Bank Wire & Instant Bank */}
                {['bank_wire', 'bank_instant', 'bankTransfer'].includes(selectedMethodId) && (
                  <div className="space-y-4">
                    {(!bankSettings.active || !bankSettings.accountNumber || !bankSettings.bankName) ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-xs space-y-3">
                        <div className="font-extrabold text-amber-900 flex items-center gap-2 text-sm">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          Bank Wire Settlement Account Not Configured
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          Official corporate bank wire settlement accounts have not yet been configured or activated by the platform administrator.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-amber-200/80 text-[11px] text-slate-700 space-y-1">
                          <div className="font-bold text-slate-900">Administrator Access Required:</div>
                          <div>To enable direct bank wire deposits, please log in to the <strong className="text-slate-900">Admin Panel &gt; Wallet &amp; Bank Settings</strong> to enter and activate your official bank wire settlement details.</div>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          For immediate balance funding, please select <strong>Credit/Debit Card (Instant Gateway)</strong> or <strong>Cryptocurrency (USDT, BTC, ETH)</strong>.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-700" />
                            Official Bank Settlement Details
                          </div>

                          <div className="space-y-2 text-[11px]">
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                              <span className="text-slate-500">Beneficiary Bank:</span>
                              <span className="font-bold text-slate-900">{bankSettings.bankName}</span>
                            </div>
                            {bankSettings.accountName && (
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-slate-500">Account Name:</span>
                                <span className="font-bold text-slate-900">{bankSettings.accountName}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                              <span className="text-slate-500">Account Number / IBAN:</span>
                              <span className="font-mono font-bold text-slate-900">{bankSettings.accountNumber}</span>
                            </div>
                            {bankSettings.swiftBic && (
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-slate-500">SWIFT / BIC:</span>
                                <span className="font-mono font-bold text-slate-900">{bankSettings.swiftBic}</span>
                              </div>
                            )}
                            {bankSettings.routingNumber && (
                              <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-slate-500">Routing / Sort Code:</span>
                                <span className="font-mono font-bold text-slate-900">{bankSettings.routingNumber}</span>
                              </div>
                            )}
                            {bankSettings.bankAddress && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Bank Address:</span>
                                <span className="font-bold text-slate-900 text-right">{bankSettings.bankAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Proof Form */}
                        <form onSubmit={handleTransferCompletionSubmit} className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                              Bank Wire Reference Number / Transaction ID *
                            </label>
                            <input
                              type="text"
                              required
                              value={txHashOrRef}
                              onChange={(e) => setTxHashOrRef(e.target.value)}
                              placeholder="e.g. WIRE-8849102 or Bank Transfer Ref"
                              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-brand-red"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                              Sender Full Name / Remitting Bank
                            </label>
                            <input
                              type="text"
                              value={senderAccountName}
                              onChange={(e) => setSenderAccountName(e.target.value)}
                              placeholder="Name of account holder sending the transfer"
                              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 outline-none focus:border-brand-red"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                              Upload Bank Wire Receipt / Slip (Optional)
                            </label>
                            <div className="flex items-center gap-2">
                              <label className="cursor-pointer py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition">
                                <Upload className="w-3.5 h-3.5" />
                                {proofFileName ? 'Change File' : 'Upload Wire Slip'}
                                <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                              </label>
                              {proofFileName && (
                                <span className="text-xs font-mono text-emerald-600 truncate max-w-[180px]">{proofFileName}</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Submit Bank Transfer Confirmation
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* Method 4: Cryptocurrency Deposit */}
                {(activeMethod?.category === 'crypto' || activeMethod?.type === 'crypto') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                        Scan QR to Send {activeCryptoWallet?.network || 'Crypto'}
                      </span>
                      {activeCryptoWallet?.address ? (
                        <div className="inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeCryptoWallet.address)}`}
                            alt="Deposit QR Code"
                            className="w-36 h-36 mx-auto rounded"
                          />
                        </div>
                      ) : null}

                      <div className="text-left space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              Deposit Address ({activeCryptoWallet?.network})
                            </label>
                            <span className="text-[10px] font-bold text-brand-red">Click address to copy</span>
                          </div>
                          <div 
                            onClick={() => handleCopy(activeCryptoWallet?.address || '', 'address')}
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-brand-red/60 transition cursor-pointer group shadow-2xs"
                            title="Click to copy crypto deposit address"
                          >
                            <span className="font-mono text-xs text-slate-900 break-all select-all flex-1 group-hover:text-brand-red transition">
                              {activeCryptoWallet?.address}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(activeCryptoWallet?.address || '', 'address');
                              }}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer shrink-0"
                              title="Copy to clipboard"
                            >
                              {copiedKey === 'address' ? <Check className="w-4 h-4 text-emerald-600 font-black" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {activeCryptoWallet?.memo && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                                Destination Memo / Tag (Required for {walletDisplayLabel})
                              </label>
                              <span className="text-[10px] font-bold text-amber-800">Click memo to copy</span>
                            </div>
                            <div 
                              onClick={() => handleCopy(activeCryptoWallet.memo || '', 'memo')}
                              className="flex items-center gap-2 bg-amber-50/60 hover:bg-amber-100/60 p-2.5 rounded-lg border border-amber-200 hover:border-amber-400 transition cursor-pointer group shadow-2xs"
                              title="Click to copy destination memo/tag"
                            >
                              <span className="font-mono text-xs font-bold text-amber-950 flex-1 select-all">
                                {activeCryptoWallet.memo}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(activeCryptoWallet.memo || '', 'memo');
                                }}
                                className="p-2 text-amber-800 hover:bg-amber-100 rounded-md transition cursor-pointer shrink-0"
                                title="Copy memo to clipboard"
                              >
                                {copiedKey === 'memo' ? <Check className="w-4 h-4 text-emerald-600 font-black" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proof Form for Crypto */}
                    <form onSubmit={handleTransferCompletionSubmit} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          {cryptoProofMeta.label}
                        </label>
                        <input
                          type="text"
                          required
                          value={txHashOrRef}
                          onChange={(e) => setTxHashOrRef(e.target.value)}
                          placeholder={cryptoProofMeta.hint}
                          className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-brand-red"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Sending Wallet Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={senderAccountName}
                          onChange={(e) => setSenderAccountName(e.target.value)}
                          placeholder="Your personal wallet address from which crypto was sent"
                          className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-brand-red"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        I Have Completed The Transfer
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: WITHDRAW ================= */}
        {activeTab === 'withdraw' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Request Withdrawal</h2>
                    <p className="text-xs text-slate-500 mt-1">Withdraw trading profits directly to your external destination</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Available to Withdraw</span>
                    <span className="text-lg font-black text-brand-red">{formatCurrency(liveBalance)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                {/* Method selector */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-3">
                    Select Withdrawal Channel
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('crypto')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        withdrawMethod === 'crypto'
                          ? 'border-brand-red bg-red-50/30 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Wallet className="w-5 h-5 text-slate-800 mb-1.5" />
                      <div className="text-xs font-bold text-slate-900">Crypto</div>
                      <div className="text-[10px] text-slate-500">USDT, BTC</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        withdrawMethod === 'bank'
                          ? 'border-brand-red bg-red-50/30 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-slate-800 mb-1.5" />
                      <div className="text-xs font-bold text-slate-900">Bank Wire</div>
                      <div className="text-[10px] text-slate-500">SWIFT / ACH</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('skrill')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        withdrawMethod === 'skrill'
                          ? 'border-brand-red bg-red-50/30 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <PaymentMethodBrandIcon id="skrill" className="w-6 h-4 mb-1.5" />
                      <div className="text-xs font-bold text-slate-900">Skrill</div>
                      <div className="text-[10px] text-slate-500">E-Wallet</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('neteller')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        withdrawMethod === 'neteller'
                          ? 'border-brand-red bg-red-50/30 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <PaymentMethodBrandIcon id="neteller" className="w-6 h-4 mb-1.5" />
                      <div className="text-xs font-bold text-slate-900">Neteller</div>
                      <div className="text-[10px] text-slate-500">E-Wallet</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('card')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        withdrawMethod === 'card'
                          ? 'border-brand-red bg-red-50/30 ring-1 ring-brand-red'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-slate-800 mb-1.5" />
                      <div className="text-xs font-bold text-slate-900">Card Refund</div>
                      <div className="text-[10px] text-slate-500">Original Card</div>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                    Withdrawal Amount ($ USD)
                  </label>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      max={liveBalance}
                      min="10"
                      className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setWithdrawAmount((liveBalance * (pct / 100)).toFixed(2))}
                        className="py-1.5 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                      >
                        {pct === 100 ? 'Max (100%)' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Destination Fields */}
                {withdrawMethod === 'crypto' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                        Select Cryptocurrency Asset
                      </label>
                      <select
                        value={withdrawCryptoAsset}
                        onChange={(e) => setWithdrawCryptoAsset(e.target.value)}
                        className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-brand-red transition"
                      >
                        <option value="usdt_trc20">Tether (USDT) - TRON TRC20 (Fastest)</option>
                        <option value="usdt_erc20">Tether (USDT) - Ethereum ERC20</option>
                        <option value="btc">Bitcoin (BTC) - Bitcoin Mainnet</option>
                        <option value="eth">Ethereum (ETH) - ERC20</option>
                        <option value="usdc">USD Coin (USDC) - ERC20</option>
                        <option value="sol">Solana (SOL) - Solana Mainnet</option>
                        <option value="xrp">Ripple (XRP) - Ripple Ledger</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                        Recipient Destination Wallet Address
                      </label>
                      <input
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        placeholder="Paste your external wallet address"
                        className="w-full py-3.5 px-4 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm text-slate-900 outline-none focus:border-brand-red transition"
                      />
                    </div>
                  </div>
                )}

                {withdrawMethod === 'bank' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={withdrawBankName}
                          onChange={(e) => setWithdrawBankName(e.target.value)}
                          placeholder="e.g. JPMorgan Chase"
                          className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-brand-red transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Beneficiary Account Name</label>
                        <input
                          type="text"
                          value={withdrawAccountName}
                          onChange={(e) => setWithdrawAccountName(e.target.value)}
                          placeholder="Full Name on Account"
                          className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-brand-red transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Account Number / IBAN</label>
                        <input
                          type="text"
                          value={withdrawAccountNumber}
                          onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                          placeholder="Account or IBAN"
                          className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-brand-red transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">SWIFT / BIC Code</label>
                        <input
                          type="text"
                          value={withdrawSwift}
                          onChange={(e) => setWithdrawSwift(e.target.value)}
                          placeholder="e.g. CHASUS33XXX"
                          className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-brand-red transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(withdrawMethod === 'skrill' || withdrawMethod === 'neteller') && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-2">
                        Recipient {withdrawMethod === 'skrill' ? 'Skrill' : 'Neteller'} Account Email
                      </label>
                      <input
                        type="email"
                        required
                        value={withdrawEWalletEmail}
                        onChange={(e) => setWithdrawEWalletEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full py-3.5 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-brand-red transition"
                      />
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full bg-brand-red hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-xl text-sm uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingWithdraw ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Submitting Withdrawal Request...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      Submit Withdrawal Request (${parseFloat(withdrawAmount || '0').toLocaleString()})
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TRANSACTION HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('deposit')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    historyFilter === 'deposit'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Deposits
                </button>
                <button
                  onClick={() => setHistoryFilter('withdraw')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    historyFilter === 'withdraw'
                      ? 'bg-brand-red text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Withdrawals
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search reference or method..."
                  className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-brand-red transition"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">No Transactions Found</h3>
                  <p className="text-xs text-slate-500 mt-1">Your deposits and withdrawals will appear in this ledger in real-time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-6">Type</th>
                        <th className="py-3.5 px-6">Reference ID</th>
                        <th className="py-3.5 px-6">Method / Gateway</th>
                        <th className="py-3.5 px-6">Date & Time</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredTransactions.map((tx, idx) => {
                        const isDeposit = tx.type === 'Deposit' || tx.amount > 0;
                        const isComplete = tx.status === 'Completed' || tx.status === 'Approved';
                        const isPending = tx.status === 'Pending' || tx.status === 'In Review' || tx.status === 'Pending Verification';
                        return (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  isDeposit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-brand-red'
                                }`}>
                                  {isDeposit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <span className="font-bold text-slate-900">{tx.type || (isDeposit ? 'Deposit' : 'Withdrawal')}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-600">{tx.id || `TX-${idx + 101}`}</td>
                            <td className="py-4 px-6 text-slate-700">
                              <div>{tx.method || 'Online Transfer'}</div>
                              {tx.txHash && tx.txHash !== 'Provided via receipt' && (
                                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                                  Ref: {tx.txHash}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-500">{tx.date || 'Just now'}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                isComplete
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {isComplete ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {tx.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-sm">
                              <span className={isDeposit ? 'text-emerald-600' : 'text-brand-red'}>
                                {isDeposit ? '+' : '-'}${Math.abs(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: MY PAYMENT METHODS (USER CHOSEN ONLY) ================= */}
        {activeTab === 'my_methods' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-xl font-black text-slate-900">My Payment Methods</h2>
                <p className="text-xs text-slate-500 mt-0.5">Add and manage your personal saved payment accounts for 1-click funding</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMethodModalOpen(true)}
                className="bg-brand-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Personal Method
              </button>
            </div>

            {/* List of user-added methods */}
            {userSavedMethods.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Personal Payment Methods Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  You have full control over your payment methods. Click "Add Personal Method" to save your personal bank account, Skrill wallet, credit card, or crypto address.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddMethodModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Payment Method
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSavedMethods.map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <PaymentMethodBrandIcon id={m.brandIcon} className="w-10 h-7 rounded shadow-xs" />
                          <div>
                            <div className="text-sm font-bold text-slate-900">{m.name}</div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {m.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteUserMethod(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete payment method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 break-all select-all mb-3">
                        {m.detail}
                        {m.subDetail && (
                          <div className="text-[10px] font-sans text-slate-500 font-bold mt-1">
                            {m.subDetail}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>Saved on {m.addedAt}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethodId(m.type === 'card' ? 'card' : m.type === 'crypto' ? 'usdt_trc20' : m.type === 'ewallet' ? 'skrill' : 'bank_wire');
                          setActiveTab('add_funds');
                        }}
                        className="font-bold text-brand-red hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Use to Deposit <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Add Custom User Payment Method */}
      {isAddMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-black text-slate-900">Add Personal Payment Method</h3>
              <button
                type="button"
                onClick={() => setIsAddMethodModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserMethod} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Method Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'card', label: 'Card' },
                    { id: 'bank', label: 'Bank Wire' },
                    { id: 'ewallet', label: 'Skrill/E-Wallet' },
                    { id: 'crypto', label: 'Crypto' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewMethodType(cat.id as any)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        newMethodType === cat.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Account Label / Nickname *
                </label>
                <input
                  type="text"
                  required
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  placeholder={newMethodType === 'card' ? 'e.g. My Chase Debit Card' : newMethodType === 'bank' ? 'e.g. Personal Checking Wire' : newMethodType === 'ewallet' ? 'e.g. My Personal Skrill' : 'e.g. Ledger USDT TRC20'}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  {newMethodType === 'card' ? 'Card Number / Last 4 Digits' : newMethodType === 'bank' ? 'Account Number / IBAN' : newMethodType === 'ewallet' ? 'E-Wallet Email / ID' : 'Wallet Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={newMethodIdentifier}
                  onChange={(e) => setNewMethodIdentifier(e.target.value)}
                  placeholder={newMethodType === 'card' ? '•••• •••• •••• 4242' : newMethodType === 'bank' ? 'IBAN or Account Number' : newMethodType === 'ewallet' ? 'skrill-email@gmail.com' : '0x... or TTH...'}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                  {newMethodType === 'bank' ? 'Bank Name & SWIFT' : newMethodType === 'crypto' ? 'Network (e.g. TRC20, ERC20)' : 'Additional Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={newMethodNetworkOrBank}
                  onChange={(e) => setNewMethodNetworkOrBank(e.target.value)}
                  placeholder={newMethodType === 'bank' ? 'e.g. Barclays Bank PLC - BARKGB22' : newMethodType === 'crypto' ? 'e.g. TRON Network (TRC20)' : 'e.g. Primary settlement method'}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-brand-red"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMethodModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-xs"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
