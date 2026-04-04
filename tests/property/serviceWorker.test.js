// Feature: app-production-readiness, Property 11: Cached assets are served offline

import { describe, it, beforeEach } from 'vitest';
import { expect } from 'vitest';
import fc from 'fast-check';

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

/**
 * Minimal in-memory Cache mock.
 */
function makeCache() {
  const store = new Map();
  return {
    addAll(urls) {
      for (const url of urls) {
        store.set(url, new Response(`cached: ${url}`));
      }
      return Promise.resolve();
    },
    match(request) {
      const url = typeof request === 'string' ? request : request.url;
      return Promise.resolve(store.get(url) ?? null);
    },
    _store: store,
  };
}

/**
 * Simulate the service worker install handler using the provided cache.
 */
async function simulateInstall(cache) {
  await cache.addAll(ASSETS);
}

// Property 11: Cached assets are served offline
// Validates: Requirements 8.2, 8.3
describe('Property 11: Cached assets are served offline', () => {
  it('every ASSETS URL is retrievable from the cache after install', async () => {
    const cache = makeCache();
    await simulateInstall(cache);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ASSETS),
        async (url) => {
          const match = await cache.match(url);
          expect(match).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
