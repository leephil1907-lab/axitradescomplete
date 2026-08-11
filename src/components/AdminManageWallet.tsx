import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Search, Edit, Trash2, Eye, ArrowLeft, Copy, Check, 
  ShieldCheck, CheckCircle2, ToggleLeft, ToggleRight, RefreshCw, 
  Landmark, Wallet, Globe, Database, Save, Lock, DollarSign, Sliders,
  QrCode, AlertCircle, ArrowUpRight, Activity, Server, Zap, AlertTriangle, Wrench
} from 'lucide-react';
import { safeStorage } from '../utils/storage';
import { copyToClipboard } from '../utils/copy';
import { 
  CentralPaymentConfig, 
  PaymentMethodItem, 
  CryptoWalletConfig, 
  BankSettingsConfig,
  subscribePaymentConfig, 
  subscribeSystemConfigWallets,
  updateCentralPaymentConfig, 
  updateSystemConfigWallets,
  defaultPaymentMethods, 
  defaultCryptoWallets, 
  defaultBankSettings 
} from '../services/paymentConfigService';

interface StripeStatus {
  configured: boolean;
  webhookConfigured: boolean;
  webhookEndpoint: string;
  eventsSupported: string[];
  environment: string;
  timestamp: string;
}

interface AdminManageWalletProps {
  initialSubTab?: 'methods' | 'crypto' | 'bank' | 'controls';
}

export default function AdminManageWallet({ initialSubTab = 'methods' }: AdminManageWalletProps) {
  const [config, setConfig] = useState<CentralPaymentConfig>({
    updatedAt: Date.now(),
    cryptoWallets: defaultCryptoWallets,
    bankSettings: defaultBankSettings,
    paymentMethods: defaultPaymentMethods,
    autoApproveLimit: 5000,
    requireKycForDeposit: false
  });

  const [isFirestoreLive, setIsFirestoreLive] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'methods' | 'crypto' | 'bank' | 'controls'>(initialSubTab);
  const [view, setView] = useState<'list' | 'create_crypto' | 'create_bank' | 'create_wallet' | 'edit'>('list');
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodItem | null>(null);
  const [viewModalMethod, setViewModalMethod] = useState<PaymentMethodItem | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stripe Webhook Read-Only Status State
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);

  const checkStripeStatus = async () => {
    setIsCheckingStripe(true);
    try {
      const res = await fetch('/api/stripe/status');
      if (res.ok) {
        const data = await res.json();
        setStripeStatus(data);
      }
    } catch (err) {
      console.warn('Stripe status check error:', err);
    } finally {
      setIsCheckingStripe(false);
    }
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    checkStripeStatus();
    const unsubscribe = subscribePaymentConfig((data, isLive) => {
      setConfig(data);
      setIsFirestoreLive(isLive);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveCentralConfig = async (newConfig: CentralPaymentConfig, notificationMsg?: string) => {
    setIsSaving(true);
    setConfig(newConfig);
    const result = await updateCentralPaymentConfig(newConfig);
    setIsSaving(false);
    showNotification(notificationMsg || result.message);
  };

  const deleteMethod = (id: string) => {
    const target = config.paymentMethods.find(m => m.id === id);
    if (window.confirm(`Are you sure you want to remove payment method "${target?.name || id}"?`)) {
      const updatedMethods = config.paymentMethods.filter(m => m.id !== id);
      const updatedConfig = { ...config, paymentMethods: updatedMethods };
      handleSaveCentralConfig(updatedConfig, `Removed payment method: ${target?.name}`);
    }
  };

  const toggleMethodActive = (id: string) => {
    const updatedMethods = config.paymentMethods.map(m => m.id === id ? { ...m, active: !m.active } : m);
    const item = updatedMethods.find(m => m.id === id);
    const updatedConfig = { ...config, paymentMethods: updatedMethods };
    handleSaveCentralConfig(updatedConfig, `${item?.name} is now ${item?.active ? 'ACTIVE' : 'DISABLED'}`);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all payment methods, crypto wallets, and bank details to official Axi defaults in Firestore?")) {
      const defaultConfig: CentralPaymentConfig = {
        updatedAt: Date.now(),
        cryptoWallets: defaultCryptoWallets,
        bankSettings: defaultBankSettings,
        paymentMethods: defaultPaymentMethods,
        autoApproveLimit: 5000,
        requireKycForDeposit: false
      };
      handleSaveCentralConfig(defaultConfig, "Reset central payment configuration to official Axi defaults.");
    }
  };

  // Quick Crypto Address Edit Handlers
  const handleCryptoAddressChange = (coinKey: string, field: keyof CryptoWalletConfig, value: any) => {
    const updatedWallets = {
      ...config.cryptoWallets,
      [coinKey]: {
        ...config.cryptoWallets[coinKey],
        [field]: value
      }
    };
    const updatedConfig = { ...config, cryptoWallets: updatedWallets };
    setConfig(updatedConfig);
  };

  const handleSaveCryptoWallets = async () => {
    setIsSaving(true);
    const res = await updateSystemConfigWallets(config.cryptoWallets);
    setIsSaving(false);
    showNotification(res.message);
  };

  // Bank Settings Handler
  const handleBankFieldChange = (field: keyof BankSettingsConfig, value: any) => {
    const updatedBank = {
      ...config.bankSettings,
      [field]: value
    };
    const updatedConfig = { ...config, bankSettings: updatedBank };
    setConfig(updatedConfig);
  };

  const handleSaveBankDetails = () => {
    handleSaveCentralConfig(config, "Updated bank wire routing instructions in Firestore!");
  };

  const renderHeader = () => (
    <div className="bg-gradient-to-r from-[#1c1f26] via-[#2a2e39] to-[#1c1f26] text-white p-5 rounded-t-xl border border-slate-700 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E3000F] flex items-center justify-center font-black text-white text-xl shadow-md shrink-0">
            AX
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Payment Control Panel <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E3000F]/20 text-red-400 font-bold border border-[#E3000F]/40">Firestore Sync</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage live deposit methods, receiving crypto wallet addresses, and bank wire details stored in Firestore central configuration.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isFirestoreLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-semibold text-slate-200">
              {isFirestoreLive ? 'Firestore Live Connected' : 'Local Storage Fallback'}
            </span>
          </div>

          <button 
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-600 transition"
            title="Restore official defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restore Defaults
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700/60">
        <button
          onClick={() => { setActiveSubTab('methods'); setView('list'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'methods' && view === 'list'
              ? 'bg-[#E3000F] text-white shadow-sm'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
          }`}
        >
          <Wallet className="w-4 h-4" /> All Payment Methods ({config.paymentMethods.length})
        </button>

        <button
          onClick={() => { setActiveSubTab('crypto'); setView('list'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'crypto' && view === 'list'
              ? 'bg-[#E3000F] text-white shadow-sm'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-400" /> Crypto Receiving Wallets
        </button>

        <button
          onClick={() => { setActiveSubTab('bank'); setView('list'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'bank' && view === 'list'
              ? 'bg-[#E3000F] text-white shadow-sm'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
          }`}
        >
          <Landmark className="w-4 h-4 text-blue-400" /> Bank Wire Routing Details
        </button>

        <button
          onClick={() => { setActiveSubTab('controls'); setView('list'); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'controls' && view === 'list'
              ? 'bg-[#E3000F] text-white shadow-sm'
              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-400" /> Deposit Limits & Controls
        </button>
      </div>
    </div>
  );

  const renderMethodsTab = () => {
    const filtered = config.paymentMethods.filter(m => 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      (m.type && m.type.toLowerCase().includes(search.toLowerCase())) ||
      (m.walletAddress && m.walletAddress.toLowerCase().includes(search.toLowerCase())) ||
      (m.currency && m.currency.toLowerCase().includes(search.toLowerCase()))
    );

    return (
      <div className="p-5 border border-slate-200 rounded-b-xl -mt-6 bg-white shadow-sm space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setView('create_crypto')}
              className="px-4 py-2 bg-[#E3000F] hover:bg-[#c4000d] text-white font-bold rounded-lg text-sm shadow-sm transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Add Crypto Method
            </button>
            <button 
              onClick={() => setView('create_bank')}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-sm transition flex items-center gap-2"
            >
              <Landmark className="w-4 h-4 text-blue-600" /> Add Bank Method
            </button>
            <button 
              onClick={() => setView('create_wallet')}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-lg text-sm transition flex items-center gap-2"
            >
              <Wallet className="w-4 h-4 text-purple-600" /> Add Digital Wallet
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search methods..."
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:border-[#E3000F] w-56"
              />
            </div>
          </div>
        </div>

        {/* Methods Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Method Name</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Type / Currency</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Deposit Limits ($)</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Processing Time</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(method => (
                <tr key={method.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4 align-middle">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {method.name}
                    </div>
                    {method.walletAddress && (
                      <div className="font-mono text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                        {method.walletAddress}
                      </div>
                    )}
                    {method.bankName && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {method.bankName} - {method.accountNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {method.type} ({method.currency})
                    </span>
                  </td>
                  <td className="py-4 px-4 align-middle text-xs font-semibold text-slate-700">
                    ${method.minDeposit?.toLocaleString()} – ${method.maxDeposit?.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 align-middle text-xs text-slate-600">
                    {method.processingTime || 'Instant'}
                  </td>
                  <td className="py-4 px-4 text-center align-middle">
                    <button 
                      onClick={() => toggleMethodActive(method.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                        method.active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {method.active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3.5 h-3.5 text-slate-400" /> Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right align-middle whitespace-nowrap space-x-1.5">
                    <button 
                      onClick={() => setViewModalMethod(method)}
                      className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button 
                      onClick={() => { setSelectedMethod(method); setView('edit'); }}
                      className="px-2.5 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      title="Edit Method"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => deleteMethod(method.id)} 
                      className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1"
                      title="Remove Method"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No payment methods found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCryptoTab = () => {
    return (
      <div className="p-6 border border-slate-200 rounded-b-xl -mt-6 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-500" /> Central Receiving Crypto Wallet Addresses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates saved here synchronize directly to Firestore document `/config/paymentConfig` and reflect on `FundsView` and `QuickDepositModal` immediately.
            </p>
          </div>

          <button
            onClick={handleSaveCryptoWallets}
            disabled={isSaving}
            className="px-5 py-2 bg-[#E3000F] hover:bg-[#c4000d] text-white font-bold rounded-lg text-sm shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save & Push to Firestore
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(config.cryptoWallets).map(([coinKey, wallet]: [string, any]) => (
            <div key={coinKey} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold uppercase text-slate-800 text-sm flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 font-black text-xs flex items-center justify-center border border-amber-500/20">
                    {coinKey.toUpperCase()}
                  </span>
                  {coinKey.toUpperCase()} ({wallet.network})
                </span>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wallet.active !== false}
                    onChange={(e) => handleCryptoAddressChange(coinKey, 'active', e.target.checked)}
                    className="w-4 h-4 text-[#E3000F] rounded border-slate-300"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Network / Chain Name</label>
                <input
                  type="text"
                  value={wallet.network}
                  onChange={(e) => handleCryptoAddressChange(coinKey, 'network', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#E3000F] outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Deposit Receiving Address</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wallet.address}
                    onChange={(e) => handleCryptoAddressChange(coinKey, 'address', e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#E3000F] outline-none bg-white"
                  />
                  <button
                    onClick={async () => {
                      await copyToClipboard(wallet.address);
                      showNotification(`Copied ${coinKey.toUpperCase()} receiving address!`);
                    }}
                    className="px-2.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                    title="Copy Address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Memo / Tag (If required)</label>
                <input
                  type="text"
                  value={wallet.memo || ''}
                  onChange={(e) => handleCryptoAddressChange(coinKey, 'memo', e.target.value)}
                  placeholder="Optional destination tag / memo..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-[#E3000F] outline-none bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBankTab = () => {
    return (
      <div className="p-6 border border-slate-200 rounded-b-xl -mt-6 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" /> Bank Wire Direct Routing Details
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure institution custody bank details shown to users initiating SWIFT/SEPA wire deposits.
            </p>
          </div>

          <button
            onClick={handleSaveBankDetails}
            disabled={isSaving}
            className="px-5 py-2 bg-[#E3000F] hover:bg-[#c4000d] text-white font-bold rounded-lg text-sm shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Bank Details to Firestore
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              🏦 Clearing Bank & Account Info
            </h4>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Custody Bank Name</label>
              <input
                type="text"
                value={config.bankSettings.bankName}
                onChange={(e) => handleBankFieldChange('bankName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Account Holder Name</label>
              <input
                type="text"
                value={config.bankSettings.accountName}
                onChange={(e) => handleBankFieldChange('accountName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Account Number / IBAN</label>
              <input
                type="text"
                value={config.bankSettings.accountNumber}
                onChange={(e) => handleBankFieldChange('accountNumber', e.target.value)}
                className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
              />
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              🌐 SWIFT / Routing Codes & Instructions
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={config.bankSettings.swiftBic}
                  onChange={(e) => handleBankFieldChange('swiftBic', e.target.value)}
                  className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Routing Number</label>
                <input
                  type="text"
                  value={config.bankSettings.routingNumber || ''}
                  onChange={(e) => handleBankFieldChange('routingNumber', e.target.value)}
                  className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Bank Physical Address</label>
              <input
                type="text"
                value={config.bankSettings.bankAddress || ''}
                onChange={(e) => handleBankFieldChange('bankAddress', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-[#E3000F]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-600 block mb-1">Wire Deposit Instructions for Trader</label>
              <textarea
                value={config.bankSettings.instructions}
                onChange={(e) => handleBankFieldChange('instructions', e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white outline-none focus:border-[#E3000F] h-20"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderControlsTab = () => {
    return (
      <div className="p-6 border border-slate-200 rounded-b-xl -mt-6 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" /> Platform Deposit Limits & Policy Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set auto-approval thresholds and deposit compliance requirements stored centrally in Firestore.
            </p>
          </div>

          <button
            onClick={() => handleSaveCentralConfig(config, "Saved platform deposit controls to Firestore!")}
            disabled={isSaving}
            className="px-5 py-2 bg-[#E3000F] hover:bg-[#c4000d] text-white font-bold rounded-lg text-sm shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Controls
          </button>
        </div>

        {/* Global Platform Maintenance Mode Switch & Configuration */}
        <div className={`p-5 rounded-xl border transition-all space-y-4 shadow-sm ${
          config.maintenanceMode?.active 
            ? 'bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/30' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                config.maintenanceMode?.active ? 'bg-amber-500 text-white animate-bounce' : 'bg-slate-200 text-slate-600'
              }`}>
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  Global System Maintenance Mode
                  {config.maintenanceMode?.active && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider animate-pulse">
                      ACTIVE ON FRONTEND
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-600">
                  When enabled, prevents new deposit requests and/or disables live order execution on the trading terminal for users.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const current = config.maintenanceMode || {
                  active: false,
                  message: 'System Maintenance Active: Deposits and live trading execution are temporarily paused for scheduled platform upgrades. Please check back shortly.',
                  disableDeposits: true,
                  disableTrading: true
                };
                const updated = { ...current, active: !current.active };
                const newConfig = { ...config, maintenanceMode: updated };
                handleSaveCentralConfig(newConfig, `Maintenance Mode is now ${updated.active ? 'ACTIVE (Frontend Paused)' : 'OFF (Normal Operations)'}`);
              }}
              className={`px-5 py-2.5 rounded-xl font-black text-sm transition flex items-center gap-2 shadow-md ${
                config.maintenanceMode?.active
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {config.maintenanceMode?.active ? (
                <>
                  <ToggleRight className="w-5 h-5" /> Maintenance Mode ACTIVE
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-400" /> Enable Maintenance Mode
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold uppercase text-slate-700">
              Custom Maintenance Alert Message Displayed to Traders
            </label>
            <textarea
              value={config.maintenanceMode?.message || 'System Maintenance Active: Deposits and live trading execution are temporarily paused for scheduled platform upgrades. Please check back shortly.'}
              onChange={(e) => {
                const current = config.maintenanceMode || {
                  active: false,
                  message: '',
                  disableDeposits: true,
                  disableTrading: true
                };
                setConfig({
                  ...config,
                  maintenanceMode: { ...current, message: e.target.value }
                });
              }}
              placeholder="Enter custom maintenance alert text displayed on deposit modals & trading terminal..."
              className="w-full border border-slate-300 rounded-lg p-3 text-xs text-slate-800 bg-white outline-none focus:border-[#E3000F] shadow-inner h-20"
            />

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode?.disableDeposits ?? true}
                  onChange={(e) => {
                    const current = config.maintenanceMode || {
                      active: false,
                      message: 'System Maintenance Active: Deposits and live trading execution are temporarily paused for scheduled platform upgrades. Please check back shortly.',
                      disableDeposits: true,
                      disableTrading: true
                    };
                    setConfig({
                      ...config,
                      maintenanceMode: { ...current, disableDeposits: e.target.checked }
                    });
                  }}
                  className="w-4 h-4 text-[#E3000F] rounded border-slate-300 focus:ring-[#E3000F]"
                />
                <span>Block All New Deposit Requests</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode?.disableTrading ?? true}
                  onChange={(e) => {
                    const current = config.maintenanceMode || {
                      active: false,
                      message: 'System Maintenance Active: Deposits and live trading execution are temporarily paused for scheduled platform upgrades. Please check back shortly.',
                      disableDeposits: true,
                      disableTrading: true
                    };
                    setConfig({
                      ...config,
                      maintenanceMode: { ...current, disableTrading: e.target.checked }
                    });
                  }}
                  className="w-4 h-4 text-[#E3000F] rounded border-slate-300 focus:ring-[#E3000F]"
                />
                <span>Disable Live Order Execution / Trading</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Auto-Approval Limit ($)
            </h4>
            <p className="text-xs text-slate-500">
              Deposits under this threshold can be automatically credited upon confirmation. Higher deposits require administrator review.
            </p>
            <input
              type="number"
              value={config.autoApproveLimit ?? 5000}
              onChange={(e) => setConfig({ ...config, autoApproveLimit: parseFloat(e.target.value) || 0 })}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold bg-white outline-none focus:border-[#E3000F]"
            />
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> KYC Verification Requirement
            </h4>
            <p className="text-xs text-slate-500">
              Enforce verified identity requirement before enabling live deposit options for traders.
            </p>
            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={config.requireKycForDeposit ?? false}
                onChange={(e) => setConfig({ ...config, requireKycForDeposit: e.target.checked })}
                className="w-5 h-5 text-[#E3000F] rounded border-slate-300 focus:ring-[#E3000F]"
              />
              <span className="text-sm font-bold text-slate-800">
                Require Verified Account Status Before Deposit
              </span>
            </label>
          </div>
        </div>

        {/* Global Dynamic Payment Method Gateway Toggles Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Global Payment Gateway & Method Status Control
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or disable individual payment channels (Stripe, Crypto Wallets, Bank Wire, Digital Wallets) in real time across the entire platform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const updatedMethods = config.paymentMethods.map(m => ({ ...m, active: true }));
                  handleSaveCentralConfig({ ...config, paymentMethods: updatedMethods }, "Enabled ALL payment gateways globally!");
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Enable All
              </button>
              <button
                onClick={() => {
                  const updatedMethods = config.paymentMethods.map(m => ({ ...m, active: false }));
                  handleSaveCentralConfig({ ...config, paymentMethods: updatedMethods }, "Disabled ALL payment gateways globally.");
                }}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <ToggleLeft className="w-3.5 h-3.5 text-slate-500" /> Disable All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.paymentMethods.map((method) => (
              <div 
                key={method.id} 
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                  method.active 
                    ? 'bg-white border-slate-200 shadow-sm' 
                    : 'bg-slate-100/70 border-slate-200 opacity-75'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${method.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    <h5 className="font-bold text-slate-900 text-sm truncate">{method.name}</h5>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {method.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {method.instructions || method.walletAddress || method.bankName || `${method.currency} payment gateway`}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 pt-1">
                    <span>Min: <strong>${method.minDeposit}</strong></span>
                    <span>•</span>
                    <span>Fee: <strong>{method.feePercent}%</strong></span>
                    <span>•</span>
                    <span>Time: <strong>{method.processingTime || 'Instant'}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => toggleMethodActive(method.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-sm ${
                    method.active
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  {method.active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-white" /> Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" /> Disabled
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only Stripe Webhook & Payment Gateway Status Monitor */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  Stripe Payment Gateway & Webhook Diagnostic Monitor
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Read-Only Verification
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Instant visibility into active server-side Stripe payment endpoints, raw-body webhook listener, and event routing.
                </p>
              </div>
            </div>

            <button
              onClick={checkStripeStatus}
              disabled={isCheckingStripe}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStripe ? 'animate-spin text-indigo-400' : ''}`} />
              {isCheckingStripe ? 'Checking...' : 'Ping Gateway'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Stripe API Service</div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${stripeStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className={stripeStatus?.configured ? 'text-emerald-400' : 'text-amber-400'}>
                  {stripeStatus?.configured ? 'Active & Ready' : 'Development Mode'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">API key setup in environment</p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Raw Webhook Handler</div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${stripeStatus?.webhookEndpoint ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-slate-200 font-mono text-xs">
                  {stripeStatus?.webhookEndpoint || '/api/stripe/webhook'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Express raw body parser active</p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Signature Enforcement</div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${stripeStatus?.webhookConfigured ? 'bg-emerald-400' : 'bg-sky-400'}`}></span>
                <span className={stripeStatus?.webhookConfigured ? 'text-emerald-400' : 'text-sky-300'}>
                  {stripeStatus?.webhookConfigured ? 'HMAC Verified' : 'Standard Webhook'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {stripeStatus?.webhookConfigured ? 'STRIPE_WEBHOOK_SECRET set' : 'Graceful fallback mode active'}
              </p>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 space-y-1">
              <div className="text-[11px] text-slate-400 font-medium">Ledger & Telegram Routing</div>
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Auto Dispatch</span>
              </div>
              <p className="text-[10px] text-slate-500">Instant notification on payment</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Supported Handlers:</span>
              <div className="flex flex-wrap gap-1.5">
                {(stripeStatus?.eventsSupported || ['payment_intent.succeeded', 'checkout.session.completed']).map((evt) => (
                  <span key={evt} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                    {evt}
                  </span>
                ))}
              </div>
            </div>
            {stripeStatus?.timestamp && (
              <div className="text-[11px] text-slate-500">
                Last checked: {new Date(stripeStatus.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateCrypto = () => {
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('USDT');
    const [network, setNetwork] = useState('TRON (TRC20)');
    const [address, setAddress] = useState('');
    const [memo, setMemo] = useState('');
    const [minDeposit, setMinDeposit] = useState(50);
    const [maxDeposit, setMaxDeposit] = useState(100000);

    const handleSave = () => {
      if (!name.trim() || !address.trim()) {
        alert("Please enter coin name and receiving wallet address.");
        return;
      }
      const newMethod: PaymentMethodItem = {
        id: `pm-crypto-${Date.now()}`,
        type: 'crypto',
        name: name.trim(),
        currency: currency.trim().toUpperCase(),
        network: network.trim(),
        walletAddress: address.trim(),
        memo: memo.trim() || undefined,
        active: true,
        minDeposit,
        maxDeposit,
        feePercent: 0,
        processingTime: 'Instant - 5 Mins'
      };

      const updatedConfig = {
        ...config,
        paymentMethods: [...config.paymentMethods, newMethod]
      };
      handleSaveCentralConfig(updatedConfig, `Added crypto payment method: ${name}`);
      setView('list');
    };

    return (
      <div className="max-w-2xl mx-auto space-y-5 bg-white p-6 border border-slate-200 rounded-xl shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900">Add Crypto Deposit Method</h2>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600 transition"><ArrowLeft className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Method Display Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. USDT TRC20" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Ticker Currency</label>
              <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="e.g. USDT, BTC" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Blockchain Network</label>
             <input type="text" value={network} onChange={e => setNetwork(e.target.value)} placeholder="e.g. TRON (TRC20), Ethereum (ERC20)" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Receiving Wallet Address</label>
             <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter public receiving crypto wallet address" className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div>
             <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Memo / Destination Tag (Optional)</label>
             <input type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="e.g. 1476340" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Min Deposit ($)</label>
              <input type="number" value={minDeposit} onChange={e => setMinDeposit(parseFloat(e.target.value) || 0)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Max Deposit ($)</label>
              <input type="number" value={maxDeposit} onChange={e => setMaxDeposit(parseFloat(e.target.value) || 0)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-[#E3000F] text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-[#c4000d] transition">
              Add Method to Firestore
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateBank = () => {
    const [name, setName] = useState('Bank Wire Transfer');
    const [bankName, setBankName] = useState(config.bankSettings.bankName);
    const [accountName, setAccountName] = useState(config.bankSettings.accountName);
    const [accountNumber, setAccountNumber] = useState(config.bankSettings.accountNumber);
    const [swiftBic, setSwiftBic] = useState(config.bankSettings.swiftBic);

    const handleSave = () => {
      const newMethod: PaymentMethodItem = {
        id: `pm-bank-${Date.now()}`,
        type: 'bank',
        name,
        currency: 'USD',
        active: true,
        minDeposit: 500,
        maxDeposit: 1000000,
        feePercent: 0,
        processingTime: '1-3 Business Days',
        bankName,
        accountName,
        accountNumber,
        swiftBic
      };

      const updatedConfig = {
        ...config,
        paymentMethods: [...config.paymentMethods, newMethod]
      };
      handleSaveCentralConfig(updatedConfig, `Added bank method: ${name}`);
      setView('list');
    };

    return (
      <div className="max-w-2xl mx-auto space-y-5 bg-white p-6 border border-slate-200 rounded-xl shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900">Add Bank Wire Method</h2>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Method Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Bank Name</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Holder Name</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Number / IBAN</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">SWIFT / BIC</label>
            <input type="text" value={swiftBic} onChange={e => setSwiftBic(e.target.value)} className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-[#E3000F] text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-[#c4000d] transition">
              Add Bank Method
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateWallet = () => {
    const [name, setName] = useState('');
    const [walletIdentifier, setWalletIdentifier] = useState('');

    const handleSave = () => {
      if (!name.trim() || !walletIdentifier.trim()) {
        alert("Please enter wallet name and account identifier.");
        return;
      }
      const newMethod: PaymentMethodItem = {
        id: `pm-wallet-${Date.now()}`,
        type: 'wallet',
        name,
        currency: 'USD',
        active: true,
        minDeposit: 50,
        maxDeposit: 15000,
        feePercent: 1.0,
        processingTime: 'Instant',
        walletIdentifier
      };

      const updatedConfig = {
        ...config,
        paymentMethods: [...config.paymentMethods, newMethod]
      };
      handleSaveCentralConfig(updatedConfig, `Added digital wallet: ${name}`);
      setView('list');
    };

    return (
      <div className="max-w-2xl mx-auto space-y-5 bg-white p-6 border border-slate-200 rounded-xl shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900">Add Digital Wallet Method</h2>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Wallet Service Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. PayPal, CashApp, Skrill" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Wallet ID / Email / Tag</label>
            <input type="text" value={walletIdentifier} onChange={e => setWalletIdentifier(e.target.value)} placeholder="e.g. payments@axi.com or $AxiTag" className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => setView('list')} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-[#E3000F] text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-[#c4000d] transition">
              Add Digital Wallet
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEditForm = () => {
    if (!selectedMethod) return null;

    const [name, setName] = useState(selectedMethod.name);
    const [currency, setCurrency] = useState(selectedMethod.currency);
    const [walletAddress, setWalletAddress] = useState(selectedMethod.walletAddress || '');
    const [network, setNetwork] = useState(selectedMethod.network || '');
    const [minDeposit, setMinDeposit] = useState(selectedMethod.minDeposit);
    const [maxDeposit, setMaxDeposit] = useState(selectedMethod.maxDeposit);
    const [processingTime, setProcessingTime] = useState(selectedMethod.processingTime || 'Instant');
    const [active, setActive] = useState(selectedMethod.active);

    const handleUpdate = () => {
      const updatedMethods = config.paymentMethods.map(m => {
        if (m.id === selectedMethod.id) {
          return {
            ...m,
            name,
            currency,
            walletAddress,
            network,
            minDeposit,
            maxDeposit,
            processingTime,
            active
          };
        }
        return m;
      });

      const updatedConfig = { ...config, paymentMethods: updatedMethods };
      handleSaveCentralConfig(updatedConfig, `Updated payment method: ${name}`);
      setView('list');
      setSelectedMethod(null);
    };

    return (
      <div className="max-w-2xl mx-auto space-y-5 bg-white p-6 border border-slate-200 rounded-xl shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900">Edit Method: {selectedMethod.name}</h2>
          <button onClick={() => { setView('list'); setSelectedMethod(null); }} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Currency</label>
            <input type="text" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          {selectedMethod.type === 'crypto' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Blockchain Network</label>
                <input type="text" value={network} onChange={e => setNetwork(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Receiving Address</label>
                <input type="text" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} className="w-full font-mono border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Min Deposit ($)</label>
              <input type="number" value={minDeposit} onChange={e => setMinDeposit(parseFloat(e.target.value) || 0)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Max Deposit ($)</label>
              <input type="number" value={maxDeposit} onChange={e => setMaxDeposit(parseFloat(e.target.value) || 0)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Processing Duration</label>
            <input type="text" value={processingTime} onChange={e => setProcessingTime(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E3000F]" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="activeEdit" 
              checked={active} 
              onChange={e => setActive(e.target.checked)} 
              className="w-4 h-4 text-[#E3000F] rounded border-slate-300"
            />
            <label htmlFor="activeEdit" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Active for user deposits
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button onClick={() => { setView('list'); setSelectedMethod(null); }} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancel
            </button>
            <button onClick={handleUpdate} className="bg-[#E3000F] text-white px-6 py-2.5 rounded-lg font-bold shadow hover:bg-[#c4000d] transition">
              Save Changes to Firestore
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {renderHeader()}

      {view === 'list' && (
        <>
          {activeSubTab === 'methods' && renderMethodsTab()}
          {activeSubTab === 'crypto' && renderCryptoTab()}
          {activeSubTab === 'bank' && renderBankTab()}
          {activeSubTab === 'controls' && renderControlsTab()}
        </>
      )}

      {view === 'create_crypto' && renderCreateCrypto()}
      {view === 'create_bank' && renderCreateBank()}
      {view === 'create_wallet' && renderCreateWallet()}
      {view === 'edit' && renderEditForm()}

      {/* VIEW MODAL OVERLAY */}
      {viewModalMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#1c1f26] to-[#2a2e39] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">{viewModalMethod.name}</h3>
                <p className="text-xs text-slate-400">{viewModalMethod.type.toUpperCase()} • {viewModalMethod.currency}</p>
              </div>
              <button onClick={() => setViewModalMethod(null)} className="text-slate-400 hover:text-white p-1 rounded">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {viewModalMethod.walletAddress && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">QR Code Deposit Address</div>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(viewModalMethod.walletAddress)}`} 
                      alt="QR Code" 
                      className="w-36 h-36 mx-auto rounded-lg border border-slate-300 p-2 bg-white shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Receiving Address</label>
                    <div className="flex items-center gap-2 bg-slate-100 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 break-all">
                      <span className="flex-1">{viewModalMethod.walletAddress}</span>
                      <button 
                        onClick={async () => {
                          await copyToClipboard(viewModalMethod.walletAddress!);
                          setCopiedAddr(true);
                          setTimeout(() => setCopiedAddr(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded font-bold transition flex items-center gap-1 shrink-0"
                      >
                        {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedAddr ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {viewModalMethod.bankName && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div><span className="text-slate-500 font-semibold">Bank Name:</span> <span className="font-bold text-slate-900">{viewModalMethod.bankName}</span></div>
                  <div><span className="text-slate-500 font-semibold">Account Holder:</span> <span className="font-bold text-slate-900">{viewModalMethod.accountName}</span></div>
                  <div><span className="text-slate-500 font-semibold">Account/IBAN:</span> <span className="font-mono font-bold text-slate-900">{viewModalMethod.accountNumber}</span></div>
                  {viewModalMethod.swiftBic && <div><span className="text-slate-500 font-semibold">SWIFT/BIC:</span> <span className="font-mono font-bold text-slate-900">{viewModalMethod.swiftBic}</span></div>}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${viewModalMethod.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  Status: {viewModalMethod.active ? 'Active' : 'Disabled'}
                </span>
                <button 
                  onClick={() => {
                    setSelectedMethod(viewModalMethod);
                    setViewModalMethod(null);
                    setView('edit');
                  }}
                  className="px-4 py-2 bg-[#E3000F] text-white font-bold text-xs rounded-lg hover:bg-[#c4000d] transition"
                >
                  Edit Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
