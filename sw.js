'use strict';

// English_GA offline cache. Network first (so updates appear immediately when online),
// falling back to the cached copy when offline. Only same-origin files are cached.
const CACHE = 'english-ga-v4'; // bump when files are added or removed

const CORE = [
  './',
  'index.html',
  'app.js',
  'styles.css',
  'icon.svg',
  'logo.svg',
  'apple-touch-icon.png',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'content/verb-tenses-aspect.json',
  'content/auxiliary-verbs-questions.json',
  'content/prepositions.json',
  'content/articles.json',
  'content/sentence-structure.json',
  'content/quantifiers.json',
  'content/subject-verb-agreement.json',
  'content/relative-clauses.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // 'no-cache' revalidates with the server (a cheap 304 when unchanged), so new releases
  // show up immediately instead of after the browser's HTTP cache expires.
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })
        .then((cached) => cached || (request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
