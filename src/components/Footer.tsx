import type { ViewType } from '../types';
import { ArrowUp, ArrowUpRight, Facebook, Instagram, Linkedin } from 'lucide-react';
import AxiLogo from './AxiLogo';

interface FooterProps {
  setView: (view: ViewType) => void;
  openSignUp: () => void;
  showCallout: boolean;
}

const groups: { title: string; links: [string, ViewType][] }[] = [
  { title: 'Essentials', links: [['Payment methods', 'funds'], ['Axi Select', 'select']] },
  { title: 'Trading', links: [['Markets', 'markets'], ['Account options', 'accounts'], ['Trading platforms', 'platforms'], ['Trading tools', 'tools']] },
  { title: 'Education', links: [['Axi Academy', 'academy'], ['Market insights', 'blog'], ['Economic calendar', 'economic_calendar']] },
  { title: 'Partnerships', links: [['Partner programs', 'partners'], ['About Axi', 'about'], ['Promotions', 'promotions']] },
  { title: 'Legal', links: [['Legal documents', 'legal'], ['Privacy and terms', 'legal']] },
  { title: 'Client support', links: [['Help centre', 'support'], ['Client dashboard', 'dashboard'], ['Forex VPS', 'forex_vps']] },
];

export default function Footer({ setView, openSignUp, showCallout }: FooterProps) {
  const handleNav = (view: ViewType) => { setView(view); window.scrollTo(0, 0); };
  const backToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

  return (
    <footer className="axi-design site-footer">
      {showCallout && <div className="site-footer-callout">
        <div className="home-shell flex flex-wrap items-center justify-between gap-6">
          <div><p className="home-kicker">/// Get started</p><h2 className="home-heading mt-3">Ready to trade your edge?</h2></div>
          <button type="button" onClick={openSignUp} className="home-button home-button-primary">Open account <ArrowUpRight size={17} aria-hidden="true" /></button>
        </div>
      </div>}
      <div className="home-shell site-footer-shell">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <button type="button" onClick={() => handleNav('home')} aria-label="Axi home"><AxiLogo variant="white" size="md" /></button>
            <p>Explore global markets, compare platforms and sharpen your trading skills.</p>
            <div className="site-footer-social">
              <a href="https://facebook.com/axi" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17} /></a>
              <a href="https://instagram.com/axi" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17} /></a>
              <a href="https://linkedin.com/company/axi" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17} /></a>
            </div>
          </div>
          <nav className="site-footer-nav" aria-label="Footer">
            {groups.map(group => <div key={group.title}>
              <h3>{group.title}</h3>
              <ul>{group.title === 'Essentials' && <li><button type="button" onClick={openSignUp}>Open account</button></li>}{group.links.map(([label, view]) => <li key={label}><button type="button" onClick={() => handleNav(view)}>{label}</button></li>)}</ul>
            </div>)}
          </nav>
        </div>
        <section className="site-footer-disclosures" aria-labelledby="footer-disclosures-title">
          <h2 id="footer-disclosures-title">Risk disclosures</h2>
            <p>
              Axi is a trading name of AxiTrader LLC (AxiTrader), which is incorporated in St Vincent and the Grenadines, number 4303 LLC 2025 by the Registrar of International Business Companies, and registered by the Financial Services Authority, and whose address is Euro House, Richmond Hill Road, Kingstown, St. Vincent and the Grenadines.
            </p>
            
            <p>
              Over-the-counter derivatives are complex instruments and come with a high risk of losing substantially more than your initial investment rapidly due to leverage. You should consider whether you understand how over-the-counter derivatives work and whether you can afford to take the high level of risk to your capital. Investing in over-the-counter derivatives carries significant risks and is not suitable for all investors.
            </p>
            
            <p>
              When acquiring our derivative products you have no entitlement, right or obligation to the underlying financial asset. AxiTrader is not a financial adviser and all services are provided on an execution only basis. Information is of a general nature only and does not consider your financial objectives, needs or personal circumstances. Important legal documents in relation to our products and services are available{' '}
              <button onClick={() => handleNav('legal')} className="underline font-semibold text-white hover:text-[#F5CE47] transition cursor-pointer">
                on our website
              </button>
              . You should read and understand these documents before applying for any AxiTrader products or services and obtain independent professional advice as necessary.
            </p>
            
            <p>
              AxiTrader LLC is a{' '}
              <button onClick={() => handleNav('legal')} className="underline font-semibold text-white hover:text-[#F5CE47] transition cursor-pointer">
                member of The Financial Commission
              </button>
              , an international organization engaged in the{' '}
              <button onClick={() => handleNav('legal')} className="underline font-semibold text-white hover:text-[#F5CE47] transition cursor-pointer">
                resolution of disputes
              </button>{' '}
              within the financial services industry in the Forex market.
            </p>
            
            <p>
              The information on this website is not directed at residents in any country where such distribution or use would be contrary to local law or regulation, and is not intended for residents of France, overseas French territories, Australia, or New Zealand.
            </p>
        </section>
        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} Axi. All rights reserved.</span>
          <button type="button" onClick={() => handleNav('legal')}>Legal & privacy</button>
          <button type="button" onClick={backToTop}>Back to top <ArrowUp size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </footer>
  );
}
