// Safeguard window.fetch against read-only getter assignment in browser/iframe environments
try {
  const win = typeof window !== 'undefined' ? window : null;
  if (win) {
    const proto = typeof Window !== 'undefined' ? Window.prototype : Object.getPrototypeOf(win);
    const origFetch = win.fetch ? win.fetch.bind(win) : null;
    let activeFetch = origFetch;

    const descriptor = {
      get: () => activeFetch,
      set: (fn: typeof fetch) => {
        activeFetch = typeof fn === 'function' ? fn : activeFetch;
      },
      configurable: true,
      enumerable: true,
    };

    if (proto) {
      try {
        Object.defineProperty(proto, 'fetch', descriptor);
      } catch {}
    }
    try {
      Object.defineProperty(win, 'fetch', descriptor);
    } catch {}
  }
} catch {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
