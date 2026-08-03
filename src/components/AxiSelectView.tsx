import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, TrendingUp, ShieldCheck, HelpCircle, Trophy, Sparkles, Filter, ArrowUpRight } from 'lucide-react';

interface LeaderboardTrader {
  rank: number;
  name: string;
  country: string;
  edgeScore: number;
  roi: string;
  stage: 'Seed' | 'Incubator' | 'Pro' | 'Master';
  fundedAmount: string;
}

const LEADERBOARD_DATA: LeaderboardTrader[] = [
  { rank: 1, name: 'Alexandre G.', country: 'France', edgeScore: 92, roi: '+142.5%', stage: 'Master', fundedAmount: '€150,000' },
  { rank: 2, name: 'Sven K.', country: 'Germany', edgeScore: 89, roi: '+98.4%', stage: 'Pro', fundedAmount: '€100,000' },
  { rank: 3, name: 'Yuki T.', country: 'Japan', edgeScore: 86, roi: '+84.2%', stage: 'Pro', fundedAmount: '€75,000' },
  { rank: 4, name: 'Elena R.', country: 'Spain', edgeScore: 81, roi: '+72.1%', stage: 'Incubator', fundedAmount: '€50,000' },
  { rank: 5, name: 'Marcus L.', country: 'United Kingdom', edgeScore: 78, roi: '+54.6%', stage: 'Incubator', fundedAmount: '€35,000' },
  { rank: 6, name: 'David M.', country: 'Australia', edgeScore: 71, roi: '+45.8%', stage: 'Seed', fundedAmount: '€20,000' },
  { rank: 7, name: 'Chao W.', country: 'Singapore', edgeScore: 68, roi: '+38.2%', stage: 'Seed', fundedAmount: '€15,000' },
  { rank: 8, name: 'Fatima Z.', country: 'Saudi Arabia', edgeScore: 65, roi: '+32.1%', stage: 'Seed', fundedAmount: '€10,000' },
];

export default function AxiSelectView() {
  // Edge Score sub-scores (0-100)
  const [risk, setRisk] = useState(75);
  const [consistency, setConsistency] = useState(80);
  const [discipline, setDiscipline] = useState(70);
  const [experience, setExperience] = useState(65);
  const [growth, setGrowth] = useState(72);
  
  const [selectedStageFilter, setSelectedStageFilter] = useState<'All' | 'Seed' | 'Incubator' | 'Pro' | 'Master'>('All');

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
    if (score >= 85) return { stage: 'Master', funding: 'Up to €200,000', nextGoal: 'N/A (Highest Tier)' };
    if (score >= 75) return { stage: 'Pro', funding: 'Up to €100,000', nextGoal: 'Score 85 to unlock Master Funding' };
    if (score >= 65) return { stage: 'Incubator', funding: 'Up to €50,000', nextGoal: 'Score 75 to unlock Pro Funding' };
    if (score >= 50) return { stage: 'Seed', funding: 'Up to €20,000', nextGoal: 'Score 65 to unlock Incubator Funding' };
    return { stage: 'None', funding: '€0', nextGoal: 'Score 50+ to qualify for Seed Funding' };
  };

  const currentQualification = getQualificationStage(calculatedEdgeScore);

  const filteredLeaderboard = selectedStageFilter === 'All' 
    ? LEADERBOARD_DATA 
    : LEADERBOARD_DATA.filter(t => t.stage === selectedStageFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 bg-brand-light">
      
      {/* Hero Intro */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="text-brand-red text-xs font-black tracking-widest uppercase bg-brand-red/5 border border-brand-red/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow/25" /> AXI SELECT ALLOCATION
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tight uppercase">
          Axi Select Funding Program
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          Trade client capital. Keep up to 90% of the profits. Our premier incubation module secures your growth with up to €200,000 allocation. Zero entry fees.
        </p>
      </div>

      {/* Edge Score Calculator & Stages Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Interactive Score Sliders (Left) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-yellow fill-brand-yellow/10" /> Interactive Edge Score Planner
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Slide parameters to calculate your personalized trading Edge Score and see which Seed Stage funding bracket you unlock.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Slider 1: Risk Control */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Risk Management <span className="text-[10px] text-brand-red font-semibold lowercase">(25% weight)</span>
                </span>
                <span className="text-xs font-black font-mono text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10">{risk} / 100</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={risk} 
                onChange={(e) => setRisk(Number(e.target.value))}
                className="w-full accent-brand-red cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-medium">Drawdown limits, defensive leverage usage, and stop-loss deployment.</span>
            </div>

            {/* Slider 2: Consistency */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Consistency <span className="text-[10px] text-brand-red font-semibold lowercase">(25% weight)</span>
                </span>
                <span className="text-xs font-black font-mono text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10">{consistency} / 100</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={consistency} 
                onChange={(e) => setConsistency(Number(e.target.value))}
                className="w-full accent-brand-red cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-medium">Stability of profit vectors per day and week. Avoids sporadic lottery gains.</span>
            </div>

            {/* Slider 3: Discipline */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Discipline <span className="text-[10px] text-brand-red font-semibold lowercase">(20% weight)</span>
                </span>
                <span className="text-xs font-black font-mono text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10">{discipline} / 100</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={discipline} 
                onChange={(e) => setDiscipline(Number(e.target.value))}
                className="w-full accent-brand-red cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-medium">Adherence to maximum daily loss guidelines and strategy boundaries.</span>
            </div>

            {/* Slider 4: Experience */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Experience <span className="text-[10px] text-brand-red font-semibold lowercase">(15% weight)</span>
                </span>
                <span className="text-xs font-black font-mono text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10">{experience} / 100</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={experience} 
                onChange={(e) => setExperience(Number(e.target.value))}
                className="w-full accent-brand-red cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-medium">Active volume duration, market cycle coverage, and overall trade execution count.</span>
            </div>

            {/* Slider 5: Growth Potential */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  Growth Potential <span className="text-[10px] text-brand-red font-semibold lowercase">(15% weight)</span>
                </span>
                <span className="text-xs font-black font-mono text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10">{growth} / 100</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={growth} 
                onChange={(e) => setGrowth(Number(e.target.value))}
                className="w-full accent-brand-red cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <span className="text-[10px] text-slate-400 font-medium">Recovery rates from drawdowns and progressive lot size scalability.</span>
            </div>
          </div>
        </div>

        {/* Live Qualification Results (Right) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Score Display Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-2xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-yellow/5 rounded-full blur-xl -z-10"></div>

            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <span className="text-[10px] font-black uppercase text-brand-yellow tracking-widest">Active Edge Meter</span>
                <span className="text-[10px] font-bold text-slate-400">Live Calculation</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white font-mono tracking-tighter">{calculatedEdgeScore}</span>
                <span className="text-xs font-bold text-brand-yellow">EDGE SCORE</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Unlocked Qualification Level</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-brand-yellow" />
                    Stage {currentQualification.stage}
                  </span>
                  <span className="text-xs font-black font-mono text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/25 px-2.5 py-0.5 rounded">
                    {currentQualification.funding} Allocation
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                <span className="text-brand-yellow font-bold uppercase">Next goal:</span> {currentQualification.nextGoal}
              </div>
            </div>
          </div>

          {/* Incubation Stage Qualifications Map */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">Incubation Path Metrics</h3>
            <div className="flex flex-col gap-3">
              {[
                { name: 'Seed Stage', minScore: 50, funding: '€10k to €20k', profitShare: '50% Profit Share', bg: calculatedEdgeScore >= 50 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400' },
                { name: 'Incubator Stage', minScore: 65, funding: '€30k to €50k', profitShare: '70% Profit Share', bg: calculatedEdgeScore >= 65 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400' },
                { name: 'Pro Stage', minScore: 75, funding: '€75k to €100k', profitShare: '80% Profit Share', bg: calculatedEdgeScore >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400' },
                { name: 'Master Stage', minScore: 85, funding: 'Up to €200k', profitShare: '90% Profit Share', bg: calculatedEdgeScore >= 85 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400' }
              ].map((stage) => (
                <div key={stage.name} className={`flex items-center justify-between border rounded-xl p-3 text-xs font-bold ${stage.bg} transition-colors duration-150`}>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                    <div>
                      <div>{stage.name}</div>
                      <div className="text-[10px] opacity-75 font-semibold mt-0.5">{stage.profitShare}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{stage.funding}</div>
                    <div className="text-[9px] opacity-75 uppercase">Min Edge: {stage.minScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-yellow fill-brand-yellow/10" /> Axi Funded Leaderboard
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">Real-time performance rating of our top incubated traders globally.</p>
          </div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-2 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Filter Stage</span>
            {['All', 'Seed', 'Incubator', 'Pro', 'Master'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStageFilter(st as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-colors border duration-150 cursor-pointer ${
                  selectedStageFilter === st 
                    ? 'bg-brand-red text-white border-brand-red' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-bold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6 w-16">Rank</th>
                <th className="py-4 px-6">Trader Name</th>
                <th className="py-4 px-6">Region</th>
                <th className="py-4 px-6 text-center">Edge Score</th>
                <th className="py-4 px-6 text-right">Return (ROI)</th>
                <th className="py-4 px-6 text-center">Program Stage</th>
                <th className="py-4 px-6 text-right">Funded Capital</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((trader) => (
                <tr key={trader.rank} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition duration-150">
                  <td className="py-4 px-6 font-mono font-black text-slate-400">#{trader.rank}</td>
                  <td className="py-4 px-6 text-slate-900 font-black">{trader.name}</td>
                  <td className="py-4 px-6 text-slate-500">{trader.country}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-block font-mono font-black text-brand-red bg-brand-red/5 border border-brand-red/10 px-2.5 py-0.5 rounded">
                      {trader.edgeScore}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-emerald-600 font-mono font-black">{trader.roi}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full ${
                      trader.stage === 'Master' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' :
                      trader.stage === 'Pro' ? 'bg-red-50 text-brand-red border border-brand-red/10' :
                      trader.stage === 'Incubator' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                    }`}>
                      {trader.stage}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-black text-slate-800">{trader.fundedAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traders Already Funded Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Case Review</span>
            <h3 className="text-base font-black text-brand-dark uppercase tracking-wide mt-1.5">No Capital Risk</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
              Axi funds your designated incubation account in full. There are no fees or collateral guarantees required from the trader. Your maximum liability is strictly capped at zero.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] font-black text-brand-red uppercase">
            <span>Learn Liability Rules</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Case Review</span>
            <h3 className="text-base font-black text-brand-dark uppercase tracking-wide mt-1.5">90% Professional Profit Split</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
              Withdraw up to 90% of trade profits straight to your personal e-wallet. Withdrawals are processed within 24 hours on premium tiers with zero broker deductions.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] font-black text-brand-red uppercase">
            <span>Profit Split Schedule</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Case Review</span>
            <h3 className="text-base font-black text-brand-dark uppercase tracking-wide mt-1.5">Rapid Scaling Model</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2">
              Successful trading over 10 consecutive trading days consistently elevates your allocation tier, scaling your capital access from €10k up to €200,000 automatically.
            </p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[11px] font-black text-brand-red uppercase">
            <span>Examine Allocation Stages</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
