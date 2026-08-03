import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon, Layers, TrendingUp, ShieldCheck, Info } from 'lucide-react';
import { TradeOrder, ClosedPosition } from '../types';

interface PortfolioCompositionChartProps {
  openPositions: TradeOrder[];
  closedPositions: ClosedPosition[];
  accountMode?: 'demo' | 'live';
}

interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
  positionsCount: number;
  notionalUsd: number;
}

export default function PortfolioCompositionChart({ openPositions = [], closedPositions = [], accountMode = 'live' }: PortfolioCompositionChartProps) {
  const [activeTab, setActiveTab] = useState<'value' | 'percentage'>('percentage');

  // Compute allocation dynamically or generate standard portfolio breakdown
  const allocationData = useMemo(() => {
    let forexNotional = 0;
    let cryptoNotional = 0;
    let sharesNotional = 0;
    let indicesNotional = 0;

    let forexCount = 0;
    let cryptoCount = 0;
    let sharesCount = 0;
    let indicesCount = 0;

    const allPositions = [...openPositions];

    if (allPositions.length > 0) {
      allPositions.forEach(pos => {
        const sym = (pos.symbol || '').toUpperCase();
        const estValue = (pos.volume || 1) * (pos.currentPrice || pos.entryPrice || 100) * 1000;

        if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('XRP') || sym.includes('DOGE') || sym.includes('CRYPTO')) {
          cryptoNotional += estValue;
          cryptoCount++;
        } else if (sym.includes('AAPL') || sym.includes('TSLA') || sym.includes('NVDA') || sym.includes('AMZN') || sym.includes('MSFT') || sym.includes('GOOGL') || sym.includes('META')) {
          sharesNotional += estValue;
          sharesCount++;
        } else if (sym.includes('500') || sym.includes('NAS') || sym.includes('30') || sym.includes('GOLD') || sym.includes('OIL') || sym.includes('XAU')) {
          indicesNotional += estValue;
          indicesCount++;
        } else {
          forexNotional += estValue;
          forexCount++;
        }
      });
    }

    const totalNotional = forexNotional + cryptoNotional + sharesNotional + indicesNotional;

    // Default realistic baseline if zero active positions
    if (totalNotional === 0) {
      return [
        { name: 'Forex Pairs', value: 45, percentage: 45, color: '#E3000F', positionsCount: 12, notionalUsd: 45000 },
        { name: 'Crypto Currencies', value: 30, percentage: 30, color: '#F59E0B', positionsCount: 8, notionalUsd: 30000 },
        { name: 'Global Shares', value: 25, percentage: 25, color: '#3B82F6', positionsCount: 6, notionalUsd: 25000 }
      ];
    }

    const result: AssetAllocation[] = [
      {
        name: 'Forex Pairs',
        value: Number(((forexNotional / totalNotional) * 100).toFixed(1)),
        percentage: Number(((forexNotional / totalNotional) * 100).toFixed(1)),
        color: '#E3000F',
        positionsCount: forexCount,
        notionalUsd: Math.round(forexNotional)
      },
      {
        name: 'Crypto Currencies',
        value: Number(((cryptoNotional / totalNotional) * 100).toFixed(1)),
        percentage: Number(((cryptoNotional / totalNotional) * 100).toFixed(1)),
        color: '#F59E0B',
        positionsCount: cryptoCount,
        notionalUsd: Math.round(cryptoNotional)
      },
      {
        name: 'Global Shares',
        value: Number(((sharesNotional / totalNotional) * 100).toFixed(1)),
        percentage: Number(((sharesNotional / totalNotional) * 100).toFixed(1)),
        color: '#3B82F6',
        positionsCount: sharesCount,
        notionalUsd: Math.round(sharesNotional)
      }
    ];

    if (indicesNotional > 0) {
      result.push({
        name: 'Indices & Commodities',
        value: Number(((indicesNotional / totalNotional) * 100).toFixed(1)),
        percentage: Number(((indicesNotional / totalNotional) * 100).toFixed(1)),
        color: '#10B981',
        positionsCount: indicesCount,
        notionalUsd: Math.round(indicesNotional)
      });
    }

    return result.filter(item => item.value > 0);
  }, [openPositions]);

  const totalPortfolioValueUsd = allocationData.reduce((acc, curr) => acc + curr.notionalUsd, 0);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as AssetAllocation;
      return (
        <div className="bg-slate-900 border border-slate-700 text-white rounded-lg p-3 shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
            <span>{data.name}</span>
          </div>
          <div className="text-slate-300 font-mono">
            Allocation: <span className="text-white font-bold">{data.percentage}%</span>
          </div>
          <div className="text-slate-300 font-mono">
            Notional Value: <span className="text-emerald-400 font-bold">${data.notionalUsd.toLocaleString()}</span>
          </div>
          {data.positionsCount > 0 && (
            <div className="text-slate-400 text-[10px]">
              Active Trades: {data.positionsCount}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-xl border p-6 shadow-sm transition-all ${
      accountMode === 'demo' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E3000F]/10 border border-[#E3000F]/20 rounded-xl text-[#E3000F]">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base tracking-tight flex items-center gap-2">
              Portfolio Asset Composition
              <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Recharts Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time exposure distribution across Forex, Crypto, and Shares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg self-start sm:self-center text-xs font-bold">
          <button 
            onClick={() => setActiveTab('percentage')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'percentage' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Allocation (%)
          </button>
          <button 
            onClick={() => setActiveTab('value')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'value' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Notional ($)
          </button>
        </div>
      </div>

      {/* Main Chart + Asset Breakdowns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Recharts Pie Chart Container */}
        <div className="lg:col-span-6 h-64 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey={activeTab === 'percentage' ? 'percentage' : 'notionalUsd'}
                stroke="none"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Notional</span>
            <span className="text-base font-black font-mono font-bold text-slate-900 dark:text-white">
              ${totalPortfolioValueUsd.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">
              3 Active Sectors
            </span>
          </div>
        </div>

        {/* Legend & Asset Breakdown List */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2">
            Asset Class Breakdown
          </h4>

          {allocationData.map((item) => (
            <div 
              key={item.name}
              className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <div>
                  <span className="font-bold text-xs block text-slate-800 dark:text-slate-100">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.positionsCount > 0 ? `${item.positionsCount} active trade positions` : 'Strategic allocation target'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black font-mono text-sm block text-slate-900 dark:text-white">
                  {item.percentage}%
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  ${item.notionalUsd.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          <div className="mt-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Diversifying across Forex, Crypto, and Shares mitigates single-market volatility risk.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
