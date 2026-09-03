import fs from 'node:fs';

// Production-safe build step.
// Admin authentication and funding controls are wired by their dedicated build
// steps. This script intentionally avoids source-code string injection because
// multiline JSX injection made the previous build brittle and caused Node
// SyntaxErrors during Railway builds.
const requiredFiles = [
  'src/components/AdminDashboardView.tsx',
  'src/components/FundsView.tsx',
  'src/components/QuickDepositModal.tsx',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Required production file is missing: ${file}`);
  }
}

console.log('Production funding UI validation passed.');
