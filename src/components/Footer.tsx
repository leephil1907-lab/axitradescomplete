import React from 'react';
import { ViewType } from '../types';
import { Facebook, Instagram, Twitter, Linkedin, ShieldCheck, Award, TrendingUp, HelpCircle } from 'lucide-react';

interface FooterProps {
  setView: (view: ViewType) => void;
}

export default function Footer({ setView }: FooterProps) {
  const handleNav = (view: ViewType) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    {
      title: 'Trading & Portals',
      links: [
        { label: 'Markets & Spreads', id: 'markets' as ViewType },
        { label: 'Account Types', id: 'accounts' as ViewType },
        { label: 'Axi Select ($1M Allocation)', id: 'select' as ViewType },
        { label: 'Promotions & Contests', id: 'promotions' as ViewType },
        { label: 'Deposit & Withdraw Funds', id: 'funds' as ViewType },
        { label: 'Trading Dashboard', id: 'dashboard' as ViewType },
      ]
    },
    {
      title: 'Platforms & Tools',
      links: [
        { label: 'MetaTrader 4 (MT4)', id: 'platforms' as ViewType },
        { label: 'MetaTrader 5 (MT5)', id: 'platforms' as ViewType },
        { label: 'Forex VPS Hosting', id: 'forex_vps' as ViewType },
        { label: 'Economic Calendar', id: 'economic_calendar' as ViewType },
        { label: 'Trading Calculators', id: 'tools' as ViewType },
        { label: 'Copy Trading Portal', id: 'tools' as ViewType },
      ]
    },
    {
      title: 'Partners & Learn',
      links: [
        { label: 'Introducing Broker (IB)', id: 'partners' as ViewType },
        { label: 'CPA Affiliate Program', id: 'partners' as ViewType },
        { label: 'White Label Broker', id: 'partners' as ViewType },
        { label: 'Axi Academy Courses', id: 'academy' as ViewType },
        { label: 'Market Blog & Insights', id: 'blog' as ViewType },
        { label: 'Free Strategy Guides', id: 'academy' as ViewType },
      ]
    },
    {
      title: 'Legal & Security',
      links: [
        { label: 'Why Choose Axi', id: 'about' as ViewType },
        { label: 'Legal Documentation', id: 'legal' as ViewType },
        { label: 'Product Disclosure (PDS)', id: 'legal' as ViewType },
        { label: 'Client Agreement', id: 'legal' as ViewType },
        { label: 'Complaints Handling', id: 'legal' as ViewType },
        { label: 'Privacy Policy', id: 'legal' as ViewType },
      ]
    },
    {
      title: 'Client Support',
      links: [
        { label: '24/7 Client Help Desk', id: 'support' as ViewType },
        { label: 'Request a Callback', id: 'support' as ViewType },
        { label: 'WhatsApp Priority Line', id: 'support' as ViewType },
        { label: 'Voice Notes Inquiry', id: 'support' as ViewType },
        { label: 'Account Verification Help', id: 'support' as ViewType },
      ]
    }
  ];

  return (
    <footer className="w-full text-[#A3A3A3] text-sm select-none border-t border-neutral-800">
      
      {/* Red Callout Angle Banner */}
      <div className="relative w-full bg-[#C8102E] text-white py-12 px-6 overflow-hidden">
        {/* Angled geometry overlay */}
        <div 
          className="absolute inset-0 bg-[#9B0018] opacity-70 pointer-events-none"
          style={{ clipPath: 'polygon(0 0, 88% 0, 100% 100%, 0% 100%)' }}
        />
        
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Ready to trade your edge?
            </h2>
            <p className="text-sm sm:text-base text-white/90">
              Join over 100,000+ traders worldwide with a licensed, multi-award-winning broker.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNav('dashboard')}
              className="bg-[#F5CE47] hover:bg-[#ECC94B] text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-md shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Open Live Account
            </button>
            <button
              onClick={() => handleNav('platforms')}
              className="bg-black/30 hover:bg-black/45 text-white font-bold text-xs sm:text-sm border border-white/30 px-5 py-3 rounded-md transition cursor-pointer"
            >
              Try Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Dark Footer Area */}
      <div className="bg-[#141414] pt-14 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Row: Brand Info + Navigation Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-neutral-800/80">
            
            {/* Brand Column (Left 4 cols on desktop) */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              {/* Axi Brand Logo */}
              <button 
                type="button"
                onClick={() => handleNav('home')}
                className="mb-4 cursor-pointer bg-transparent border-0 p-0 transition-transform duration-200 hover:scale-105 inline-flex items-center gap-2"
                title="Axi - Return to Home"
                aria-label="Axi Home"
              >
                <svg className="h-9 w-auto text-white" viewBox="0 0 110 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <text x="0" y="29" fill="#FFFFFF" fontSize="36" fontWeight="900" fontFamily="'Clash Display', 'General Sans', system-ui, sans-serif" letterSpacing="-1.5">axi</text>
                </svg>
              </button>

              <p className="text-neutral-400 text-xs sm:text-[13px] leading-relaxed max-w-sm mb-6">
                Trade Forex, Share CFDs, Indices, Commodities, and Crypto with ultra-competitive spreads, institutional execution speeds, and 24/7 dedicated support.
              </p>

              {/* Trustpilot & Credibility Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <div className="inline-flex items-center rounded overflow-hidden shadow-sm border border-neutral-700">
                  <div className="bg-[#00B67A] px-2.5 py-1.5 flex items-center gap-1.5">
                    <span className="text-white text-sm leading-none">★</span>
                    <span className="text-white font-bold text-xs tracking-tight">Trustpilot</span>
                  </div>
                  <div className="bg-neutral-900 px-2.5 py-1.5 text-neutral-200 text-xs font-semibold border-l border-neutral-800">
                    7.2K reviews
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded text-[11px] text-neutral-300">
                  <Award className="w-3.5 h-3.5 text-[#F5CE47]" />
                  <span>30+ Global Awards</span>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-4 text-neutral-400">
                <a href="https://facebook.com/axi" target="_blank" rel="noreferrer" className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition cursor-pointer" aria-label="Facebook">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://instagram.com/axi" target="_blank" rel="noreferrer" className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition cursor-pointer" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://twitter.com/axi" target="_blank" rel="noreferrer" className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition cursor-pointer" aria-label="X (Twitter)">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://tiktok.com/@axi" target="_blank" rel="noreferrer" className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition cursor-pointer" aria-label="TikTok">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3v10.81a2.89 2.89 0 0 1-5.78-.34 2.89 2.89 0 0 1 2.89-2.89 2.84 2.84 0 0 1 1.7.57V7.11A6 6 0 0 0 7 6.81a6 6 0 0 0 0 12 6 6 0 0 0 6-6.19V11.2a7.6 7.6 0 0 0 6.59 2.32Z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/axi" target="_blank" rel="noreferrer" className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700 transition cursor-pointer" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Navigation Links Columns (Right 8 cols on desktop) */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
              {sections.map((sec, sIdx) => (
                <div key={sIdx} className="flex flex-col items-start gap-3">
                  <h3 className="text-[#C8102E] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#C8102E] inline-block -skew-x-12" />
                    {sec.title}
                  </h3>
                  <ul className="flex flex-col items-start gap-2.5 w-full">
                    {sec.links.map((link, lIdx) => (
                      <li key={lIdx} className="w-full">
                        <button
                          onClick={() => handleNav(link.id)}
                          className="text-neutral-300 hover:text-[#F5CE47] transition text-xs sm:text-[13px] text-left cursor-pointer hover:translate-x-0.5 transform inline-block"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          {/* Legal and Regulatory Text */}
          <div className="flex flex-col gap-4 text-neutral-400 text-xs sm:text-[12px] leading-relaxed pt-8 text-justify sm:text-left">
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
          </div>

          {/* Bottom Copyright & Security Bar */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Segregated Tier-1 Bank Accounts
              </span>
              <span className="hidden md:inline text-neutral-600">|</span>
              <span className="hidden md:inline text-neutral-300">SSL 256-Bit Financial Encryption</span>
            </div>

            <p className="text-neutral-400 text-[11px]">
              &copy; {new Date().getFullYear()} Axi. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
