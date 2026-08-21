import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, FileText, X, ArrowRight } from 'lucide-react';

interface RiskDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function RiskDisclosureModal({ isOpen, onClose, onAcknowledge, showToast }: RiskDisclosureModalProps) {
  const [hasReadAndAccepted, setHasReadAndAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasReadAndAccepted) {
      if (showToast) showToast('Please check the acknowledgment box to confirm you understand the CFD risks.', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      localStorage.setItem('axi_risk_disclosure_acknowledged', 'true');
      setIsSubmitting(false);
      if (showToast) showToast('CFD Risk Disclosure acknowledged. You may now execute trades.', 'success');
      onAcknowledge();
      onClose();
    }, 400);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-t-4 border-[#E3000F] rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 my-8 border-x border-b border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="p-5 md:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#E3000F]/20 border border-[#E3000F]/40 text-[#E3000F]">
                <ShieldAlert className="w-6 h-6 text-[#E3000F] animate-pulse" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-white flex items-center gap-2">
                  <span>CFD Risk Disclosure & Regulatory Notice</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Mandatory regulatory acknowledgment before initiating your first trade
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <form onSubmit={handleConfirm} className="p-5 md:p-6 space-y-5">
            {/* Prominent High-Risk Banner Box */}
            <div className="bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl space-y-2 text-rose-900 dark:text-rose-200">
              <div className="flex items-center gap-2 font-black text-xs md:text-sm uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>High Risk Investment Warning (71.6% Retail Loss Rate)</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                Trading Over-The-Counter (OTC) Financial Contracts for Difference (CFDs) and Foreign Exchange (Forex) on margin carries a high level of risk and may not be suitable for all investors. You may lose substantially more than your initial deposit.
              </p>
            </div>

            {/* Structured Risk Disclosure Terms */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 text-xs text-slate-600 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
              
              <div className="pt-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span>
                  1. Leverage & Magnified Capital Loss
                </h4>
                <p className="leading-relaxed pl-3 text-slate-500 dark:text-slate-400">
                  Leverage allows you to trade larger position sizes with a fraction of total margin. While leverage can increase potential profits, it equally magnifies potential losses. Adverse market movements can deplete your account balance rapidly.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span>
                  2. Volatility & Liquidation (Margin Calls)
                </h4>
                <p className="leading-relaxed pl-3 text-slate-500 dark:text-slate-400">
                  Financial markets experience extreme volatility during economic releases, geopolitical events, and liquidity gaps. If your usable margin drops below minimum requirements, open positions will automatically close without prior notice.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span>
                  3. Product Complexity & No Ownership
                </h4>
                <p className="leading-relaxed pl-3 text-slate-500 dark:text-slate-400">
                  CFDs are cash-settled derivative agreements. You do not own or hold any rights to the underlying assets (e.g. physical gold, stocks, or crypto). You should ensure you fully understand how CFDs operate before executing orders.
                </p>
              </div>

              <div className="pt-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3000F]"></span>
                  4. Independent Financial Advice
                </h4>
                <p className="leading-relaxed pl-3 text-slate-500 dark:text-slate-400">
                  Information supplied by Axi is of general nature only and does not consider your personal financial situation, objectives, or risk tolerance. Seek independent professional financial advice if necessary.
                </p>
              </div>

            </div>

            {/* Checkbox Acknowledgment */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={hasReadAndAccepted}
                  onChange={(e) => setHasReadAndAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#E3000F] focus:ring-[#E3000F] border-slate-300 dark:border-slate-600 shrink-0"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                  I confirm that I am over 18 years of age, have read and fully understand the High-Risk CFD Trading Disclosure, and acknowledge the financial risks involved in trading leveraged derivatives.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!hasReadAndAccepted || isSubmitting}
                className="bg-[#E3000F] hover:bg-red-700 text-white font-black text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Recording Acknowledgment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acknowledge & Proceed to Trade</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
