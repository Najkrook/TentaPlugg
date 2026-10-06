# Handoff Report: UI & Theme Architecture Survey

**Agent**: Explorer Survey 1  
**Milestone**: Survey Phase — Ultra Kawaii Upgrade  
**Working Directory**: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1`  
**Date**: 2026-10-06  

---

## 1. Observation

1. **Sidebar Template Location**:
   - `src/main.js` lines 278–313: Desktop sidebar is rendered inline inside `renderTemplate(html`<aside class="sidebar">...`, app)`.
   - Contains `.brand` (lines 280–288), `<nav>` with 5 buttons (lines 289–291), and `.side-bottom` (lines 292–312).
   - Currently, there is no mascot markup rendered inside `aside.sidebar`.

2. **Pre-Existing Sidebar Chibi CSS**:
   - `src/style.css` lines 2886–2947: Dedicated CSS for `[data-theme='sakura'] .sidebar-chibi-card`, `.sidebar-chibi-img-wrap`, and `.sidebar-chibi-bubble` already exists verbatim.
   - `public/anime/mascot_peek.jpg` exists on disk (verified 1024x1024 JPEG of pink-haired catgirl chibi peeking over a card).

3. **Theme State & Storage Mechanism**:
   - `index.html` lines 12–25: Early head script checks `localStorage.getItem('tentaplugg-theme')` and sets `document.documentElement.dataset.theme = 'sakura'` or `'classic'`.
   - `src/main.js` lines 76–86 (`applyTheme`), lines 87–93 (`toggleTheme`), lines 111–120 (`setTheme`).
   - `storage.js` / `main.js`: Stored under key `'tentaplugg-theme'` and synced into state payload.
   - `src/audio.js` line 112: `playAnimeSound` strictly enforces `if (theme !== 'sakura' || muted || volume <= 0) return false;`.

4. **Hard-Hiding Rules & Test M3-6 Assertion**:
   - `src/style.css` lines 2495–2508:
     ```css
     :root:not([data-theme='sakura']) .anime-figure,
     html:not([data-theme='sakura']) .anime-figure,
     [data-theme='classic'] .anime-figure,
     :root:not([data-theme='sakura']) .sound-toggle,
     html:not([data-theme='sakura']) .sound-toggle,
     [data-theme='classic'] .sound-toggle,
     :root:not([data-theme='sakura']) .sound-slider-wrapper,
     html:not([data-theme='sakura']) .sound-slider-wrapper,
     [data-theme='classic'] .sound-slider-wrapper,
     :root:not([data-theme='sakura']) .sound-slider,
     html:not([data-theme='sakura']) .sound-slider,
     [data-theme='classic'] .sound-slider {
       display: none !important;
     }
     ```
   - `tests/stress_m3.test.js` lines 244–275 (`Empirical Stress M3-6`):
     Directly reads `src/style.css` as a raw text string and asserts exact presence of:
     `':root:not([data-theme="sakura"]) .anime-figure'`, `'html:not([data-theme="sakura"]) .anime-figure'`, `'[data-theme="classic"] .anime-figure'`, and `'display: none !important;'`.

5. **Button Styling & Playwright Test Selectors**:
   - Styles defined in `src/style.css`: `.primary`, `.secondary` (lines 421–460), `.theme-toggle` (lines 2444–2488), `.rating-btn` (lines 3507–3543).
   - `tests/e2e/app.spec.js` line 37: `getByRole('button', { name: q.self ? 'Visa modellösning' : 'Kontrollera svar', exact: true })` (runs in Classic mode).
   - `tests/e2e/pedagogy.spec.js` line 49: `getByRole('button', { name: 'Kontrollera svar', exact: true })` (runs in Classic mode).
   - `tests/e2e/session_flow_stress.spec.js` line 114: `getByRole('button', { name: /^(Kontrollera svar|Visa modellösning|Rätta meningen)$/ })` (runs in Classic mode).
   - `tests/e2e/theme_stress.spec.js` line 206: `getByRole('button', { name: 'Kontrollera svar' })` (runs in Sakura mode).
   - `tests/e2e/session_flow_stress.spec.js` line 126: selects rating buttons via `.rating-btn[data-rating="${rating}"]`.

6. **Responsive Layout & Overflow Tests**:
   - `src/style.css` line 1202 (`@media (max-width: 1100px)`): sidebar width adjusts to 205px.
   - `src/style.css` line 1244 (`@media (max-width: 760px)`): `.sidebar { display: none; }`.
   - `tests/e2e/viewport_overflow_stress.spec.js`: strict test asserting 0px overflow across 320px, 360px, 375px, 390px, 414px, 768px, 1024px.
   - Baseline suite status: `npm test` passes all 109 unit tests (exit code 0); `npm run build` succeeds in 1.62s.

---

## 2. Logic Chain

1. **Sidebar Integration (R1)**:
   - Observation 1 shows `aside.sidebar` has space between `<nav>` and `.side-bottom` (`margin-top: auto;`).
   - Observation 2 confirms that CSS classes (`.sidebar-chibi-card`, `.sidebar-chibi-img-wrap`, `.sidebar-chibi-bubble`) and the asset (`/anime/mascot_peek.jpg`) already exist.
   - Observation 4 mandates that any anime element must have class `.anime-figure` and be conditionally rendered only when `state.theme === 'sakura'`.
   - *Therefore*: Adding `<div class="anime-figure sidebar-chibi-card">` between `<nav>` and `.side-bottom` in `src/main.js` conditionally when `state.theme === 'sakura'` will immediately activate the mascot with zero regression to Classic mode.

2. **Hard-Hiding Invariants**:
   - Observation 4 shows test M3-6 string-matches existing CSS selectors.
   - *Therefore*: Implementers must NOT alter or delete existing selector lines in `src/style.css`. Giving the sidebar mascot the class `.anime-figure` automatically inherits the existing tested rule.

3. **Bouncy / Jelly Micro-interactions (R4)**:
   - Observation 5 shows `.primary`, `.secondary`, `.theme-toggle`, `.rating-btn`, `.topic-card` have standard linear transitions.
   - *Therefore*: Introducing `cubic-bezier(0.34, 1.56, 0.64, 1)` hover lift (`translateY(-3px) scale(1.03)`) and active squish (`translateY(1px) scale(0.96)`) under `[data-theme='sakura']` delivers the required jelly feeling without affecting Classic mode.

4. **Kaomoji Integration Test Safety (R4)**:
   - Observation 5 shows Classic mode E2E tests strictly check `name: 'Kontrollera svar', exact: true`.
   - *Therefore*: Classic mode text must remain 100% clean. In Sakura mode, action buttons should enclose decorative kaomojis within `<span class="kaomoji" aria-hidden="true">` to maintain accessible name parity while rendering kaomojis visually. Rating buttons can directly incorporate kaomojis (`Igen (｡•́︿•̀｡)`, `Svårt (´-﹏-`；)`, `Bra (o^▽^o)`, `Lätt (★ω★)`) because tests select by `[data-rating]`.

5. **Responsive Sidebar Safety**:
   - Observation 6 shows `.sidebar` has fixed height `100dvh` without `overflow-y: auto`. Adding a ~130px card in a short window (< 700px height) could clip `.side-bottom`.
   - *Therefore*: Adding `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` ensures stability on short viewports. Mobile viewports (<= 760px) naturally hide `.sidebar` via existing CSS line 1244.

---

## 3. Caveats

1. **Prettier Formatting Baseline**: Running `npm run format:check` currently detects existing code style warnings in 6 files (`main.js`, `multiplayer.js`, `style.css`, `views/multiplayer.js`, `tests/audio.test.js`, `tests/multiplayer.test.js`). Implementers must run `npm run format` prior to final verification.
2. **Audio File Mapping**: `public/anime/sounds/ara_ara.mp3` exists on disk, but in `src/audio.js` line 48 `ara_ara` is mapped to `wow.mp3`. Updating this mapping to `/anime/sounds/ara_ara.mp3` will allow proper "ara ara" dialogue sounds.
3. **No Direct Code Modifications**: As a Survey Explorer, all investigations were strictly read-only. No application code has been modified.

---

## 4. Conclusion

The architecture is primed for the Ultra Kawaii upgrade:
1. **R1**: Render the peeking chibi card (`/anime/mascot_peek.jpg`) in `src/main.js` inside `aside.sidebar` under `${state.theme === 'sakura' ? ... : ''}` with class `anime-figure sidebar-chibi-card`. Add `overflow-y: auto` to `.sidebar`.
2. **R3**: Add interactive click handler cycling dialogue strings and audio (`arigato`, `tuturu`, `wow`, `ara_ara`) to both the study panel mascot and the new sidebar mascot.
3. **R4**: Apply jelly spring hover/active transforms under `[data-theme='sakura']` in `src/style.css`, while preserving `@media (prefers-reduced-motion: reduce)`. Keep Classic mode button labels unadorned; enrich Sakura mode rating buttons with kaomojis and action buttons with aria-hidden kaomoji spans.
4. **Hard-Hiding Rules**: Completely intact and strictly verified by both CSS text assertions and Playwright count assertions.

---

## 5. Verification Method

To verify these architectural findings independently:

1. **Unit & Stress Test Suite**:
   ```powershell
   npm test
   ```
   *Expected outcome*: Passes all 109 tests with 0 failures, including `Empirical Stress M3-6`.

2. **Build Verification**:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Vite exits with code 0.

3. **Inspect Style & Markup Locations**:
   - `src/style.css`: Lines 2495–2508 (hard-hiding rules) and 2886–2947 (sidebar chibi styles).
   - `src/main.js`: Lines 278–313 (sidebar markup) and 76–120 (theme functions).
   - `public/anime/`: Check for `mascot_peek.jpg`, `study.jpg`, `cheer.jpg`, `encourage.jpg`.
