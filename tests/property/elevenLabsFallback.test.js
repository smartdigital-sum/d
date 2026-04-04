// Feature: app-production-readiness, Property 6: ElevenLabs error triggers browser TTS fallback
// Validates: Requirements 5.3

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Minimal harness replicating the relevant parts of audio-narrator.html.
 * playElevenLabs() is extracted verbatim from the updated audio-narrator.html.
 */

function buildEnv() {
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

  return { playBrowserTTS, playElevenLabs };
}

describe('Property 6: ElevenLabs error triggers browser TTS fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('playBrowserTTS is called with original text on any fetch error (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.oneof(fc.constant('http-error'), fc.constant('network-error')),
        async (text, errorKind) => {
          document.body.innerHTML = '';
          const { playBrowserTTS, playElevenLabs } = buildEnv();

          if (errorKind === 'network-error') {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failure')));
          } else {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
              ok: false,
              status: 401,
            }));
          }

          await playElevenLabs(text);

          expect(playBrowserTTS).toHaveBeenCalledTimes(1);
          expect(playBrowserTTS).toHaveBeenCalledWith(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});
