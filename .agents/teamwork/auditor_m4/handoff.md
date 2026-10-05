# Forensic Audit Report: Milestone M4 (TentaPlugg)

**Work Product**: TentaPlugg codebase across Milestones M1–M4 (`src/engine.js`, `src/views/session.js`, `src/views/guide.js`, `src/views/home.js`, `src/style.css`, `src/main.js`, `tests/engine.test.js`, `test/requirements.test.js`, and associated test suites)  
**Profile**: General Project  
**Integrity Mode**: Development Mode (as specified in `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

## 1. Observation

Direct empirical evidence obtained across all forensic verification checks:

1. **Test Suite Execution (`npm test`)**:
   - Command: `npm test` (`node --test --test-isolation=none tests/*.test.js`)
   - Outcome: **86 passed, 0 failed, 0 skipped, 0 cancelled, 0 todo** in 231.95ms.
   - Breakdown:
     - 24/24 original unit tests in `tests/engine.test.js` continue to pass.
     - 17/17 requirement-driven tests in `test/requirements.test.js` (Tiers 1–4) pass.
     - 9/9 Leitner SRS stress tests in `tests/stress_m2.test.js` pass.
     - 6/6 Theme & persistence stress tests in `tests/stress_m3.test.js` pass.
     - 4/4 Session sizing & review flow tests in `tests/session_stress.test.js` pass.
     - 5/5 Regression tests in `tests/audit-regressions.test.js` pass.
     - 21/21 Additional pedagogy, particles, speech, and storage tests pass.

2. **Production Build (`npm run build`)**:
   - Command: `npm run build` (`vite build`)
   - Outcome: Exit code 0, 1595 modules transformed, production assets generated cleanly in 2.23s:
     - `dist/index.html` (1.16 kB)
     - `dist/assets/index-873LvxtP.css` (39.91 kB)
     - `dist/assets/index-D-uJxOOv.js` (133.80 kB)
     - `dist/assets/firebase-BN_uS7yZ.js` (531.30 kB)

3. **Prohibited Patterns Inspection**:
   - **Hardcoded test outputs / string-matching mocks**: Scanned project source (`src/engine.js`, `src/main.js`, `src/session.js`, etc.). Real algorithm execution verified: dynamic Leitner interval progression (`nextStat`), genuine normalization (`NFKC` + punctuation removal), real distractor mapping in `getContrastiveFeedback`, dynamic session filtering in `selectPractice`. Zero fake test mocks found.
   - **Facade implementations**: No stubbed or empty functions returning constant values or raising `NotImplementedError`. All public APIs (`nextStat`, `rebuildStats`, `migrate`, `getContrastiveFeedback`, `selectPractice`, `scoreAttempt`, `formatInterval`, `previewRatingInterval`, `resolveGuideId`) contain complete functional logic.
   - **Fabricated verification outputs / pre-populated artifacts**: Scanned workspace for unexpected `.log`, `.txt`, result or attestation artifacts. Only standard Firebase emulator log (`firestore-debug.log`) present. Zero pre-populated audit files or fake verification dumps.
   - **Fake overflow masking (`overflow-x: hidden`)**: Zero occurrences of `overflow-x: hidden` in `src/style.css` or anywhere in `src/`. No masking applied to `:root`, `html`, or `body`. Valid `overflow: hidden` strictly confined to localized UI components (`.focus-panel` rounded corners, `.mini-track` progress bars, and `.sr-only` accessibility utility).
   - **Test tampering / skipped tests**: Scanned all test files in `tests/` and `test/` for `.skip`, `xit`, `xtest`, and `.todo`. Exactly zero skipped or disabled tests found.

4. **Component & Requirement Forensics**:
   - **R1: Contrastive Feedback & Snabbguide Modal (`src/engine.js`, `src/views/session.js`, `src/views/guide.js`)**:
     - `getContrastiveFeedback(q, userAnswer)` returns pedagogical explanation and `guideId` (`ni-de`, `wa-ga`, `wo-to-no-mo`, `no-particle`, `questions`, etc.) when common particle distractors are selected (e.g. `に` instead of `で`, `で` instead of `に`, `は` instead of `が`).
     - Returns `null` when the answer is correct (including alternatives and whitespace).
     - `sessionView` renders `.contrastive-callout` with "Ditt val:" vs "Godtagna svar:" and "Så hänger det ihop".
     - Non-destructive dialog (`<dialog class="guide-modal">`) opens via `openGuideModal(guideId)` without resetting or mutating `session` state. Closing dialog restores focus and returns student to exact question state.
   - **R2: Spaced Repetition & Session Sizing (`src/engine.js`, `src/views/home.js`, `src/views/session.js`)**:
     - Home view renders segmented pill selector with options: `5`, `10`, `20`, and `Alla förfallna (${p.due})`.
     - Keyboard accessibility supported via ArrowLeft/ArrowRight/ArrowUp/ArrowDown on `role="radiogroup"`.
     - 4 self-rating buttons rendered during practice feedback: `1 Igen` (resets to Box 0, +10m), `2 Svårt` (maintains box, <= 1d), `3 Bra` (advances box by 1), `4 Lätt` (advances box by 2, capped at Box 4). Keyboard shortcuts `1`–`4` supported.
     - Schema version 2 (`SCHEMA_VERSION = 2`) preserved; backwards compatible with legacy boolean `ok` reviews without triggering data wipes.
   - **R3: Sakura Anime Vibes Theme & Assets (`src/style.css`, `src/main.js`, `public/anime/`)**:
     - Theme toggle smoothly switches between `🎓 Klassiskt tema` and `🌸 Sakura Anime`.
     - Preference persisted to `localStorage.getItem('tentaplugg-theme')`.
     - Head script in `index.html` evaluates theme before DOM render to prevent flash of unstyled theme (FOUT).
     - Anime assets present on disk in `public/anime/`: `study.jpg` (524 kB), `cheer.jpg` (638 kB), `encourage.jpg` (552 kB).
     - Hard-hiding rule enforced: `:root:not([data-theme='sakura']) .anime-figure, html:not([data-theme='sakura']) .anime-figure, [data-theme='classic'] .anime-figure { display: none !important; }`. Anime figures are completely hidden in Classic mode.
     - Contrast ratios meet WCAG AA (>= 4.5:1): Classic body text `#243e36` on `#f8faf8` = 11.02:1; Sakura body text `#3b1d28` on `#fff5f8` = 14.13:1; Sakura primary button `#ffffff` on `#b82763` = 5.99:1.
     - Layout responsiveness verified down to 320px width with 0px horizontal overflow across viewports (52/52 Playwright viewport tests pass).

---

## 2. Logic Chain

1. **Premise 1**: Under the Development Mode rules defined in `ORIGINAL_REQUEST.md`, code must not contain hardcoded test results, facade implementations, pre-populated artifacts, fake overflow masking, or test tampering.
2. **Premise 2**: Direct inspection confirms that `src/engine.js`, `src/views/session.js`, `src/views/guide.js`, `src/views/home.js`, `src/style.css`, and `src/main.js` contain genuine, authentic implementations for all features.
3. **Premise 3**: Direct execution of `npm test` demonstrates 100% test pass rate (86 passing, 0 failing, 0 skipped) across all unit, requirement, and empirical stress test suites.
4. **Premise 4**: Direct execution of `npm run build` confirms that the production Vite build completes with zero errors.
5. **Premise 5**: CSS audit confirms no fake root overflow masking (`overflow-x: hidden` is absent), WCAG AA contrast compliance is satisfied (11.02:1 Classic, 14.13:1 Sakura), and mobile responsiveness down to 320px is verified.
6. **Premise 6**: Anime mascots (`study.jpg`, `cheer.jpg`, `encourage.jpg`) are displayed tastefully in Sakura mode and strictly hidden via CSS `display: none !important` in Classic mode.
7. **Conclusion**: All acceptance criteria are satisfied with authentic implementations and zero integrity violations. The work product is certified **CLEAN**.

---

## 3. Caveats

1. **E2E Test Seed Assumption**:
   - In `tests/e2e/quickguide_modal_stress.spec.js`, Test 7 ("Contrastive callout in session renders BookOpen icon and opens corresponding guide card") starts a practice session via "Träna partiklar" without specifying an explicit topic or seed. Because `selectPractice` uses daily pseudo-random seeding (`seed = dayKey(now)`), on dates where exam question IDs (`gema70-3-*`) are sorted ahead of lesson gap-fill questions (`l5-*`), the session serves exam questions where `guideId` is intentionally `null` (as tested in `tests/pedagogy.test.js:66`). When running Playwright E2E suites independently, either mock/pass a consistent date seed or ensure at least one particle gap-fill item is due. This is a test harness observation, not an implementation integrity defect.
2. **Headless Browser Concurrency**:
   - Running full multi-browser Playwright suites with 3 parallel workers concurrently with Vite dev server requires sufficient port binding headroom; single-worker or sequential execution runs cleanly.

---

## 4. Conclusion

The work product for Milestone M4 has undergone rigorous forensic integrity analysis and fulfills all constraints and acceptance criteria in `ORIGINAL_REQUEST.md`:
- Leitner SRS math, session sizing (5, 10, 20, all due), and schema v2 preservation are sound.
- Contrastive feedback, distractor callouts, and non-destructive Quick Guide lookup operate authentically.
- Sakura Anime Vibes theme and Classic theme function properly with persistent storage, WCAG AA compliance, and strict anime mascot hiding in Classic mode.
- Build and test commands execute cleanly.

**Final Verdict**: **CLEAN**

---

## 5. Verification Method

To independently reproduce the forensic verification findings:

1. **Execute Unit and Requirement Test Suite**:
   ```bash
   npm test
   ```
   *Expected outcome*: 86 passing tests, 0 failures, 0 skipped.

2. **Execute Production Build**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Vite builds cleanly without errors into `dist/`.

3. **Verify Zero Fake Overflow Masking**:
   ```bash
   grep -rn "overflow-x" src/
   ```
   *Expected outcome*: 0 matches.

4. **Verify Zero Skipped Tests**:
   ```bash
   grep -rn "\.skip" tests/ test/
   ```
   *Expected outcome*: 0 matches.

5. **Verify Hard Hiding Rule for Anime Mascots**:
   ```bash
   grep -n "anime-figure" src/style.css
   ```
   *Expected outcome*: Rule `:root:not([data-theme='sakura']) .anime-figure` sets `display: none !important;`.
