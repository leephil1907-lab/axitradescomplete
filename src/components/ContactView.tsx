import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Phone, MapPin, Globe, Clock, ShieldCheck, ArrowRight, Send, X,
  CheckCircle2, Linkedin, Twitter, Instagram, Facebook
} from 'lucide-react';
import { ViewType } from '../types';
import TrustpilotWidget from './TrustpilotWidget';

export default function ContactView({ setView }: { setView: (view: ViewType) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Hero */}
        <div className="bg-gradient-to-r from-[#F7931A] to-[#E8B93A] rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#F7931A]" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Contact Axi</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">We're Here to Help</h1>
            <p className="text-lg text-orange-100 max-w-xl">
              Whether you need help with your account, have a question about trading, or want to speak with our
              client services team, we're available 24/7 across multiple channels.
            </p>
          </div>
        </div>

        {/* Contact Form + Office Info */}
        <div className="grid gap-8 lg:grid-cols-4">

          {/* Left: Contact Form */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
            >
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl mb-2">Message Sent Successfully</h3>
                  <p className="text-slate-600">
                    Thank you for contacting Axi. Our client services team has received your message and will respond
                    within 1-2 business days. You can also reach us anytime via live chat or phone.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-xs font-black text-[#F7931A] hover:text-orange-600 transition"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Smith"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="account">Account Verification</option>
                      <option value="deposit">Deposit &amp; Withdrawal</option>
                      <option value="trading">Trading Platform</option>
                      <option value="technical">Technical Support</option>
                      <option value="partners">Partnerships &amp; IB Program</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      placeholder="How can we help you today?"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-[#F7931A] focus:ring-2 focus:ring-[#F7931A]/20 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl text-lg font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                      submitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-[#F7931A] text-white shadow-lg hover:bg-[#E89B2F] hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Send className="w-5 h-5 animate-spin mr-2" /> Sending…
                        </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" /> Send Message
                        </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Right: Contact Methods */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
              <h3 className="font-black text-slate-900 text-lg mb-6">Contact Methods</h3>
              <div className="space-y-5">
                {[
                  {
                    icon: Mail,
                    title: 'Email Support',
                    value: 'axicustomersupport@gmail.com',
                    desc: '24/7 response within 2 hours'
                  },
                  {
                    icon: Phone,
                    title: 'Client Services',
                    value: '+1 (800) 245-2943',
                    desc: 'Multilingual phone support'
                  },
                  {
                    icon: Globe,
                    title: 'Live Chat',
                    value: 'Available on portal',
                    desc: 'Instant messaging with agents'
                  },
                  {
                    icon: Clock,
                    title: 'Hours of Operation',
                    value: '24/7',
                    desc: 'Every day, including weekends'
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-[#F7931A]/30 transition cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg ${item.title === 'Live Chat' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#F7931A]/10 text-[#F7931A]'} flex items-center justify-center shrink-0`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-xs font-mono text-slate-600">{item.value}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-black text-slate-900 text-lg mb-4">Regulatory</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Axi Financial Services Pty Ltd is regulated by FCA, ASIC, DFSA &amp; FSA. Client funds are held in
                segregated Tier-1 bank accounts.
              </p>
              <div className="flex flex-wrap gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-500" title="Regulated" />
                <Globe className="w-6 h-6 text-slate-400" title="Global" />
              </div>
            </div>
          </div>

        </div>

        {/* Social & Trust */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <TrustpilotWidget />
        </div>

        {/* Office Locations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="font-black text-slate-900 text-xl mb-6">Global Offices</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { city: 'London, UK', country: 'United Kingdom', region: 'EMEA Headquarters' },
              { city: 'Sydney, Australia', country: 'Australia', region: 'APAC Headquarters' },
              { city: 'Dubai, UAE', country: 'United Arab Emirates', region: 'MENA Headquarters' },
            ].map((office, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-5 hover:border-[#F7931A]/30 transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="font-black text-slate-900 text-sm">{office.city}</div>
                </div>
                <div className="text-xs text-slate-500">{office.country}</div>
                <div className="text-[10px] text-[#F7931A] font-black mt-1 uppercase">{office.region}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
