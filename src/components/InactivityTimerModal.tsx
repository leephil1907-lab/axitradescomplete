import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, LogOut, RefreshCw, Lock } from 'lucide-react';

interface InactivityTimerModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalSeconds?: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export default function InactivityTimerModal({
  isOpen,
  secondsRemaining,
  totalSeconds = 30,
  onExtendSession,
  onLogoutNow
}: InactivityTimerModalProps) {
  if (!isOpen) return null;

  const progressPercentage = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-red-500/30 text-slate-900 dark:text-slate-100"
        >
          {/* Top Security Banner */}
          <div className="bg-gradient-to-r from-red-600 via-[#E3000F] to-red-700 text-white p-5 flex items-center gap-3 shadow-md">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0 animate-bounce">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase bg-white/20 text-white px-2 py-0.5 rounded font-black">
                SECURITY ALERT
              </span>
              <h3 className="text-base font-extrabold leading-tight mt-0.5">
                Session Inactivity Timeout Warning
              </h3>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You have been inactive for an extended period. For your financial account security, your Axi session will automatically terminate in:
            </p>

            {/* Countdown Circular / Bar Display */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-center gap-2 text-slate-900 dark:text-white">
                <Clock className="w-5 h-5 text-[#E3000F] animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-4xl font-black font-mono tracking-tight text-[#E3000F]">
                  00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
                <span className="text-xs text-slate-400 uppercase font-mono">sec</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#E3000F] h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Account: ECN Live</span>
                <span>Auto-Log Out at 00:00</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Axi 256-Bit SSL Encrypted Session Protection</span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={onExtendSession}
                className="w-full bg-[#FFD250] hover:bg-[#FFC518] text-slate-950 font-black py-3 px-4 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4" /> Stay Logged In
              </button>

              <button
                onClick={onLogoutNow}
                className="w-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" /> Log Out Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
