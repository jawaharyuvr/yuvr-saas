const CACHE_NAME = 'yuvrs-v1';

// Minimal PWA Service Worker for "Add to Home Screen"
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for online-only SaaS while satisfying PWA criteria
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
