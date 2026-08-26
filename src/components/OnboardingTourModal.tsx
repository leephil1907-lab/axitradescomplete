import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, CreditCard, Mic, Gift, CheckCircle2, ChevronRight, ChevronLeft, X, Compass, ShieldCheck } from 'lucide-react';
import { ViewType } from '../types';

interface OnboardingStep {
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  highlights: string[];
  actionView?: ViewType;
  actionLabel?: string;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Axi Platform',
    badge: 'Step 1 of 5',
    description: 'Get ready to trade with ultra-low spreads, institutional speed execution, and powerful global markets access.',
    icon: Compass,
    iconBg: 'bg-brand-red/10',
    iconColor: 'text-brand-red',
    highlights: [
      'Institutional-grade liquidity & execution',
      'Real-time live multi-asset portfolio tracking',
      '24/7 Multi-asset coverage (Forex, Crypto, Shares)'
    ],
    actionView: 'dashboard',
    actionLabel: 'View Dashboard'
  },
  {
    title: 'Live Trading & Markets',
    badge: 'Step 2 of 5',
    description: 'Explore live quotes, interactive technical charts, order types, and custom price alert notifications.',
    icon: TrendingUp,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    highlights: [
      'Instant Buy & Sell execution with custom lot sizes',
      'Set stop-loss, take-profit & real-time price alerts',
      'Interactive candlestick charts with multiple timeframes'
    ],
    actionView: 'markets',
    actionLabel: 'Explore Markets'
  },
  {
    title: 'Instant Deposits & Funding',
    badge: 'Step 3 of 5',
    description: 'Fund your live trading account seamlessly via Bitcoin, Ethereum, USDT, credit cards, or wire transfers with zero fee overhead.',
    icon: CreditCard,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    highlights: [
      'Zero deposit fees across all payment methods',
      'Instant automated deposit verification & credit',
      'Fast withdrawals back to your verified payment method'
    ],
    actionView: 'funds',
    actionLabel: 'Manage Funds'
  },
  {
    title: 'Command Menu & Voice Studio',
    badge: 'Step 4 of 5',
    description: 'Boost your trading efficiency with smart keyboard shortcuts and voice dictation notes.',
    icon: Mic,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    highlights: [
      'Press Ctrl+K (Cmd+K) anytime for quick navigation & search',
      'Record trade rationale with AI voice notes',
      'Custom Telegram & SMS notification alerts'
    ],
    actionView: 'tools',
    actionLabel: 'View Trading Tools'
  },
  {
    title: 'Axi Select & Referral Rewards',
    badge: 'Step 5 of 5',
    description: 'Scale your capital with up to $1,000,000 in funded account allocation and earn cash rewards by inviting friends.',
    icon: Gift,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    highlights: [
      'Qualify for Axi Select trader capital allocation',
      'Earn $100 withdrawable bonus per invited active friend',
      'Access 24/7 priority live customer support'
    ],
    actionView: 'select',
    actionLabel: 'Discover Axi Select'
  }
];

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  setView: (view: ViewType) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OnboardingTourModal({ isOpen, onClose, setView, showToast }: OnboardingTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('axi_onboarding_completed', 'true');
    showToast('🎉 Tour completed! You are ready to start trading on Axi.', 'success');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('axi_onboarding_completed', 'true');
    onClose();
  };

  const handleActionClick = (view?: ViewType) => {
    if (view) {
      setView(view);
      showToast(`Navigated to ${view.toUpperCase()} page.`, 'info');
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col relative"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-red/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-white text-sm">
                  axi
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Guided Tour</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  {currentStep.badge}
                </span>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close tour"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-5 overflow-hidden">
              <motion.div
                className="bg-brand-red h-full rounded-full"
                animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 flex flex-col gap-5 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl shrink-0 ${currentStep.iconBg} ${currentStep.iconColor}`}>
                    <StepIcon className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">{currentStep.title}</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                      {currentStep.description}
                    </p>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2.5 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Key Feature Highlights</span>
                  {currentStep.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Context Action Button */}
                {currentStep.actionView && (
                  <button
                    onClick={() => handleActionClick(currentStep.actionView)}
                    className="text-xs font-bold text-brand-red hover:text-red-700 flex items-center gap-1 self-start cursor-pointer hover:underline pt-1"
                  >
                    <span>{currentStep.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer px-3 py-2"
            >
              Skip Tour
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex ? 'w-6 bg-brand-red' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                {currentStepIndex === STEPS.length - 1 ? (
                  <>
                    <span>Finish</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
