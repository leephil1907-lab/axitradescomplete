import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useSiteCMS } from '../hooks/useSiteCMS';
import type { MarketQuote, ViewType } from '../types';
import ManCityImage from '../assets/images/mancity_dpworld_partnership_1786474036247.jpg';
import HeroSlideshow from './axi/HeroSlideshow';
import MarketRibbon from './axi/MarketRibbon';
import { ReferenceHomeSections } from './axi/ReferenceHomeSections';

const insights = [
  ['What is agentic trading?', 'agentic_trading_preview_b7b317bd52.webp', 'Agentic systems can plan and carry out multi-step tasks. Trading teams should set explicit permissions, verify inputs and keep human oversight over execution.'],
  ['Perpetual futures in traditional markets', 'clock_24_7_trading_pr_7b743b9d90.webp', 'Perpetual contracts track an underlying market without a fixed expiry. Funding payments and leverage can materially change the cost and risk of holding a position.'],
  ['AI trading: What you need to know', 'what_is_ai_trading_preview_8f44b88979.webp', 'AI can help organize market information, but outputs can be inaccurate or outdated. Independently verify prices and research before making a decision.'],
  ['What is MCP in trading?', 'mcp_trading_preview_ae7b6361dc.webp', 'Model Context Protocol lets compatible AI clients access tools and data. Read-only access and order execution are different permissions. This site does not offer an MCP connection.'],
  ['What is trading and how does it work?', 'axi_trading_platform_user_interface_f61b709232.webp', 'Trading involves taking exposure to changing market prices. Understand the instrument, transaction costs and maximum possible loss before entering a trade.'],
];

interface HomeViewProps {
  quotes: Record<string, MarketQuote>;
  setView: (view: ViewType) => void;
  openSignUp: () => void;
}

export default function HomeView({ quotes, setView, openSignUp }: HomeViewProps) {
  const [selectedInsight, setSelectedInsight] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const { cmsContent } = useSiteCMS();
  const navigate = (view: ViewType) => { setView(view); window.scrollTo(0, 0); };
  return (
    <div className="axi-home flex flex-col bg-white">
      <HeroSlideshow onAction={(action) => {
        if (action === 'open-account') openSignUp();
        else if (action === 'copy') navigate('platforms');
        else if (action === 'perpetuals') navigate('perpetuals');
        else if (action === 'markets' || action === 'platforms' || action === 'tools') navigate(action);
      }} />
      <MarketRibbon quotes={quotes} onViewMarkets={() => navigate('markets')} />
      <ReferenceHomeSections setView={navigate} openSignUp={openSignUp} />
      <section className="reference-band reference-editorial">
        <div className="home-shell">
          <div className="reference-partnership reference-cut">
            <picture><source media="(max-width: 40rem)" srcSet="https://media.axiglobal.net/media/man_city_banner_mobile_f0c6449896.webp" /><img src="https://media.axiglobal.net/media/man_city_banner_desktop_fc2bbd705c.webp" alt="" loading="lazy" onError={event => { event.currentTarget.parentElement?.querySelector('source')?.removeAttribute('srcset'); if (event.currentTarget.getAttribute('src') !== ManCityImage) event.currentTarget.src = ManCityImage; }} /></picture>
            <div><h2 className="home-heading">Passion for the edge, passion for football.</h2><p>{cmsContent.home.partnershipSubtitle}</p><button type="button" className="home-button reference-outline" onClick={() => { setView('about'); window.scrollTo(0, 0); }}>Read more <ArrowRight size={17} /></button></div>
          </div>
        </div>
      </section>
      <section className="reference-get-started">
        <div className="home-shell"><p className="home-kicker">/// Get started</p><h2 className="home-heading">Get started<br /> with CFD trading.</h2><button type="button" className="home-button home-button-primary" onClick={openSignUp}>Open account <ArrowRight size={17} /></button><p>CFDs are complex instruments and carry a high risk of rapidly losing money due to leverage.</p></div>
      </section>
      <section className="reference-band reference-editorial">
        <div className="home-shell">
          <p className="home-kicker">/// Axi blog</p><h2 className="home-heading">Insights to <em>sharpen your edge</em></h2>
          <div className="reference-blog-rail" aria-label="Featured insights" tabIndex={0}>
          {insights.map(([title, image], i) => <button type="button" className="reference-cut" key={title} aria-pressed={selectedInsight === i} onClick={() => setSelectedInsight(i)}><img src={`https://media.axiglobal.net/media/${image}`} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /><span>{title}</span></button>)}
          </div>
          {selectedInsight !== null && <motion.article key={selectedInsight} className="home-insight-note" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite"><h3>{insights[selectedInsight][0]}</h3><p>{insights[selectedInsight][2]}</p></motion.article>}
          <button type="button" className="reference-link mt-5" onClick={() => navigate('blog')}>Explore the blog <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </section>

    </div>
  );
}
