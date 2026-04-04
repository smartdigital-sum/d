// Feature: app-production-readiness, Property 1: autoAdvance only fires when checked
// Validates: Requirements 1.2, 1.3

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Minimal DOM setup that mirrors the relevant parts of audio-narrator.html:
 *   - #autoAdvance  checkbox
 *   - #storyFrame   iframe with a mocked contentWindow.postMessage
 *
 * onAudioEnd() is extracted verbatim from audio-narrator.html (the relevant
 * portion that reads autoAdvance.checked and posts AUTO_NEXT_PANEL).
 */
function buildDOM() {
  // checkbox
  const autoAdvance = document.createElement('input');
  autoAdvance.type = 'checkbox';
  autoAdvance.id = 'autoAdvance';
  document.body.appendChild(autoAdvance);

  // iframe element with a mocked contentWindow
  const storyFrame = document.createElement('iframe');
  storyFrame.id = 'storyFrame';
  const mockPostMessage = vi.fn();
  Object.defineProperty(storyFrame, 'contentWindow', {
    get: () => ({ postMessage: mockPostMessage }),
    configurable: true,
  });
  document.body.appendChild(storyFrame);

  return { autoAdvance, storyFrame, mockPostMessage };
}

/**
 * The function under test — extracted from audio-narrator.html's onAudioEnd().
 * Only the AUTO_NEXT_PANEL branch is exercised here; the rest of onAudioEnd
 * (owl animation, status bar, etc.) is irrelevant to this property.
 */
function onAudioEnd() {
  const autoAdvance = document.getElementById('autoAdvance');
  const storyFrame = document.getElementById('storyFrame');
  if (autoAdvance && autoAdvance.checked) {
    if (storyFrame && storyFrame.contentWindow) {
      storyFrame.contentWindow.postMessage({ type: 'AUTO_NEXT_PANEL' }, '*');
    }
  }
}

describe('Property 1: autoAdvance only fires when checked', () => {
  beforeEach(() => {
    // Clean up DOM between runs
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Ensure DOM is clean after each test so jsdom teardown has no iframes
    document.body.innerHTML = '';
  });

  it('postMessage is called iff autoAdvance is checked (property test)', () => {
    fc.assert(
      fc.property(fc.boolean(), (isChecked) => {
        // Reset DOM for each iteration
        document.body.innerHTML = '';
        const { mockPostMessage } = buildDOM();

        // Set checkbox state
        const autoAdvance = document.getElementById('autoAdvance');
        autoAdvance.checked = isChecked;

        // Fire the function under test
        onAudioEnd();

        // Assert: postMessage called iff checkbox was checked
        if (isChecked) {
          expect(mockPostMessage).toHaveBeenCalledTimes(1);
          expect(mockPostMessage).toHaveBeenCalledWith(
            { type: 'AUTO_NEXT_PANEL' },
            '*'
          );
        } else {
          expect(mockPostMessage).not.toHaveBeenCalled();
        }
      }),
      { numRuns: 100 }
    );
  });
});
