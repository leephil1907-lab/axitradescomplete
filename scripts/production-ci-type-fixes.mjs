import fs from 'fs';

const serverPath = 'server.ts';
const server = fs.readFileSync(serverPath, 'utf8');
const serverFrom = "const { paymentIntentId, sessionId } = req.body || {};";
const serverTo = "const { paymentIntentId, sessionId, amount } = req.body || {};";
if (server.includes(serverFrom) && !server.includes(serverTo)) {
  fs.writeFileSync(serverPath, server.replace(serverFrom, serverTo));
} else if (!server.includes(serverTo)) {
  throw new Error('production-ci-type-fixes: Stripe verification request destructuring marker not found');
}

const boundaryPath = 'src/AppErrorBoundary.tsx';
const boundary = fs.readFileSync(boundaryPath, 'utf8');
const boundaryFrom = 'if (!this.state.hasError) return this.props.children;';
const boundaryTo = 'const children = (this as React.Component<Props, State>).props.children;\n    if (!this.state.hasError) return children;';
if (boundary.includes(boundaryFrom)) {
  fs.writeFileSync(boundaryPath, boundary.replace(boundaryFrom, boundaryTo));
} else if (!boundary.includes(boundaryTo)) {
  throw new Error('production-ci-type-fixes: AppErrorBoundary marker not found');
}

console.log('Production CI type fixes applied');
