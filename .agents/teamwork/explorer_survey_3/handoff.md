# Handoff Report — Explorer Survey 3: Views Theming & Verification Infrastructure

## 1. Observation
1. **Test Runner & Existing Test Count**:
   - `package.json:9`: `"test": "node --test --test-isolation=none tests/*.test.js"`.
   - Execution of `npm test`:
     ```
     ✔ Empirical Stress M3-6: CSS hard-hiding rules and theme selector verification (0.818ms)
     ℹ tests 109
     ℹ suites 0
     ℹ pass 109
     ℹ fail 0
     ℹ cancelled 0
     ℹ skipped 0
     ℹ todo 0
     ℹ duration_ms 1099.7647
     ```
     Exit code: `0`. There are exactly 109 unit tests across 16 test files in `tests/`, running via Node's native `node:test` without Vitest or Jest.
2. **Build Execution**:
   - `package.json:8`: `"build": "vite build"`.
   - Execution of `npm run build`:
     ```
     vite v7.3.6 building client environment for production...
     transforming...
     ✓ 1601 modules transformed.
     rendering chunks...
     dist/index.html                     1.63 kB │ gzip:   0.72 kB
     dist/assets/index-DNOj0OGZ.css     74.45 kB │ gzip:  15.08 kB
     dist/assets/index-CRdltJX7.js     247.39 kB │ gzip:  77.17 kB
     dist/assets/firebase-DvpDwDg2.js  545.49 kB │ gzip: 162.06 kB
     ✓ built in 3.89s
     ```
     Exit code: `0`.
3. **Format Check Execution**:
   - `package.json:12`: `"format:check": "prettier --check ."`.
   - Execution of `npm run format:check`:
     ```
     Checking formatting...
     [warn] src/main.js
     [warn] src/multiplayer.js
     [warn] src/style.css
     [warn] src/views/multiplayer.js
     [warn] tests/audio.test.js
     [warn] tests/multiplayer.test.js
     Code style issues found in 6 files. Run Prettier with --write to fix.
     ```
     Exit code: `1`. Prettier detected unformatted syntax in 6 pre-existing repository files.
4. **Current Views and Routing in `src/main.js`**:
   - Line 48: `let view = 'home';`
   - Lines 266-276:
     ```javascript
     const body = session
       ? sessionView(ctx)
       : view === 'home'
         ? homeView(ctx)
         : view === 'exams'
           ? examsView(ctx)
           : view === 'multiplayer'
             ? multiplayerView(ctx)
             : view === 'progress'
               ? progressView(ctx)
               : guideView(ctx);
     ```
   - Lines 484-492:
     ```javascript
     function navigate(id) {
       flush();
       if (view === 'multiplayer' && id !== 'multiplayer') {
         resetMultiplayerView(user?.uid);
       }
       session = null;
       view = id;
       render(true);
     }
     ```
   - Routes `/vocabulary` and `/particles` are not yet wired into `main.js`.
5. **Vocabulary and Particle Datasets**:
   - `src/vocabulary-data.js`: Exports `kanjiList` (43 kanji, 180 compounds) and `vocabularyList` (170+ words across lessons 3, 4, 5). Currently only imported in `src/multiplayer.js:15`.
   - `src/particles.js`: Contains particle definitions and reduction logic.
   - `src/views/particles.js`: Only exports `particleSessionView(ctx, q, ratings)`. There is currently no top-level view for `/particles`.
6. **Existing Kawaii Cards and CSS Hard-Hiding Rules**:
   - `src/views/exams.js:8-18` & `src/style.css:3653-3705`: `.anime-figure.exam-anime-banner-card` with `mascot_cheer.jpg`, `.exam-anime-omamori`, `h3`, `p`.
   - `src/views/guide.js:101-114` & `src/style.css:3761-3829`: `.anime-figure.guide-anime-hero-card` with `mascot_peek.jpg`, `.guide-anime-bubble`, `.guide-anime-tag`.
   - `src/views/progress.js:21-34` & `src/style.css:3707-3759`: `.anime-figure.progress-anime-hero-card` with `.progress-rank-badge`.
   - `src/style.css:2494-2508`:
     ```css
     :root:not([data-theme='sakura']) .anime-figure,
     html:not([data-theme='sakura']) .anime-figure,
     [data-theme='classic'] .anime-figure,
     :root:not([data-theme='sakura']) .sound-toggle,
     ... {
       display: none !important;
     }
     ```
     Verified by `tests/stress_m3.test.js:250-265`.

---

## 2. Logic Chain
1. **Need for dedicated views**: The acceptance criteria explicitly state:
   *"The Vocabulary view (`/vocabulary`) and Particle view (`/particles`) render dedicated kawaii banner/encouragement cards when Sakura mode is active."*
   Based on Observation 4 and 5, neither route currently exists in `main.js`. Therefore, the implementer must:
   - Add path synchronization in `src/main.js` (reading `window.location.pathname` and calling `history.pushState`).
   - Create `src/views/vocabulary.js` rendering `vocabularyView(ctx)` using data from `src/vocabulary-data.js`.
   - Extend `src/views/particles.js` to export a top-level `particlesView(ctx)` for the standalone `/particles` route.
2. **Visual Consistency**:
   From Observation 6, existing banner cards follow an identical design architecture:
   - Container with class `.anime-figure` and a view-specific modifier (e.g. `.vocab-anime-banner-card`, `.particle-anime-banner-card`).
   - 85x85px anime mascot image (`/anime/encourage.jpg` for vocabulary, `/anime/mascot_peek.jpg` or `study.jpg` for particles).
   - Pill badge with omamori / Sakura styling (`border-radius: 9999px`, `#ffffff` background, pink border).
   - Joyful Japanese speech bubble (`.kawaii-speech-bubble` or inner bubble) with encouraging Swedish text.
   - Pastel background gradient with `2px dashed #f472b6` border and `border-radius: 20px`.
3. **Hard-Hiding Enforcement**:
   From Observation 6, `tests/stress_m3.test.js` enforces the presence of `:root:not([data-theme='sakura']) .anime-figure { display: none !important; }`. Conditioning with `${ctx.theme === 'sakura' ? html`...` : ''}` ensures elements are omitted from the DOM in Classic mode, and the `.anime-figure` CSS class provides defense-in-depth against accidental visual leaks in Classic mode.
4. **Verification Gate**:
   From Observation 1, 2, and 3:
   - `npm test` has 109 tests passing; any additions must maintain 0 failures and 0 regressions.
   - `npm run build` is healthy and builds in ~3.9s.
   - `npm run format:check` currently fails due to 6 unformatted files. Running `npm run format` is mandatory before final verification to meet acceptance criteria.

---

## 3. Caveats
- **Read-Only Scope**: Explorer 3 performed read-only investigations; no source files were modified. The formatting failure in `npm run format:check` was observed on pre-existing code and must be fixed during the implementation phase.
- **URL Routing Strategy**: While browser pathname routing (`/vocabulary`, `/particles`) can be managed with `history.pushState` and `window.location.pathname`, Vite's dev server and preview server natively fallback to `index.html` for single-page applications. No custom server configuration is needed.

---

## 4. Conclusion
The path to satisfying Requirement R5 and all testing/build acceptance criteria is clear:
1. Implement client-side path handling in `src/main.js` for `/vocabulary` and `/particles`.
2. Create `src/views/vocabulary.js` and extend `src/views/particles.js` to render dedicated views with `.anime-figure` banner cards in Sakura mode.
3. Style the cards in `src/style.css` using the established pastel gradient, omamori pill badge, and dashed border pattern (`encourage.jpg` for vocabulary, `mascot_peek.jpg` for particles).
4. Add automated tests in `tests/` asserting that `/vocabulary` and `/particles` render banner cards in Sakura mode and omit them in Classic mode.
5. Execute `npm run format` to clean up Prettier violations across the 6 flagged files, ensuring `npm run format:check`, `npm test`, and `npm run build` all exit 0.

---

## 5. Verification Method
To independently verify these findings:
1. **Run Unit Tests**:
   ```powershell
   npm test
   ```
   *Expected*: Passes 109 tests with 0 failures in ~1.1s.
2. **Run Build**:
   ```powershell
   npm run build
   ```
   *Expected*: Exits code 0 in ~4s.
3. **Run Format Check**:
   ```powershell
   npm run format:check
   ```
   *Expected currently*: Exits code 1, flagging `src/main.js`, `src/multiplayer.js`, `src/style.css`, `src/views/multiplayer.js`, `tests/audio.test.js`, `tests/multiplayer.test.js`.
4. **Inspect CSS Hard Hiding & Theme Selectors**:
   Inspect `src/style.css:2494-2508` and verify against `tests/stress_m3.test.js:244-275`.
5. **Inspect Existing Sakura Banner Cards**:
   Inspect `src/views/exams.js:8-18` and `src/views/guide.js:101-114`.
