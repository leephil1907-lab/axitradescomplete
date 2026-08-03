import { useSiteCMS } from '../hooks/useSiteCMS';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Ticket,
  LifeBuoy,
  Mic,
  MicOff,
  Sparkles
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'General Account Setup' | 'Deposits & Withdrawals' | 'Axi Select & Funding' | 'Leverage & Risk Control' | 'MetaTrader Platforms';
  question: string;
  answer: string;
}

const FAQ_ENTRIES: FAQItem[] = [
  // 1. Account Setup & Verification
  {
    id: 'faq-1',
    category: 'General Account Setup',
    question: 'How does the identity verification process (KYC) work and how long does approval take?',
    answer: 'Identity verification is a 2-step process to ensure AML compliance: 1) Upload a clear photo of a Government ID (Passport, Driving License, or National ID) and 2) Upload a Proof of Address document (Utility bill or bank statement within 90 days). Verification reviews are processed by our automated compliance system within 1 to 12 hours.'
  },
  {
    id: 'faq-2',
    category: 'General Account Setup',
    question: 'How do I open an Axi Live Trading Account?',
    answer: 'Opening an account is fully digitized and takes under 3 minutes. Scroll to our accounts tab, click "Open Account" to launch our 3-step wizard, specify your country of residence, enter contact profiles, and select your leverage/tier. Once verified, credentials will be sent instantly.'
  },
  {
    id: 'faq-3',
    category: 'General Account Setup',
    question: 'Are my client trading funds held in secure segregated accounts?',
    answer: 'Absolutely. In compliance with FCA and ASIC client money rules, all client capital is held completely separate from corporate accounts in Tier-1 bank trust accounts and can never be used for operational leverage.'
  },
  // 2. Deposits & Withdrawals
  {
    id: 'faq-4',
    category: 'Deposits & Withdrawals',
    question: 'What are the exact processing times for deposits (Visa/Mastercard, Crypto, Bank Wire)?',
    answer: 'Visa/Mastercard credit/debit card deposits and Crypto transactions (BTC, ETH, USDT TRC20, USDC) process INSTANTLY (0 to 5 minutes) at 0% deposit fee. Bank Wire transfers and SEPA payments clear within 1 to 3 business days.'
  },
  {
    id: 'faq-5',
    category: 'Deposits & Withdrawals',
    question: 'Does Axi charge any fees or commissions on deposits and withdrawals?',
    answer: 'Axi charges 0% fees on all deposits and standard withdrawals. You receive 100% of your deposited amount. Third-party intermediary bank charges may apply for international SWIFT wire transfers depending on your receiving institution.'
  },
  {
    id: 'faq-6',
    category: 'Deposits & Withdrawals',
    question: 'How can I move capital between my standard MT5 account and sub-accounts?',
    answer: 'Internal transfers are executed instantly. Navigate to our secure cashier desk (Funds Tab), choose "Internal Transfer", specify the source MT5 account ID, select the destination account (e.g., your Axi Select Incubator Wallet), enter the transfer amount, and click submit.'
  },
  // 3. Trading Fees & Commissions
  {
    id: 'faq-7',
    category: 'Leverage & Risk Control',
    question: 'What are the trading fees, spreads, and commissions across Axi account types?',
    answer: 'Axi offers two primary fee structures: 1) Standard Accounts feature 0.0% commission with ultra-tight spreads starting from 0.9 pips, and 2) Pro ECN Accounts feature raw spreads from 0.0 pips with a low $7 per round turn lot commission. There are zero account maintenance fees.'
  },
  {
    id: 'faq-8',
    category: 'Axi Select & Funding',
    question: 'What is Axi Select and how do I qualify for live capital allocation?',
    answer: 'Axi Select is our premier capital allocation incubator program. Unlike traditional prop firms, there are zero entry fees or evaluation assessments. You trade on a real live account, prove your skill parameters to generate an Edge Score of 50+, and we back you with up to €200,000 capital, keeping up to 90% of the profits.'
  },
  {
    id: 'faq-9',
    category: 'Axi Select & Funding',
    question: 'What is the Edge Score and how is it calculated?',
    answer: 'The Edge Score is a weighted institutional score (0-100) assessing five skill vectors: Risk Control (25% weight), Consistency of gains (25%), Discipline to guidelines (20%), trade Experience (15%), and Growth recovery curves (15%). Higher Edge scores unlock higher funding stages.'
  },
  {
    id: 'faq-10',
    category: 'Leverage & Risk Control',
    question: 'What is the maximum trading leverage limit on EURUSD for retail clients?',
    answer: 'Axi offers up to 1:1000 max leverage depending on your jurisdiction and regulatory tier. For FCA/ASIC retail accounts, leverage is capped in compliance with local rules (typically 1:30), while professional clients and international accounts enjoy up to 1:500 or 1:1000 ECN leverage ratios.'
  },
  {
    id: 'faq-11',
    category: 'Leverage & Risk Control',
    question: 'How does Negative Balance Protection safeguard my trading profile?',
    answer: 'Negative Balance Protection is a mandatory risk buffer. If extreme market gaps or volatility causes your account balance to fall below zero, our automated risk engine clears the deficit, resetting your balance back to zero so you can never lose more than your initial capital.'
  },
  {
    id: 'faq-12',
    category: 'MetaTrader Platforms',
    question: 'Does Axi fully support MetaTrader 5 (MT5) alongside MT4?',
    answer: 'Yes, Axi provides state-of-the-art MetaTrader 4 and MetaTrader 5 setups across Desktop, iOS, Android, and Webtrader clients. MT5 boasts superior order execution paths, deeper market depth (DOM) layouts, and 21 timeframes.'
  }
];

interface SupportProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  openVoiceModal?: () => void;
}

export default function SupportView({ showToast, openVoiceModal }: SupportProps) {
  const { cmsContent } = useSiteCMS();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const toggleSpeechDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Web Speech API is not supported in this browser.', 'error');
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsDictating(false);
      showToast('Voice dictation stopped.', 'info');
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let existingText = ticketData.message ? ticketData.message + ' ' : '';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setTicketData(prev => ({
              ...prev,
              message: (existingText + finalTranscript).trim()
            }));
            existingText += finalTranscript;
          }
        };

        recognition.onerror = () => {
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
        };

        recognition.start();
        setIsDictating(true);
        showToast('🎙️ Dictating... Speak into your microphone to populate inquiry details.', 'info');
      } catch (err) {
        console.error(err);
        showToast('Microphone access denied or error starting speech recognition.', 'error');
      }
    }
  };

  // Ticket creation state
  const [ticketData, setTicketData] = useState({
    name: '',
    email: '',
    topic: 'Technical MetaTrader Help',
    priority: 'Normal',
    message: ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState<string | null>(null);

  const categories = ['All', 'General Account Setup', 'Deposits & Withdrawals', 'Axi Select & Funding', 'Leverage & Risk Control', 'MetaTrader Platforms'];

  const filteredFaqs = FAQ_ENTRIES.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketData.name || !ticketData.email || !ticketData.message) {
      showToast('Please fill out all required ticket fields.', 'error');
      return;
    }

    setSubmittingTicket(true);
    setTimeout(() => {
      const ticketId = `AXI-SR-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedTicketId(ticketId);
      setSubmittingTicket(false);
      setTicketData({
        name: '',
        email: '',
        topic: 'Technical MetaTrader Help',
        priority: 'Normal',
        message: ''
      });
      showToast(`Support Ticket ${ticketId} created. We will contact you shortly!`, 'success');
    }, 1500);
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 bg-brand-light">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="text-brand-red text-xs font-black tracking-widest uppercase bg-brand-red/5 border border-brand-red/10 px-3.5 py-1.5 rounded-full flex items-center gap-2">
          <LifeBuoy className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow/10" /> HELP DESK CENTER
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-brand-dark dark:text-white tracking-tight uppercase">
          Axi Client Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">
          Get institutional grade support. Access our database of 15 regulatory FAQs, submit secure service tickets, or launch live chat 24 hours a day, 7 days a week.
        </p>
      </div>

      {/* Digital Support Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-brand-red" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Support Email Portal</span>
            <h4 className="text-sm font-black text-brand-dark dark:text-white mt-1">{cmsContent.brand.contactEmail}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-1">
              Average response time: &lt; 2 hours. Submit verification PDFs and API requests here.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-2xl p-6 shadow-lg flex items-start gap-4 cursor-pointer hover:border-brand-red transition duration-200" onClick={() => showToast('Initializing secure Live Chat channel... Agent connection ready.', 'info')}>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-brand-yellow" />
          </div>
          <div className="flex-grow">
            <span className="text-[10px] uppercase font-bold text-brand-yellow tracking-widest">Axi Secure Live Chat</span>
            <h4 className="text-sm font-black text-white mt-1">Launch Instant Messenger</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-normal mt-1 flex items-center gap-1">
              Connect with a live ECN broker agent now <ArrowRight className="w-3 h-3 text-brand-yellow" />
            </p>
          </div>
        </div>
      </div>

      {/* Main FAQs & Search Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FAQs Accordion (Left Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-red" /> Regulatory FAQ Vault ({filteredFaqs.length})
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">Find immediate answers regarding compliance, platforms, and select rules.</p>
              </div>
            </div>

            {/* Inline search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search FAQs by keywords (e.g. leverage, ECN, MT5)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none transition shadow-inner"
              />
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border whitespace-nowrap transition duration-150 cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-brand-red text-white border-brand-red' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Accordion list of FAQs */}
            <div className="flex flex-col gap-3.5">
              {filteredFaqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-150 bg-white">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50"
                    >
                      <span className="text-xs font-black text-slate-850 uppercase leading-snug">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-red' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-slate-100 text-[11px] font-semibold text-slate-500 leading-relaxed bg-slate-50/50">
                            {faq.answer}
                            <div className="text-[9px] text-slate-400 mt-2.5 uppercase font-bold tracking-wider">
                              Category: {faq.category}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center gap-2">
                  <ShieldAlert className="w-8 h-8 text-slate-300 animate-pulse" />
                  <span className="text-slate-600 font-black uppercase text-xs">No matching queries found</span>
                  <p className="text-[10px] text-slate-400 font-semibold">Try submitting a support ticket or launching live chat.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Support Ticket / Email Ticket (Right Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-base font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-yellow fill-brand-yellow/10" /> Raise Secure Support Ticket
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">Submit technical details directly to our compliance and trading floor.</p>
            </div>

            <AnimatePresence mode="wait">
              {!generatedTicketId ? (
                <form onSubmit={handleTicketSubmit} className="flex flex-col gap-4 text-xs font-bold text-slate-650">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={ticketData.name}
                      onChange={(e) => setTicketData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Verified Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. trader@example.com"
                      value={ticketData.email}
                      onChange={(e) => setTicketData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inquiry Topic</label>
                      <select 
                        value={ticketData.topic}
                        onChange={(e) => setTicketData(prev => ({ ...prev, topic: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 focus:border-brand-red rounded-lg p-2.5 text-slate-800 cursor-pointer font-bold focus:outline-none"
                      >
                        <option value="Technical MetaTrader Help">MT4/MT5 Platform</option>
                        <option value="Axi Select Funding Account">Axi Select Incubator</option>
                        <option value="Deposits & Cashier Options">Deposits & Cashier</option>
                        <option value="KYC Verification & AML">KYC & Compliance</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Priority Level</label>
                      <select 
                        value={ticketData.priority}
                        onChange={(e) => setTicketData(prev => ({ ...prev, priority: e.target.value }))}
                        className="bg-slate-50 border border-slate-200 focus:border-brand-red rounded-lg p-2.5 text-slate-800 cursor-pointer font-bold focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High (Urgent)">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inquiry Details *</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleSpeechDictation}
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                            isDictating
                              ? 'bg-red-600 text-white animate-pulse shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {isDictating ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-brand-red" />}
                          {isDictating ? 'Stop Recording' : 'Dictate Speech'}
                        </button>

                        {openVoiceModal && (
                          <button
                            type="button"
                            onClick={openVoiceModal}
                            className="px-2.5 py-1 text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" /> Advanced Voice Studio
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      required
                      rows={4}
                      placeholder={isDictating ? "🎙️ Speaking... Text will populate automatically as you talk!" : "Please specify account ID and precise platform error text or click Dictate Speech..."}
                      value={ticketData.message}
                      onChange={(e) => setTicketData(prev => ({ ...prev, message: e.target.value }))}
                      className={`bg-slate-50 border rounded-lg p-3.5 text-slate-800 focus:outline-none font-semibold leading-relaxed transition-colors ${
                        isDictating ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20' : 'border-slate-200 focus:border-brand-red focus:bg-white'
                      }`}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submittingTicket}
                    className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-brand-red/15 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {submittingTicket ? 'Locking Ticket Credentials...' : 'Submit Support Ticket'}
                  </motion.button>
                </form>
              ) : (
                <motion.div 
                  key="ticket-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center gap-4 py-6"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-7 h-7 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase">Ticket Raised Successfully!</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Our desk coordinator is processing your inquiry vectors.</p>
                  </div>

                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 w-full font-mono text-xs text-left text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">ID Reference</span>
                      <span className="font-extrabold text-brand-red">{generatedTicketId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">Status</span>
                      <span className="font-extrabold text-emerald-600">QUEUED</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setGeneratedTicketId(null)}
                    className="text-xs font-bold text-brand-red underline uppercase hover:text-brand-red-hover mt-2 cursor-pointer"
                  >
                    Submit Another Query
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}
