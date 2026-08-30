import React, { useMemo, useState } from 'react';
import { Activity, ShieldCheck, UserCheck } from 'lucide-react';

interface AdminUserPnlControlProps {
  users: Array<{
    id: string;
    name: string;
    email: string;
    balance: number;
    status: string;
  }>;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  onLogAudit?: (category: any, user: string, details: string) => void;
}

/**
 * Production-safe portfolio view.
 *
 * The previous component allowed an administrator to manufacture a user's P&L,
 * return percentage and chart trend. That is deliberately removed. Portfolio
 * performance must come from actual positions, actual balances and live prices.
 */
export default function AdminUserPnlControl({ users, onShowToast }: AdminUserPnlControlProps) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) || users[0], [users, selectedUserId]);

  if (!selectedUser) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No registered users are currently available.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black">Portfolio Performance Integrity</h2>
            <p className="mt-1 text-xs text-slate-300">P&L is read from the user's real ledger and current market prices. Manual P&L fabrication is disabled.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-black uppercase tracking-wider text-slate-700">
            <UserCheck className="h-4 w-4" /> Registered users
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {users.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${user.id === selectedUser.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
              >
                <div className="text-xs font-black">{user.name}</div>
                <div className={`mt-1 font-mono text-[10px] ${user.id === selectedUser.id ? 'text-slate-300' : 'text-slate-500'}`}>{user.email}</div>
                <div className="mt-2 text-[10px]">Ledger balance: ${Number(user.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected account</div>
                <h3 className="mt-1 text-lg font-black text-slate-900">{selectedUser.name}</h3>
                <div className="font-mono text-xs text-slate-500">{selectedUser.email}</div>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase text-slate-400">Ledger balance</div>
                <div className="mt-1 font-mono text-xl font-black text-slate-900">${Number(selectedUser.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase text-slate-400">Account status</div>
                <div className="mt-1 text-sm font-black text-slate-900">{selectedUser.status || 'Unknown'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase text-slate-400">P&L source</div>
                <div className="mt-1 text-sm font-black text-emerald-700">Real positions</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            <div className="font-black">Production integrity rule</div>
            <p className="mt-1 text-xs leading-5">Administrators cannot set a custom profit, loss, return percentage, balance curve, or portfolio trend. Any displayed performance must be calculated from recorded transactions/positions and verified market prices.</p>
            {onShowToast && <button type="button" className="mt-3 text-xs font-black underline" onClick={() => onShowToast('Synthetic P&L controls are disabled. Performance remains ledger-driven.', 'info')}>Confirm policy</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
