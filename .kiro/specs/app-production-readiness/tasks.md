# Implementation Plan: App Production Readiness

## Overview

Incremental fixes and improvements to the Kids Digital Comic static app, ordered by priority: bugs → security → UX → polish. Each task targets a specific file and requirement, building toward a fully wired, production-ready app.

## Tasks

- [x] 1. Fix missing `autoAdvance` checkbox element in `audio-narrator.html`
  - Insert a new `.card` div with `id="advanceCard"` between `#ctrlCard` and `#storyCard`
  - Add `<input type="checkbox" id="autoAdvance" class="big-check" />` inside the card with a descriptive label span
  - No JS changes needed — the existing `onAudioEnd()` already reads `autoAdvance.checked`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.1 Write property test for autoAdvance firing behaviour
    - **Property 1: autoAdvance only fires when checked**
    - **Validates: Requirements 1.2, 1.3**
    - Mock `onAudioEnd()`, set checkbox state to `fc.boolean()`, assert `postMessage` called iff checked

- [x] 2. Fix undefined `--mint` CSS variable in `audio-narrator.html`
  - Add `--mint: #00FF7F;` to the `:root` block in the page's `<style>` tag
  - Verify the `body { background-color: var(--mint); }` rule resolves correctly
  - _Requirements: 2.1, 2.2_

- [x] 3. Replace hardcoded panel count `6` with dynamic `story.panels.length` in `story-viewer.html`
  - [x] 3.1 Fix `goPanel()` boundary condition
    - Change `next > 5` to `next >= story.panels.length`
    - _Requirements: 3.2_

  - [x] 3.2 Write property test for panel navigation bounds
    - **Property 2: Panel navigation stays within bounds**
    - **Validates: Requirements 3.2, 3.5**
    - Use `fc.integer({ min: 2, max: 10 })` for N and `fc.array` of directions; assert `0 <= currentPanel <= N-1` after each call

  - [x] 3.3 Fix `renderDots()` loop upper bound
    - Change `i < 6` to `i < story.panels.length`
    - _Requirements: 3.3_

  - [x] 3.4 Write property test for dot count equals panel count
    - **Property 3: Dot count equals panel count**
    - **Validates: Requirements 3.3**
    - Build a story with `fc.integer({ min: 1, max: 12 })` panels; assert rendered dot elements count equals N

  - [x] 3.5 Fix `renderPanel()` badge label
    - Change `` `… / 6` `` to `` `… / ${story.panels.length}` ``
    - _Requirements: 3.1, 3.4_

  - [x] 3.6 Write property test for panel badge dynamic count
    - **Property 4: Panel badge reflects dynamic count**
    - **Validates: Requirements 3.1, 3.4**
    - Call `renderPanel(i)` with a story of N panels; assert badge text contains `String(N)` not `"6"`

  - [x] 3.7 Fix `handleNext()` finish condition
    - Change `currentPanel === 5` to `currentPanel >= story.panels.length - 1`
    - _Requirements: 3.2, 3.5_

- [x] 4. Checkpoint — Ensure all bug-fix tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add API key security warning and `.gitignore` (`config.js`, `audio-narrator.html`, `.gitignore`)
  - [x] 5.1 Create `.gitignore` with entries for `config.js` and `kids_digital_comic_plan.svg`
    - _Requirements: 4.1, 9.1_

  - [x] 5.2 Add security warning comment block to `config.js`
    - Insert the `⚠️ SECURITY WARNING` comment at the top of `config.js` describing the backend proxy pattern
    - _Requirements: 4.2, 4.4_

  - [x] 5.3 Add security banner element and show/hide logic to `audio-narrator.html`
    - Add `<div id="securityBanner" style="display:none; …">` to the page body
    - In `init()`, show the banner when `CONFIG.ELEVENLABS_API_KEY` is non-empty; keep it hidden otherwise
    - _Requirements: 4.3, 4.5_

- [x] 6. Implement ElevenLabs error handling with browser TTS fallback in `audio-narrator.html`
  - [x] 6.1 Wrap `fetch()` call in try/catch for network errors
    - On catch, call `setStatus("❌ Network error — switching to browser voice.")` then `playBrowserTTS(text)`
    - _Requirements: 5.2, 5.3, 5.5_

  - [x] 6.2 Check `resp.ok` after fetch and handle non-2xx responses
    - On `!resp.ok`, call `setStatus(\`❌ ElevenLabs error ${resp.status} — switching to browser voice.\`)` then `playBrowserTTS(text)`
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 6.3 Write property test for ElevenLabs error clearing loading state
    - **Property 5: ElevenLabs error clears loading state**
    - **Validates: Requirements 5.1, 5.2, 5.5**
    - Mock fetch to return `fc.oneof` of HTTP error or network throw; assert status bar text !== `"⏳ Loading audio…"` after call

  - [x] 6.4 Write property test for ElevenLabs error triggering browser TTS fallback
    - **Property 6: ElevenLabs error triggers browser TTS fallback**
    - **Validates: Requirements 5.3**
    - Mock fetch; call `playElevenLabs(fc.string())` with error; assert `playBrowserTTS` called with original text

- [x] 7. Add progress reset button and logic to `index.html`
  - [x] 7.1 Add "Reset Progress" button inside `.progress-section`
    - Insert `<button id="resetBtn" onclick="resetProgress()">🗑️ Reset Progress</button>` after the progress tip element
    - _Requirements: 6.1_

  - [x] 7.2 Implement `resetProgress()` function
    - Show `window.confirm()` prompt; return early on cancel
    - On confirm: `localStorage.removeItem` for all three keys (`kidsDC_stars`, `kidsDC_badges`, `kidsDC_lang`)
    - Update `#progressFill` width to `"0%"`, `aria-valuenow` to `0`, and `#progressLabel` text inline
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 7.3 Write property test for progress reset clearing all keys
    - **Property 7: Progress reset clears all three localStorage keys**
    - **Validates: Requirements 6.3**
    - Seed localStorage with `fc.integer`, `fc.array(fc.string())`, `fc.constantFrom('en','hi','as')`; call `resetProgress(confirm=true)`; assert all three keys absent

  - [x] 7.4 Write property test for cancelled reset leaving localStorage unchanged
    - **Property 8: Cancelled reset leaves localStorage unchanged**
    - **Validates: Requirements 6.5**
    - Same seed; call `resetProgress(confirm=false)`; assert all three values identical before and after

- [x] 8. Checkpoint — Ensure all security and UX tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Expand quiz question pool and randomise selection in `quiz-rewards.html`
  - [x] 9.1 Add 3 new questions to each genre's `questions` array (bringing each to 6 total)
    - Each new question must have exactly 3 `options` and 1 `answer` matching one option
    - _Requirements: 7.1, 7.4_

  - [x] 9.2 Update `startQuiz()` to randomly select 3 questions from the pool
    - Use `shuffle([...currentQuiz.questions]).slice(0, 3)` before mapping to `shuffledQs`
    - The `shuffle()` utility (Fisher-Yates) already exists in the file
    - _Requirements: 7.2, 7.3_

  - [x] 9.3 Write property test for quiz pool selection being a valid subset
    - **Property 9: Quiz pool selection is a subset of the full pool**
    - **Validates: Requirements 7.1, 7.2**
    - Generate `fc.array` of question objects (minLength 6); assert selected 3 are all members of pool with no duplicates

  - [x] 9.4 Write data-integrity check for question schema
    - **Property 10: Each quiz question has exactly 3 options and 1 correct answer**
    - **Validates: Requirements 7.4**
    - Iterate all `QUIZZES` entries; assert `options.length === 3` and exactly one option equals `answer`

- [x] 10. Add service worker for offline support (`service-worker.js`, `index.html`)
  - [x] 10.1 Create `service-worker.js` with install and fetch event handlers
    - Define `CACHE = 'kidsDC-v1'` and `ASSETS` array containing all 5 HTML/JS files plus the Google Fonts URL
    - `install` handler: `caches.open(CACHE).then(c => c.addAll(ASSETS))`
    - `fetch` handler: cache-first — `caches.match(e.request).then(cached => cached || fetch(e.request))`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.2 Register service worker from `index.html`
    - In the `DOMContentLoaded` handler, add `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./service-worker.js').catch(() => {}); }`
    - _Requirements: 8.1, 8.5_

  - [x] 10.3 Write property test for cached assets served offline
    - **Property 11: Cached assets are served offline**
    - **Validates: Requirements 8.2, 8.3**
    - After service worker install, use `fc.constantFrom(...ASSETS)` and assert `caches.match(url)` returns non-null for each

- [x] 11. Update copyright year in `index.html`
  - Change `© 2025 Kids Digital Comic` to `© 2026 Kids Digital Comic` in the `.footer-bottom` element
  - _Requirements: 10.1, 10.2_

- [x] 12. Add SEO and Open Graph metadata to all four HTML files
  - [x] 12.1 Add `<meta name="description">` and Open Graph tags to `index.html`
    - Description: "Kids Digital Comic — magical panel-by-panel stories, audio narration, quizzes and rewards for curious young readers." (≤160 chars)
    - Add `og:title`, `og:description`, `og:type` tags
    - _Requirements: 11.1, 11.2_

  - [x] 12.2 Add `<meta name="description">` to `story-viewer.html`
    - _Requirements: 11.3_

  - [x] 12.3 Add `<meta name="description">` to `audio-narrator.html`
    - _Requirements: 11.4_

  - [x] 12.4 Add `<meta name="description">` to `quiz-rewards.html`
    - _Requirements: 11.5_

- [x] 13. Create favicon and add `<link rel="icon">` to all four HTML files
  - [x] 13.1 Create `favicon.svg` in the root directory
    - SVG content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📚</text></svg>`
    - _Requirements: 12.1_

  - [x] 13.2 Add `<link rel="icon" href="favicon.svg" type="image/svg+xml" />` to `index.html` `<head>`
    - _Requirements: 12.2_

  - [x] 13.3 Add `<link rel="icon">` to `story-viewer.html` `<head>`
    - _Requirements: 12.3_

  - [x] 13.4 Add `<link rel="icon">` to `audio-narrator.html` `<head>`
    - _Requirements: 12.4_

  - [x] 13.5 Add `<link rel="icon">` to `quiz-rewards.html` `<head>`
    - _Requirements: 12.5_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 4, 8, and 14 ensure incremental validation
- Property tests use **fast-check** (`npm install --save-dev fast-check`), minimum 100 iterations each
- All changes are to existing static HTML/JS files — no build step or new runtime dependencies required
