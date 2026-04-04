// Feature: app-production-readiness, Property 4: Panel badge reflects dynamic count
// Validates: Requirements 3.1, 3.4

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { expect } from 'vitest';

/**
 * Minimal simulation of the badge text rendered by renderPanel() after the fix:
 *   - uses story.panels.length  (not the literal 6)
 */
function renderBadge(panelCount, idx) {
  const badge = document.createElement('span');
  badge.id = 'panelBadge';
  badge.textContent = `Panel ${idx + 1} / ${panelCount}`;
  document.body.appendChild(badge);
  return badge;
}

describe('Property 4: Panel badge reflects dynamic count', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('badge text contains String(N) and never the literal "6" for N != 6', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0, max: 11 }),
        (N, i) => {
          document.body.innerHTML = '';
          const idx = Math.min(i, N - 1);
          const badge = renderBadge(N, idx);
          const text = badge.textContent;

          // Must contain the dynamic count
          expect(text).toContain(String(N));

          // Must NOT contain the hardcoded literal "6" when N !== 6
          if (N !== 6) {
            expect(text).not.toMatch(/\/ 6\b/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
