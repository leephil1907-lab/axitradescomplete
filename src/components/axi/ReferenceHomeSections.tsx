import { productRoutes } from '../../config/publicRoutes';
import { useState } from 'react';
import { ArrowUpRight, Smartphone, ChartCandlestick, ChartNoAxesCombined, Copy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import app from '../../assets/axi-reference/platform-app.webp';
import watchlist from '../../assets/axi-reference/watchlist.webp';
import copy from '../../assets/axi-reference/copy-app.webp';
import perps from '../../assets/axi-reference/perpetuals.webp';
import desktop from '../../assets/axi-official/axi_desktop_hero.jpg';
import indices from '../../assets/axi-official/axi_indices_scene.jpg';
import ai from '../../assets/images/axi_ai_signals_1784835914680.jpg';
import type { ViewType } from '../../types';

const products = [
  { label: 'CFDs', title: 'FX. Indices. Shares.', body: 'Explore price movements across currencies, indices, shares and commodities.', art: 'element_3_8a05f7dba7.webp', fallback: indices, button: 'Explore CFDs', view: 'cfds' as const },
  { label: 'Crypto perpetuals', title: 'Crypto futures that never expire.', body: 'Discover perpetual futures and how they differ from spot markets.', art: 'element_4_9f6eba74a7.webp', fallback: perps, button: 'Explore perpetuals', view: 'perpetuals' as const },
  { label: 'Spot crypto', title: 'Spot it. Buy it. Own it.', body: 'Learn how spot crypto differs from derivatives and compare major digital assets.', art: 'element_5_a097bc1fa7.webp', fallback: watchlist, button: 'Explore crypto', view: 'spot' as const },
];

const platforms = [
  { icon: Smartphone, name: 'The Axi trading app', text: 'Monitor your positions, explore market analysis and manage your trades in one place.', image: app, features: ['Live analysis', 'Portfolio view', 'Mobile'] },
  { icon: ChartCandlestick, name: 'MetaTrader 4', text: 'Explore the classic platform with charting, indicators and automated trading tools.', image: desktop, art: 'Desktop_3_adb20e26be.webp', features: ['Expert Advisors', 'Charting'] },
  { icon: ChartNoAxesCombined, name: 'MetaTrader 5', text: 'Explore multi-asset charting and a broader range of analytical tools.', image: desktop, art: 'meta_trader_5_Desktop_8f3e32d1fc.webp', features: ['Multi-asset', 'Custom indicators'] },
  { icon: Copy, name: 'Axi Copy Trading', text: 'Learn how to follow trading strategies and review the risks before you start.', image: copy, features: ['MT4', 'MT5'] },
];

function ReferenceArt({ asset, fallback, alt = '' }: { asset?: string; fallback: string; alt?: string }) {
  // Keep a bundled fallback for presentations on networks that block the reference CDN.
  return <img key={asset ?? fallback} loading="lazy" src={asset ? `https://media.axiglobal.net/media/${asset}` : fallback} alt={alt} onError={event => { if (event.currentTarget.getAttribute('src') !== fallback) event.currentTarget.src = fallback; }} />;
}

export function ReferenceHomeSections({ setView, openSignUp }: { setView: (view: ViewType) => void; openSignUp: () => void }) {
  const [platform, setPlatform] = useState(0);
  const [product, setProduct] = useState(0);
  const active = platforms[platform];
  const reducedMotion = useReducedMotion();
  return <>
    <section className="reference-band reference-intro">
      <div className="home-shell reference-split">
        <div>
          <p className="home-kicker">/// Trade your edge</p>
          <h2 className="home-heading">Trade <em>CFDs, Crypto and Forex</em> with a Global Online Broker</h2>
          <p className="reference-lede">AxiTrader LLC is part of Axi Group, which operates globally.</p>
          <button type="button" className="reference-link" onClick={() => setView('about')}>About AxiTrades <ArrowUpRight size={17} aria-hidden="true" /></button>
        </div>
        <div className="reference-intro-art"><ReferenceArt fallback={watchlist} alt="Axi trading app showing a CFD watchlist and account overview" /></div>
      </div>
      <div className="home-shell reference-metrics">
        {[["Execution", "29", "ms"], ["Top liquidity providers", "20", "+"], ["Countries served", "100", "+"], ["Industry awards since 2021", "50", "+"]].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>)}
        <p>Figures shown on the Axi reference homepage; not measured in this preview.</p>
      </div>
    </section>

    <section className="reference-band reference-products" aria-labelledby="products-title">
      <div className="home-shell">
        <p className="home-kicker">/// Trading products</p>
        <h2 id="products-title" className="home-heading">CFDs, Crypto Perpetuals and <em>Spot Trading.</em></h2>
        <p className="reference-lede">Explore CFDs and compare two ways to trade crypto. Spot and perpetual execution are not enabled in this preview.</p>
        <button type="button" className="home-button home-button-primary" onClick={openSignUp}>Open account <ArrowUpRight size={17} aria-hidden="true" /></button>
        <div className="reference-product-grid" data-active={product}>
          {products.map((item, i) => <article key={item.label} className={i === product ? 'is-active' : undefined}>
            <button type="button" className="home-kicker" aria-pressed={i === product} onClick={() => setProduct(i)}>/// {item.label}</button>
            <h3>{item.title}</h3><p>{item.body}</p>
            <ReferenceArt asset={item.art} fallback={item.fallback} />
            <a className="reference-link" href={productRoutes[item.view]} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setView(item.view); }}>{item.button} <ArrowUpRight size={17} aria-hidden="true" /></a>
          </article>)}
        </div>
      </div>
    </section>

    <section className="reference-band reference-platforms">
      <div className="home-shell">
        <p className="home-kicker">/// Axi trading platforms</p>
        <h2 className="home-heading">Choose your platform. The Axi app, MT4, MT5 or Copy Trading.</h2>
        <div className="reference-platform-switch" role="group" aria-label="Choose a platform">
          {platforms.map((item, i) => <button type="button" key={item.name} aria-pressed={platform === i} onClick={() => setPlatform(i)}><item.icon size={16} aria-hidden="true" />{item.name}</button>)}
        </div>
        <div aria-live="polite"><AnimatePresence initial={false} mode="popLayout">
        <motion.div key={active.name} className="reference-platform-panel" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .24 }}>
          <ReferenceArt asset={active.art} fallback={active.image} alt={`${active.name} preview`} />
          <div><h3 key={active.name} className="campaign-enter">{active.name}</h3><p>{active.text}</p><ul>{active.features.map(item => <li key={item}>{item}</li>)}</ul>
            <button type="button" onClick={() => setView('platforms')} className="home-button home-button-primary">Explore platforms <ArrowUpRight size={17} aria-hidden="true" /></button>
          </div>
        </motion.div>
        </AnimatePresence></div>
      </div>
    </section>

    <section id="home-perpetuals" tabIndex={-1} className="reference-band reference-perps scroll-mt-24">
      <div className="home-shell">
        <p className="home-kicker">/// TradFi perpetuals</p><h2 className="home-heading">24/7 trading with no expiry dates.</h2>
        <div className="reference-perps-grid">{[
          ['Pre-IPO', 'Coming soon', 'PO_CF_Ds_2089d7d97b.webp'], ['Shares', 'Global companies', 'shares_trade_Fi_3840527f38.webp'], ['Commodities', 'Metals and energy', 'Commodity_CF_Ds_d5aea0bd23.webp'], ['ETFs', 'Market benchmarks', 'ETF_CF_Ds_1cfee956be.webp'], ['Crypto', 'Digital assets', 'Cryptocurrency_CF_Ds_b16241d89b.webp'],
        ].map(([name, text, image]) => <article key={name}><ReferenceArt asset={image} fallback={perps} /><h3>{name}</h3><p>{text}</p></article>)}</div>
        <button type="button" className="reference-link" onClick={() => setView('perpetuals')}>Explore perps <ArrowUpRight size={17} aria-hidden="true" /></button>
      </div>
    </section>

    <section className="reference-band reference-select"><div className="home-shell reference-split">
      <div><p className="home-kicker">/// Axi Select</p><h2 className="home-heading">Free funded trader program.</h2><p className="reference-lede">Learn about the program stages, the Edge Score and what it takes to qualify for funding.</p><button type="button" onClick={() => setView('select')} className="home-button home-button-primary">Explore Axi Select <ArrowUpRight size={17} aria-hidden="true" /></button></div>
      <div className="reference-select-steps">{[
        ['Open a live account', 'Review the eligibility and account requirements before you apply.'],
        ['Build your Edge Score', 'Your score reflects skill, consistency, risk management and experience.'],
        ['Work toward funding', 'Explore the program stages and criteria for qualifying traders.'],
      ].map(([title, text], i) => <article className="reference-cut" key={title}><p className="home-kicker">/// 0{i + 1}</p><h3>{title}</h3><p>{text}</p>{i < 2 && <ReferenceArt asset={i === 0 ? 'Frame_2147204759_67ebe9d7e9.webp' : 'Frame_2147204760_ab5d7b0d65.webp'} fallback={i === 0 ? app : watchlist} />}{i === 2 && <button type="button" className="home-button home-button-primary" onClick={() => setView('select')}>Join Axi Select <ArrowUpRight size={17} /></button>}</article>)}</div>
    </div></section>

    <section className="reference-band reference-ai"><div className="home-shell reference-split">
      <div><p className="home-kicker">/// MCP</p><h2 className="home-heading">Explore market research tools</h2><p className="reference-lede">Use the research tools available on AxiTrades. An MT5–Claude connection is not enabled here.</p><button type="button" onClick={() => setView('tools')} className="home-button home-button-primary">Explore tools <ArrowUpRight size={17} aria-hidden="true" /></button></div>
      <ReferenceArt asset="IMG_Slot_79934c186e.webp" fallback={ai} />
    </div></section>
  </>;
}
