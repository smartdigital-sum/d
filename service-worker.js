const CACHE = 'kidsDC-v3';
const ASSETS = [
  './',
  './index.html',
  './story-viewer.html',
  './audio-narrator.html',
  './quiz-rewards.html',
  './config.js',
  './manifest.json',
  './favicon.svg',
  // Story covers
  './assets/cover_animals.png',
  './assets/cover_fairy.png',
  './assets/cover_myth.png',
  './assets/cover_space.png',
  './assets/cover_ocean.png',
  // Story panels — all 24 images
  './assets/story_panels/animals_1.jpeg',
  './assets/story_panels/animals_2.jpeg',
  './assets/story_panels/animals_3.jpeg',
  './assets/story_panels/animals_4.jpeg',
  './assets/story_panels/animals_5.jpeg',
  './assets/story_panels/animals_6.jpeg',
  './assets/story_panels/fairy_1.jpeg',
  './assets/story_panels/fairy_2.jpeg',
  './assets/story_panels/fairy_3.jpeg',
  './assets/story_panels/fairy_4.jpeg',
  './assets/story_panels/fairy_5.jpeg',
  './assets/story_panels/fairy_6.jpeg',
  './assets/story_panels/myth_1.jpeg',
  './assets/story_panels/myth_2.jpeg',
  './assets/story_panels/myth_3.jpeg',
  './assets/story_panels/myth_4.jpeg',
  './assets/story_panels/myth_5.jpeg',
  './assets/story_panels/myth_6.jpeg',
  './assets/story_panels/space_1.jpeg',
  './assets/story_panels/space_2.jpeg',
  './assets/story_panels/space_3.jpeg',
  './assets/story_panels/space_4.jpeg',
  './assets/story_panels/space_5.jpeg',
  './assets/story_panels/space_6.jpeg',
  './assets/story_panels/ocean_1.png',
  './assets/story_panels/ocean_2.png',
  './assets/story_panels/ocean_3.png',
  './assets/story_panels/ocean_4.png',
  './assets/story_panels/ocean_5.png',
  './assets/story_panels/ocean_6.png',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800;900&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Remove old caches on activation
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Cache-first for assets, network-first for HTML
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document';

  if (isHTML) {
    // Network-first for HTML so updates are picked up
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for everything else
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
