import fs from 'node:fs';

const path = 'server.ts';
const source = fs.readFileSync(path, 'utf8');

// The production build now owns PostgreSQL funding persistence. This workflow
// step is deliberately validation-only so it cannot overwrite working routes
// with brittle string transforms.
const requiredRoutes = [
  "/api/admin/funding/pending",
  "/api/admin/funding/:id/credit",
  "/api/admin/funding/:id/reject",
  "/api/admin/payment-methods",
];

for (const route of requiredRoutes) {
  if (!source.includes(route)) throw new Error(`Required production route is missing: ${route}`);
}

if (!source.includes("from './server/postgres'")) {
  throw new Error('PostgreSQL service import is missing from server.ts');
}

console.log('PostgreSQL funding route validation passed.');
