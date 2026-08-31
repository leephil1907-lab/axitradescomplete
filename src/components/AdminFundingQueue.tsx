import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, RefreshCw, XCircle } from 'lucide-react';

interface PendingDeposit {
  id: string;
  userEmail: string;
  amount: number;
  method: string;
  status: string;
  stripeRef?: string;
  receivedAt: string;
  creditedByAdmin?: boolean;
  user?: { id?: string; email?: string; name?: string; balance?: number };
}

export default function AdminFundingQueue({ showToast }: { showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const [items, setItems] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/funding/pending');
      const data = await res.json();
      if (res.ok && Array.isArray(data.deposits)) setItems(data.deposits);
    } catch (error) {
      console.warn('Funding queue load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const credit = async (deposit: PendingDeposit) => {
    const userId = deposit.user?.id;
    if (!userId) {
      showToast('This payment has no verified user ID. Do not credit it automatically; verify the customer manually.', 'error');
      return;
    }

    setBusy(deposit.id);
    try {
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      const user = (usersData.users || []).find((u: any) => u.id === userId || u.email?.toLowerCase() === deposit.userEmail?.toLowerCase());
      if (!user) throw new Error('User account could not be verified.');

      const nextBalance = Number(user.balance || 0) + Number(deposit.amount || 0);
      const balanceRes = await fetch(`/api/users/${encodeURIComponent(userId)}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: nextBalance, reason: `Stripe payment ${deposit.stripeRef || deposit.id} manually credited by admin` })
      });
      if (!balanceRes.ok) throw new Error('User balance update failed.');

      const markRes = await fetch(`/api/admin/funding/${encodeURIComponent(deposit.id)}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, creditedBalance: nextBalance })
      });
      if (!markRes.ok) throw new Error('Payment record could not be marked as credited.');

      showToast(`$${Number(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} manually credited to ${deposit.userEmail}.`, 'success');
      await load();
    } catch (error: any) {
      showToast(error?.message || 'Manual credit failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (deposit: PendingDeposit) => {
    setBusy(deposit.id);
    try {
      const res = await fetch(`/api/admin/funding/${encodeURIComponent(deposit.id)}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not reject payment.');
      showToast('Stripe payment marked for rejection/investigation. No balance was credited.', 'info');
      await load();
    } catch (error: any) {
      showToast(error?.message || 'Rejection failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><CreditCard className="h-5 w-5" /> Stripe Funding Review</h2>
          <p className="mt-1 text-xs text-slate-500">Stripe confirms receipt first. Internal balance credit requires an explicit admin action.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Refresh funding queue">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No Stripe payments are awaiting manual credit.</div>
      ) : (
        <div className="space-y-3">
          {items.map((deposit) => (
            <div key={deposit.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><Clock3 className="h-4 w-4" /> ${Number(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{deposit.user?.name || deposit.userEmail}</div>
                  <div className="mt-1 text-xs text-slate-500">{deposit.method} · {deposit.stripeRef || deposit.id} · {new Date(deposit.receivedAt).toLocaleString()}</div>
                  <div className="mt-1 text-xs font-medium text-amber-600">{deposit.status}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy === deposit.id} onClick={() => reject(deposit)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle className="h-4 w-4" /> Reject</button>
                  <button type="button" disabled={busy === deposit.id} onClick={() => credit(deposit)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Credit Balance</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
