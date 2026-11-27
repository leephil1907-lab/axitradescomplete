import { ArrowUpRight, ChevronRight } from 'lucide-react';
import type { MarketQuote, ViewType } from '../../types';
import type { ProductView } from '../../config/publicRoutes';
import AssetBrandLogo from '../AssetBrandLogo';
import cfdArt from '../../assets/axi-reference/platform-app.webp';
import perpsArt from '../../assets/axi-official/campaign-clock.jpg';
import spotArt from '../../assets/axi-reference/watchlist.webp';

const content = {
  cfds: { label: 'CFDs', title: 'Trade CFDs across global markets', description: 'Explore forex, indices, commodities and cryptocurrency CFDs in the existing trading terminal.', art: cfdArt, source: 'Desktop_1_3e1d63b1f8.webp', instruments: ['EURUSD', 'BTCUSD', 'XAUUSD', 'USDJPY', 'ETHUSD', 'GBPUSD'], cardsTitle: 'Trading accounts and costs', cards: [['Standard pricing', 'Review the spread and applicable fees before placing a trade.'], ['Commission-based pricing', 'Compare available account terms and commissions in the client area.']], faqs: [['What is a CFD?', 'A contract for difference tracks the price movement of an underlying asset without giving you ownership of that asset.'], ['What are the risks?', 'Leverage increases exposure and can magnify losses. Review the risk disclosures before trading.']] },
  perpetuals: { label: 'Perpetual futures', title: '24/7 trading with no expiry dates', description: 'Explore how perpetual contracts track traditional markets and digital assets without a fixed expiry date.', art: perpsArt, source: '', instruments: ['BTCUSD', 'ETHUSD', 'XAUUSD'], cardsTitle: 'Explore perpetual markets', cards: [['Shares and ETFs', 'Follow price movements in companies and market benchmarks.'], ['Commodities and crypto', 'Learn how perpetual contracts differ from spot ownership.']], faqs: [['What is a perpetual futures contract?', 'A derivative without a fixed expiration date. Funding payments may apply depending on the contract and market.'], ['Can I place a perpetual order here?', 'No. This page is informational; perpetual execution is not enabled in this build.']] },
  spot: { label: 'Spot crypto', title: 'Spot it. Buy it. Own it.', description: 'Learn how buying an asset outright differs from trading a leveraged crypto derivative. This page is a read-only market preview.', art: spotArt, source: '', instruments: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD'], cardsTitle: 'Understand spot crypto', cards: [['Asset ownership', 'A settled spot purchase gives the buyer ownership of the asset. It is not a CFD position.'], ['Custody and fees', 'A live spot product needs verified custody and disclosed execution fees. Neither is enabled in this preview.']], faqs: [['Can I buy or sell crypto here?', 'No. Spot execution, custody, deposits and withdrawals are not available in this build.'], ['Are these executable prices?', 'No. Quotes shown here are market references, not offers to trade.']] },
};

export default function ProductLanding({ product, quotes, setView, openSignUp }: { product: ProductView; quotes: Record<string, MarketQuote>; setView: (view: ViewType) => void; openSignUp: () => void }) {
  const page = content[product];
  return <div className="product-landing">
    <header className="product-hero"><div className="home-shell product-hero-grid">
      <div><nav aria-label="Breadcrumb" className="product-crumb"><button type="button" onClick={() => setView('home')}>Home</button><ChevronRight size={14} /><span>Trade</span><ChevronRight size={14} /><span aria-current="page">{page.label}</span></nav>
        <p className="home-kicker">/// {page.label}</p><h1>{page.title}</h1><p className="reference-lede">{page.description}</p>
        {product === 'cfds' ? <button type="button" className="home-button home-button-primary" onClick={openSignUp}>Open account <ArrowUpRight size={17} /></button> : <a href="#product-market-preview" className="home-button home-button-primary">Explore market prices <ArrowUpRight size={17} /></a>}
      </div>
      <img className="reference-cut" src={page.source ? `https://media.axiglobal.net/media/${page.source}` : page.art} alt="" onError={event => { if (event.currentTarget.getAttribute('src') !== page.art) event.currentTarget.src = page.art; }} />
    </div></header>
    <section id="product-market-preview" className="home-shell reference-band scroll-mt-24"><p className="home-kicker">/// Market watch</p><h2 className="home-heading">{product === 'cfds' ? 'Find your next market' : 'Market prices'}</h2><p className="reference-lede">Reference prices only. Not executable quotes.</p>
      <ul className="product-symbol-grid">{page.instruments.map(symbol => {
        const quote = quotes[symbol];
        const available = !!quote && quote.status !== 'unavailable' && Number.isFinite(quote.price);
        return <li key={symbol}><AssetBrandLogo symbol={symbol} size="sm" /><div><b>{symbol}</b><p>{available ? quote.price.toLocaleString(undefined, { maximumFractionDigits: 5 }) : 'Unavailable'}</p></div></li>;
      })}</ul>
      {product === 'cfds' && <button type="button" className="home-button home-button-primary mt-6" onClick={() => setView('markets')}>View Markets <ArrowUpRight size={17} /></button>}
    </section>
    <section className="reference-band product-info-band"><div className="home-shell"><h2 className="home-heading">{page.cardsTitle}</h2><div className="product-info-grid">{page.cards.map(([title, body]) => <article className="reference-cut" key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>
    <section className="home-shell reference-band product-faq"><h2 className="home-heading">Frequently asked questions</h2>{page.faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
  </div>;
}
