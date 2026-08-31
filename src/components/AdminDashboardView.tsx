import React, { useEffect, useState } from 'react';
import { useSiteCMS } from '../hooks/useSiteCMS';
import { ViewType, DisplayCurrency } from '../types';
import AdminFundingQueue from './AdminFundingQueue';
import AdminPaymentMethods from './AdminPaymentMethods';

interface AdminDashboardViewProps {
  transactions: any[];
  updateTransactionStatus: (id: string, status: string) => void;
  setLiveBalance: React.Dispatch<React.SetStateAction<number>>;
  liveBalance: number;
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  displayCurrency?: DisplayCurrency;
  setDisplayCurrency?: (curr: DisplayCurrency) => void;
  formatCurrency?: (usdAmount: number, targetCurrency?: DisplayCurrency, decimals?: number) => string;
}

export default function AdminDashboardView({
  setView,
  showToast,
  transactions,
  updateTransactionStatus,
  setLiveBalance,
  liveBalance,
  displayCurrency = 'USD',
  setDisplayCurrency,
  formatCurrency = (amt) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}: AdminDashboardViewProps) {
  const { cmsContent } = useSiteCMS();
  const [activeTab, setActiveTab] = useState<'overview' | 'funding' | 'payments'>('overview');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    document.title = 'AXITRADES Admin';
  }, []);

  const pendingCount = transactions.filter((tx) => {
    const status = String(tx?.status ?? '').toLowerCase();
    return status.includes('pending') || status.includes('awaiting');
  }).length;

  const handleStatusUpdate = (id: string, status: string) => {
    updateTransactionStatus(id, status);
    showToast(`Transaction ${id} updated to ${status}.`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AXITRADES Admin</h1>
            <p className="mt-1 text-sm text-slate-400">Production operations and funding control</p>
          </div>
          <button
            type="button"
            onClick={() => setView('dashboard' as ViewType)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Available Balance</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(liveBalance, displayCurrency)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Pending Transactions</p>
            <p className="mt-2 text-2xl font-semibold">{pendingCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Currency</p>
            <p className="mt-2 text-2xl font-semibold">{displayCurrency}</p>
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {(['overview', 'funding', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'funding' ? 'Funding' : 'Payment Settings'}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">Transaction controls</h2>
            <p className="mt-1 text-sm text-slate-400">Only real transaction records should appear here. No demo records are created by this component.</p>
            <div className="mt-5 space-y-3">
              {transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">No transaction records available.</div>
              ) : transactions.map((tx) => (
                <div key={String(tx.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-4">
                  <div>
                    <p className="font-medium">{String(tx.id)}</p>
                    <p className="text-sm text-slate-400">{String(tx.status ?? 'Unknown')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleStatusUpdate(String(tx.id), 'Approved')} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-950">Approve</button>
                    <button type="button" onClick={() => handleStatusUpdate(String(tx.id), 'Rejected')} className="rounded-md border border-white/10 px-3 py-2 text-sm">Reject</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <label htmlFor="admin-note" className="mb-2 block text-sm text-slate-400">Admin note</label>
              <textarea id="admin-note" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="min-h-24 w-full rounded-lg border border-white/10 bg-black/20 p-3 outline-none" placeholder="Enter a real operational note..." />
            </div>
          </section>
        )}

        {activeTab === 'funding' && <AdminFundingQueue showToast={showToast} />}
        {activeTab === 'payments' && <AdminPaymentMethods showToast={showToast} />}
      </main>
    </div>
  );
}
