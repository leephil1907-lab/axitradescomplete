import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { MarketQuote } from '../../types';
import gold from '../../assets/axi-symbols/XAUUSD_a4af4f0890.svg';
import bitcoin from '../../assets/axi-symbols/BTCUSD_ef26763aad.svg';
import forex from '../../assets/axi-symbols/EURUSD_c9ddb4d7fe.svg';
import ethereum from '../../assets/axi-symbols/ETHUSD_4204db8748.svg';

const instruments = [
  { symbol: 'XAUUSD', name: 'Gold', icon: gold },
  { symbol: 'BTCUSD', name: 'Bitcoin', icon: bitcoin },
  { symbol: 'EURUSD', name: 'EUR/USD', icon: forex },
  { symbol: 'ETHUSD', name: 'Ethereum', icon: ethereum },
];

function QuoteTile({ instrument, quote }: { key?: string; instrument: (typeof instruments)[number]; quote?: MarketQuote }) {
  const available = !!quote && Number.isFinite(quote.price) && quote.status !== 'unavailable';
  const fresh = available && quote.status === 'live' && !quote.stale;
  const price = available ? quote.price : null;
  const previous = useRef<number | null>(null);
  const [tick, setTick] = useState<{ direction: 'up' | 'down'; price: number } | null>(null);
  useEffect(() => {
    const prior = previous.current;
    previous.current = fresh ? price : null;
    if (!fresh || price === null || prior === null || price === prior) { setTick(null); return; }
    setTick({ direction: price > prior ? 'up' : 'down', price });
    const timer = window.setTimeout(() => setTick(null), 700);
    return () => window.clearTimeout(timer);
  }, [fresh, price]);
  const change = quote?.change;
  const ChangeIcon = change === 0 ? Minus : Number(change) < 0 ? ArrowDownRight : ArrowUpRight;
  return <div className="market-ribbon-cell">
    <img src={instrument.icon} alt="" width="28" height="28" className="market-instrument-icon" />
    <div className="market-instrument-data">
      <span>{instrument.name} <small>{fresh ? 'Live' : quote?.stale || quote?.status === 'stale' ? (available ? 'Delayed' : 'Unavailable') : available ? 'Indicative' : 'Unavailable'}</small></span>
      <strong key={price ?? 'na'} data-tick={fresh && tick?.price === price ? tick?.direction : undefined}>{price === null ? '—' : price.toLocaleString(undefined, { maximumFractionDigits: instrument.symbol === 'EURUSD' ? 5 : 2 })}</strong>
      {available && typeof change === 'number' && Number.isFinite(change) && <span className={`market-instrument-change ${change < 0 ? 'market-down' : change > 0 ? 'market-up' : ''}`}><ChangeIcon size={14} aria-hidden="true" />{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>}
    </div>
  </div>;
}

export default function MarketRibbon({ quotes, onViewMarkets }: { quotes: Record<string, MarketQuote>; onViewMarkets: () => void }) {
  return <section className="market-ribbon" aria-label="Market snapshot">
    <div className="home-shell market-ribbon-layout">
      <button type="button" className="market-ribbon-heading" onClick={onViewMarkets}><span className="home-kicker">/// Market watch</span><span>Market snapshot <ArrowUpRight size={15} aria-hidden="true" /></span></button>
      {instruments.map(instrument => <QuoteTile key={instrument.symbol} instrument={instrument} quote={quotes[instrument.symbol]} />)}
    </div>
  </section>;
}
