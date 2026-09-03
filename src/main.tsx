import React from 'react';
import { createRoot } from 'react-dom/client';
import AppErrorBoundary from './AppErrorBoundary';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('AXI application root element was not found.');
}

// Keep third-party iframe/script noise from replacing the application with a blank page.
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('contentWindow') ||
    message.includes('Script error') ||
    message.includes('Cannot listen to the event from the provided iframe')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason || '');
  if (
    message.includes('contentWindow') ||
    message.includes('Script error') ||
    message.includes('Cannot listen to the event from the provided iframe')
  ) {
    event.preventDefault();
  }
});

// Render a visible boot screen before loading the large application bundle.
// This also catches module-evaluation failures that React ErrorBoundary cannot catch.
const bootRoot = createRoot(root);
bootRoot.render(
  <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
    <section style={{ textAlign: 'center', padding: 32 }} aria-live="polite">
      <div style={{ margin: '0 auto 16px', width: 48, height: 48, borderRadius: 12, background: '#E3000F', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 24 }}>A</div>
      <strong style={{ display: 'block', fontSize: 20 }}>Axi Trades</strong>
      <span style={{ display: 'block', marginTop: 8, color: '#64748b' }}>Loading trading platform…</span>
    </section>
  </main>,
);

void import('./App.tsx')
  .then(({ default: App }) => {
    bootRoot.render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>,
    );
  })
  .catch((error) => {
    console.error('[AXI] Frontend module boot failure', error);
    const message = error instanceof Error ? error.message : String(error || 'Unknown startup error');
    bootRoot.render(
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff', color: '#111827', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <section style={{ width: '100%', maxWidth: 560, border: '1px solid #e2e8f0', borderRadius: 16, padding: 28, boxShadow: '0 12px 40px rgba(15,23,42,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E3000F', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900 }}>A</div>
            <div><strong style={{ display: 'block', fontSize: 18 }}>Axi Trades</strong><span style={{ color: '#64748b', fontSize: 13 }}>Frontend startup error</span></div>
          </div>
          <p style={{ color: '#475569' }}>The application bundle failed during startup. The server is reachable; this is a frontend runtime/module issue.</p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: 12, color: '#475569' }}>{message}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, width: '100%', border: 0, borderRadius: 10, background: '#E3000F', color: '#fff', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Reload application</button>
        </section>
      </main>,
    );
  });
