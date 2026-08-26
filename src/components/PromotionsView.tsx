import React, { useState } from 'react';
import { 
  Award, 
  Gift, 
  Trophy, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  Users, 
  DollarSign, 
  ShieldCheck,
  Send,
  ArrowRight,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../types';
import { sendTelegramAlert } from '../utils/telegram';
import { safeStorage } from '../utils/storage';

interface PromotionsViewProps {
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openSignUp?: () => void;
  openQuickDeposit?: () => void;
}

interface ContestLeader {
  rank: number;
  traderHandle: string;
  countryFlag: string;
  country: string;
  roiMonthly: number;
  lotsTraded: number;
  prizePayout: string;
}

const CONTEST_LEADERBOARD: ContestLeader[] = [
  { rank: 1, traderHandle: 'AlphaQuant_UK', countryFlag: '🇬🇧', country: 'United Kingdom', roiMonthly: 184.2, lotsTraded: 342.5, prizePayout: '$35,000 USD' },
  { rank: 2, traderHandle: 'Sterling_Apex', countryFlag: '🇦🇺', country: 'Australia', roiMonthly: 156.8, lotsTraded: 289.0, prizePayout: '$20,000 USD' },
  { rank: 3, traderHandle: 'NordicScalp', countryFlag: '🇳🇴', country: 'Norway', roiMonthly: 141.5, lotsTraded: 215.2, prizePayout: '$12,500 USD' },
  { rank: 4, traderHandle: 'TokyoTrendMaster', countryFlag: '🇯🇵', country: 'Japan', roiMonthly: 129.4, lotsTraded: 198.0, prizePayout: '$7,500 USD' },
  { rank: 5, traderHandle: 'Dubai_Whale', countryFlag: '🇦🇪', country: 'United Arab Emirates', roiMonthly: 118.2, lotsTraded: 260.4, prizePayout: '$5,000 USD' },
  { rank: 6, traderHandle: 'Rhine_Flow', countryFlag: '🇩🇪', country: 'Germany', roiMonthly: 98.7, lotsTraded: 175.5, prizePayout: '$4,000 USD' },
  { rank: 7, traderHandle: 'SingaForex', countryFlag: '🇸🇬', country: 'Singapore', roiMonthly: 89.1, lotsTraded: 142.0, prizePayout: '$3,000 USD' },
  { rank: 8, traderHandle: 'Geneva_FX', countryFlag: '🇨🇭', country: 'Switzerland', roiMonthly: 82.6, lotsTraded: 130.8, prizePayout: '$2,000 USD' }
];

export default function PromotionsView({ setView, showToast, openSignUp, openQuickDeposit }: PromotionsViewProps) {
  // Claim Promo Form State
  const [selectedPromo, setSelectedPromo] = useState<string>('50% Welcome Trading Credit');
  const [accountNumber, setAccountNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<string | null>(null);

  const calculatedBonus = selectedPromo.includes('50%') 
    ? (Number(depositAmount) * 0.5) 
    : selectedPromo.includes('Dual') ? 50 : 0;

  const handleClaimPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !accountNumber) {
      showToast('Please provide your name, email, and Axi account number.', 'error');
      return;
    }
    if (!termsAgreed) {
      showToast('Please accept the promotional terms and conditions.', 'error');
      return;
    }

    setIsSubmitting(true);
    const claimRef = `PROMO-AXI-${Math.floor(100000 + Math.random() * 900000)}`;

    const claimData = {
      claimRef,
      selectedPromo,
      accountNumber,
      clientName,
      clientEmail,
      depositAmount: Number(depositAmount),
      calculatedBonus,
      createdAt: new Date().toISOString()
    };

    // Save to storage
    try {
      const existing = JSON.parse(safeStorage.getItem('axi_promo_claims') || '[]');
      existing.unshift(claimData);
      safeStorage.setItem('axi_promo_claims', JSON.stringify(existing));
    } catch (err) {
      console.warn('Storage save warning:', err);
    }

    // Send real transactional email via Google SMTP
    try {
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: clientEmail,
          recipientName: clientName,
          type: 'Custom',
          subject: `🎁 Axi Promotional Credit Activated [Ref: ${claimRef}]`,
          customBody: `Dear ${clientName},\n\nYour enrollment for the "${selectedPromo}" has been successfully logged for Axi Trading Account #${accountNumber}.\n\nClaim Reference: ${claimRef}\nProjected Trading Credit: $${calculatedBonus.toLocaleString()} USD\n\nYour bonus credit will be credited to your trading equity balance immediately upon deposit clearance.\n\nBest regards,\nAxi Promotions & Client Rewards Team\nwww.axi.com`
        })
      }).catch(e => console.warn('Email notice:', e));
    } catch (e) {}

    // Send Telegram alert
    sendTelegramAlert('PROMO_CLAIM', `🎁 New Promotion Claim [${selectedPromo}]`, {
      'Claim ID': claimRef,
      'Promotion': selectedPromo,
      'Client Name': clientName,
      'Email': clientEmail,
      'Account #': accountNumber,
      'Planned Deposit': `$${depositAmount} USD`,
      'Bonus Projected': `$${calculatedBonus} USD`
    });

    setIsSubmitting(false);
    setSubmittedClaim(claimRef);
    showToast(`✅ Promotion enrollment confirmed! Claim Ref: ${claimRef}`, 'success');
  };

  return (
    <div className="w-full py-8 lg:py-12">
      {/* Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30 text-xs font-black uppercase tracking-wider mb-4">
            <Gift className="w-3.5 h-3.5" /> Official Axi Promotions & Contests
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Boost Your Trading Capital with Exclusive Axi Bonuses
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Take advantage of institutional deposit bonuses, compete in global trading championships for cash prize pools, and win exclusive Manchester City FC VIP hospitality tickets.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#claim-promo"
              className="bg-brand-red hover:bg-red-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition cursor-pointer text-sm flex items-center gap-2"
            >
              Claim 50% Welcome Bonus <ChevronRight className="w-4 h-4" />
            </a>
            <a
              href="#leaderboard"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-xl border border-slate-700 transition cursor-pointer text-sm"
            >
              View $100K Championship Standings
            </a>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-800">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-brand-yellow block">+50%</span>
            <span className="text-xs text-slate-400 font-medium">Tradable Margin Booster</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">$100,000</span>
            <span className="text-xs text-slate-400 font-medium">Monthly Championship Pool</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">$0 Fee</span>
            <span className="text-xs text-slate-400 font-medium">To Enter Contests</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">VIP Etihad</span>
            <span className="text-xs text-slate-400 font-medium">Man City Matchday Access</span>
          </div>
        </div>
      </div>

      {/* 4 Active Promotions Grid */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            Active Trader Promotions & Exclusive Rewards
          </h2>
          <p className="text-sm text-slate-500">
            Select any promotion below to activate your rewards directly on your live trading account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Promo 1: 50% Welcome Bonus */}
          <div className="bg-white border-2 border-brand-red rounded-3xl p-6 sm:p-8 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 right-6 bg-brand-red text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-xs">
              Top Pick
            </span>

            <div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-brand-red flex items-center justify-center font-black mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">50% Welcome Tradable Credit</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Deposit into your live Standard or Pro trading account and receive a 50% tradable margin credit up to $5,000 USD to withstand market drawdowns and expand position sizes.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Minimum Deposit:</span>
                  <strong className="font-mono text-slate-900">$200 USD</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Maximum Credit:</span>
                  <strong className="font-mono text-brand-red">$5,000 USD</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Usage:</span>
                  <strong className="text-emerald-700 font-bold">100% Fully Tradable Margin</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPromo('50% Welcome Trading Credit');
                document.getElementById('claim-promo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              Enroll in 50% Deposit Booster
            </button>
          </div>

          {/* Promo 2: $100K Championship */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-slate-400 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Axi $100,000 Championship</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Compete against traders globally in our monthly equity growth tournament. 1st place wins $35,000 in withdrawable cash prizes directly deposited into trading balance.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Total Prize Fund:</span>
                  <strong className="font-mono text-amber-600 font-black">$100,000 USD Cash</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Entry Fee:</span>
                  <strong className="text-emerald-700 font-bold">$0 (Free for live clients)</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Ranking Metric:</span>
                  <strong className="text-slate-900 font-bold">Monthly % Equity Gain</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPromo('Axi $100K Global Championship');
                document.getElementById('claim-promo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Register for $100K Tournament
            </button>
          </div>

          {/* Promo 3: Man City VIP Experience */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-slate-400 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Manchester City VIP Matchday</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                As the Official Online Trading Partner of Manchester City FC, trade 10+ standard lots to enter the quarterly draw for VIP hospitality tickets and signed merchandise.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Grand Prize:</span>
                  <strong className="text-sky-700 font-bold">Etihad Stadium VIP Box + Flights</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Runner-Up Prizes:</span>
                  <strong className="text-slate-900">Signed 2026 First Team Kits</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Eligibility:</span>
                  <strong className="text-slate-900">Trade 10 Lots / Quarter</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPromo('Manchester City VIP Experience');
                document.getElementById('claim-promo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-900 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Enter Man City VIP Draw
            </button>
          </div>

          {/* Promo 4: Refer a Friend */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:border-slate-400 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">$50 Refer-A-Friend Dual Bonus</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Invite fellow traders to experience Axi. When your friend deposits $200 and trades 2 standard FX lots, both you and your friend receive $50 withdrawable cash.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Referrer Reward:</span>
                  <strong className="font-mono text-emerald-700 font-black">$50 USD Cash</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Friend Reward:</span>
                  <strong className="font-mono text-emerald-700 font-black">$50 USD Cash</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Max Referrals:</span>
                  <strong className="text-slate-900 font-bold">Uncapped Unlimited</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPromo('$50 Refer-A-Friend Dual Bonus');
                document.getElementById('claim-promo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-900 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Get Referral Link & Bonus
            </button>
          </div>
        </div>
      </div>

      {/* Live $100K Championship Leaderboard */}
      <div id="leaderboard" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 mb-16 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase mb-2">
              <Trophy className="w-3.5 h-3.5" /> Current Round Standings
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Axi $100K Championship Leaderboard</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live standings based on verified monthly percentage equity gain and trading activity.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 shrink-0">
            <Clock className="w-4 h-4 text-brand-red" /> Round Ends In: <span className="font-mono text-slate-900 font-black">11d : 14h : 22m</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Trader Handle</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4 text-right">Monthly ROI (%)</th>
                <th className="py-3 px-4 text-right">Lots Traded</th>
                <th className="py-3 px-4 text-right">Prize Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CONTEST_LEADERBOARD.map(leader => (
                <tr key={leader.rank} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-black">
                    {leader.rank === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 inline-flex items-center justify-center font-black text-xs">1</span>
                    ) : leader.rank === 2 ? (
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center font-black text-xs">2</span>
                    ) : leader.rank === 3 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center font-black text-xs">3</span>
                    ) : (
                      <span className="text-slate-500 font-mono pl-2">#{leader.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {leader.traderHandle}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="mr-1.5 text-sm">{leader.countryFlag}</span>
                    {leader.country}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                    +{leader.roiMonthly.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                    {leader.lotsTraded.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                    {leader.prizePayout}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Promotion Claim Form */}
      <div id="claim-promo" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mx-auto mb-3">
            <Gift className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Claim Promotion & Activate Rewards</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit your trading account details below to enroll in your selected promotion.
          </p>
        </div>

        {submittedClaim ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-emerald-950">Promotion Enrollment Confirmed!</h3>
            <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
              Your enrollment for <strong className="text-slate-900">{selectedPromo}</strong> has been logged under Reference <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{submittedClaim}</strong>. A confirmation email has been dispatched to <strong>{clientEmail}</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setSubmittedClaim(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Enroll In Another Promotion
              </button>
              {openQuickDeposit && (
                <button
                  onClick={openQuickDeposit}
                  className="bg-brand-red hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  Deposit Funds & Unlock Bonus
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleClaimPromo} className="space-y-5">
            {/* Promo Selector Pills */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-2">Selected Promotion</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  '50% Welcome Trading Credit',
                  'Axi $100K Global Championship',
                  'Manchester City VIP Experience',
                  '$50 Refer-A-Friend Dual Bonus'
                ].map(promo => (
                  <button
                    key={promo}
                    type="button"
                    onClick={() => setSelectedPromo(promo)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition border text-left cursor-pointer flex items-center justify-between ${
                      selectedPromo === promo 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{promo}</span>
                    {selectedPromo === promo && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Account # & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Axi Trading Account Number *</label>
                <input 
                  type="text" 
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="e.g. 9817264"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Trader Legal Name *</label>
                <input 
                  type="text" 
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>
            </div>

            {/* Row 2: Email & Planned Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Registered Account Email *</label>
                <input 
                  type="email" 
                  required
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="trader@yourdomain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">Planned Deposit Amount ($ USD)</label>
                <input 
                  type="number" 
                  min="50"
                  step="50"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-red focus:bg-white transition font-mono font-bold"
                />
              </div>
            </div>

            {/* Projected Bonus Box */}
            {selectedPromo.includes('50%') && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-red-950 block">Projected 50% Trading Credit:</span>
                  <span className="text-[11px] text-red-700">Added to usable margin equity upon deposit clearance</span>
                </div>
                <div className="text-2xl font-black text-brand-red font-mono">
                  +${calculatedBonus.toLocaleString()} USD
                </div>
              </div>
            )}

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input 
                type="checkbox"
                id="promo-terms"
                checked={termsAgreed}
                onChange={e => setTermsAgreed(e.target.checked)}
                className="mt-0.5 accent-brand-red rounded cursor-pointer"
              />
              <label htmlFor="promo-terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                I confirm that I have read and agree to the official Axi Promotional Terms, Margin Credit Requirements, and Client Agreement.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Activating Promotional Credit...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Activate Promotion on Trading Account
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
