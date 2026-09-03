import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import AppErrorBoundary from './AppErrorBoundary';
import './index.css';

const App = React.lazy(() => import('./App.tsx'));

// Suppress only known benign third-party iframe/script errors.
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('contentWindow') ||
    event.message?.includes('Script error') ||
    event.message?.includes('Cannot listen to the event from the provided iframe')
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

function BootScreen() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3000F] text-2xl font-black">A</div>
        <h1 className="text-2xl font-bold">Axi Trades</h1>
        <p className="mt-2 text-sm text-slate-400">Loading trading platform…</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Suspense fallback={<BootScreen />}>
      <App />
    </Suspense>
  </AppErrorBoundary>,
);
