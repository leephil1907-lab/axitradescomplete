import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ToggleLeft, ToggleRight, 
  Sliders, ShieldCheck, Sparkles, RefreshCw, CheckCircle2, UserCheck, Activity, BarChart2
} from 'lucide-react';
import { getPnlOverrideForUser, setPnlOverrideForUser, clearPnlOverrideForUser, PnlOverrideConfig } from '../utils/pnlOverride';
import { sendTelegramAlert } from '../utils/telegram';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

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

export default function AdminUserPnlControl({ users, onShowToast, onLogAudit }: AdminUserPnlControlProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'usr_8492');
  const selectedUser = users.find(u => u.id === selectedUserId || u.email === selectedUserId) || users[0] || {
    id: 'usr_8492',
    name: 'Alex Turner',
    email: 'trader@axi.com',
    balance: 10000,
    status: 'Verified'
  };

  const [overrideEnabled, setOverrideEnabled] = useState<boolean>(false);
  const [unrealizedPnlInput, setUnrealizedPnlInput] = useState<string>('1450.00');
  const [realizedPnlInput, setRealizedPnlInput] = useState<string>('3200.00');
  const [pnlPercentInput, setPnlPercentInput] = useState<string>('24.5');
  const [trendPattern, setTrendPattern] = useState<'bullish' | 'growth' | 'volatile' | 'bearish'>('bullish');
  const [notesInput, setNotesInput] = useState<string>('Administrative Portfolio Showcase Override');

  // Load existing override on selected user change
  useEffect(() => {
    if (!selectedUser) return;
    const existing = getPnlOverrideForUser(selectedUser.id) || getPnlOverrideForUser(selectedUser.email);
    if (existing) {
      setOverrideEnabled(existing.enabled);
      setUnrealizedPnlInput((existing.unrealizedPnl ?? 1450).toString());
      setRealizedPnlInput((existing.realizedPnl ?? 3200).toString());
      setPnlPercentInput((existing.pnlPercentage ?? 24.5).toString());
      setTrendPattern(existing.trendPattern || 'bullish');
      setNotesInput(existing.customAccountNotes || 'Administrative Portfolio Showcase Override');
    } else {
      setOverrideEnabled(false);
      setUnrealizedPnlInput('1450.00');
      setRealizedPnlInput('3200.00');
      setPnlPercentInput('24.5');
      setTrendPattern('bullish');
    }
  }, [selectedUserId]);

  const handleApplyPnlOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const unPnl = parseFloat(unrealizedPnlInput) || 0;
    const rePnl = parseFloat(realizedPnlInput) || 0;
    const pct = parseFloat(pnlPercentInput) || 0;

    const config: PnlOverrideConfig = {
      enabled: overrideEnabled,
      unrealizedPnl: unPnl,
      realizedPnl: rePnl,
      pnlPercentage: pct,
      trendPattern,
      customAccountNotes: notesInput.trim(),
      updatedAt: new Date().toISOString()
    };

    setPnlOverrideForUser(selectedUser.id, config);
    if (selectedUser.email) {
      setPnlOverrideForUser(selectedUser.email, config);
    }

    // Write directly to user's Firestore document
    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      setDoc(userDocRef, {
        pnlPercentage: pct,
        pnlOverride: config,
        updatedAt: Date.now()
      }, { merge: true });

      if (selectedUser.email && selectedUser.email !== selectedUser.id) {
        const emailDocRef = doc(db, 'users', selectedUser.email);
        setDoc(emailDocRef, {
          pnlPercentage: pct,
          pnlOverride: config,
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.warn('Firestore user P&L update error:', err);
    }

    sendTelegramAlert('ADMIN_PNL_OVERRIDE', `🎯 Admin Set User P&L Override: ${selectedUser.name} (${selectedUser.email})`, {
      'User Name': selectedUser.name,
      'User Email': selectedUser.email,
      'Override Active': overrideEnabled ? 'YES' : 'NO',
      'Unrealized P&L': `${unPnl >= 0 ? '+' : ''}$${unPnl.toLocaleString()} USD`,
      'Realized P&L': `${rePnl >= 0 ? '+' : ''}$${rePnl.toLocaleString()} USD`,
      'P&L Return %': `${pct >= 0 ? '+' : ''}${pct}%`,
      'Trend Pattern': trendPattern
    });

    if (onLogAudit) {
      onLogAudit(
        'Compliance Override',
        `${selectedUser.name} (${selectedUser.email})`,
        `Set Live P&L Override to ${unPnl >= 0 ? '+' : ''}$${unPnl.toLocaleString()} USD (${pct}% return)`
      );
    }

    if (onShowToast) {
      onShowToast(`🎯 Live P&L Override ${overrideEnabled ? 'APPLIED' : 'DISABLED'} for ${selectedUser.name}`, 'success');
    }
  };

  const handleResetOverride = () => {
    clearPnlOverrideForUser(selectedUser.id);
    if (selectedUser.email) clearPnlOverrideForUser(selectedUser.email);
    setOverrideEnabled(false);
    if (onShowToast) {
      onShowToast(`Reset P&L calculation to real-time market default for ${selectedUser.name}`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <TrendingUp className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              User Portfolio Live P&L Control Panel
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Manually adjust unrealized gains, return trends, and performance visualizations for official client portfolio management.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserCheck className="w-4 h-4 text-slate-700" /> Select Target User
          </h3>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {users.map(u => {
              const isSelected = u.id === selectedUserId || u.email === selectedUserId;
              const hasOverride = getPnlOverrideForUser(u.id)?.enabled || getPnlOverrideForUser(u.email)?.enabled;

              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {hasOverride && (
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                          P&L ACTIVE
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {u.email}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-xs">
                      ${u.balance.toLocaleString()}
                    </div>
                    <div className={`text-[9px] ${u.status === 'Verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {u.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Target Account</span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {selectedUser.name} <span className="text-xs font-mono font-normal text-slate-500">({selectedUser.email})</span>
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-700">Override Mode:</span>
              <button
                type="button"
                onClick={() => setOverrideEnabled(!overrideEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
                  overrideEnabled
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {overrideEnabled ? <ToggleRight className="w-5 h-5 text-emerald-200" /> : <ToggleLeft className="w-5 h-5" />}
                <span>{overrideEnabled ? 'OVERRIDE ENABLED' : 'OVERRIDE DISABLED'}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleApplyPnlOverride} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Unrealized P&L ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={unrealizedPnlInput}
                    onChange={e => setUnrealizedPnlInput(e.target.value)}
                    placeholder="+1450.00"
                    className="w-full border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-[#E3000F] outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Positive for profit, negative for loss</span>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  Realized P&L ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={realizedPnlInput}
                    onChange={e => setRealizedPnlInput(e.target.value)}
                    placeholder="+3200.00"
                    className="w-full border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-[#E3000F] outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Accumulated historical profit</span>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                  P&L Return Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={pnlPercentInput}
                    onChange={e => setPnlPercentInput(e.target.value)}
                    placeholder="+24.5"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-[#E3000F] outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Displayed return metric</span>
              </div>
            </div>

            {/* Trend Pattern Selectors */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                Visualization Curve Trend Pattern
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'bullish', label: '🚀 Bullish Surge', desc: 'Steep upward profit rally' },
                  { id: 'growth', label: '📈 Steady Growth', desc: 'Consistent gradual gains' },
                  { id: 'volatile', label: '⚡ Volatile Swings', desc: 'High fluctuation trading' },
                  { id: 'bearish', label: '📉 Bearish Drawdown', desc: 'Temporary pullback curve' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTrendPattern(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      trendPattern === item.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 ${trendPattern === item.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                Admin Showcase Note / Justification
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="Institutional Portfolio Custom P&L Settings"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetOverride}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Real-Time Market Calculations
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#E3000F] hover:bg-rose-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> Save & Apply P&L Override
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
