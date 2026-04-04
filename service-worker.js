const CACHE = 'kidsDC-v1';
const ASSETS = [
  './',
  './index.html',
  './story-viewer.html',
  './audio-narrator.html',
  './quiz-rewards.html',
  './config.js',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap',
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);

self.addEventListener('fetch', e =>
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
);
