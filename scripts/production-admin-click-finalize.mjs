import fs from 'node:fs';

// Finalize the hidden administrator entry point after all other production
// hardening scripts have modified Header.tsx. The Axi logo remains clickable:
// clicks 1-6 behave normally (home), while click 7 opens the standalone admin
// password gate directly. No Firebase/user login is involved.
const path = 'src/components/Header.tsx';
let header = fs.readFileSync(path, 'utf8');

if (!header.includes('AXI_HIDDEN_ADMIN_TRIGGER_V3')) {
  const state = `  const [userDropdownOpen, setUserDropdownOpen] = useState(false);`;
  if (!header.includes(state)) throw new Error('Header state marker not found');
  const injected = `  // AXI_HIDDEN_ADMIN_TRIGGER_V3\n  const [hiddenAdminClicks,setHiddenAdminClicks]=useState(0);\n  const hiddenAdminTimerRef=React.useRef<ReturnType<typeof setTimeout>|null>(null);\n  const handleHiddenAdminLogoClick=()=>{const next=hiddenAdminClicks+1;if(hiddenAdminTimerRef.current)clearTimeout(hiddenAdminTimerRef.current);if(next>=7){setHiddenAdminClicks(0);handleNav('admin');return;}setHiddenAdminClicks(next);handleNav('home');hiddenAdminTimerRef.current=setTimeout(()=>setHiddenAdminClicks(0),1800);};`;
  header = header.replace(state, state + '\n' + injected);
}

// Ensure the actual logo button is wired to the counter. Replace both the
// original single-click handler and previously injected variants.
header = header.replace(
  /onClick=\{\(\) => handleNav\('home'\)\}\s*/,
  'onClick={handleHiddenAdminLogoClick} '
);
header = header.replace(
  /onClick=\{\(\) => \{ handleHiddenAdminLogoClick\(\); if \(hiddenAdminClicks < 6\) handleNav\('home'\); \}\}\s*/,
  'onClick={handleHiddenAdminLogoClick} '
);
header = header.replace(
  /onClick=\{\(\) => \{ handleHiddenAdminLogoClick\(\); if \(hiddenAdminClicks < 6\) handleNav\('home'\); \}\}\s*/,
  'onClick={handleHiddenAdminLogoClick} '
);

// Remove obsolete intermediate-prompt state/handler if an earlier patch left it.
header = header.replace(`  const [showHiddenAdminPrompt,setShowHiddenAdminPrompt]=useState(false);\n`, '');
header = header.replace(/\n\s*\{showHiddenAdminPrompt && <div className="fixed inset-0 z-\[100\].*?<\/div>\}\n/s, '\n');
header = header.replace(/\n\s*const openHiddenAdmin=\(\)=>\{[^\n]*\};\n/, '\n');

fs.writeFileSync(path, header);
console.log('Hidden Axi logo administrator trigger finalized.');
