'use strict';

// English_GA offline cache. Network first (so updates appear immediately when online),
// falling back to the cached copy when offline. Only same-origin files are cached.
const CACHE = 'english-ga-v3'; // bump when files are added or removed

const CORE = [
  './',
  'index.html',
  'app.js',
  'styles.css',
  'icon.svg',
  'logo.svg',
  'apple-touch-icon.png',
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

  event.respondWith(
    fetch(request)
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
