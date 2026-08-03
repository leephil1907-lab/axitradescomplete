import { useSiteCMS } from '../hooks/useSiteCMS';
import React from 'react';
import { ViewType } from '../types';
import { Facebook, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';

interface FooterProps {
  setView: (view: ViewType) => void;
}

export default function Footer({ setView }: FooterProps) {
  const { cmsContent } = useSiteCMS();
  const handleNav = (view: ViewType) => {
    setView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const linkGroups = [
    {
      title: 'ESSENTIALS',
      links: [
        { label: 'Getting Started', id: 'home' as ViewType },
        { label: 'Open Account', id: 'dashboard' as ViewType },
        { label: 'Payment Methods', id: 'funds' as ViewType },
        { label: 'Download MT4', id: 'platforms' as ViewType },
        { label: 'Download MT5', id: 'platforms' as ViewType },
        { label: 'Buy Crypto', id: 'markets' as ViewType },
      ]
    },
    {
      title: 'TRADING',
      links: [
        { label: 'Markets', id: 'markets' as ViewType },
        { label: 'Forex', id: 'markets' as ViewType },
        { label: 'Stocks', id: 'markets' as ViewType },
        { label: 'Gold', id: 'markets' as ViewType },
        { label: 'Indices', id: 'markets' as ViewType },
        { label: 'Account Types', id: 'accounts' as ViewType },
        { label: 'Platforms', id: 'platforms' as ViewType },
        { label: 'Tools', id: 'tools' as ViewType },
      ]
    },
    {
      title: 'EDUCATION',
      links: [
        { label: 'Axi Academy', id: 'tools' as ViewType },
        { label: 'Free eBooks', id: 'tools' as ViewType },
        { label: 'Blog', id: 'blog' as ViewType },
      ]
    },
    {
      title: 'LEGAL',
      links: [
        { label: 'Legal Documentation', id: 'legal' as ViewType },
        { label: 'Product Schedule', id: 'legal' as ViewType },
        { label: 'Client Agreement', id: 'legal' as ViewType },
        { label: 'Complaints Handling', id: 'legal' as ViewType },
        { label: 'Privacy Policy', id: 'legal' as ViewType },
        { label: 'Website Terms & Conditions', id: 'legal' as ViewType },
      ]
    },
    {
      title: 'CLIENT SUPPORT',
      links: [
        { label: 'Request a callback', id: 'support' as ViewType },
        { label: 'WhatsApp', id: 'support' as ViewType },
        { label: 'Contact', id: 'support' as ViewType },
        { label: 'Help Centre', id: 'support' as ViewType },
      ]
    }
  ];

  return (
    <footer className="bg-[#363636] text-[#A3A3A3] text-sm">
      <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-12">
          <img src="https://d2tpnh780x5es.cloudfront.net/rebrand-prod/hqwjus4e/logo-light1.svg" alt="Axi Logo" className="h-8 md:h-10 opacity-90" referrerPolicy="no-referrer" />
        </div>

        {/* Navigation Links Grid */}
        <div className="flex flex-col md:flex-row flex-wrap justify-center gap-10 md:gap-16 w-full text-center">
          {linkGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-5">
              <h3 className="text-[#E3000F] text-xs font-black tracking-widest uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <button
                      onClick={() => handleNav(link.id)}
                      className="text-[#D1D1D1] hover:text-white transition-all duration-150 text-[13px]"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trustpilot & Socials */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center bg-white rounded overflow-hidden shadow-sm">
            <div className="bg-[#00B67A] px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-white text-lg leading-none">★</span>
              <span className="text-white font-bold text-sm tracking-tight">Trustpilot</span>
            </div>
            <div className="px-3 py-1.5 text-slate-800 text-sm font-medium">
              7.1K reviews
            </div>
          </div>

          <div className="flex gap-6 text-[#A3A3A3]">
            <a href="https://facebook.com/axi" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer"><Facebook className="w-5 h-5" /></a>
            <a href="https://instagram.com/axi" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer"><Instagram className="w-5 h-5" /></a>
            <a href="https://twitter.com/axi" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer"><Twitter className="w-5 h-5" /></a>
            <a href="https://tiktok.com/@axi" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3v10.81a2.89 2.89 0 0 1-5.78-.34 2.89 2.89 0 0 1 2.89-2.89 2.84 2.84 0 0 1 1.7.57V7.11A6 6 0 0 0 7 6.81a6 6 0 0 0 0 12 6 6 0 0 0 6-6.19V11.2a7.6 7.6 0 0 0 6.59 2.32Z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/axi" target="_blank" rel="noreferrer" className="hover:text-white transition-colors cursor-pointer"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>

      
                <div className="flex flex-wrap justify-center gap-4 mt-12 mb-6">
          <a href="mailto:customersupport@axitrades.com" className="border border-slate-600 bg-slate-800/80 hover:bg-slate-700 rounded px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition">
            <Mail className="w-3.5 h-3.5 text-brand-red" /> Support: customersupport@axitrades.com
          </a>
          <div className="border border-slate-600 rounded px-3 py-1.5 text-xs font-bold text-slate-400">FCA Regulated</div>
          <div className="border border-slate-600 rounded px-3 py-1.5 text-xs font-bold text-slate-400">ASIC Regulated</div>
          <div className="border border-slate-600 rounded px-3 py-1.5 text-xs font-bold text-slate-400">DFSA Regulated</div>
          <div className="border border-slate-600 rounded px-3 py-1.5 text-xs font-bold text-slate-400">FMA Regulated</div>
          <div className="border border-slate-600 rounded px-3 py-1.5 text-xs font-bold text-slate-400">CySEC Regulated</div>
        </div>

      {/* Risk Warning and Legal Disclosures */}
      <div className="bg-[#262626] py-12 text-[#999999] text-[11px] leading-relaxed border-t border-[#404040]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col gap-5 text-center sm:text-left">
          
          {/* Prominent High Risk CFD Warning Box */}
          <div className="bg-[#1f1f1f] border border-[#E3000F]/40 p-4 rounded-lg text-slate-300 text-xs leading-relaxed">
            <span className="font-bold text-[#E3000F] uppercase tracking-wider block mb-1">
              Risk Warning & High-Risk Investment Notice:
            </span>
            <p>
              CFDs and Margin FX are complex financial instruments and come with a high risk of losing money rapidly due to leverage. <strong className="text-white">71.6% of retail investor accounts lose money when trading CFDs with this provider.</strong> You should consider whether you understand how CFDs, Spot FX, and financial derivatives work and whether you can afford to take the high risk of losing your capital. Past performance is no guarantee of future results.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-[#999999]">
            <p>
              <strong>Company Entities & Operating Structure:</strong> Axi is a trading name of AxiTrader Limited (AxiTrader), which is incorporated in St. Vincent and the Grenadines, number 25417 BC 2019 by the Registrar of International Business Companies, and registered by the Financial Services Authority, Suite 305, Griffith Corporate Centre, PO Box 1510, Beachmont Kingstown, St. Vincent and the Grenadines.
            </p>            <p>
              <strong>Global Regulatory Status:</strong> AxiCorp Financial Services Pty Ltd (ACN 127 606 348) is authorised and regulated by the Australian Securities & Investments Commission (ASIC) AFSL number 318232. AxiCorp Limited is authorised and regulated by the Financial Conduct Authority (FCA) Reference Number 509746. AxiTrader Limited is authorised and regulated by the Dubai Financial Services Authority (DFSA) under Firm Reference Number F003742. Axi Financial Markets (Cyprus) Ltd is authorized and regulated by the Cyprus Securities and Exchange Commission (CySEC) License Number 258/14.
            </p>
            <p>
              <strong>Dispute Resolution & Investor Protection:</strong> AxiTrader Limited is a certified member of <a href="#" onClick={(e) => { e.preventDefault(); handleNav('legal'); }} className="underline hover:text-white transition">The Financial Commission</a>, an international independent body engaged in the resolution of disputes within the financial markets. Client funds are strictly segregated in tier-1 international banking accounts and maintained in compliance with regulatory client money rules.
            </p>
            <p>
              <strong>Regional & Restricted Jurisdictions:</strong> The information on this website is not directed at residents of the United States of America, Canada, Iran, North Korea, Syria, Cuba, Belarus, or any jurisdiction where FX or CFD trading is prohibited or restricted by local law or regulation.
            </p>
            <p>
              <strong>General Advice Disclaimer:</strong> Information on this site is general in nature and does not take into account your personal investment objectives, financial situation, or risk tolerance. Please review our <button onClick={() => handleNav('legal')} className="underline hover:text-white transition">Product Disclosure Statement (PDS)</button>, <button onClick={() => handleNav('legal')} className="underline hover:text-white transition">Financial Services Guide (FSG)</button>, and <button onClick={() => handleNav('legal')} className="underline hover:text-white transition">Client Agreement</button> prior to executing transactions.
            </p>
          </div>

          <div className="pt-4 border-t border-[#3a3a3a] flex flex-col sm:flex-row items-center justify-between text-[#888888] text-[11px] gap-2">
            <div>
              &copy; {new Date().getFullYear()} Axi. All rights reserved. Axi, AxiTrader, and the Axi logo are registered trademarks.
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleNav('legal')} className="hover:text-white transition">Privacy Policy</button>
              <span>•</span>
              <button onClick={() => handleNav('legal')} className="hover:text-white transition">Terms & Conditions</button>
              <span>•</span>
              <button onClick={() => handleNav('legal')} className="hover:text-white transition">Cookie Policy</button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
