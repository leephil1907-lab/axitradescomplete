import fs from 'node:fs';

const path = 'src/components/AdminDashboardView.tsx';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  {
    label: 'new-client defaults',
    from: "const [newClientInitialBalance, setNewClientInitialBalance] = useState('1000');\n  const [newClientStatus, setNewClientStatus] = useState('Verified');",
    to: "const [newClientInitialBalance, setNewClientInitialBalance] = useState('');\n  const [newClientStatus, setNewClientStatus] = useState('Pending Verification');"
  },
  {
    label: 'smtp demo defaults',
    from: "  const [smtpConfig, setSmtpConfig] = useState({\n    host: 'smtp.gmail.com',\n    port: '465',\n    user: 'axicustomersupport@gmail.com',\n    pass: '',\n    fromName: 'Axi Trades Official',\n    fromEmail: 'axicustomersupport@gmail.com',\n    isConfigured: false\n  });\n  const [testEmailRecipient, setTestEmailRecipient] = useState('axicustomersupport@gmail.com');",
    to: "  const [smtpConfig, setSmtpConfig] = useState({\n    host: '',\n    port: '',\n    user: '',\n    pass: '',\n    fromName: 'AXITRADES',\n    fromEmail: '',\n    isConfigured: false\n  });\n  const [testEmailRecipient, setTestEmailRecipient] = useState('');"
  },
  {
    label: 'email sample content',
    from: "  const [emailSubject, setEmailSubject] = useState('Important Account Notice from Axi Administration');\n  const [emailType, setEmailType] = useState('Custom');\n  const [emailBody, setEmailBody] = useState('Dear Valued Trader,\\n\\nPlease be advised that our market execution servers and liquidity routes have been optimized for higher execution speeds.\\n\\nBest regards,\\nAxi Support Team');",
    to: "  const [emailSubject, setEmailSubject] = useState('');\n  const [emailType, setEmailType] = useState('Custom');\n  const [emailBody, setEmailBody] = useState('');"
  },
  {
    label: 'bot defaults',
    from: "    return {\n      active: true,\n      name: 'Axi Neural Quant Bot v4',\n      strategy: 'High Frequency Arbitrage',\n      frequency: '15 seconds',\n      maxAllocationUsd: 25000,\n      winRateSim: 88.5,\n      monthlyTargetYield: 18.4,\n      riskLevel: 'Moderate'\n    };",
    to: "    return {\n      active: false,\n      name: '',\n      strategy: '',\n      frequency: '',\n      maxAllocationUsd: 0,\n      winRateSim: null,\n      monthlyTargetYield: null,\n      riskLevel: ''\n    };"
  },
  {
    label: 'trading bot defaults',
    from: "    return {\n      automatedTradingEnabled: true,\n      maxBotLeverage: '1:500',\n      circuitBreakerEnabled: true,\n      circuitBreakerThreshold: 15\n    };",
    to: "    return {\n      automatedTradingEnabled: false,\n      maxBotLeverage: '',\n      circuitBreakerEnabled: true,\n      circuitBreakerThreshold: 0\n    };"
  },
  {
    label: 'investment plan samples',
    from: "    return [\n      { id: 'plan-1', name: 'Starter Alpha Plan', minDeposit: 500, maxDeposit: 5000, dailyRoi: 1.8, durationDays: 14, active: true },\n      { id: 'plan-2', name: 'Pro Growth Quant Plan', minDeposit: 5000, maxDeposit: 25000, dailyRoi: 2.5, durationDays: 30, active: true },\n      { id: 'plan-3', name: 'Institutional Prime Plan', minDeposit: 25000, maxDeposit: 250000, dailyRoi: 3.4, durationDays: 60, active: true }\n    ];",
    to: "    return [];"
  },
  {
    label: 'trading pair samples',
    from: "    return [\n      { id: 'p1', symbol: 'EURUSD', category: 'Forex Major', spreadPips: 0.2, leverage: '1:500', active: true },\n      { id: 'p2', symbol: 'GBPUSD', category: 'Forex Major', spreadPips: 0.4, leverage: '1:500', active: true },\n      { id: 'p3', symbol: 'BTCUSD', category: 'Crypto', spreadPips: 12.0, leverage: '1:100', active: true },\n      { id: 'p4', symbol: 'ETHUSD', category: 'Crypto', spreadPips: 1.5, leverage: '1:100', active: true },\n      { id: 'p5', symbol: 'XAUUSD', category: 'Commodities', spreadPips: 0.15, leverage: '1:500', active: true },\n      { id: 'p6', symbol: 'NVDA', category: 'US Stocks', spreadPips: 0.05, leverage: '1:20', active: true }\n    ];",
    to: "    return [];"
  }
];

for (const item of replacements) {
  if (!source.includes(item.from)) throw new Error(`Expected ${item.label} block was not found`);
  source = source.replace(item.from, item.to);
}

fs.writeFileSync(path, source);
console.log(`Applied ${replacements.length} production hardening changes to ${path}`);
