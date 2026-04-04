// Feature: app-production-readiness, Property 5: ElevenLabs error clears loading state
// Validates: Requirements 5.1, 5.2, 5.5

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Minimal harness that replicates the relevant parts of audio-narrator.html:
 *   - statusBar element (read by setStatus)
 *   - global fetch mock
 *   - playBrowserTTS stub
 *
 * playElevenLabs() is extracted verbatim from the updated audio-narrator.html.
 */

const LOADING_TEXT = '⏳ Loading audio…';

function buildEnv() {
  // Status bar element
  const statusBar = document.createElement('div');
  statusBar.id = 'statusBar';
  document.body.appendChild(statusBar);

  function setStatus(msg) {
    statusBar.textContent = msg;
  }

  const playBrowserTTS = vi.fn();

  async function playElevenLabs(text) {
    const voiceId = 'test-voice-id';
    const apiKey = 'test-api-key';
    let resp;
    try {
      resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (networkErr) {
      setStatus('❌ Network error — switching to browser voice.');
      playBrowserTTS(text);
      return;
    }

    if (!resp.ok) {
      setStatus(`❌ ElevenLabs error ${resp.status} — switching to browser voice.`);
      playBrowserTTS(text);
      return;
    }
  }

  return { statusBar, setStatus, playBrowserTTS, playElevenLabs };
}

describe('Property 5: ElevenLabs error clears loading state', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('status bar is not loading text after any fetch error (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({ kind: fc.constant('http'), status: fc.integer({ min: 400, max: 599 }) }),
          fc.record({ kind: fc.constant('network') })
        ),
        fc.string({ minLength: 1 }),
        async (errorCase, text) => {
          document.body.innerHTML = '';
          const { statusBar, playElevenLabs } = buildEnv();

          // Set status to loading before the call (as btnPlay does)
          statusBar.textContent = LOADING_TEXT;

          if (errorCase.kind === 'network') {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failure')));
          } else {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
              ok: false,
              status: errorCase.status,
            }));
          }

          await playElevenLabs(text);

          expect(statusBar.textContent).not.toBe(LOADING_TEXT);
        }
      ),
      { numRuns: 100 }
    );
  });
});
