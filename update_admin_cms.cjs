const fs = require('fs');

let adminCode = fs.readFileSync('src/components/AdminDashboardView.tsx', 'utf8');

// Add Site Content tab
adminCode = adminCode.replace(
  "| 'walletSettings'>('adminReview');",
  "| 'walletSettings' | 'siteCMS'>('adminReview');"
);

// Import useSiteCMS
if (!adminCode.includes('useSiteCMS')) {
  adminCode = "import { useSiteCMS } from '../hooks/useSiteCMS';\n" + adminCode;
}

// Hook usage inside AdminDashboardView
adminCode = adminCode.replace(
  "  const { updateWalletSettings } = useWalletSettings();", // wait this might not exist
  ""
);
// I will just add it below `const [activeTab, setActiveTab]`
adminCode = adminCode.replace(
  "const [activeTab, setActiveTab] = useState",
  "const { cmsContent, updateCMS } = useSiteCMS();\n  const [activeTab, setActiveTab] = useState"
);


const cmsTabButtonCode = `          <button 
            onClick={() => setActiveTab('siteCMS')}
            className={\`flex-1 py-4 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition whitespace-nowrap flex items-center justify-center gap-2 \${activeTab === 'siteCMS' ? 'bg-slate-50 text-[#E3000F] border-b-2 border-[#E3000F]' : 'text-slate-500 hover:bg-slate-50'}\`}
          >
            <Globe className="w-4 h-4 text-slate-700" />
            <span>Site Content</span>
          </button>`;

adminCode = adminCode.replace(
  `          <button \n            onClick={() => setActiveTab('manualCredit')}`,
  `${cmsTabButtonCode}\n          <button \n            onClick={() => setActiveTab('manualCredit')}`
);

const cmsPanelViewCode = `
          {/* SITE CONTENT CMS TAB */}
          {activeTab === 'siteCMS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-slate-800" /> Global Website Content (CMS)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Change text and copy across the entire website from this dashboard. Changes save instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Page Edit */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    🏠 Home Page Content
                  </h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Title</label>
                    <input
                      type="text"
                      value={cmsContent.home.heroTitle}
                      onChange={(e) => updateCMS('home', 'heroTitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Subtitle</label>
                    <textarea
                      value={cmsContent.home.heroSubtitle}
                      onChange={(e) => updateCMS('home', 'heroSubtitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Call-to-action Button</label>
                    <input
                      type="text"
                      value={cmsContent.home.ctaText}
                      onChange={(e) => updateCMS('home', 'ctaText', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Partnership Title</label>
                    <input
                      type="text"
                      value={cmsContent.home.partnershipTitle}
                      onChange={(e) => updateCMS('home', 'partnershipTitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Partnership Subtitle</label>
                    <textarea
                      value={cmsContent.home.partnershipSubtitle}
                      onChange={(e) => updateCMS('home', 'partnershipSubtitle', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                </div>

                {/* Brand / Global Edit */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    🏢 Brand & Global Info
                  </h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Company Name</label>
                    <input
                      type="text"
                      value={cmsContent.brand.companyName}
                      onChange={(e) => updateCMS('brand', 'companyName', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Support Email</label>
                    <input
                      type="text"
                      value={cmsContent.brand.contactEmail}
                      onChange={(e) => updateCMS('brand', 'contactEmail', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Support Phone</label>
                    <input
                      type="text"
                      value={cmsContent.brand.contactPhone}
                      onChange={(e) => updateCMS('brand', 'contactPhone', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Footer Disclosure</label>
                    <textarea
                      value={cmsContent.brand.footerText}
                      onChange={(e) => updateCMS('brand', 'footerText', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-[#E3000F] outline-none min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
`;

adminCode = adminCode.replace(
  "{/* LIVE CHAT DESK TAB */}",
  cmsPanelViewCode + "\n          {/* LIVE CHAT DESK TAB */}"
);

// If Globe icon isn't imported, import it
if (!adminCode.includes("Globe,")) {
  adminCode = adminCode.replace("import { ", "import { Globe, ");
}

fs.writeFileSync('src/components/AdminDashboardView.tsx', adminCode);
console.log('Updated AdminDashboardView.tsx with Site Content tab');
