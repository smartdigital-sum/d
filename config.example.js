/*
 * Kids Digital Comic — Local Configuration Template
 *
 * Copy this file to `config.js` before running the app:
 *
 *     cp config.example.js config.js     (macOS / Linux)
 *     copy config.example.js config.js   (Windows)
 *
 * `config.js` is git-ignored so any keys you add there stay on your machine.
 *
 * The app works out of the box with the browser's built-in text-to-speech —
 * no keys are required. ElevenLabs is optional and only used if you both
 * flip USE_ELEVENLABS to true AND route requests through your own backend
 * proxy (NEVER embed a raw ElevenLabs API key here — it would be public).
 */

const CONFIG = {
  USE_ELEVENLABS: false,

  // Point this to YOUR backend proxy that injects the ElevenLabs key
  // server-side (Cloudflare Workers / Netlify Functions / Vercel Edge, etc.)
  ELEVENLABS_PROXY_URL: "",

  // Reserved for local development only — leave empty in any committed file.
  // Must never contain a real ElevenLabs key if you push this file.
  ELEVENLABS_API_KEY: "",

  // ElevenLabs voice IDs per language (multilingual v2 model covers hi / as)
  VOICE_IDS: {
    en: "XB0fDUnXU5powFXDhCwa",
    hi: "XB0fDUnXU5powFXDhCwa",
    as: "XB0fDUnXU5powFXDhCwa"
  }
};
