const fs = require('fs');

let code = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

const trustpilotBlock = `      {/* TRUSTPILOT RIBBON */}
      <div className="bg-[#1C1C1C] py-2 w-full overflow-hidden flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">Trustpilot</span>
          <div className="flex gap-1">
            <span className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white font-bold rounded-sm">★</span>
            <span className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white font-bold rounded-sm">★</span>
            <span className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white font-bold rounded-sm">★</span>
            <span className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white font-bold rounded-sm">★</span>
            <span className="w-6 h-6 bg-emerald-500 flex items-center justify-center text-white font-bold rounded-sm">★</span>
          </div>
        </div>
      </div>`;

if (code.includes(trustpilotBlock)) {
  code = code.replace(trustpilotBlock, '');
  fs.writeFileSync('src/components/HomeView.tsx', code);
  console.log('Removed Trustpilot ribbon from HomeView.tsx');
} else {
  console.log('Trustpilot block not found exactly as written.');
}
