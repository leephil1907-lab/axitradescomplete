import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, TrendingUp, ShieldCheck, Trophy, Sparkles, ArrowRight, Zap, CheckCircle2, ChevronRight, DollarSign, Target, BarChart2, Users } from 'lucide-react';
import { ViewType } from '../types';

interface LeaderboardTrader {
  rank: number;
  name: string;
  country: string;
  edgeScore: number;
  roi: string;
  stage: 'Seed' | 'Incubator' | 'Acceleration' | 'Pro' | 'Pro 500' | 'Master';
  fundedAmount: string;
}

const LEADERBOARD_DATA: LeaderboardTrader[] = [
  { rank: 1, name: 'Alexandre G.', country: 'France', edgeScore: 94, roi: '+164.5%', stage: 'Master', fundedAmount: '$1,000,000' },
  { rank: 2, name: 'Sven K.', country: 'Germany', edgeScore: 91, roi: '+128.4%', stage: 'Pro 500', fundedAmount: '$500,000' },
  { rank: 3, name: 'Yuki T.', country: 'Japan', edgeScore: 88, roi: '+94.2%', stage: 'Pro', fundedAmount: '$200,000' },
  { rank: 4, name: 'Elena R.', country: 'Spain', edgeScore: 84, roi: '+78.1%', stage: 'Acceleration', fundedAmount: '$100,000' },
  { rank: 5, name: 'Marcus L.', country: 'United Kingdom', edgeScore: 79, roi: '+62.6%', stage: 'Incubator', fundedAmount: '$50,000' },
  { rank: 6, name: 'David M.', country: 'Australia', edgeScore: 73, roi: '+48.8%', stage: 'Seed', fundedAmount: '$20,000' },
  { rank: 7, name: 'Chao W.', country: 'Singapore', edgeScore: 69, roi: '+41.2%', stage: 'Seed', fundedAmount: '$10,000' },
  { rank: 8, name: 'Fatima Z.', country: 'UAE', edgeScore: 66, roi: '+35.1%', stage: 'Seed', fundedAmount: '$5,000' },
];

interface AxiSelectViewProps {
  setView?: (view: ViewType) => void;
  openSignUp?: () => void;
  showToast?: (message: string, type?: 'error' | 'success' | 'info') => void;
}

export default function AxiSelectView({ setView, openSignUp, showToast }: AxiSelectViewProps) {
  // Edge Score sub-scores (0-100)
  const [risk, setRisk] = useState(80);
  const [consistency, setConsistency] = useState(85);
  const [discipline, setDiscipline] = useState(75);
  const [experience, setExperience] = useState(70);
  const [growth, setGrowth] = useState(80);
  
  const [selectedStageFilter, setSelectedStageFilter] = useState<'All' | 'Seed' | 'Incubator' | 'Acceleration' | 'Pro' | 'Pro 500' | 'Master'>('All');

  // Edge Score is a weighted average
  const calculatedEdgeScore = Math.round(
    (risk * 0.25) + 
    (consistency * 0.25) + 
    (discipline * 0.2) + 
    (experience * 0.15) + 
    (growth * 0.15)
  );

  // Qualifications based on Edge Score
  const getQualificationStage = (score: number) => {
    if (score >= 90) return { stage: 'Master', funding: 'Up to $1,000,000', profitShare: '90%', nextGoal: 'Highest tier reached' };
    if (score >= 85) return { stage: 'Pro 500', funding: 'Up to $500,000', profitShare: '90%', nextGoal: 'Score 90+ to unlock $1,000,000 Master tier' };
    if (score >= 80) return { stage: 'Pro', funding: 'Up to $200,000', profitShare: '80%', nextGoal: 'Score 85+ to unlock $500,000 Pro 500 tier' };
    if (score >= 70) return { stage: 'Acceleration', funding: 'Up to $100,000', profitShare: '70%', nextGoal: 'Score 80+ to unlock $200,000 Pro tier' };
    if (score >= 60) return { stage: 'Incubator', funding: 'Up to $50,000', profitShare: '60%', nextGoal: 'Score 70+ to unlock $100,000 Acceleration tier' };
    if (score >= 50) return { stage: 'Seed', funding: 'Up to $20,000', profitShare: '50%', nextGoal: 'Score 60+ to unlock $50,000 Incubator tier' };
    return { stage: 'Qualifying', funding: '$0', profitShare: '0%', nextGoal: 'Score 50+ to qualify for Seed Funding' };
  };

  const currentQualification = getQualificationStage(calculatedEdgeScore);

  const filteredLeaderboard = selectedStageFilter === 'All' 
    ? LEADERBOARD_DATA 
    : LEADERBOARD_DATA.filter(t => t.stage === selectedStageFilter);

  const STAGES = [
    { name: 'Seed', minScore: 50, funding: 'Up to $20,000', profitShare: '50% Profit Share', requiredEquity: '$500', maxLoss: '10%' },
    { name: 'Incubator', minScore: 60, funding: 'Up to $50,000', profitShare: '60% Profit Share', requiredEquity: '$1,000', maxLoss: '10%' },
    { name: 'Acceleration', minScore: 70, funding: 'Up to $100,000', profitShare: '70% Profit Share', requiredEquity: '$2,000', maxLoss: '10%' },
    { name: 'Pro', minScore: 80, funding: 'Up to $200,000', profitShare: '80% Profit Share', requiredEquity: '$4,000', maxLoss: '10%' },
    { name: 'Pro 500', minScore: 85, funding: 'Up to $500,000', profitShare: '90% Profit Share', requiredEquity: '$10,000', maxLoss: '10%' },
    { name: 'Master', minScore: 90, funding: 'Up to $1,000,000', profitShare: '90% Profit Share', requiredEquity: '$20,000', maxLoss: '10%' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      
      {/* Hero Section with Slanted Axi Geometry */}
      <div className="relative bg-gradient-to-b from-[#1C1C1C] to-[#0D0D0D] border-b border-neutral-800/80 pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Angled background banner */}
        <div 
          className="absolute -right-20 -top-20 w-96 h-96 bg-[#C8102E]/10 rounded-full blur-3xl pointer-events-none"
        />
        <div 
          className="absolute -left-20 bottom-0 w-80 h-80 bg-[#F5CE47]/5 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#C8102E]/15 border border-[#C8102E]/30 text-[#F5CE47] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            <Trophy className="w-4 h-4 text-[#F5CE47]" />
            <span>Official Axi Capital Allocation Program</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase max-w-4xl leading-tight">
            Get Funded Up To <span className="text-[#F5CE47]">$1,000,000 USD</span>
          </h1>

          <p className="text-neutral-300 text-sm sm:text-base max-w-2xl mt-4 font-normal leading-relaxed">
            Trade client capital. Keep up to <strong className="text-white">90% of the profits</strong>. No registration fees, no monthly evaluations, and transparent performance criteria powered by the Axi Edge Score.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={() => {
                if (openSignUp) openSignUp();
                else if (setView) setView('dashboard');
              }}
              className="bg-[#F5CE47] hover:bg-[#ECC94B] text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-3.5 rounded-md shadow-xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Join Axi Select For Free
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('edge-calculator');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm border border-neutral-700 px-6 py-3.5 rounded-md transition cursor-pointer"
            >
              Calculate My Edge Score
            </button>
          </div>

          {/* 4 Value Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-12 text-left">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 font-semibold uppercase">Registration Fee</div>
              <div className="text-xl sm:text-2xl font-black text-[#F5CE47] mt-1">$0.00 Free</div>
              <div className="text-[11px] text-neutral-400 mt-1">No monthly subscription</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 font-semibold uppercase">Profit Split</div>
              <div className="text-xl sm:text-2xl font-black text-[#F5CE47] mt-1">Up to 90%</div>
              <div className="text-[11px] text-neutral-400 mt-1">Direct monthly withdrawals</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 font-semibold uppercase">Max Allocation</div>
              <div className="text-xl sm:text-2xl font-black text-[#F5CE47] mt-1">$1,000,000</div>
              <div className="text-[11px] text-neutral-400 mt-1">Across 6 scaling tiers</div>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <div className="text-xs text-neutral-400 font-semibold uppercase">Loss Liability</div>
              <div className="text-xl sm:text-2xl font-black text-[#F5CE47] mt-1">0% Liability</div>
              <div className="text-[11px] text-neutral-400 mt-1">Axi absorbs trading losses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">
        
        {/* Edge Score Calculator & Stages Panel */}
        <div id="edge-calculator" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Interactive Score Sliders (Left) */}
          <div className="lg:col-span-7 bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
            <div className="border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C8102E]">
                <Sparkles className="w-4 h-4 text-[#F5CE47]" />
                <span>Interactive Allocation Model</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                Axi Edge Score Planner
              </h2>
              <p className="text-xs sm:text-[13px] text-neutral-400 mt-1">
                Adjust parameters to calculate your personalized Edge Score and determine your starting capital bracket.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Slider 1: Risk Control */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    Risk Management <span className="text-[10px] text-[#C8102E] font-semibold lowercase">(25% weight)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F5CE47] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {risk} / 100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={risk} 
                  onChange={(e) => setRisk(Number(e.target.value))}
                  className="w-full accent-[#C8102E] cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] text-neutral-400">Strict max drawdown discipline, defensive leverage, and stop-loss rigor.</span>
              </div>

              {/* Slider 2: Consistency */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    Consistency <span className="text-[10px] text-[#C8102E] font-semibold lowercase">(25% weight)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F5CE47] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {consistency} / 100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={consistency} 
                  onChange={(e) => setConsistency(Number(e.target.value))}
                  className="w-full accent-[#C8102E] cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] text-neutral-400">Steady equity curve progression over minimum required active trading days.</span>
              </div>

              {/* Slider 3: Discipline */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    Discipline <span className="text-[10px] text-[#C8102E] font-semibold lowercase">(20% weight)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F5CE47] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {discipline} / 100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={discipline} 
                  onChange={(e) => setDiscipline(Number(e.target.value))}
                  className="w-full accent-[#C8102E] cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] text-neutral-400">Adherence to single-trade risk limits and avoiding revenge or over-leveraging.</span>
              </div>

              {/* Slider 4: Experience */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    Experience <span className="text-[10px] text-[#C8102E] font-semibold lowercase">(15% weight)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F5CE47] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {experience} / 100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={experience} 
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-[#C8102E] cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] text-neutral-400">Total trade history, market sessions traded, and multi-asset versatility.</span>
              </div>

              {/* Slider 5: Growth Potential */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    Growth Potential <span className="text-[10px] text-[#C8102E] font-semibold lowercase">(15% weight)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F5CE47] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    {growth} / 100
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={growth} 
                  onChange={(e) => setGrowth(Number(e.target.value))}
                  className="w-full accent-[#C8102E] cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
                <span className="text-[11px] text-neutral-400">Ability to compound gains steadily and scale position sizing effectively.</span>
              </div>
            </div>
          </div>

          {/* Live Qualification Results (Right) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Main Score Display Card */}
            <div className="bg-[#161616] text-white rounded-2xl p-6 border border-neutral-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8102E]/20 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <span className="text-[10px] font-black uppercase text-[#F5CE47] tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#F5CE47]" /> Live Edge Meter
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">Score Metric</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-white font-mono tracking-tight">{calculatedEdgeScore}</span>
                  <span className="text-xs font-bold text-[#F5CE47] uppercase tracking-wider">Edge Score / 100</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Unlocked Qualification Level</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#F5CE47]" />
                      Stage {currentQualification.stage}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#F5CE47] bg-[#F5CE47]/10 border border-[#F5CE47]/30 px-2.5 py-1 rounded">
                      {currentQualification.funding}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-2">
                    Profit Split: <strong className="text-white">{currentQualification.profitShare}</strong> (to Trader)
                  </div>
                </div>

                <div className="text-xs text-neutral-400 leading-relaxed">
                  <span className="text-[#F5CE47] font-bold uppercase">Next goal:</span> {currentQualification.nextGoal}
                </div>

                <button
                  onClick={() => {
                    if (openSignUp) openSignUp();
                    else if (setView) setView('dashboard');
                  }}
                  className="w-full bg-[#C8102E] hover:bg-[#A60012] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg shadow-md transition cursor-pointer"
                >
                  Apply For Stage {currentQualification.stage}
                </button>
              </div>
            </div>

            {/* Incubation Stage Qualifications Map */}
            <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[#F5CE47]" /> Axi Scaling Ladder
              </h3>
              <div className="flex flex-col gap-2">
                {STAGES.map((stage) => {
                  const isQualified = calculatedEdgeScore >= stage.minScore;
                  return (
                    <div 
                      key={stage.name} 
                      className={`flex items-center justify-between border rounded-xl p-3 text-xs font-bold transition-all ${
                        isQualified 
                          ? 'bg-neutral-900 border-[#C8102E]/60 text-white' 
                          : 'bg-neutral-950/60 border-neutral-850 text-neutral-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isQualified ? 'bg-[#C8102E]' : 'bg-neutral-700'}`} />
                        <div>
                          <div>{stage.name}</div>
                          <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">{stage.profitShare}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">{stage.funding}</div>
                        <div className="text-[10px] text-neutral-400">Min Edge: {stage.minScore}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Global Leaderboard Section */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#C8102E]">
                <Users className="w-4 h-4 text-[#F5CE47]" />
                <span>Verified Performance</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                Axi Select Trader Leaderboard
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Live rankings of funded clients managing institutional capital allocations.
              </p>
            </div>

            {/* Stage filter buttons */}
            <div className="flex flex-wrap gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              {(['All', 'Seed', 'Incubator', 'Acceleration', 'Pro', 'Pro 500', 'Master'] as const).map((stg) => (
                <button
                  key={stg}
                  onClick={() => setSelectedStageFilter(stg)}
                  className={`px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
                    selectedStageFilter === stg 
                      ? 'bg-[#C8102E] text-white shadow-sm' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 uppercase text-[11px] font-bold">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4 text-center">Edge Score</th>
                  <th className="py-3 px-4 text-center">ROI</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Funded Capital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {filteredLeaderboard.map((trader) => (
                  <tr key={trader.rank} className="hover:bg-neutral-900/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {trader.rank === 1 ? '🥇 #1' : trader.rank === 2 ? '🥈 #2' : trader.rank === 3 ? '🥉 #3' : `#${trader.rank}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{trader.name}</td>
                    <td className="py-3.5 px-4 text-neutral-400">{trader.country}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#F5CE47]">{trader.edgeScore}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">{trader.roi}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded text-[11px] font-bold border border-neutral-700">
                        {trader.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">{trader.fundedAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
