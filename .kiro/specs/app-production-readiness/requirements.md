# Requirements Document

## Introduction

The Kids Digital Comic app is a static HTML/JS application with four pages: a home page (`index.html`), a panel-by-panel story reader (`story-viewer.html`), an audio narrator (`audio-narrator.html`), and a quiz/rewards page (`quiz-rewards.html`). Before going live, a set of bugs, a security concern, UX gaps, and polish items must be addressed. Requirements are ordered by severity: bugs first, then security, then UX improvements, then polish.

## Glossary

- **App**: The Kids Digital Comic static web application as a whole.
- **Audio_Narrator**: The `audio-narrator.html` page and its JavaScript engine.
- **Story_Viewer**: The `story-viewer.html` page and its JavaScript engine.
- **Quiz_Page**: The `quiz-rewards.html` page and its JavaScript engine.
- **Home_Page**: The `index.html` page.
- **ElevenLabs_Client**: The browser-side fetch call to the ElevenLabs TTS REST API.
- **Browser_TTS**: The Web Speech API (`window.speechSynthesis`) fallback used when ElevenLabs is unavailable.
- **Config_File**: `config.js`, which exports the `CONFIG` object containing the ElevenLabs API key and voice IDs.
- **LocalStorage**: The browser `localStorage` used to persist stars, badges, and language preference.
- **Service_Worker**: A browser service worker script that caches app assets for offline use.
- **Panel_Count**: The number of panels in a story, derived from `story.panels.length`.
- **Progress_Reset**: A user-initiated action that clears all LocalStorage progress data and returns the App to its initial state.

---

## Requirements

### Requirement 1: Fix Missing `autoAdvance` Element

**User Story:** As a developer, I want the Audio Narrator page to load without JavaScript errors, so that the app works reliably for all users.

#### Acceptance Criteria

1. THE Audio_Narrator SHALL contain an HTML element with `id="autoAdvance"` that is a checkbox input, so that the existing `document.getElementById("autoAdvance")` reference resolves to a non-null value.
2. WHEN the `autoAdvance` checkbox is checked and audio playback ends, THE Audio_Narrator SHALL post an `AUTO_NEXT_PANEL` message to the embedded story iframe.
3. WHEN the `autoAdvance` checkbox is unchecked, THE Audio_Narrator SHALL NOT post an `AUTO_NEXT_PANEL` message when audio playback ends.
4. THE Audio_Narrator SHALL render the `autoAdvance` checkbox inside a labelled UI card so that its purpose is visible to the user.

---

### Requirement 2: Fix Undefined `--mint` CSS Variable

**User Story:** As a user, I want the Audio Narrator page to display its background colour correctly, so that the page looks intentional and polished.

#### Acceptance Criteria

1. THE Audio_Narrator SHALL define `--mint: #00FF7F` inside its `:root` CSS block.
2. WHEN the Audio_Narrator page is rendered, THE Audio_Narrator SHALL display a background colour that matches the `--mint` value rather than falling back to `transparent`.

---

### Requirement 3: Fix Hardcoded Panel Count in Story Viewer

**User Story:** As a developer, I want the Story Viewer to derive panel count dynamically, so that adding or removing panels does not require manual code changes.

#### Acceptance Criteria

1. THE Story_Viewer SHALL derive the total panel count from `story.panels.length` rather than the hardcoded literal `6`.
2. WHEN navigating panels, THE Story_Viewer SHALL evaluate the "next panel" boundary condition as `currentPanel >= story.panels.length - 1` rather than `currentPanel > 5`.
3. WHEN rendering dot indicators, THE Story_Viewer SHALL generate exactly `story.panels.length` dots.
4. WHEN displaying the panel badge label (e.g. "Panel 1 / 6"), THE Story_Viewer SHALL substitute the total count with `story.panels.length`.
5. WHEN a story with a panel count other than 6 is loaded, THE Story_Viewer SHALL navigate correctly from the first panel to the last panel without skipping or overflowing.

---

### Requirement 4: API Key Security Warning and Proxy Guidance

**User Story:** As a developer, I want clear guidance on protecting the ElevenLabs API key, so that the key is not accidentally committed to a public repository or exposed in production.

#### Acceptance Criteria

1. THE App SHALL include a `.gitignore` file that lists `config.js` as an ignored file.
2. THE Config_File SHALL contain a prominent comment warning that the file must not be committed to version control and must be added to `.gitignore`.
3. THE Audio_Narrator SHALL display a visible in-page warning banner WHEN the ElevenLabs API key is present in `config.js` at page load, informing the user that client-side API keys are not secure for production and recommending a backend proxy.
4. THE Config_File SHALL contain a comment describing the recommended backend proxy pattern: route TTS requests through a server-side endpoint that injects the API key, so the key is never sent to the browser.
5. IF the `CONFIG.ELEVENLABS_API_KEY` value is an empty string, THEN THE Audio_Narrator SHALL silently skip the security warning banner and proceed with Browser_TTS fallback.

---

### Requirement 5: ElevenLabs API Error State

**User Story:** As a user, I want to see a clear message when audio narration fails, so that I know what happened and can still enjoy the story.

#### Acceptance Criteria

1. WHEN an ElevenLabs API call returns a non-2xx HTTP status, THE Audio_Narrator SHALL display a human-readable error message in the status bar that includes the HTTP status code.
2. WHEN an ElevenLabs API call fails due to a network error, THE Audio_Narrator SHALL display a status bar message indicating that the network request failed.
3. WHEN any ElevenLabs error occurs, THE Audio_Narrator SHALL automatically fall back to Browser_TTS and display the fallback banner.
4. WHEN Browser_TTS is not available in the current browser, THE Audio_Narrator SHALL display a status bar message stating that no speech engine is available.
5. THE Audio_Narrator SHALL NOT leave the status bar in a loading state ("⏳ Loading audio…") after an error has occurred.

---

### Requirement 6: Progress Reset Mechanism

**User Story:** As a child user, I want to be able to start fresh, so that I can replay stories and re-earn rewards.

#### Acceptance Criteria

1. THE Home_Page SHALL provide a "Reset Progress" control that is accessible from the main page.
2. WHEN the user activates the Reset Progress control, THE Home_Page SHALL display a confirmation prompt before clearing any data.
3. WHEN the user confirms the reset, THE Home_Page SHALL remove the `kidsDC_stars`, `kidsDC_badges`, and `kidsDC_lang` keys from LocalStorage.
4. WHEN the reset is confirmed, THE Home_Page SHALL update the progress bar to reflect 0 stars without requiring a full page reload.
5. WHEN the user cancels the confirmation prompt, THE Home_Page SHALL leave all LocalStorage data unchanged.

---

### Requirement 7: Expanded Quiz Question Pool

**User Story:** As a child user, I want more quiz questions per genre, so that retaking a quiz feels fresh and I am not shown the same questions every time.

#### Acceptance Criteria

1. THE Quiz_Page SHALL store at least 6 questions per genre in its question data.
2. WHEN a quiz session starts, THE Quiz_Page SHALL randomly select 3 questions from the available pool for that genre.
3. WHEN the same genre quiz is retaken in the same browser session, THE Quiz_Page SHALL present a different random selection of 3 questions with a probability of at least 50% that at least one question differs from the previous session.
4. THE Quiz_Page SHALL ensure that each selected question has exactly 3 answer options and exactly 1 correct answer.

---

### Requirement 8: Offline Support via Service Worker

**User Story:** As a child user in an area with unreliable internet, I want the app to work offline after the first visit, so that I can read stories without an internet connection.

#### Acceptance Criteria

1. THE App SHALL include a Service_Worker script file (`service-worker.js`) that is registered from `index.html` on page load.
2. WHEN the Service_Worker is installed, THE Service_Worker SHALL cache the following assets: `index.html`, `story-viewer.html`, `audio-narrator.html`, `quiz-rewards.html`, `config.js`, and the Google Fonts stylesheet URL used by the app.
3. WHEN a cached asset is requested and the network is unavailable, THE Service_Worker SHALL serve the cached version of that asset.
4. WHEN a cached asset is requested and the network is available, THE Service_Worker SHALL use a cache-first strategy and serve the cached version.
5. IF the Service_Worker registration fails, THEN THE App SHALL continue to function normally without offline support and SHALL NOT display an error to the user.

---

### Requirement 9: Remove Development Artefact from Deployment

**User Story:** As a developer, I want the planning SVG file excluded from the deployed app, so that the production build does not contain internal design documents.

#### Acceptance Criteria

1. THE App SHALL include a `.gitignore` entry for `kids_digital_comic_plan.svg`.
2. THE App repository SHALL NOT include `kids_digital_comic_plan.svg` in any committed state intended for production deployment.

---

### Requirement 10: Correct Copyright Year

**User Story:** As a user, I want the footer copyright year to be accurate, so that the app appears current and professionally maintained.

#### Acceptance Criteria

1. THE Home_Page SHALL display a footer copyright year of 2026.
2. THE Home_Page footer copyright text SHALL read "© 2026 Kids Digital Comic · All ages welcome 🌍".

---

### Requirement 11: SEO and Social Sharing Metadata

**User Story:** As a developer, I want the app pages to have meta descriptions and Open Graph tags, so that the app is discoverable by search engines and renders a rich preview when shared on social media.

#### Acceptance Criteria

1. THE Home_Page SHALL include a `<meta name="description">` tag with a concise description of the app of no more than 160 characters.
2. THE Home_Page SHALL include `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:type">` Open Graph tags.
3. THE Story_Viewer SHALL include a `<meta name="description">` tag.
4. THE Audio_Narrator SHALL include a `<meta name="description">` tag.
5. THE Quiz_Page SHALL include a `<meta name="description">` tag.

---

### Requirement 12: Favicon

**User Story:** As a user, I want the app to display a favicon in the browser tab, so that the tab is easily identifiable when multiple tabs are open.

#### Acceptance Criteria

1. THE App SHALL include a favicon file (`favicon.ico` or an SVG/PNG equivalent) in the root directory.
2. THE Home_Page SHALL include a `<link rel="icon">` tag in its `<head>` that references the favicon file.
3. THE Story_Viewer SHALL include a `<link rel="icon">` tag in its `<head>` that references the same favicon file.
4. THE Audio_Narrator SHALL include a `<link rel="icon">` tag in its `<head>` that references the same favicon file.
5. THE Quiz_Page SHALL include a `<link rel="icon">` tag in its `<head>` that references the same favicon file.
