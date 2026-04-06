'use client';

import { useEffect } from 'react';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log('PWA ServiceWorker registration successful with scope: ', registration.scope);
          },
          function (err) {
            console.log('PWA ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return <>{children}</>;
}
