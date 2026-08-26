import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldAlert, CheckCircle2, Search, ArrowRight, Award, Lock, Scale } from 'lucide-react';

interface LegalDoc {
  id: string;
  title: string;
  summary: string;
  sections: Array<{ subtitle: string; content: string }>;
}

const LEGAL_DOCUMENTS: LegalDoc[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    summary: 'Master brokerage agreement governing account parameters, execution paths, and client covenants.',
    sections: [
      { subtitle: '1. Regulatory Scope', content: 'This Agreement is entered into by and between Axi Financial Services (UK) Limited (FRN 466201) and the Client. These terms outline the execution of contract-for-difference (CFD) assets across globally segregated trust accounts.' },
      { subtitle: '2. Client Status', content: 'Under FCA guidelines, clients will be classified as Retail Clients unless they satisfy professional qualifications under MiFID II requirements.' },
      { subtitle: '3. Order Execution', content: 'Axi operates under standard straight-through-processing (STP) and electronic communication network (ECN) access nodes. Slippage and spreads are market-driven and vary under extreme macro news volatility.' }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    summary: 'Vetting client data storage and transmission channels in strict compliance with global privacy authorities.',
    sections: [
      { subtitle: '1. Collected Data', content: 'We collect personal coordinates, KYC photographs, financial source statements, and trading transaction history to ensure secure profile setup.' },
      { subtitle: '2. Storage Durability', content: 'In compliance with anti-money laundering (AML) laws, client personal archives are held securely in fully encrypted offline database vaults for a minimum period of 5 years following profile termination.' }
    ]
  },
  {
    id: 'risk',
    title: 'Risk Disclosure',
    summary: 'FCA and ASIC mandated warning illustrating high risk and leverage implications of derivative contracts.',
    sections: [
      { subtitle: '1. Leverage Magnification', content: 'Leveraged derivatives amplify both trading returns and losses. Operating under maximum ECN leverage configurations (e.g. 1:1000) can result in immediate loss of deposited capital.' },
      { subtitle: '2. Historical Performance', content: 'Historical market performance models do not serve as reliable indicators of future profit vectors. You should not fund accounts with capital you cannot afford to lose completely.' }
    ]
  },
  {
    id: 'cookie',
    title: 'Cookie Policy',
    summary: 'Vetting browser cookie variables, token storage, and session duration tracking.',
    sections: [
      { subtitle: '1. Session Cookies', content: 'We employ secure session cookies to verify your encrypted client portal login state and track navigation progress across active tabs.' },
      { subtitle: '2. Performance Telemetry', content: 'Analytical cookies collect anonymous routing telemetry to help optimize our pricing matching latency and ECN server performance.' }
    ]
  },
  {
    id: 'gdpr',
    title: 'GDPR Compliance',
    summary: 'Client data protection protocols in strict adherence with European Union GDPR directives.',
    sections: [
      { subtitle: '1. Right to Erasure', content: 'European Union clients retain the right to request erasure of their personal archives, subject to overriding statutory AML audit guidelines.' },
      { subtitle: '2. Data Portability', content: 'Under GDPR Article 20, you can request an XML or JSON statement of your trading profiles to transfer to external service operators.' }
    ]
  },
  {
    id: 'aml',
    title: 'AML Policy',
    summary: 'Anti-Money Laundering structures for tracking, vetting, and reporting suspicious credit vectors.',
    sections: [
      { subtitle: '1. Payment Isolation', content: 'To block illicit capital routes, we strictly forbid third-party funding. Deposit and withdrawal pathways must match the verified trader name.' },
      { subtitle: '2. Suspicious Transaction Audits', content: 'Axi security engines constantly scan for anomalous deposit bursts or transfer vectors, and will initiate immediate regulatory locks on suspected profiles.' }
    ]
  },
  {
    id: 'kyc',
    title: 'KYC Policy',
    summary: 'Know Your Customer rules enforcing identity and photo address verification.',
    sections: [
      { subtitle: '1. Identity Verification', content: 'All active trading profiles must submit a high-definition photo or scan of a current Passport, Driving License, or Government National ID Card.' },
      { subtitle: '2. Address Authentication', content: 'To verify residency, we require a utility bill or bank ledger dated within 90 days. We do not accept P.O. Box addresses.' }
    ]
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    summary: 'Processing rules for card deposit reversals, account closures, and cashier refunds.',
    sections: [
      { subtitle: '1. Original Source Reversals', content: 'Refunds must be processed back to the original funding source (e.g., credit card ending 4102 or Skrill email match).' },
      { subtitle: '2. Free Margin Restrictions', content: 'Refunds are only eligible on free margins not actively supporting open positions on your MetaTrader 5 terminal.' }
    ]
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    summary: 'Defining limits of third-party educational guidelines, market news, and tool calculations.',
    sections: [
      { subtitle: '1. Educational Intent', content: 'All market commentary, blog analysis, academy quizzes, and interactive calculators represent general education. They do not constitute investment advice.' },
      { subtitle: '2. Accuracy of Rates', content: 'While Axi strives for millisecond rate precision, we do not guarantee the absolute accuracy of live ticker indices shown in educational tools.' }
    ]
  },
  {
    id: 'complaints',
    title: 'Complaints Procedure',
    summary: 'Step-by-step guidelines for submitting official complaints and invoking Financial Ombudsman arbitration.',
    sections: [
      { subtitle: '1. Formal Resolution', content: 'In case of disputes, submit a secure ticket referencing your trading ID. Our compliance board will issue a written response within 5 business days.' },
      { subtitle: '2. Ombudsman Escalation', content: 'If dissatisfied with our resolution, UK clients possess the statutory right to escalate the dispute to the Financial Ombudsman Service (FOS).' }
    ]
  },
  {
    id: 'conflicts',
    title: 'Conflicts of Interest',
    summary: 'Broker policy for managing transaction routing transparency and eliminating trade execution conflicts.',
    sections: [
      { subtitle: '1. ECN Routing Transparency', content: 'Axi avoids trading conflicts of interest by routing trades directly to Tier-1 interbank liquidity pools under STP/ECN models.' },
      { subtitle: '2. Employee Trading Policies', content: 'Axi staff are prohibited from executing trades on customer platforms that conflict with open client position blocks.' }
    ]
  },
  {
    id: 'best_execution',
    title: 'Best Execution Policy',
    summary: 'Commitment to execute trades at the most favorable market rates with minimum slippage.',
    sections: [
      { subtitle: '1. Order Quality', content: 'Axi continuously audits execution feeds. We match orders with global banks to ensure spreads from 0.0 pips and sub-10ms latency.' },
      { subtitle: '2. Slippage Tolerances', content: 'Under rapid volatility, price gaps may occur. Trades are matched at the next optimal market rate with zero manual intervention.' }
    ]
  },
  {
    id: 'leverage',
    title: 'Leverage Policy',
    summary: 'Enforcing regulatory leverage boundaries and margin requirement calculations.',
    sections: [
      { subtitle: '1. Regulatory Caps', content: 'Leverage ranges from 1:30 (FCA/ASIC Retail) to 1:1000 (Axi Max ECN Offshore accounts) based on jurisdiction.' },
      { subtitle: '2. Leverage Reductions', content: 'Axi reserves the right to reduce leverage limits ahead of high-impact weekend events or during extreme liquidity stress.' }
    ]
  },
  {
    id: 'protection',
    title: 'Negative Balance Protection',
    summary: 'Commitment to protect retail client profiles from losing more capital than their balance.',
    sections: [
      { subtitle: '1. Deficit Forgiveness', content: 'If severe market volatility pushes your balance below zero, Axi auto-resets your profile. Your losses are mathematically capped at your deposit.' },
      { subtitle: '2. Professional Exclusions', content: 'Please note that institutional and professional tier accounts are excluded from automatic negative balance forgiveness.' }
    ]
  },
  {
    id: 'compensation',
    title: 'Investor Compensation',
    summary: 'Client capital coverage under the Financial Services Compensation Scheme (FSCS) up to £85,000.',
    sections: [
      { subtitle: '1. FSCS Security Net', content: 'Eligible UK client funds are insured under the FSCS. In the unlikely event of Axi default, claims are covered up to £85,000 per person.' },
      { subtitle: '2. Australian Safeguards', content: 'Australian retail clients are protected under ASIC Segregated Trust account rules with direct recourse to assets held.' }
    ]
  },
  {
    id: 'regulatory',
    title: 'Regulatory Information',
    summary: 'Full corporate mapping, registration coordinates, and financial oversight details.',
    sections: [
      { subtitle: '1. Global Supervision', content: 'Axi is a registered brand name of AxiCorp Financial Services Pty Ltd. We operate under oversight by FCA (UK), ASIC (Australia), and DFSA (Dubai).' },
      { subtitle: '2. Audit Disclosures', content: 'We undergo rigorous quarterly third-party financial audits to verify capital solvency and complete segregation of client money vaults.' }
    ]
  },
  {
    id: 'licenses',
    title: 'Licenses',
    summary: 'Active financial services licenses held across global jurisdictions.',
    sections: [
      { subtitle: '1. FCA Licence', content: 'UK Operations: Axi Financial Services (UK) Limited, authorized and regulated by the Financial Conduct Authority under FRN 466201.' },
      { subtitle: '2. ASIC AFSL Licence', content: 'Australian Operations: AxiCorp Financial Services Pty Ltd, licensed by the Australian Securities & Investments Commission under AFSL 318232.' }
    ]
  },
  {
    id: 'fees',
    title: 'Fees Schedule',
    summary: 'Details regarding standard spreads, swap overnight financing rates, and commission fees.',
    sections: [
      { subtitle: '1. Zero Commission spreads', content: 'Standard accounts trade commission-free, with costs factored into a slight spread markup starting at 0.9 pips.' },
      { subtitle: '2. Swap Overnight financing', content: 'Holding positions past 22:00 GMT triggers overnight swap debits or credits, calculated directly from benchmark interbank rate differences.' }
    ]
  },
  {
    id: 'hours',
    title: 'Trading Hours',
    summary: 'CFD and Forex market session clocks, maintenance downtime, and weekend locks.',
    sections: [
      { subtitle: '1. Market Open Cycle', content: 'Forex pairs are tradeable 24 hours a day, commencing Sunday at 22:00 GMT and locking Friday at 22:00 GMT.' },
      { subtitle: '2. Crypto Exclusions', content: 'Cryptocurrency CFDs are tradeable 24/7, except during brief scheduled server optimization windows on Saturdays.' }
    ]
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    summary: 'UI accessibility commitment in strict adherence with WCAG 2.1 AA digital standards.',
    sections: [
      { subtitle: '1. Accessible Reading layouts', content: 'We maintain a minimum contrast ratio of 4.5:1 across all typography and support full screen-reader text parsing.' },
      { subtitle: '2. Keyboard Navigation', content: 'Our website, including registration wizards and charting widgets, supports complete keyboard navigation via tab loops.' }
    ]
  }
];

interface LegalProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function LegalView({ showToast }: LegalProps) {
  const [activeDocId, setActiveDocId] = useState('terms');
  const [searchTerm, setSearchTerm] = useState('');
  const [acceptedDocs, setAcceptedDocs] = useState<Record<string, boolean>>({});

  const filteredDocs = LEGAL_DOCUMENTS.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDoc = LEGAL_DOCUMENTS.find(doc => doc.id === activeDocId) || LEGAL_DOCUMENTS[0];
  const isAccepted = acceptedDocs[activeDoc.id] || false;

  const handleAcceptDoc = () => {
    setAcceptedDocs(prev => ({ ...prev, [activeDoc.id]: true }));
    showToast(`You have officially acknowledged and agreed to the ${activeDoc.title} directive.`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10 bg-brand-light">
      
      {/* Intro Heading */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="text-brand-red text-xs font-black tracking-widest uppercase bg-brand-red/5 border border-brand-red/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow/10" /> REGULATORY TRANSPARENCY
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tight uppercase">
          Axi Legal & Disclosure Library
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          Review our 20 corporate legal policies. We operate under rigorous global supervision to safeguard client money, maintain execution transparency, and provide secure trading parameters.
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Document Selector Sidebar (Left Columns) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
          
          {/* Document Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search 20 legal documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none transition shadow-inner"
            />
          </div>

          {/* List of 20 Documents */}
          <div className="flex flex-col gap-1 max-h-[480px] overflow-y-auto pr-1">
            {filteredDocs.map((doc, idx) => {
              const isActive = activeDocId === doc.id;
              const acknowledged = acceptedDocs[doc.id] || false;
              
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-brand-red text-white' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-black uppercase tracking-wider flex items-center gap-1.5 truncate">
                      <span className="font-mono text-[10px] opacity-60">{(idx + 1).toString().padStart(2, '0')}.</span>
                      {doc.title}
                    </div>
                    <div className={`text-[9px] truncate mt-0.5 font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                      {doc.summary}
                    </div>
                  </div>
                  {acknowledged && (
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-yellow' : 'text-emerald-500'}`} />
                  )}
                </button>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold uppercase">
                No matching documents
              </div>
            )}
          </div>
        </div>

        {/* Document Reader Board (Right Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          
          {/* Header */}
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[9px] font-black uppercase text-brand-red tracking-widest font-mono">Official Regulatory Document</span>
            <h2 className="text-xl md:text-2xl font-black text-brand-dark uppercase tracking-tight mt-1">
              {activeDoc.title}
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {activeDoc.summary}
            </p>
          </div>

          {/* Fully articulated legal clauses */}
          <div className="flex flex-col gap-6 text-xs text-slate-700 leading-relaxed font-semibold">
            {activeDoc.sections.map((section) => (
              <div key={section.subtitle} className="flex flex-col gap-1.5">
                <h3 className="text-slate-900 font-black uppercase tracking-wide border-l-2 border-brand-red pl-2">
                  {section.subtitle}
                </h3>
                <p className="text-slate-500 font-medium pl-2 text-[11px]">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Sig Checklist */}
          <div className="border-t border-slate-100 pt-6 mt-4 flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id={`check-${activeDoc.id}`}
                  checked={isAccepted}
                  onChange={handleAcceptDoc}
                  disabled={isAccepted}
                  className="mt-0.5 w-4 h-4 text-brand-red focus:ring-brand-red border-slate-350 rounded accent-brand-red cursor-pointer disabled:opacity-50"
                />
                <label htmlFor={`check-${activeDoc.id}`} className="text-[10px] text-slate-500 font-bold leading-normal cursor-pointer">
                  <span className="font-black text-slate-800 block uppercase">Digitally Acknowledge and Accept Document</span>
                  I have read, understood, and accept all listed parameters of the {activeDoc.title} policy.
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span>Signed securely via verified IP credentials. Time Stamp: 2026-07-12 GMT.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
