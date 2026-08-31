import { useMemo, useState } from 'react';
import { TRADING_PLATFORMS } from '../config/tradingPlatforms';

type Trader = {
  id: string;
  name: string;
  strategy: string;
  risk: string;
  performance?: number;
  verified: boolean;
};

export default function CopyTradingView() {
  const [linkedPlatform, setLinkedPlatform] = useState<'MT4' | 'MT5' | null>(null);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);

  const traders = useMemo<Trader[]>(() => [], []);

  const platform = linkedPlatform === 'MT4' ? TRADING_PLATFORMS.mt4 : linkedPlatform === 'MT5' ? TRADING_PLATFORMS.mt5 : null;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Copy Trading</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Follow verified strategies</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Connect an MT4 or MT5 account before copying trades. Performance and trader profiles are shown only when backed by a real trading-provider integration.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLinkedPlatform('MT4')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${linkedPlatform === 'MT4' ? 'bg-white text-black' : 'border border-white/15 text-white'}`}>Link MT4</button>
            <button onClick={() => setLinkedPlatform('MT5')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${linkedPlatform === 'MT5' ? 'bg-white text-black' : 'border border-white/15 text-white'}`}>Link MT5</button>
          </div>
        </div>
      </div>

      {platform && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">{platform.name} selected</p>
              <p className="mt-1 text-xs text-white/50">The account must be connected to a real supported provider before copying can be activated.</p>
            </div>
            <a className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white" href={platform.webTraderUrl} target="_blank" rel="noreferrer">Open official platform</a>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {traders.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-sm font-semibold text-white">No live copy-trading providers available</p>
            <p className="mt-2 text-sm text-white/50">Trader profiles will appear here when the production copy-trading provider is connected. No fabricated performance data is displayed.</p>
          </div>
        ) : traders.map((trader) => (
          <button key={trader.id} onClick={() => setSelectedTrader(trader)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25">
            <div className="flex items-center justify-between"><span className="font-semibold text-white">{trader.name}</span><span className="text-xs text-white/50">{trader.verified ? 'Verified' : 'Unverified'}</span></div>
            <p className="mt-2 text-sm text-white/55">{trader.strategy}</p>
            <p className="mt-4 text-xs text-white/45">Risk: {trader.risk}</p>
            {typeof trader.performance === 'number' && <p className="mt-1 text-sm text-white">Performance: {trader.performance}%</p>}
          </button>
        ))}
      </div>

      {selectedTrader && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="font-semibold text-white">{selectedTrader.name}</p>
          <p className="mt-2 text-sm text-white/60">Review the provider's live risk and performance information before enabling copying.</p>
          <button onClick={() => setSelectedTrader(null)} className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm text-white">Close</button>
        </div>
      )}
    </section>
  );
}
