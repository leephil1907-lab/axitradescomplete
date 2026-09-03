import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './AppErrorBoundary';
import './index.css';

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

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
