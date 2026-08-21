import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress benign third-party iframe and cross-origin script errors
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('contentWindow') ||
    event.message?.includes('Script error') ||
    event.message?.includes('Cannot listen to the event from the provided iframe')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('contentWindow') ||
    event.reason?.message?.includes('Script error') ||
    event.reason?.message?.includes('Cannot listen to the event from the provided iframe')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

