import React, { useState, useEffect } from 'react';
import { 
  Globe, Edit3, Save, CheckCircle2, RefreshCw, Eye, Sparkles, 
  HelpCircle, Sliders, Type, Layers, Layout, AlertCircle, Laptop, Smartphone
} from 'lucide-react';
import { useSiteCMS } from '../hooks/useSiteCMS';
import { safeStorage } from '../utils/storage';

interface AdminLiveSiteEditorProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AdminLiveSiteEditor({ onShowToast }: AdminLiveSiteEditorProps) {
  const { cmsContent, updateCMS } = useSiteCMS();
  const [activeSectionTab, setActiveSectionTab] = useState<'visual' | 'home' | 'brand' | 'deposit' | 'about'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedElementKey, setSelectedElementKey] = useState<{ section: string; key: string; label: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [liveOverlayEnabled, setLiveOverlayEnabled] = useState<boolean>(() => {
    return safeStorage.getItem('axi_live_editor_overlay_active') === 'true';
  });

  const toggleLiveOverlay = () => {
    const nextVal = !liveOverlayEnabled;
    setLiveOverlayEnabled(nextVal);
    safeStorage.setItem('axi_live_editor_overlay_active', nextVal ? 'true' : 'false');
    window.dispatchEvent(new Event('axi_live_editor_overlay_changed'));
    if (onShowToast) {
      onShowToast(nextVal ? '✏️ Live Visual Click-Editor Overlay ENABLED across the site.' : '🔒 Live Visual Click-Editor Overlay DISABLED.', 'info');
    }
  };

  const handleOpenElementEditor = (section: string, key: string, label: string) => {
    const currentVal = (cmsContent as any)?.[section]?.[key] || '';
    setSelectedElementKey({ section, key, label });
    setEditingValue(currentVal);
  };

  const handleSaveElementEdit = () => {
    if (!selectedElementKey) return;
    updateCMS(selectedElementKey.section, selectedElementKey.key, editingValue);
    if (onShowToast) {
      onShowToast(`✨ Live Content Saved: Updated "${selectedElementKey.label}"`, 'success');
    }
    setSelectedElementKey(null);
  };

  const handleResetSectionDefaults = (sectionName: string) => {
    if (window.confirm(`Reset ${sectionName} copy to original Axi Trade defaults?`)) {
      if (sectionName === 'home') {
        updateCMS('home', 'heroTitle', 'Trade Your Edge');
        updateCMS('home', 'heroSubtitle', 'Global Online CFD & Forex Broker. Experience high-speed execution and precision.');
        updateCMS('home', 'ctaText', 'OPEN A LIVE ACCOUNT');
        updateCMS('home', 'partnershipTitle', 'A winning partnership');
        updateCMS('home', 'partnershipSubtitle', "We're proud to be Official Online Trading Partner of Manchester City Football Club.");
        updateCMS('home', 'preFooterTitle', 'Ready to trade your edge?');
        updateCMS('home', 'preFooterSubtitle', 'Join thousands of traders choosing Axi.');
      } else if (sectionName === 'brand') {
        updateCMS('brand', 'contactEmail', 'service@axi.com');
        updateCMS('brand', 'contactPhone', '+44 203 154 4820');
        updateCMS('brand', 'companyName', 'Axi Financial Services');
        updateCMS('brand', 'footerText', 'Trading CFDs and FX carries a high level of risk.');
      } else if (sectionName === 'deposit') {
        updateCMS('deposit', 'minimumDeposit', '50');
        updateCMS('deposit', 'processingTime', 'Instant - 24 hours');
      } else if (sectionName === 'about') {
        updateCMS('about', 'title', 'About Axi Group');
        updateCMS('about', 'subtitle', 'Axi is a leading global broker authorized in multiple tier-1 jurisdictions. We prioritize client safety, raw spreads, and lightning-fast NY4 server routing.');
      }
      if (onShowToast) onShowToast(`Reset ${sectionName} to default copy.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E3000F] to-rose-700 flex items-center justify-center text-white shadow-md">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Axi Trade Live Content Editor
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE SYNC ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Click any text element in the visual live editor below or select a section to instantly modify headlines, subtext, button labels, and contact copy. Changes broadcast live to all traders without code updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLiveOverlay}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer ${
              liveOverlayEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{liveOverlayEnabled ? 'Overlay Click-Editor: ACTIVE' : 'Enable Overlay Click-Editor'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'visual', label: '🖥️ Visual Live Page Editor', icon: Eye },
            { id: 'home', label: '🏠 Home Hero & CTAs', icon: Layout },
            { id: 'brand', label: '🏷️ Brand & Support Contact', icon: Globe },
            { id: 'deposit', label: '💳 Deposit & Banking Terms', icon: Sliders },
            { id: 'about', label: 'ℹ️ About Axi Section', icon: Layers }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSectionTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeSectionTab === 'visual' && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: VISUAL LIVE CANVAS EDITOR */}
      {activeSectionTab === 'visual' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Interactive Mode:</strong> Hover and click any highlighted block (dashed border) below to edit its exact text in real time!
              </span>
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
              Realtime Canvas
            </span>
          </div>

          <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-md' : 'w-full'}`}>
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-6 text-white overflow-hidden relative">
              
              {/* Hero Section Live Preview */}
              <div className="relative group p-6 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-rose-500 bg-slate-800/50 transition-all cursor-pointer">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-[#E3000F] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit Hero Section
                </div>

                <div 
                  onClick={() => handleOpenElementEditor('home', 'heroTitle', 'Main Hero Title')}
                  className="hover:bg-rose-500/10 p-2 rounded-xl transition"
                >
                  <span className="text-[10px] font-mono text-rose-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] home.heroTitle
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {cmsContent.home?.heroTitle || 'Trade Your Edge'}
                  </h1>
                </div>

                <div 
                  onClick={() => handleOpenElementEditor('home', 'heroSubtitle', 'Hero Subtitle')}
                  className="hover:bg-rose-500/10 p-2 rounded-xl transition mt-3"
                >
                  <span className="text-[10px] font-mono text-rose-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] home.heroSubtitle
                  </span>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                    {cmsContent.home?.heroSubtitle || 'Global Online CFD & Forex Broker.'}
                  </p>
                </div>

                <div 
                  onClick={() => handleOpenElementEditor('home', 'ctaText', 'Main CTA Button')}
                  className="mt-4 inline-block hover:scale-105 transition transform"
                >
                  <span className="text-[10px] font-mono text-rose-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] home.ctaText
                  </span>
                  <div className="bg-[#E3000F] hover:bg-rose-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
                    {cmsContent.home?.ctaText || 'OPEN A LIVE ACCOUNT'}
                  </div>
                </div>
              </div>

              {/* Partnership Banner Live Preview */}
              <div className="relative group p-6 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-950/20 transition-all cursor-pointer">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit Partnership Copy
                </div>

                <div onClick={() => handleOpenElementEditor('home', 'partnershipTitle', 'Partnership Title')}>
                  <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] home.partnershipTitle
                  </span>
                  <h3 className="text-lg font-black text-amber-300">
                    {cmsContent.home?.partnershipTitle || 'A winning partnership'}
                  </h3>
                </div>

                <div onClick={() => handleOpenElementEditor('home', 'partnershipSubtitle', 'Partnership Description')} className="mt-2">
                  <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] home.partnershipSubtitle
                  </span>
                  <p className="text-xs text-amber-100/80">
                    {cmsContent.home?.partnershipSubtitle || "Official Online Trading Partner of Manchester City Football Club."}
                  </p>
                </div>
              </div>

              {/* Brand & Support Bar Live Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => handleOpenElementEditor('brand', 'contactEmail', 'Support Contact Email')}
                  className="p-4 rounded-xl border-2 border-dashed border-blue-500/40 hover:border-blue-500 bg-slate-800/80 transition cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] brand.contactEmail
                  </span>
                  <div className="text-xs text-slate-400">Support Email</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">
                    {cmsContent.brand?.contactEmail || 'service@axi.com'}
                  </div>
                </div>

                <div 
                  onClick={() => handleOpenElementEditor('brand', 'contactPhone', 'Support Phone Number')}
                  className="p-4 rounded-xl border-2 border-dashed border-blue-500/40 hover:border-blue-500 bg-slate-800/80 transition cursor-pointer"
                >
                  <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] brand.contactPhone
                  </span>
                  <div className="text-xs text-slate-400">Direct Hotline</div>
                  <div className="text-sm font-black text-white font-mono mt-0.5">
                    {cmsContent.brand?.contactPhone || '+44 203 154 4820'}
                  </div>
                </div>
              </div>

              {/* Deposit Limits Live Preview */}
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-950/20 transition cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => handleOpenElementEditor('deposit', 'minimumDeposit', 'Minimum Deposit ($)')}>
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] deposit.minimumDeposit
                  </span>
                  <div className="text-xs text-slate-400">Minimum Account Deposit</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                    ${cmsContent.deposit?.minimumDeposit || '50'} USD
                  </div>
                </div>

                <div onClick={() => handleOpenElementEditor('deposit', 'processingTime', 'Deposit Processing Time')}>
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest block mb-1">
                    [Click to Edit] deposit.processingTime
                  </span>
                  <div className="text-xs text-slate-400">Processing Turnaround</div>
                  <div className="text-sm font-black text-white mt-0.5">
                    {cmsContent.deposit?.processingTime || 'Instant - 24 hours'}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOME HERO & CTAs */}
      {activeSectionTab === 'home' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#E3000F]" /> Home Page Headlines & CTAs
            </h3>
            <button
              onClick={() => handleResetSectionDefaults('home')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Home Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Hero Title</label>
              <input
                type="text"
                value={cmsContent.home?.heroTitle || ''}
                onChange={e => updateCMS('home', 'heroTitle', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Hero CTA Button Text</label>
              <input
                type="text"
                value={cmsContent.home?.ctaText || ''}
                onChange={e => updateCMS('home', 'ctaText', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Hero Subtitle</label>
              <textarea
                value={cmsContent.home?.heroSubtitle || ''}
                onChange={e => updateCMS('home', 'heroSubtitle', e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Partnership Banner Title</label>
              <input
                type="text"
                value={cmsContent.home?.partnershipTitle || ''}
                onChange={e => updateCMS('home', 'partnershipTitle', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Partnership Banner Subtitle</label>
              <input
                type="text"
                value={cmsContent.home?.partnershipSubtitle || ''}
                onChange={e => updateCMS('home', 'partnershipSubtitle', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Pre-Footer Section Title</label>
              <input
                type="text"
                value={cmsContent.home?.preFooterTitle || ''}
                onChange={e => updateCMS('home', 'preFooterTitle', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Pre-Footer Section Subtitle</label>
              <input
                type="text"
                value={cmsContent.home?.preFooterSubtitle || ''}
                onChange={e => updateCMS('home', 'preFooterSubtitle', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRAND & SUPPORT CONTACT */}
      {activeSectionTab === 'brand' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> Brand & Support Contact Details
            </h3>
            <button
              onClick={() => handleResetSectionDefaults('brand')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Brand Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={cmsContent.brand?.companyName || ''}
                onChange={e => updateCMS('brand', 'companyName', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Customer Support Email</label>
              <input
                type="text"
                value={cmsContent.brand?.contactEmail || ''}
                onChange={e => updateCMS('brand', 'contactEmail', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Global Support Phone Hotline</label>
              <input
                type="text"
                value={cmsContent.brand?.contactPhone || ''}
                onChange={e => updateCMS('brand', 'contactPhone', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:border-[#E3000F] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Footer Risk Warning Text</label>
              <textarea
                value={cmsContent.brand?.footerText || ''}
                onChange={e => updateCMS('brand', 'footerText', e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPOSIT & BANKING TERMS */}
      {activeSectionTab === 'deposit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" /> Minimum Deposit & Turnaround Terms
            </h3>
            <button
              onClick={() => handleResetSectionDefaults('deposit')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Deposit Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Minimum Deposit Amount ($ USD)</label>
              <input
                type="text"
                value={cmsContent.deposit?.minimumDeposit || ''}
                onChange={e => updateCMS('deposit', 'minimumDeposit', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Processing Time Statement</label>
              <input
                type="text"
                value={cmsContent.deposit?.processingTime || ''}
                onChange={e => updateCMS('deposit', 'processingTime', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ABOUT AXI SECTION */}
      {activeSectionTab === 'about' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> About Axi Page Content
            </h3>
            <button
              onClick={() => handleResetSectionDefaults('about')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset About Defaults
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">About Section Main Title</label>
              <input
                type="text"
                value={cmsContent.about?.title || ''}
                onChange={e => updateCMS('about', 'title', e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">About Description Copy</label>
              <textarea
                value={cmsContent.about?.subtitle || ''}
                onChange={e => updateCMS('about', 'subtitle', e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL FOR ELEMENT QUICK-EDIT */}
      {selectedElementKey && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E3000F] text-white flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Edit Text Field</h4>
                  <p className="text-[10px] font-mono text-slate-500">{selectedElementKey.section}.{selectedElementKey.key}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedElementKey(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                {selectedElementKey.label}
              </label>
              {editingValue.length > 80 ? (
                <textarea
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-2xl p-3 text-sm text-slate-900 focus:border-[#E3000F] outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold focus:border-[#E3000F] outline-none"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedElementKey(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveElementEdit}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#E3000F] hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
