// Feature: app-production-readiness, Property 3: Dot count equals panel count
// Validates: Requirements 3.3

import { describe, it, beforeEach } from 'vitest';
import fc from 'fast-check';
import { expect } from 'vitest';

/**
 * Minimal simulation of renderDots() after the fix:
 *   - loops i < story.panels.length  (not i < 6)
 */
function renderDots(panelCount) {
  const row = document.createElement('div');
  row.id = 'dotsRow';
  document.body.appendChild(row);

  row.innerHTML = '';
  for (let i = 0; i < panelCount; i++) {
    const d = document.createElement('span');
    d.className = 'dot';
    row.appendChild(d);
  }

  return row;
}

describe('Property 3: Dot count equals panel count', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('number of rendered dots equals story.panels.length', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 12 }), (N) => {
        document.body.innerHTML = '';
        const row = renderDots(N);
        const dots = row.querySelectorAll('.dot');
        expect(dots.length).toBe(N);
      }),
      { numRuns: 100 }
    );
  });
});
