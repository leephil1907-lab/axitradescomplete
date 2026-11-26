import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { MarketQuote } from '../../types';

const instruments = [ ['XAUUSD', 'Gold'], ['BTCUSD', 'Bitcoin'], ['EURUSD', 'EUR/USD'], ['ETHUSD', 'Ethereum'] ];

export default function MarketRibbon({ quotes, onViewMarkets }: { quotes: Record<string, MarketQuote>; onViewMarkets: () => void }) {
  return <section className="market-ribbon" aria-label="Market snapshot">
    <div className="home-shell market-ribbon-layout">
      <button type="button" className="market-ribbon-heading" onClick={onViewMarkets}><span className="home-kicker">/// Market watch</span><span>Market snapshot <ArrowUpRight size={15} aria-hidden="true" /></span></button>
      {instruments.map(([symbol, name]) => {
        const quote = quotes[symbol];
        const available = quote && Number.isFinite(quote.price) && quote.status !== 'unavailable';
        const fresh = available && quote.status === 'live' && !quote.stale;
        const change = quote?.change;
        return <div className="market-ribbon-cell" key={symbol}>
          <span>{name} <small>{fresh ? 'Live' : available ? 'Indicative' : 'Unavailable'}</small></span>
          <strong key={available ? quote.price : symbol}>{available ? quote.price.toLocaleString(undefined, { maximumFractionDigits: symbol === 'EURUSD' ? 5 : 2 }) : '—'}</strong>
          {available && Number.isFinite(change) && <span className={change < 0 ? 'market-down' : 'market-up'}>{change < 0 ? <ArrowDownRight size={14} aria-hidden="true" /> : <ArrowUpRight size={14} aria-hidden="true" />}{change > 0 ? '+' : ''}{change.toFixed(2)}%</span>}
        </div>;
      })}
    </div>
  </section>;
}
