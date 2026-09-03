import fs from 'node:fs';

const path = 'server.ts';
let s = fs.readFileSync(path, 'utf8');

const importAnchor = "import { requireAdmin } from './server/adminAuth';";
const operationalImport = "import { initOperationalPostgres, postgresOperationalRoutes } from './server/postgresOperational';";
if (!s.includes(operationalImport)) {
  s = s.includes(importAnchor) ? s.replace(importAnchor, `${importAnchor}\n${operationalImport}`) : `${operationalImport}\n${s}`;
}

const marker = "// General Express JSON middleware for all other API routes\napp.use(express.json());";
if (!s.includes('POSTGRES_OPERATIONAL_ROUTES_MARKER')) {
  if (!s.includes(marker)) throw new Error('Express JSON middleware marker not found');
  const block = `${marker}\n\n// POSTGRES_OPERATIONAL_ROUTES_MARKER\n// Production operational records are persisted in PostgreSQL. These routes are\n// registered before the legacy file-backed handlers so production never silently\n// falls back to ephemeral/local JSON for KYC and transaction records.\ninitOperationalPostgres().catch((error) => console.error('Operational PostgreSQL initialization failed:', error));\npostgresOperationalRoutes(app);`;
  s = s.replace(marker, block);
}

fs.writeFileSync(path, s);
console.log('PostgreSQL operational persistence wiring applied.');
