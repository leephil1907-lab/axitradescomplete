import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppErrorBoundary from './AppErrorBoundary';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('AXI application root element was not found.');

window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (message.includes('contentWindow') || message.includes('Script error') || message.includes('Cannot listen to the event from the provided iframe')) {
    event.preventDefault();
    event.stopPropagation();
  }
});
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason || '');
  if (message.includes('contentWindow') || message.includes('Script error') || message.includes('Cannot listen to the event from the provided iframe')) event.preventDefault();
});

createRoot(root).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
