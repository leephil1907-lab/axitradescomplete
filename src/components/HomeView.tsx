import { ArrowRight } from 'lucide-react';
import { useSiteCMS } from '../hooks/useSiteCMS';
import type { MarketQuote, ViewType } from '../types';
import ManCityImage from '../assets/images/mancity_dpworld_partnership_1786474036247.jpg';
import HeroSlideshow from './axi/HeroSlideshow';
import MarketRibbon from './axi/MarketRibbon';
import { ReferenceHomeSections } from './axi/ReferenceHomeSections';

interface HomeViewProps {
  quotes: Record<string, MarketQuote>;
  setView: (view: ViewType) => void;
  openSignUp: () => void;
}

export default function HomeView({ quotes, setView, openSignUp }: HomeViewProps) {
  const { cmsContent } = useSiteCMS();
  const navigate = (view: ViewType) => { setView(view); window.scrollTo(0, 0); };
  return (
    <div className="axi-home flex flex-col bg-white">
      <HeroSlideshow onAction={(action) => {
        if (action === 'open-account') openSignUp();
        else if (action === 'copy') window.open('https://www.axi.com/int/copy-trading-app', '_blank', 'noopener,noreferrer');
        else if (action === 'perpetuals') document.getElementById('home-perpetuals')?.focus();
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
          {[
            ['What is agentic trading?', 'agentic_trading_preview_b7b317bd52.webp', 'education/agentic-trading'],
            ['Perpetual futures in traditional markets', 'clock_24_7_trading_pr_7b743b9d90.webp', 'company-news/axi-expands-perpetual-futures-traditional-markets'],
            ['AI trading: What you need to know', 'what_is_ai_trading_preview_8f44b88979.webp', 'education/ai-trading'],
            ['What is MCP in trading?', 'mcp_trading_preview_ae7b6361dc.webp', 'education/mcp-trading'],
            ['Axi launches its MT5 and Claude integration', 'mobile_trading_chart_claude_a3f29e234b.webp', 'company-news/axi-launches-mcp-integration-mt5-claude'],
            ['What is trading and how does it work?', 'axi_trading_platform_user_interface_f61b709232.webp', 'education/what-is-trading'],
          ].map(([title, image, path]) => <a className="reference-cut" key={title} href={`https://www.axi.com/int/blog/${path}`} target="_blank" rel="noreferrer"><img src={`https://media.axiglobal.net/media/${image}`} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} /><span>{title}</span></a>)}
          </div>
          <div className="reference-summary"><span>Ask AI to summarize</span>{[
            ['ChatGPT', 'https://chatgpt.com/?prompt='], ['Gemini', 'https://www.google.com/search?udm=50&q='], ['Perplexity', 'https://www.perplexity.ai/search?q='], ['Claude', 'https://claude.ai/new?q='],
          ].map(([name, url]) => <a key={name} href={url + encodeURIComponent('Read https://www.axi.com/int and summarize its trading products, platforms and key risks. If you cannot access the page, say so.')} target="_blank" rel="noreferrer">{name}</a>)}</div>
        </div>
      </section>

    </div>
  );
}
