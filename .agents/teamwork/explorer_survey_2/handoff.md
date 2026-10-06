# Handoff Report: Explorer Survey 2 (Mascot Interaction, Audio System & Click Particles)

## 1. Observation
1. **Mascot Components & Locations**:
   - `src/views/home.js:103-125`: Study focus panel mascot rendered inside `.anime-figure.anime-study-panel`. Uses `/anime/study.jpg` inside `.anime-study-avatar-btn`. Static bubble text: `先輩、今日もいっしょにがんばろう！✨` / `Kämpa på, senpai! 💕`. Click handler currently triggers only `playAnimeSound('arigato', ctx.theme)`.
   - `src/views/session.js:120-141`: Feedback mascot using `/anime/cheer.jpg` (correct) or `/anime/mascot_cry.jpg` (wrong).
   - `src/views/session.js:320-340`: Result mascot using `/anime/cheer.jpg` and `/anime/stamp_sakura.jpg`.
   - `src/views/progress.js:21-34` and `src/views/exams.js:8-17`: Hero cards using `/anime/mascot_cheer.jpg`.
   - `src/views/guide.js:101-114`: Quick guide hero card using `/anime/mascot_peek.jpg`.
   - `src/main.js:278-313`: Desktop `<aside class="sidebar">` currently renders no mascot card.
   - `src/style.css:2887-2948`: Pre-existing CSS rules already define `.sidebar-chibi-card`, `.sidebar-chibi-img-wrap`, and `.sidebar-chibi-bubble` styled for Sakura mode (`[data-theme='sakura']`).

2. **Anime Image Assets**:
   - Directory `public/anime/` contains:
     - `study.jpg` (524,717 bytes)
     - `cheer.jpg` (638,920 bytes)
     - `encourage.jpg` (552,198 bytes)
     - `mascot_cheer.jpg` (633,452 bytes)
     - `mascot_cry.jpg` (527,409 bytes)
     - `mascot_peek.jpg` (435,565 bytes)
     - `stamp_sakura.jpg` (632,631 bytes)
   - All assets are valid non-empty JPEG files verified with magic bytes `0xFF 0xD8 0xFF` by `tests/stress_m3.test.js:228-242`.

3. **Audio Architecture**:
   - `src/audio.js:110-129`: `playAnimeSound(type, theme)` gates playback on `if (theme !== 'sakura' || muted || volume <= 0) return false;`.
   - `src/audio.js:43-66`: Caches `Audio` instances in singleton `sounds`. Sets `audio.currentTime = 0;` and swallows promise rejections via `.catch(() => {})`.
   - `src/audio.js:2-8`: Volume controlled via `BASE_VOLUME = 0.45` and default `volume = 0.5`. Mute state persisted under `tentaplugg-sound-muted`; volume under `tentaplugg-sound-volume`.
   - `public/anime/sounds/` contains: `tuturu.mp3` (277 KB), `arigato.mp3` (304 KB), `wow.mp3` (173 KB), `ara_ara.mp3` (173 KB), and `nani.mp3` (343 KB).

4. **Hard-Hiding Rules**:
   - `src/style.css:2495-2508`:
     `:root:not([data-theme='sakura']) .anime-figure, html:not([data-theme='sakura']) .anime-figure, [data-theme='classic'] .anime-figure, ... { display: none !important; }`
   - Tested by `tests/stress_m3.test.js:244-275` and `tests/e2e/theme_stress.spec.js:221-233`.

5. **Test Baseline**:
   - `npm test`: 109 tests run and pass in ~283ms with 0 failures.
   - `npm run build`: Vite build passes in 1.91s with 0 errors.

---

## 2. Logic Chain
1. **Mascot Placement & Asset Allocation**:
   - From Obs 1, the sidebar in `src/main.js` currently lacks a mascot card, while `src/style.css:2887-2948` already has styles for `.sidebar-chibi-card` and `.sidebar-chibi-bubble`.
   - From Obs 2, `public/anime/mascot_peek.jpg` depicts a peeking catgirl mascot matching R1's requirement ("display an interactive peeking chibi mascot card in the sidebar containing an anime avatar and an encouraging speech bubble").
   - Placing `<button type="button" class="anime-figure sidebar-chibi-card" ...>` inside `<aside class="sidebar">` (before `.side-bottom` or inside `.side-bottom`) satisfies R1 and immediately adopts existing styles.

2. **Hard-Hiding & Zero Leakage in Classic Mode**:
   - By giving both `.sidebar-chibi-card` and the particle overlay `.kawaii-particles-overlay` the `.anime-figure` class, the CSS selector in Obs 4 enforces `display: none !important;` in Classic mode.
   - Conditionally rendering them in Lit HTML (`${state.theme === 'sakura' ? html`...` : ''}`) guarantees they are removed from the DOM in Classic mode, satisfying Acceptance Criteria ("no anime figures, mascot cards, or sound controls are visible in the DOM or viewport").

3. **Poke-and-Talk Interaction (R3)**:
   - In `home.js`, the avatar button `.anime-study-avatar-btn` already exists and triggers audio (Obs 1).
   - In `tests/e2e/anime_sound.spec.js:114-140`, Playwright asserts that clicking `.anime-study-avatar-btn` triggers `arigato` without errors.
   - Therefore, introducing an 8-quote rotation catalogue (`MASCOT_QUOTES`) starting with `{ sound: 'arigato' }` advances the quote on each click, plays the cheerful audio via `playAnimeSound`, and preserves 100% test compatibility.

4. **Click Burst Particles (R2)**:
   - A single passive window listener on `click` reads `clientX` and `clientY` coordinates.
   - Gating on `state.theme === 'sakura'` and `window.matchMedia('(prefers-reduced-motion: reduce)')` prevents execution in Classic mode or under accessibility constraints.
   - Each click spawns 5-7 transient floating particles (`✨`, `💖`, `🌸`, `💕`, `⭐`) using CSS `animation: kawaii-burst-fly 0.75s forwards`.
   - Dual cleanup using `animationend` and `setTimeout(..., 1000)` along with an overlay child count ceiling ensures 0 memory leaks and 0 DOM bloat even under rapid clicking.

---

## 3. Caveats
- No changes were made to source files during this investigation (read-only constraint strictly honored).
- Prettier formatting check (`npm run format:check`) currently flags 6 pre-existing files; workers editing those files should run `npx prettier --write` to maintain clean formatting.
- The mobile viewport (`<= 760px`) hides the desktop sidebar (`.sidebar { display: none; }`); the peeking mascot will be visible on viewports `> 760px`.

---

## 4. Conclusion
1. **R1 (Sidebar Mascot)** is ready to implement: Add `.anime-figure.sidebar-chibi-card` in `src/main.js` using `/anime/mascot_peek.jpg` and pre-styled CSS classes from `src/style.css:2887`.
2. **R2 (Click Particles)** is fully specified: Implement `initClickParticles()` with dual cleanup (`animationend` + timeout safety fallback), reduced-motion detection, and overlay cleanup on theme switch.
3. **R3 (Poke-and-Talk Mascot Dialogue)** is fully mapped: Define `MASCOT_QUOTES` catalogue with Japanese text, kaomojis, Swedish subtitles, and cheerful sound cues; wire click handlers on study mascot and sidebar mascot.
4. Full architectural analysis and code templates are documented in `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\report.md`.

---

## 5. Verification Method
- **Unit Test Execution**:
  ```bash
  npm test
  ```
  Expected: All 109 tests pass in < 500ms with 0 regressions.
- **Build Verification**:
  ```bash
  npm run build
  ```
  Expected: Vite builds successfully with exit code 0.
- **Format Verification**:
  ```bash
  npm run format:check
  ```
- **Inspect Key Files**:
  - `src/audio.js`: Audio playback gating and sound mapping.
  - `src/style.css`: Hard-hiding rules at line 2495 and sidebar chibi rules at line 2887.
  - `src/views/home.js`: Study mascot structure at lines 103-125.
  - `tests/audio.test.js`: Audio unit tests.
