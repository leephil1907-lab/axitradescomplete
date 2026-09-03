import React, { useEffect, useState } from 'react';
import { Banknote, Bitcoin, Plus, RefreshCw, Save, Smartphone, Trash2 } from 'lucide-react';
import { authHeaders } from '../utils/authHeaders';

type BankTransfer = { enabled: boolean; bankName: string; accountName: string; accountNumber: string; routingNumber: string; swiftBic: string; currency: string; instructions: string };
type InstantTransfer = { enabled: boolean; providerName: string; accountName: string; accountNumber: string; instructions: string };
type CryptoWallet = { id: string; enabled: boolean; asset: string; network: string; address: string; memo: string; label: string; instructions: string };
type PaymentMethods = { bankTransfer: BankTransfer; instantTransfer: InstantTransfer; crypto: CryptoWallet[] };

const emptyBank: BankTransfer = { enabled: false, bankName: '', accountName: '', accountNumber: '', routingNumber: '', swiftBic: '', currency: '', instructions: '' };
const emptyInstant: InstantTransfer = { enabled: false, providerName: '', accountName: '', accountNumber: '', instructions: '' };
const newWallet = (): CryptoWallet => ({ id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, enabled: true, asset: '', network: '', address: '', memo: '', label: '', instructions: '' });

export default function AdminPaymentMethods({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const [methods, setMethods] = useState<PaymentMethods>({ bankTransfer: emptyBank, instantTransfer: emptyInstant, crypto: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/admin/payment-methods', { headers });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load payment settings');
      const rawCrypto = Array.isArray(data.methods?.crypto) ? data.methods.crypto : (data.methods?.crypto ? [data.methods.crypto] : []);
      setMethods({
        bankTransfer: { ...emptyBank, ...(data.methods?.bankTransfer || {}) },
        instantTransfer: { ...emptyInstant, ...(data.methods?.instantTransfer || {}) },
        crypto: rawCrypto.map((wallet: any, index: number) => ({ id: String(wallet.id || `crypto-${index}`), enabled: Boolean(wallet.enabled), asset: String(wallet.asset || ''), network: String(wallet.network || ''), address: String(wallet.address || wallet.walletAddress || ''), memo: String(wallet.memo || ''), label: String(wallet.label || ''), instructions: String(wallet.instructions || '') }))
      });
    } catch (error: any) {
      showToast(error?.message || 'Unable to load payment settings.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateGroup = (group: 'bankTransfer' | 'instantTransfer', field: string, value: string | boolean) => {
    setMethods(prev => ({ ...prev, [group]: { ...prev[group], [field]: value } } as PaymentMethods));
  };
  const updateWallet = (id: string, field: keyof CryptoWallet, value: string | boolean) => {
    setMethods(prev => ({ ...prev, crypto: prev.crypto.map(wallet => wallet.id === id ? { ...wallet, [field]: value } : wallet) }));
  };
  const addWallet = () => setMethods(prev => ({ ...prev, crypto: [...prev.crypto, newWallet()] }));
  const removeWallet = (id: string) => setMethods(prev => ({ ...prev, crypto: prev.crypto.filter(wallet => wallet.id !== id) }));

  const save = async () => {
    const invalid = methods.crypto.find(wallet => wallet.enabled && (!wallet.asset.trim() || !wallet.network.trim() || !wallet.address.trim()));
    if (invalid) return showToast('Every enabled crypto wallet needs an asset, network, and wallet address.', 'error');
    setSaving(true);
    try {
      const headers = await authHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch('/api/admin/payment-methods', { method: 'POST', headers, body: JSON.stringify(methods) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to save payment settings');
      showToast('Payment details saved successfully.', 'success');
      await load();
    } catch (error: any) { showToast(error?.message || 'Payment settings could not be saved.', 'error'); }
    finally { setSaving(false); }
  };

  const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const Field = ({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><input className={input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>
  );

  if (loading) return <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Loading payment settings…</div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Method Control</h2><p className="mt-1 text-xs text-slate-500">Configure real customer payment instructions. Crypto wallets are stored as separate payment methods.</p></div><button type="button" onClick={load} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" aria-label="Refresh payment methods"><RefreshCw className="h-4 w-4" /></button></div>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Banknote className="h-5 w-5" /> Bank Transfer</h3><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={methods.bankTransfer.enabled} onChange={e => updateGroup('bankTransfer','enabled',e.target.checked)} /> Enabled</label></div><div className="grid gap-4 md:grid-cols-2"><Field label="Bank name" value={methods.bankTransfer.bankName} onChange={v => updateGroup('bankTransfer','bankName',v)} /><Field label="Account name" value={methods.bankTransfer.accountName} onChange={v => updateGroup('bankTransfer','accountName',v)} /><Field label="Account number" value={methods.bankTransfer.accountNumber} onChange={v => updateGroup('bankTransfer','accountNumber',v)} /><Field label="Routing / sort code" value={methods.bankTransfer.routingNumber} onChange={v => updateGroup('bankTransfer','routingNumber',v)} /><Field label="SWIFT / BIC" value={methods.bankTransfer.swiftBic} onChange={v => updateGroup('bankTransfer','swiftBic',v)} /><Field label="Currency" value={methods.bankTransfer.currency} onChange={v => updateGroup('bankTransfer','currency',v)} /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions</span><textarea className={input} rows={3} value={methods.bankTransfer.instructions} onChange={e => updateGroup('bankTransfer','instructions',e.target.value)} /></label></section>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Smartphone className="h-5 w-5" /> Instant Transfer</h3><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={methods.instantTransfer.enabled} onChange={e => updateGroup('instantTransfer','enabled',e.target.checked)} /> Enabled</label></div><div className="grid gap-4 md:grid-cols-2"><Field label="Provider / bank" value={methods.instantTransfer.providerName} onChange={v => updateGroup('instantTransfer','providerName',v)} /><Field label="Account name" value={methods.instantTransfer.accountName} onChange={v => updateGroup('instantTransfer','accountName',v)} /><Field label="Account / wallet number" value={methods.instantTransfer.accountNumber} onChange={v => updateGroup('instantTransfer','accountNumber',v)} /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions</span><textarea className={input} rows={3} value={methods.instantTransfer.instructions} onChange={e => updateGroup('instantTransfer','instructions',e.target.value)} /></label></section>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-bold"><Bitcoin className="h-5 w-5" /> Crypto Wallets</h3><p className="mt-1 text-xs text-slate-500">Add as many assets and networks as you need. USDT/USDC can be configured separately per network.</p></div><button type="button" onClick={addWallet} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Payment Method</button></div>
      {methods.crypto.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No crypto wallets configured yet. Click <strong>Add Payment Method</strong> to add the first wallet.</div> : <div className="space-y-4">{methods.crypto.map((wallet, index) => <div key={wallet.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">{index + 1}</span><span className="text-sm font-bold">Crypto payment method</span></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={wallet.enabled} onChange={e => updateWallet(wallet.id,'enabled',e.target.checked)} /> Active</label><button type="button" onClick={() => removeWallet(wallet.id)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" aria-label={`Remove crypto wallet ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div></div><div className="grid gap-4 md:grid-cols-2"><Field label="Asset" value={wallet.asset} onChange={v => updateWallet(wallet.id,'asset',v.toUpperCase())} placeholder="e.g. BTC, ETH, USDT, USDC" /><Field label="Network" value={wallet.network} onChange={v => updateWallet(wallet.id,'network',v)} placeholder="e.g. Bitcoin, Ethereum, TRON, BSC, Solana, Base" /><div className="md:col-span-2"><Field label="Wallet address" value={wallet.address} onChange={v => updateWallet(wallet.id,'address',v.trim())} placeholder="Enter the receiving wallet address" /></div><Field label="Label (optional)" value={wallet.label} onChange={v => updateWallet(wallet.id,'label',v)} placeholder="e.g. Main USDT wallet" /><Field label="Memo / tag (optional)" value={wallet.memo} onChange={v => updateWallet(wallet.id,'memo',v)} placeholder="Required only for some assets" /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions (optional)</span><textarea className={input} rows={2} value={wallet.instructions} onChange={e => updateWallet(wallet.id,'instructions',e.target.value)} /></label></div>)}</div>}
    </section>

    <div className="flex justify-end"><button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Payment Details'}</button></div>
    <p className="text-xs text-slate-500">Card payments remain handled by Stripe. Manual bank, instant-transfer, and crypto funding instructions are published only when enabled.</p>
  </div>;
}
