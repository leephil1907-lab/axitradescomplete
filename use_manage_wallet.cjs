const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboardView.tsx', 'utf8');

if (!code.includes('import AdminManageWallet')) {
  code = code.replace(
    "import EmailNotificationModal",
    "import AdminManageWallet from './AdminManageWallet';\nimport EmailNotificationModal"
  );
}

const oldWalletCode = `          {activeTab === 'walletSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">`;

const newWalletCode = `          {activeTab === 'walletSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminManageWallet />
            </motion.div>
          )}
          {/* Old wallet settings disabled/removed:`;

// We need to just find {activeTab === 'walletSettings' && ( and replace its body, or replace the whole block until the next activeTab.
// A regex might be risky. Let's just do a string replacement of the activeTab === 'walletSettings' section.

const startWallet = code.indexOf("{activeTab === 'walletSettings' && (");
const endWallet = code.indexOf("{activeTab === 'siteCMS' && (");

if (startWallet !== -1 && endWallet !== -1) {
   const before = code.substring(0, startWallet);
   const after = code.substring(endWallet);
   
   const newWalletSection = `{activeTab === 'walletSettings' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <AdminManageWallet />
            </motion.div>
          )}\n          `;
          
   code = before + newWalletSection + after;
   fs.writeFileSync('src/components/AdminDashboardView.tsx', code);
   console.log('Successfully injected AdminManageWallet');
} else {
   console.log('Could not find walletSettings or siteCMS boundaries');
}

