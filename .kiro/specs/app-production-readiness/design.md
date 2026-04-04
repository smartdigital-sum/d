# Design Document — App Production Readiness

## Overview

The Kids Digital Comic is a fully static, zero-dependency web application (no build step, no server) consisting of four HTML pages, one JS config file, and shared assets. All state is stored in `localStorage`. The production-readiness pass addresses twelve requirements grouped into four categories:

- **Bug fixes** (Req 1–3): missing DOM element, undefined CSS variable, hardcoded panel count
- **Security** (Req 4): API key exposure guidance and `.gitignore`
- **UX improvements** (Req 5–8): error handling, progress reset, quiz variety, offline support
- **Polish** (Req 9–12): artefact removal, copyright year, SEO metadata, favicon

No new pages are introduced. No external runtime dependencies are added beyond those already present (GSAP, canvas-confetti, Google Fonts, ElevenLabs API).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ┌──────────────┐   iframe postMessage   ┌───────────────┐ │
│  │audio-narrator│ ◄────────────────────► │ story-viewer  │ │
│  │   .html      │                        │    .html      │ │
│  └──────────────┘                        └───────────────┘ │
│         │                                                   │
│  ┌──────┴───────┐                                           │
│  │  config.js   │  (ElevenLabs key + voice IDs)            │
│  └──────────────┘                                           │
│                                                             │
│  ┌──────────────┐   localStorage R/W   ┌────────────────┐  │
│  │  index.html  │ ◄──────────────────► │quiz-rewards    │  │
│  │  (home)      │                      │   .html        │  │
│  └──────────────┘                      └────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  service-worker.js  (cache-first, offline support)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key architectural constraints

- All pages are self-contained HTML files with inline CSS and JS.
- Cross-page communication uses only `localStorage` (stars, badges, language) and URL query params (`?genre=`).
- The audio-narrator embeds story-viewer in an `<iframe>` and communicates via `postMessage`.
- The service worker is registered once from `index.html` and caches all five app files plus the Google Fonts URL.

---

## Components and Interfaces

### Req 1 — `autoAdvance` checkbox (`audio-narrator.html`)

A new UI card is inserted between the playback-controls card (`#ctrlCard`) and the story iframe card (`#storyCard`):

```html
<div class="card" id="advanceCard">
  <div class="card-label">⏭️ Auto-Advance Panels</div>
  <div class="advance-row">
    <input type="checkbox" id="autoAdvance" class="big-check" />
    <span class="advance-text">Automatically go to next panel when audio ends</span>
  </div>
</div>
```

The existing `onAudioEnd()` already reads `autoAdvance.checked` — no JS changes needed beyond the element existing.

### Req 2 — `--mint` CSS variable (`audio-narrator.html`)

Add to the `:root` block in `audio-narrator.html`'s `<style>`:

```css
:root {
  /* existing variables … */
  --mint: #00FF7F;   /* ← ADD THIS */
}
```

The `body { background-color: var(--mint); }` rule already exists and will resolve correctly once the variable is defined.

### Req 3 — Dynamic panel count (`story-viewer.html`)

Four locations are updated to replace the literal `6` / `> 5` with dynamic expressions:

| Location | Before | After |
|---|---|---|
| `goPanel()` boundary | `next > 5` | `next >= story.panels.length` |
| `renderDots()` loop | `i < 6` | `i < story.panels.length` |
| `renderPanel()` badge | `` `… / 6` `` | `` `… / ${story.panels.length}` `` |
| `handleNext()` finish | `currentPanel === 5` | `currentPanel >= story.panels.length - 1` |

`story` is resolved as `STORIES[state.genre]` at call time, so no additional state is needed.

### Req 4 — API key security (`config.js`, `audio-narrator.html`, `.gitignore`)

**`.gitignore`** (new file):
```
config.js
kids_digital_comic_plan.svg
```

**`config.js`** — add prominent warning block at the top:
```js
/*
 * ⚠️  SECURITY WARNING — DO NOT COMMIT THIS FILE  ⚠️
 *
 * This file contains your ElevenLabs API key.
 * It MUST be listed in .gitignore and never pushed to a public repo.
 *
 * RECOMMENDED PRODUCTION PATTERN (backend proxy):
 *   1. Remove the API key from this file entirely.
 *   2. Create a server-side endpoint (e.g. /api/tts) that accepts
 *      { text, voiceId } and calls ElevenLabs with the key stored
 *      in a server environment variable.
 *   3. Point playElevenLabs() at your /api/tts endpoint instead of
 *      directly at api.elevenlabs.io.
 *   This way the key is never sent to the browser.
 */
```

**`audio-narrator.html`** — security warning banner (shown only when key is non-empty):
```html
<div id="securityBanner" style="display:none; …">
  ⚠️ API key detected in config.js — client-side keys are not secure
  for production. Use a backend proxy. See config.js for guidance.
</div>
```

In `init()`:
```js
if (apiKey) {
  document.getElementById('securityBanner').style.display = 'flex';
}
```

### Req 5 — ElevenLabs error handling (`audio-narrator.html`)

`playElevenLabs()` is updated to:
1. Catch non-2xx responses and surface the HTTP status code in the status bar.
2. Catch network-level `fetch` failures and show "network error" in the status bar.
3. Call `playBrowserTTS()` as fallback in both error paths.
4. Never leave the status bar in the loading state after an error.

```js
async function playElevenLabs(text) {
  let resp;
  try {
    resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { … });
  } catch (networkErr) {
    setStatus("❌ Network error — switching to browser voice.");
    playBrowserTTS(text);
    return;
  }

  if (!resp.ok) {
    setStatus(`❌ ElevenLabs error ${resp.status} — switching to browser voice.`);
    playBrowserTTS(text);
    return;
  }

  // … blob → Audio → play …
}
```

`playBrowserTTS()` already handles the case where `window.speechSynthesis` is absent (Req 5.4).

### Req 6 — Progress reset (`index.html`)

A "Reset Progress" button is added inside `.progress-section`, after the progress tip:

```html
<button id="resetBtn" onclick="resetProgress()" …>🗑️ Reset Progress</button>
```

```js
function resetProgress() {
  if (!window.confirm('Reset all progress? This will clear your stars and badges.')) return;
  localStorage.removeItem('kidsDC_stars');
  localStorage.removeItem('kidsDC_badges');
  localStorage.removeItem('kidsDC_lang');
  // Update progress bar inline (no reload)
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressBar').setAttribute('aria-valuenow', 0);
  document.getElementById('progressLabel').textContent =
    STRINGS[currentLang].progressLabel(0);
}
```

### Req 7 — Expanded quiz pool (`quiz-rewards.html`)

Each genre's `questions` array is expanded from 3 to 6 entries. `startQuiz()` is updated to randomly select 3:

```js
function startQuiz() {
  const pool = shuffle([...currentQuiz.questions]).slice(0, 3);
  shuffledQs = pool.map(q => ({ ...q, shuffledOptions: shuffle([...q.options]) }));
  // … rest unchanged …
}
```

The `shuffle()` utility already exists in the file (Fisher-Yates).

### Req 8 — Service worker (`service-worker.js`, `index.html`)

**`service-worker.js`** (new file):
```js
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

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
);

self.addEventListener('fetch', e =>
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
);
```

**`index.html`** — register in the `DOMContentLoaded` handler:
```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}
```

### Req 9 — `.gitignore` artefact entry

Covered by Req 4's `.gitignore` creation (both entries in the same file).

### Req 10 — Copyright year (`index.html`)

```html
<!-- Before -->
<div class="footer-bottom">© 2025 Kids Digital Comic · All ages welcome 🌍</div>
<!-- After -->
<div class="footer-bottom">© 2026 Kids Digital Comic · All ages welcome 🌍</div>
```

### Req 11 — SEO metadata (all 4 HTML files)

Each file receives a `<meta name="description">` tag. `index.html` additionally receives Open Graph tags:

```html
<!-- index.html -->
<meta name="description" content="Kids Digital Comic — magical panel-by-panel stories, audio narration, quizzes and rewards for curious young readers." />
<meta property="og:title"       content="Kids Digital Comic 📚✨" />
<meta property="og:description" content="Magical panel-by-panel stories, audio narration, quizzes and rewards for curious young readers." />
<meta property="og:type"        content="website" />

<!-- story-viewer.html -->
<meta name="description" content="Read panel-by-panel illustrated stories on Kids Digital Comic." />

<!-- audio-narrator.html -->
<meta name="description" content="Listen to Kids Digital Comic stories narrated with ElevenLabs AI or browser text-to-speech." />

<!-- quiz-rewards.html -->
<meta name="description" content="Test your knowledge with story quizzes and earn badges on Kids Digital Comic." />
```

### Req 12 — Favicon (`favicon.svg`, all 4 HTML files)

**`favicon.svg`** (new file, book emoji SVG):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y=".9em" font-size="90">📚</text>
</svg>
```

Each HTML file's `<head>` receives:
```html
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
```

---

## Data Models

### `localStorage` keys (unchanged schema)

| Key | Type | Description |
|---|---|---|
| `kidsDC_stars` | `string` (integer) | Cumulative star count (0–40+) |
| `kidsDC_badges` | `string` (JSON array of badge IDs) | Unlocked badge IDs |
| `kidsDC_lang` | `string` (`"en"` \| `"hi"` \| `"as"`) | Selected language |

The progress reset (Req 6) removes all three keys. No new keys are introduced.

### Service worker cache

| Cache name | Contents |
|---|---|
| `kidsDC-v1` | `index.html`, `story-viewer.html`, `audio-narrator.html`, `quiz-rewards.html`, `config.js`, Google Fonts CSS URL |

Cache strategy: cache-first (serve from cache; fall back to network if not cached).

### Quiz question schema (unchanged, pool size increases)

```ts
interface Question {
  q: string;           // question text
  options: string[];   // exactly 3 answer strings
  answer: string;      // must equal one of options[]
}
```

Each genre's `questions` array grows from 3 → 6 entries. `startQuiz()` selects 3 at random per session.

### `CONFIG` object (`config.js`)

```ts
interface Config {
  ELEVENLABS_API_KEY: string;   // empty string = use browser TTS
  VOICE_IDS: {
    en: string;
    hi: string;
    as: string;
  };
}
```

No schema changes — only comments and `.gitignore` are added.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: autoAdvance only fires when checked

*For any* audio-end event, a `postMessage` of type `AUTO_NEXT_PANEL` is sent to the story iframe if and only if the `autoAdvance` checkbox is checked at the time the event fires.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Panel navigation stays within bounds

*For any* story with N panels and any sequence of `goPanel()` calls, `state.currentPanel` must always satisfy `0 <= state.currentPanel <= N - 1`.

**Validates: Requirements 3.2, 3.5**

---

### Property 3: Dot count equals panel count

*For any* story loaded into the story viewer, the number of dot indicators rendered by `renderDots()` must equal `story.panels.length`.

**Validates: Requirements 3.3**

---

### Property 4: Panel badge reflects dynamic count

*For any* story with N panels and any panel index i, the badge text rendered by `renderPanel(i)` must contain the string representation of N (not the literal `"6"`).

**Validates: Requirements 3.1, 3.4**

---

### Property 5: ElevenLabs error clears loading state

*For any* ElevenLabs API call that results in either a non-2xx HTTP response or a network-level fetch failure, the status bar text must not equal `"⏳ Loading audio…"` after the error is handled.

**Validates: Requirements 5.1, 5.2, 5.5**

---

### Property 6: ElevenLabs error triggers browser TTS fallback

*For any* ElevenLabs API call that fails (non-2xx or network error), `playBrowserTTS()` must be called with the original narration text.

**Validates: Requirements 5.3**

---

### Property 7: Progress reset clears all three localStorage keys

*For any* localStorage state containing `kidsDC_stars`, `kidsDC_badges`, and/or `kidsDC_lang`, after a confirmed reset, all three keys must be absent from localStorage.

**Validates: Requirements 6.3**

---

### Property 8: Cancelled reset leaves localStorage unchanged

*For any* localStorage state, if the user cancels the reset confirmation, the values of `kidsDC_stars`, `kidsDC_badges`, and `kidsDC_lang` must be identical before and after the cancel action.

**Validates: Requirements 6.5**

---

### Property 9: Quiz pool selection is a subset of the full pool

*For any* genre with a question pool of size ≥ 3, the 3 questions selected by `startQuiz()` must all be members of that genre's `questions` array, with no duplicates.

**Validates: Requirements 7.1, 7.2**

---

### Property 10: Each quiz question has exactly 3 options and 1 correct answer

*For any* question object in any genre's question pool, `options.length === 3` and exactly one element of `options` equals `answer`.

**Validates: Requirements 7.4**

---

### Property 11: Cached assets are served offline

*For any* asset URL in the service worker's `ASSETS` list, after the service worker has installed, a fetch request for that URL must be fulfilled from the cache (i.e., `caches.match()` returns a non-null response).

**Validates: Requirements 8.2, 8.3**

---

## Error Handling

### ElevenLabs API errors (Req 5)

| Scenario | Handling |
|---|---|
| Non-2xx HTTP response | Status bar shows `"❌ ElevenLabs error {status} — switching to browser voice."`, then `playBrowserTTS()` is called |
| Network fetch failure | Status bar shows `"❌ Network error — switching to browser voice."`, then `playBrowserTTS()` is called |
| `window.speechSynthesis` absent | Status bar shows `"❌ No speech available in this browser."` |
| `audio.onerror` (blob playback) | Status bar shows `"Audio error — switching to browser voice."`, then `playBrowserTTS()` is called (already present) |

In all error paths the status bar is updated before returning, ensuring it never stays in the `"⏳ Loading audio…"` state.

### Service worker registration failure (Req 8)

The registration call is wrapped in `.catch(() => {})` — silent failure, app continues without offline support.

### Progress reset cancellation (Req 6)

`window.confirm()` returns `false` on cancel; the function returns early without touching localStorage.

### Missing `autoAdvance` element (Req 1)

After the fix the element always exists. The existing null-dereference risk is eliminated by the HTML addition.

---

## Testing Strategy

### Unit tests

Unit tests cover specific examples, edge cases, and integration points. They should be kept minimal — property tests handle broad input coverage.

Recommended unit test cases:

- `renderDots()` with a 3-panel story renders 3 dots (not 6)
- `goPanel(-1)` at panel 0 does not change `state.currentPanel`
- `goPanel(1)` at the last panel does not change `state.currentPanel`
- `handleNext()` at the last panel calls `triggerCompletion()`, not `goPanel(1)`
- `resetProgress()` with confirm=false leaves localStorage unchanged
- `resetProgress()` with confirm=true removes all three keys and sets progress bar width to `"0%"`
- `startQuiz()` returns exactly 3 questions from a 6-question pool
- `playElevenLabs()` with a 401 response calls `playBrowserTTS()` and sets status bar to a non-loading string
- `playElevenLabs()` with a network error calls `playBrowserTTS()` and sets status bar to a non-loading string
- Service worker `install` event caches all 6 listed assets
- Security banner is visible when `CONFIG.ELEVENLABS_API_KEY` is non-empty
- Security banner is hidden when `CONFIG.ELEVENLABS_API_KEY` is `""`

### Property-based tests

Property tests use a PBT library. For JavaScript, the recommended library is **fast-check** (`npm install --save-dev fast-check`). Each test runs a minimum of **100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: app-production-readiness, Property {N}: {property_text}`

**Property 1 — autoAdvance fires iff checked**
```js
// Feature: app-production-readiness, Property 1: autoAdvance only fires when checked
fc.assert(fc.property(fc.boolean(), (isChecked) => {
  // Set checkbox state, fire onAudioEnd(), assert postMessage called iff isChecked
}), { numRuns: 100 });
```

**Property 2 — Panel navigation stays within bounds**
```js
// Feature: app-production-readiness, Property 2: Panel navigation stays within bounds
fc.assert(fc.property(
  fc.integer({ min: 2, max: 10 }),   // panel count N
  fc.array(fc.integer({ min: -1, max: 1 }).filter(d => d !== 0), { minLength: 1, maxLength: 50 }),
  (N, dirs) => {
    // Simulate goPanel() calls; assert 0 <= currentPanel <= N-1 after each
  }
), { numRuns: 100 });
```

**Property 3 — Dot count equals panel count**
```js
// Feature: app-production-readiness, Property 3: Dot count equals panel count
fc.assert(fc.property(fc.integer({ min: 1, max: 12 }), (N) => {
  // Build a story with N panels, call renderDots(), assert dot elements === N
}), { numRuns: 100 });
```

**Property 4 — Panel badge reflects dynamic count**
```js
// Feature: app-production-readiness, Property 4: Panel badge reflects dynamic count
fc.assert(fc.property(
  fc.integer({ min: 1, max: 12 }),   // N panels
  fc.integer({ min: 0, max: 11 }),   // panel index i (clamped to N-1 in test)
  (N, i) => {
    const idx = Math.min(i, N - 1);
    // Call renderPanel(idx) with a story of N panels; assert badge contains String(N)
  }
), { numRuns: 100 });
```

**Property 5 — ElevenLabs error clears loading state**
```js
// Feature: app-production-readiness, Property 5: ElevenLabs error clears loading state
fc.assert(fc.property(
  fc.oneof(
    fc.record({ kind: fc.constant('http'), status: fc.integer({ min: 400, max: 599 }) }),
    fc.record({ kind: fc.constant('network') })
  ),
  async (errorCase) => {
    // Mock fetch to throw or return non-ok; call playElevenLabs(); assert statusBar !== loading text
  }
), { numRuns: 100 });
```

**Property 6 — ElevenLabs error triggers browser TTS fallback**
```js
// Feature: app-production-readiness, Property 6: ElevenLabs error triggers browser TTS fallback
fc.assert(fc.property(
  fc.string({ minLength: 1 }),   // narration text
  fc.oneof(fc.constant('http-error'), fc.constant('network-error')),
  async (text, errorKind) => {
    // Mock fetch; call playElevenLabs(text); assert playBrowserTTS called with text
  }
), { numRuns: 100 });
```

**Property 7 — Progress reset clears all three keys**
```js
// Feature: app-production-readiness, Property 7: Progress reset clears all three localStorage keys
fc.assert(fc.property(
  fc.integer({ min: 0, max: 100 }),
  fc.array(fc.string()),
  fc.constantFrom('en', 'hi', 'as'),
  (stars, badges, lang) => {
    localStorage.setItem('kidsDC_stars', String(stars));
    localStorage.setItem('kidsDC_badges', JSON.stringify(badges));
    localStorage.setItem('kidsDC_lang', lang);
    resetProgress(/* confirm = true */);
    return !localStorage.getItem('kidsDC_stars')
        && !localStorage.getItem('kidsDC_badges')
        && !localStorage.getItem('kidsDC_lang');
  }
), { numRuns: 100 });
```

**Property 8 — Cancelled reset leaves localStorage unchanged**
```js
// Feature: app-production-readiness, Property 8: Cancelled reset leaves localStorage unchanged
fc.assert(fc.property(
  fc.integer({ min: 0, max: 100 }),
  fc.array(fc.string()),
  fc.constantFrom('en', 'hi', 'as'),
  (stars, badges, lang) => {
    localStorage.setItem('kidsDC_stars', String(stars));
    localStorage.setItem('kidsDC_badges', JSON.stringify(badges));
    localStorage.setItem('kidsDC_lang', lang);
    resetProgress(/* confirm = false */);
    return localStorage.getItem('kidsDC_stars') === String(stars)
        && localStorage.getItem('kidsDC_badges') === JSON.stringify(badges)
        && localStorage.getItem('kidsDC_lang') === lang;
  }
), { numRuns: 100 });
```

**Property 9 — Quiz pool selection is a valid subset**
```js
// Feature: app-production-readiness, Property 9: Quiz pool selection is a subset of the full pool
fc.assert(fc.property(
  fc.array(fc.record({
    q: fc.string({ minLength: 1 }),
    options: fc.tuple(fc.string(), fc.string(), fc.string()).map(t => [...t]),
    answer: fc.string()
  }), { minLength: 6, maxLength: 20 }),
  (pool) => {
    const selected = shuffle([...pool]).slice(0, 3);
    const unique = new Set(selected.map(q => q.q));
    return selected.length === 3
        && selected.every(q => pool.includes(q))
        && unique.size === 3;
  }
), { numRuns: 100 });
```

**Property 10 — Each question has exactly 3 options and 1 correct answer**
```js
// Feature: app-production-readiness, Property 10: Each quiz question has 3 options and 1 correct answer
// This is a data-integrity check run once over all QUIZZES entries
Object.values(QUIZZES).forEach(genre => {
  genre.questions.forEach(q => {
    assert(q.options.length === 3);
    assert(q.options.filter(o => o === q.answer).length === 1);
  });
});
```

**Property 11 — Cached assets are served offline**
```js
// Feature: app-production-readiness, Property 11: Cached assets are served offline
fc.assert(fc.property(
  fc.constantFrom(...ASSETS),
  async (url) => {
    const cache = await caches.open(CACHE);
    const match = await cache.match(url);
    return match !== undefined && match !== null;
  }
), { numRuns: 100 });
```
