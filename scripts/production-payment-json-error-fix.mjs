import fs from 'node:fs';

const files = [
  'src/components/AdminPaymentMethods.tsx',
  'src/components/FundsView.tsx',
];

const helper = `\nasync function readApiJson(response: Response) {\n  const text = await response.text();\n  let data: any = null;\n  try { data = text ? JSON.parse(text) : null; } catch {\n    const preview = text.replace(/\\s+/g, ' ').trim().slice(0, 180);\n    throw new Error(\`Payment API returned an invalid response (HTTP \${response.status})\${preview ? ': ' + preview : '.'}\`);\n  }\n  if (!data || typeof data !== 'object') {\n    throw new Error(\`Payment API returned an unexpected response (HTTP \${response.status}).\`);\n  }\n  return data;\n}\n`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  if (!source.includes('async function readApiJson(response: Response)')) {
    const marker = "import React";
    const markerIndex = source.indexOf(marker);
    const lineEnd = markerIndex >= 0 ? source.indexOf('\n', markerIndex) : -1;
    if (lineEnd >= 0) source = source.slice(0, lineEnd + 1) + helper + source.slice(lineEnd + 1);
    else source = helper + source;
  }
  source = source.replace(/await res\.json\(\)/g, 'await readApiJson(res)');
  source = source.replace(/await response\.json\(\)/g, 'await readApiJson(response)');
  fs.writeFileSync(file, source);
}

console.log('Payment API JSON error handling fixed.');
