import { useSiteCMS } from '../hooks/useSiteCMS';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  Mail, 
  Send, 
  Cpu, 
  Users, 
  PhoneCall, 
  Globe2, 
  MessageSquare,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { SupportMessage } from '../types';
import { REGULATIONS } from '../data';

interface AboutViewProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AboutView({ showToast }: AboutViewProps) {
  const { cmsContent } = useSiteCMS();
  // Support Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([
    {
      sender: 'assistant',
      text: "Welcome to the Axi Help Desk. I am your search-grounded AI Trading Assistant. Ask me anything about Axi regulations, client fund safety, account parameters, or live financial trends!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Submit contact form
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) {
      showToast('Please complete all contact ticket details.', 'error');
      return;
    }
    setSubmittingForm(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, email: contactEmail, message: contactMsg })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        setContactName('');
        setContactEmail('');
        setContactMsg('');
      }
    } catch (err) {
      showToast('Could not register support ticket right now.', 'error');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Chat message submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || assistantLoading) return;

    const userText = chatInput;
    setChatInput('');
    setAssistantLoading(true);

    const updatedMessages = [
      ...chatMessages,
      { sender: 'user' as const, text: userText, timestamp: new Date().toLocaleTimeString() }
    ];
    setChatMessages(updatedMessages);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await response.json();
      
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant' as const,
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
          sources: data.sources
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'assistant' as const,
          text: "I couldn't reach the live AI server right now, but please note that Axi standard accounts offer zero commissions, FCA/ASIC security, and 24/5 support. Let me know if you would like me to assist you with opening a live trading account!",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12 bg-brand-light">
      
      {/* Intro Header */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="text-brand-red text-xs font-black tracking-widest uppercase bg-brand-red/5 border border-brand-red/10 px-3.5 py-1.5 rounded-full">
          Corporate Identity & Compliance
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-brand-dark tracking-tight animate-fade-in">
          {cmsContent.about?.title || 'About Axi Group'}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          {cmsContent.about?.subtitle || 'Axi is a leading global broker authorized in multiple tier-1 jurisdictions.'}
        </p>
      </div>

      {/* Global Regulation Grid - Redesigned cleanly */}
      <section className="flex flex-col gap-6">
        <div className="border-b border-slate-200 pb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-red" />
          <h2 className="text-lg font-black text-brand-dark uppercase tracking-wider">Regulatory Licenses & Compliance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REGULATIONS.map((reg) => (
            <div 
              key={reg.entity}
              className="bg-white border border-slate-200 hover:border-brand-red/30 transition-all duration-150 p-5 rounded-2xl flex flex-col gap-3 justify-between shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-mono font-black text-brand-red bg-brand-red/5 px-2.5 py-1 rounded border border-brand-red/10 self-start">
                  {reg.jurisdiction}
                </span>
                <h3 className="text-sm font-black text-brand-dark mt-2">{reg.entity}</h3>
                <p className="text-[11px] text-slate-400 font-bold">{reg.authority} | License: {reg.license}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-semibold">
                {reg.details}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive AI Assistant & Support Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-t border-slate-200 pt-10">
        
        {/* Left Column: AI Assistant (Col span 7) - Redesigned as clean, responsive light module */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          
          {/* Support Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-red/5 flex items-center justify-center border border-brand-red/10 text-brand-red shadow-sm">
                <Cpu className="w-4 h-4 text-brand-red" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-brand-dark tracking-wider">Axi AI Assistant</h4>
                <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span> Live Search Grounded
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setChatMessages([
                  {
                    sender: 'assistant',
                    text: "Chat database reset. Ask me anything about Axi spreads, FCA licenses, or live market updates!",
                    timestamp: new Date().toLocaleTimeString()
                  }
                ]);
              }}
              className="text-[10px] font-black text-slate-400 hover:text-brand-red flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCcw className="w-3 h-3 text-brand-red" /> Clear Logs
            </motion.button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-xs font-semibold text-slate-650 bg-slate-50/40">
            {chatMessages.map((msg, idx) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div 
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    isAssistant ? 'self-start items-start' : 'self-end items-end'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-mono font-bold mb-1">{msg.timestamp}</span>
                  <div className={`p-3.5 rounded-xl border leading-relaxed shadow-sm ${
                    isAssistant 
                      ? 'bg-white border-slate-200 rounded-tl-none text-slate-700' 
                      : 'bg-brand-red/5 border-brand-red/10 rounded-tr-none text-slate-800'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Grounding Source citations if available */}
                    {isAssistant && msg.sources && msg.sources.length > 0 && (
                      <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex flex-col gap-1.5 text-[9px] text-slate-400 font-mono font-bold">
                        <span className="font-extrabold text-brand-red uppercase tracking-wider text-[8px]">Live Sources Consulted:</span>
                        {msg.sources.slice(0, 3).map((source, sIdx) => (
                          <a 
                            key={sIdx}
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-brand-red hover:underline flex items-center gap-0.5 truncate max-w-full"
                          >
                            <Globe2 className="w-3 h-3 shrink-0 text-brand-red" /> {source.title.substring(0, 45)}...
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {assistantLoading && (
              <div className="self-start flex items-center gap-2 text-[10px] text-slate-400 font-bold pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-red" />
                Axi Assistant is searching live databases...
              </div>
            )}
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleChatSubmit} className="bg-white border-t border-slate-200 p-2.5 flex gap-2">
            <input
              type="text"
              placeholder="Ask Axi AI (e.g., 'What is standard vs pro spreads?')..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3 py-2.5 text-xs focus:outline-none text-slate-800 font-semibold shadow-inner"
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!chatInput.trim() || assistantLoading}
              className="bg-brand-red hover:bg-brand-red-hover disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 rounded-lg transition shrink-0 shadow-sm cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4 text-brand-yellow stroke-[3]" />
            </motion.button>
          </form>

        </div>

        {/* Right Column: Contact ticket Desk (Col span 5) - Clean white container with Red/Yellow CTA elements */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-black text-brand-dark uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-red" /> Open Support Ticket
              </h3>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">Have custom partnership inquiries, API queries, or wholesale deposit questions? Drop a ticket below.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-3.5 text-xs font-bold text-slate-600">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Full name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Smith"
                  className="bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none font-semibold transition shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email address</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. s.smith@example.com"
                  className="bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none font-semibold transition shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description message</label>
                <textarea
                  rows={4}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Describe your inquiry details..."
                  className="bg-slate-50 border border-slate-200 focus:border-brand-red focus:bg-white rounded-lg px-3.5 py-2.5 text-slate-800 focus:outline-none font-semibold transition resize-none leading-relaxed shadow-sm"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submittingForm}
                className="w-full py-3.5 bg-brand-red hover:bg-brand-red-hover text-white font-black uppercase text-xs rounded-xl transition shadow-lg shadow-brand-red/10 cursor-pointer mt-1.5"
              >
                {submittingForm ? 'Filing ticket...' : 'Submit Support Ticket'}
              </motion.button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-5 flex flex-col gap-2.5 text-[10px] text-slate-500 font-mono font-bold">
            <span className="font-extrabold text-brand-dark uppercase text-[9px] tracking-wider">Alternative Contacts:</span>
            <div className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-brand-red shrink-0" /> Phone: +44 203 123 4567</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-red shrink-0" /> Email: support@axi.com</div>
          </div>
        </div>

      </section>

    </div>
  );
}
