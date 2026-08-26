import React from 'react';
import { motion } from 'motion/react';
import { Award, Trophy, Sparkles, ShieldCheck, ChevronRight, CheckCircle2, Zap, Star } from 'lucide-react';
import { ClosedPosition } from '../types';

interface MilestoneTier {
  id: string;
  name: string;
  targetProfit: number;
  badgeColor: string;
  badgeBg: string;
  icon: React.ElementType;
  perks: string[];
}

const MILESTONE_TIERS: MilestoneTier[] = [
  {
    id: 'tier-1',
    name: 'Bronze Trader',
    targetProfit: 500,
    badgeColor: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    icon: Award,
    perks: ['1:500 Standard Leverage Access', 'Daily Market Signals Telegram Channel', 'Standard Deposit Processing']
  },
  {
    id: 'tier-2',
    name: 'Silver Trader',
    targetProfit: 2500,
    badgeColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-300/20 border-slate-400/40',
    icon: Star,
    perks: ['5% Spread Rebate Cashback', 'Priority Deposit & Fast Withdrawal Clearance', 'Advanced Analytics Heatmap Access']
  },
  {
    id: 'tier-3',
    name: 'Gold VIP Trader',
    targetProfit: 10000,
    badgeColor: 'text-amber-500',
    badgeBg: 'bg-amber-400/10 border-amber-400/30',
    icon: Trophy,
    perks: ['Dedicated 1-on-1 Account Senior Manager', 'Axi Select Fast-Track Capital Allocation', 'Zero Deposit/Withdrawal Overhead']
  },
  {
    id: 'tier-4',
    name: 'Platinum Elite',
    targetProfit: 25000,
    badgeColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/30',
    icon: Zap,
    perks: ['0.0 Pip ECN Raw Spreads Guarantee', 'Free High-Speed VPS Hosting Account', 'Exclusive Institutional Market Webinars']
  },
  {
    id: 'tier-5',
    name: 'Diamond Institutional',
    targetProfit: 100000,
    badgeColor: 'text-cyan-500',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30',
    icon: Sparkles,
    perks: ['Custom Liquidity Pool Depth', 'Profit-Sharing Bonus Pool Eligibility', 'Bespoke API High-Frequency Trading Keys']
  }
];

interface MilestoneProgressBarProps {
  closedPositions: ClosedPosition[];
  accountMode?: 'demo' | 'live';
  onExplorePerks?: () => void;
}

export default function MilestoneProgressBar({ closedPositions, accountMode = 'live', onExplorePerks }: MilestoneProgressBarProps) {
  // Calculate total realized profit from closed positions
  const totalRealizedProfit = closedPositions.reduce((acc, pos) => acc + (pos.profit || 0), 0);
  const displayProfit = Math.max(0, totalRealizedProfit);

  // Find current active tier & next target tier
  let currentTierIndex = 0;
  for (let i = 0; i < MILESTONE_TIERS.length; i++) {
    if (displayProfit >= MILESTONE_TIERS[i].targetProfit) {
      currentTierIndex = i;
    } else {
      break;
    }
  }

  const currentTier = MILESTONE_TIERS[currentTierIndex];
  const nextTier = currentTierIndex < MILESTONE_TIERS.length - 1 ? MILESTONE_TIERS[currentTierIndex + 1] : currentTier;

  // Calculate progress percentage to next tier
  const previousTarget = currentTierIndex > 0 ? MILESTONE_TIERS[currentTierIndex].targetProfit : 0;
  const targetGoal = nextTier.targetProfit;
  
  let percentage = 0;
  if (displayProfit >= MILESTONE_TIERS[MILESTONE_TIERS.length - 1].targetProfit) {
    percentage = 100;
  } else {
    const range = targetGoal - previousTarget;
    const progress = displayProfit - previousTarget;
    percentage = Math.min(100, Math.max(0, (progress / range) * 100));
  }

  const remainingNeeded = Math.max(0, targetGoal - displayProfit);

  const CurrentIcon = currentTier.icon;
  const NextIcon = nextTier.icon;

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-xs ${
      accountMode === 'demo'
        ? 'bg-slate-900 border-slate-800 text-white'
        : 'bg-white border-slate-200/90 text-slate-900'
    }`}>
      {/* Top Banner Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-brand-red/20 text-amber-500 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm tracking-tight">Trader Milestone & Rank Progression</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${currentTier.badgeBg} ${currentTier.badgeColor}`}>
                {currentTier.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Accumulate realized profit from successful trades to unlock VIP status, spread discounts & Axi Select perks.
            </p>
          </div>
        </div>

        {onExplorePerks && (
          <button
            onClick={onExplorePerks}
            className="text-xs font-extrabold text-brand-red hover:text-red-700 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>View All VIP Perks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          accountMode === 'demo' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Realized Profit</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalRealizedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          accountMode === 'demo' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Rank Target</span>
          <div className="flex items-center gap-1.5 mt-1">
            <NextIcon className={`w-4 h-4 ${nextTier.badgeColor}`} />
            <span className="text-lg font-black text-slate-900 dark:text-white">
              ${nextTier.targetProfit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          accountMode === 'demo' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Needed for {nextTier.name}</span>
          <span className="text-lg font-black text-brand-red mt-1">
            {displayProfit >= MILESTONE_TIERS[MILESTONE_TIERS.length - 1].targetProfit
              ? 'Max Rank Achieved! 🏆'
              : `$${remainingNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <CurrentIcon className={`w-4 h-4 ${currentTier.badgeColor}`} />
            <span>Current: {currentTier.name}</span>
          </span>

          <span className="text-brand-red font-black">
            {percentage.toFixed(1)}% Completed
          </span>

          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span>Next: {nextTier.name}</span>
            <NextIcon className={`w-4 h-4 ${nextTier.badgeColor}`} />
          </span>
        </div>

        <div className={`h-3.5 w-full rounded-full overflow-hidden p-0.5 border ${
          accountMode === 'demo' ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/80 border-slate-300/80'
        }`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-brand-red shadow-sm"
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Unlocked & Upcoming Perks List */}
      <div className={`rounded-xl p-4 border ${
        accountMode === 'demo' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{nextTier.name} Status Perks</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            Unlocked upon reaching ${nextTier.targetProfit.toLocaleString()} profit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {nextTier.perks.map((perk, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
