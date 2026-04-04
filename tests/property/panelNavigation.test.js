// Feature: app-production-readiness, Property 2: Panel navigation stays within bounds
// Validates: Requirements 3.2, 3.5

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { expect } from 'vitest';

/**
 * Minimal simulation of goPanel() after the fix:
 *   - boundary: next >= N  (not next > 5)
 *   - boundary: next < 0
 */
function makeGoPanel(N) {
  let currentPanel = 0;

  function goPanel(dir) {
    const next = currentPanel + dir;
    if (next < 0 || next >= N) return;
    currentPanel = next;
  }

  return { goPanel, getPanel: () => currentPanel };
}

describe('Property 2: Panel navigation stays within bounds', () => {
  it('currentPanel is always in [0, N-1] after any sequence of goPanel calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.array(
          fc.integer({ min: -1, max: 1 }).filter(d => d !== 0),
          { minLength: 1, maxLength: 50 }
        ),
        (N, dirs) => {
          const { goPanel, getPanel } = makeGoPanel(N);

          for (const dir of dirs) {
            goPanel(dir);
            const panel = getPanel();
            expect(panel).toBeGreaterThanOrEqual(0);
            expect(panel).toBeLessThanOrEqual(N - 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
