import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './index.css';

import { registerServiceWorker } from './lib/push.js';

// Register Service Worker for Web Push notifications (replicated from self_push_notifications)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((err) => {
      console.warn('[PWA] Service Worker registration note:', err.message);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
