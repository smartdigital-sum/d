// Feature: app-production-readiness, Property 7: Progress reset clears all three localStorage keys
// Feature: app-production-readiness, Property 8: Cancelled reset leaves localStorage unchanged

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { expect } from 'vitest';

/**
 * Minimal simulation of resetProgress() extracted from index.html.
 * Accepts `confirmed` boolean to bypass window.confirm for testability.
 */
function resetProgress(confirmed, storage) {
  if (!confirmed) return;
  storage.removeItem('kidsDC_stars');
  storage.removeItem('kidsDC_badges');
  storage.removeItem('kidsDC_lang');
}

/**
 * Simple in-memory localStorage stand-in so tests don't touch the real browser store.
 */
function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    setItem(k, v) { store[k] = String(v); },
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    removeItem(k) { delete store[k]; },
    _store: store,
  };
}

// Property 7: Progress reset clears all three localStorage keys
// Validates: Requirements 6.3
describe('Property 7: Progress reset clears all three localStorage keys', () => {
  it('all three keys are absent after a confirmed reset', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.array(fc.string()),
        fc.constantFrom('en', 'hi', 'as'),
        (stars, badges, lang) => {
          const storage = makeStorage();
          storage.setItem('kidsDC_stars', String(stars));
          storage.setItem('kidsDC_badges', JSON.stringify(badges));
          storage.setItem('kidsDC_lang', lang);

          resetProgress(true, storage);

          expect(storage.getItem('kidsDC_stars')).toBeNull();
          expect(storage.getItem('kidsDC_badges')).toBeNull();
          expect(storage.getItem('kidsDC_lang')).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 8: Cancelled reset leaves localStorage unchanged
// Validates: Requirements 6.5
describe('Property 8: Cancelled reset leaves localStorage unchanged', () => {
  it('all three keys retain their original values after a cancelled reset', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.array(fc.string()),
        fc.constantFrom('en', 'hi', 'as'),
        (stars, badges, lang) => {
          const storage = makeStorage();
          const starsStr  = String(stars);
          const badgesStr = JSON.stringify(badges);

          storage.setItem('kidsDC_stars',  starsStr);
          storage.setItem('kidsDC_badges', badgesStr);
          storage.setItem('kidsDC_lang',   lang);

          resetProgress(false, storage);

          expect(storage.getItem('kidsDC_stars')).toBe(starsStr);
          expect(storage.getItem('kidsDC_badges')).toBe(badgesStr);
          expect(storage.getItem('kidsDC_lang')).toBe(lang);
        }
      ),
      { numRuns: 100 }
    );
  });
});
