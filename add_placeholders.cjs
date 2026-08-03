const fs = require('fs');

const placeholders = [
  { id: 'editBot', title: 'Edit Trading Bot', desc: 'Configure active AI trading bots.' },
  { id: 'sendEmail', title: 'Send Email Notification', desc: 'Broadcast emails to users.' },
  { id: 'tradingBotSettings', title: 'Trading Bot Settings', desc: 'Global settings for auto-trading algorithms.' },
  { id: 'investmentPlanSettings', title: 'Investment Plan Settings', desc: 'Manage fixed-return investment tiers.' },
  { id: 'changePassword', title: 'Change Admin Password', desc: 'Update your administrator password.' },
  { id: 'manageTradingPairs', title: 'Manage Trading Pairs', desc: 'Enable or disable tradable assets on the exchange.' },
  { id: 'manageCurrency', title: 'Manage Currency', desc: 'Set primary display currencies and exchange rates.' },
  { id: 'manageCopyTraders', title: 'Manage Copy Traders', desc: 'Approve or remove Master Traders for the copy-trading platform.' }
];

let code = fs.readFileSync('src/components/AdminDashboardView.tsx', 'utf8');

const anchor = "{activeTab === 'manualCredit' && (";
const anchorIdx = code.indexOf(anchor);

if (anchorIdx !== -1) {
  let blocks = placeholders.map(p => `
          {activeTab === '${p.id}' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 items-center justify-center py-20">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🚧</span>
               </div>
               <h2 className="text-xl font-bold text-slate-800">${p.title}</h2>
               <p className="text-slate-500 max-w-md text-center text-sm">${p.desc}</p>
               <p className="text-xs text-slate-400 mt-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">This feature is currently under development.</p>
            </motion.div>
          )}`).join("\n");
          
  code = code.substring(0, anchorIdx) + blocks + "\n          " + code.substring(anchorIdx);
  fs.writeFileSync('src/components/AdminDashboardView.tsx', code);
  console.log("Added placeholders");
}

