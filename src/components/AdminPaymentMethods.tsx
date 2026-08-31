import React, { useEffect, useState } from 'react';
import { Banknote, Bitcoin, CreditCard, RefreshCw, Save, Smartphone } from 'lucide-react';

type PaymentMethods = {
  bankTransfer: { enabled: boolean; bankName: string; accountName: string; accountNumber: string; routingNumber: string; swiftBic: string; currency: string; instructions: string };
  instantTransfer: { enabled: boolean; providerName: string; accountName: string; accountNumber: string; instructions: string };
  crypto: { enabled: boolean; asset: string; network: string; address: string; memo: string; instructions: string };
};

const empty: PaymentMethods = {
  bankTransfer: { enabled: false, bankName: '', accountName: '', accountNumber: '', routingNumber: '', swiftBic: '', currency: '', instructions: '' },
  instantTransfer: { enabled: false, providerName: '', accountName: '', accountNumber: '', instructions: '' },
  crypto: { enabled: false, asset: '', network: '', address: '', memo: '', instructions: '' }
};

export default function AdminPaymentMethods({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const [methods, setMethods] = useState<PaymentMethods>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-methods');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load payment settings');
      setMethods({ ...empty, ...data.methods, bankTransfer: { ...empty.bankTransfer, ...(data.methods?.bankTransfer || {}) }, instantTransfer: { ...empty.instantTransfer, ...(data.methods?.instantTransfer || {}) }, crypto: { ...empty.crypto, ...(data.methods?.crypto || {}) } });
    } catch (error: any) {
      showToast(error?.message || 'Unable to load payment settings.', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const update = (group: keyof PaymentMethods, field: string, value: string | boolean) => {
    setMethods(prev => ({ ...prev, [group]: { ...prev[group], [field]: value } } as PaymentMethods));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(methods) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to save payment settings');
      showToast('Payment details saved successfully.', 'success');
    } catch (error: any) { showToast(error?.message || 'Payment settings could not be saved.', 'error'); }
    finally { setSaving(false); }
  };

  const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
  const Field = ({ label, group, field, placeholder = '' }: { label: string; group: keyof PaymentMethods; field: string; placeholder?: string }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><input className={input} value={String((methods[group] as any)[field] ?? '')} onChange={e => update(group, field, e.target.value)} placeholder={placeholder} /></label>
  );

  if (loading) return <div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Loading payment settings…</div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Method Control</h2><p className="mt-1 text-xs text-slate-500">Only configured and enabled methods are published to customers. Nothing is pre-filled.</p></div><button type="button" onClick={load} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"><RefreshCw className="h-4 w-4" /></button></div>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Banknote className="h-5 w-5" /> Bank Transfer</h3><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={methods.bankTransfer.enabled} onChange={e => update('bankTransfer','enabled',e.target.checked)} /> Enabled</label></div><div className="grid gap-4 md:grid-cols-2"><Field label="Bank name" group="bankTransfer" field="bankName" /><Field label="Account name" group="bankTransfer" field="accountName" /><Field label="Account number" group="bankTransfer" field="accountNumber" /><Field label="Routing / sort code" group="bankTransfer" field="routingNumber" /><Field label="SWIFT / BIC" group="bankTransfer" field="swiftBic" /><Field label="Currency" group="bankTransfer" field="currency" /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions</span><textarea className={input} rows={3} value={methods.bankTransfer.instructions} onChange={e => update('bankTransfer','instructions',e.target.value)} /></label></section>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Smartphone className="h-5 w-5" /> Instant Transfer</h3><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={methods.instantTransfer.enabled} onChange={e => update('instantTransfer','enabled',e.target.checked)} /> Enabled</label></div><div className="grid gap-4 md:grid-cols-2"><Field label="Provider / bank" group="instantTransfer" field="providerName" /><Field label="Account name" group="instantTransfer" field="accountName" /><Field label="Account / wallet number" group="instantTransfer" field="accountNumber" /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions</span><textarea className={input} rows={3} value={methods.instantTransfer.instructions} onChange={e => update('instantTransfer','instructions',e.target.value)} /></label></section>

    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold"><Bitcoin className="h-5 w-5" /> Crypto Wallet</h3><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={methods.crypto.enabled} onChange={e => update('crypto','enabled',e.target.checked)} /> Enabled</label></div><div className="grid gap-4 md:grid-cols-2"><Field label="Asset" group="crypto" field="asset" placeholder="e.g. USDT" /><Field label="Network" group="crypto" field="network" placeholder="e.g. TRC20" /><div className="md:col-span-2"><Field label="Wallet address" group="crypto" field="address" /></div><Field label="Memo / tag (optional)" group="crypto" field="memo" /></div><label className="mt-4 block space-y-1"><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Customer instructions</span><textarea className={input} rows={3} value={methods.crypto.instructions} onChange={e => update('crypto','instructions',e.target.value)} /></label></section>

    <div className="flex justify-end"><button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Payment Details'}</button></div>
    <p className="text-xs text-slate-500">Card payments remain handled by Stripe. These settings are for manual bank, instant-transfer, and crypto funding instructions only.</p>
  </div>;
}
