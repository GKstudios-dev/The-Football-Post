// Minimal service worker — its only job is to satisfy the browser's
// requirement for an installable app. It doesn't cache anything, so
// the site always loads fresh content, same as without it.
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
