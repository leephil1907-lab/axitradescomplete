const fs = require('fs');

let code = fs.readFileSync('src/components/AdminDashboardView.tsx', 'utf8');

const returnRegex = /return \(\s*<div className="bg-\[#f8f7f5\] min-h-screen pb-20">([\s\S]*?)<div className="bg-white rounded-b-xl shadow-sm p-6 border border-t-0 border-slate-200">/;

const match = code.match(returnRegex);

if (match) {
  const newLayout = `return (
    <div className="flex h-screen overflow-hidden bg-[#ecf0f5]">
      {/* Sidebar */}
      <div className="w-64 bg-[#222d32] text-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 flex items-center justify-center border-b border-[#1a2226]">
          <h1 className="text-xl font-bold tracking-wider text-[#FF9800]">
            <span className="text-white">Axi</span>Admin
          </h1>
        </div>
        
        {/* User Profile */}
        <div className="p-4 flex items-center gap-3 border-b border-[#1a2226]">
          <div className="w-10 h-10 rounded-full bg-slate-500 overflow-hidden flex items-center justify-center text-xl">
             <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Online
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 py-2 flex flex-col">
          {[
            { id: 'overview', label: 'Dashboard', icon: BarChart4 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'adminReview', label: 'Identity Verification', icon: ShieldCheck },
            { id: 'deposits', label: 'Deposits', icon: Activity },
            { id: 'manualCredit', label: 'Manual Credit', icon: DollarSign },
            { id: 'liveChat', label: 'Live Chat Support', icon: Headset },
            { id: 'walletSettings', label: 'Payment Settings', icon: Lock },
            { id: 'siteCMS', label: 'Site Content', icon: Globe },
            { id: 'auditLogs', label: 'Audit Logs', icon: FileText }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={\`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors \${isActive ? 'bg-[#1e282c] border-l-4 border-[#FF9800] text-white' : 'text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent'}\`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          
          <button
            onClick={() => setView('home')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#b8c7ce] hover:bg-[#1e282c] hover:text-white border-l-4 border-transparent transition-colors mt-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#FF9800] flex items-center justify-between px-4 shrink-0 shadow">
          <button className="text-white hover:bg-orange-600 p-2 rounded transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-orange-400 overflow-hidden flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#ecf0f5]">
          
          {/* Breadcrumb */}
          <div className="bg-white rounded shadow-sm px-4 py-3 mb-6 flex items-center text-sm text-slate-600">
             <span className="font-bold flex items-center gap-2">
               <Globe className="w-4 h-4" /> Home
             </span>
             <span className="mx-2">&gt;</span>
             <span className="capitalize">{activeTab.replace(/([A-Z])/g, ' $1').trim()}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200">`;

  code = code.replace(returnRegex, newLayout);
  
  // Replace the closing div tags at the very end
  // The original has:
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  
  const endRegex = /\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}\s*$/;
  const newEnd = `
          </div>
        </main>
      </div>
    </div>
  );
}`;
  code = code.replace(endRegex, newEnd);
  
  // Make sure we import Lock if not imported (we did it earlier, but let's check)
  if(!code.includes("Lock")) {
      code = code.replace("import { Users, ", "import { Lock, Users, ");
  }

  fs.writeFileSync('src/components/AdminDashboardView.tsx', code);
  console.log('Successfully updated layout of AdminDashboardView');
} else {
  console.log('Could not match return regex.');
}

