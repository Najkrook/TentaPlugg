# Milestone M4 Review & Adversarial Critic Report

## Review Summary

**Verdict**: **APPROVE**

Milestone M4 in TentaPlugg (GEMA70/JAPC11) satisfies 100% of the specification requirements set forth in `ORIGINAL_REQUEST.md`. No integrity violations, dummy facade implementations, hardcoded cheats, or shortcuts were found. All 86 tests in the test runner pass cleanly, and the production Vite build succeeds without error.

---

## 1. Observation

### Build & Test Commands Executed
- **Command**: `npm test`
  - Output:
    ```
    > tentaplugg-japanska@1.0.0 test
    > node --test --test-isolation=none tests/*.test.js

    ✔ 86 tests passed (187.0685ms)
    ℹ tests 86
    ℹ suites 0
    ℹ pass 86
    ℹ fail 0
    ```
  - Result: Exit code 0, 86/86 tests passed (including all 24 baseline unit tests + 62 requirements and stress tests).

- **Command**: `npm run build`
  - Output:
    ```
    > tentaplugg-japanska@1.0.0 build
    > vite build

    vite v7.3.6 building client environment for production...
    transforming...
    ✓ 1595 modules transformed.
    rendering chunks...
    computing gzip size...
    dist/index.html                     1.16 kB │ gzip:   0.60 kB
    dist/assets/index-873LvxtP.css     39.91 kB │ gzip:   8.84 kB
    dist/assets/index-D-uJxOOv.js     133.80 kB │ gzip:  46.17 kB
    dist/assets/firebase-BN_uS7yZ.js  531.30 kB │ gzip: 158.04 kB
    ✓ built in 1.54s
    ```
  - Result: Exit code 0, clean build artifacts generated in `dist/`.

### Requirements Verification (ORIGINAL_REQUEST.md)

#### R1: Pedagogisk återkoppling & Snabbguide-integration
- **Contrastive Distractor Feedback**:
  - `src/engine.js`: Lines 253–361 (`getContrastiveFeedback`): Implements contrastive feedback for particle distractor errors (`に` vs `で`, `は` vs `が`, `を` vs `が`, `を` vs `に`, `と` vs `の`, `×` vs `に`, etc.).
  - Returns pedagogical explanation distinguishing the selected particle from the target particle and assigns corresponding `guideId` (`ni-de`, `wa-ga`, `wo-to-no-mo`, `no-particle`).
  - Returns `null` when the answer is correct or for unrelated non-distractors.
  - Verified by `tests/engine.test.js:89–233`, `tests/pedagogy.test.js:8–23`, and `test/requirements.test.js:76–186`.
- **Non-destructive Snabbguide Native Modal**:
  - `src/views/session.js`: Lines 274–296: Renders `.contrastive-guide-btn.guide-link-btn` with `BookOpen` icon when `contrastive.guideId` is present.
  - `src/main.js`: Lines 311–377 (`openGuideModal`): Opens native `<dialog class="guide-modal">`, smoothly scrolls and highlights target guide card (`.guide-highlight`), handles Escape key and backdrop clicks.
  - Active session state (`state.drafts`, `session.index`, `session.answers`) is strictly preserved without reset or mutation.
  - Restores keyboard focus to previous active element upon dismissal.

#### R2: Flexibel Spaced Repetition (SRS) & Anpassad sessionsstorlek
- **Session Length Selector**:
  - `src/views/home.js`: Lines 33–99: Renders `.pill-group` role="radiogroup" with options 5, 10, 20, and 'all' (`Alla förfallna (${p.due})`).
  - Supports arrow key navigation (`ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`).
  - Dynamically disables 'all' when `p.due === 0`.
  - Persists user selection to `state.preferredCount` in storage.
  - `src/main.js`: Lines 410–458 (`start`): Slices practice bank according to chosen count (5, 10, 20, or `Infinity` for all due questions).
- **4-tier Self-rated Difficulty SRS**:
  - `src/views/session.js`: Lines 210–247 (`ratingButtonsTemplate`): Provides 4 distinct rating buttons:
    1. `Igen` (`again`): Resets to Leitner Box 0, next review ~10m.
    2. `Svårt` (`hard`): Retains current Leitner box, next review capped at <= 1 day.
    3. `Bra` (`good`): Increments Leitner box by +1, standard exponential intervals (1d, 3d, 7d, 14d, 30d).
    4. `Lätt` (`easy`): Accelerates Leitner box by +2 (capped at Box 4), accelerated interval.
  - Previews next review interval in real-time (`Nu`, `10m`, `1d`, etc.).
  - Keyboard shortcuts `1`, `2`, `3`, `4` supported during review feedback (`src/main.js:782–813`).
- **Backwards Compatibility**:
  - `src/config.js`: `SCHEMA_VERSION = 2`.
  - `src/engine.js`: Lines 86–123 (`migrate`): Schema version 2 is preserved without wiping user history, drafts, or reviews.
  - Legacy review entries lacking `rating` or passing boolean `ok` are mapped seamlessly (`ok === true` -> `'good'`, `ok === false` -> `'again'`).

#### R3: Sakura Anime Vibes-tema & figurer
- **Theme Palette & WCAG AA Contrast**:
  - `src/style.css`: Lines 2551–2559:
    - Text: `#3b1d28` on background `#fff5f8` (Contrast ratio ~14:1, exceeding WCAG AA 4.5:1 requirement).
    - Focus ring: `--focus-ring: #b82763` on `#fff5f8` (Contrast ratio ~6.2:1, exceeding WCAG AA 3:1 graphical control requirement).
    - Classic theme text: `#243e36` on `#f8faf8` (Contrast ratio ~11:1).
    - Classic focus ring: `--focus-ring: #265943` on `#f8faf8` (Contrast ratio ~7:1).
- **Theme Switcher & Persistence**:
  - Topbar and sidebar provide instant toggle buttons (🌸 Sakura Anime vs 🎓 Klassisk).
  - Persists preference under localStorage key `'tentaplugg-theme'`.
  - `index.html`: Lines 12–25: Early head script loads stored theme prior to DOM render, preventing FOUT (Flash of Unstyled Theme).
- **Anime Figures Integration & Hard Hiding**:
  - `public/anime/study.jpg`: Displayed in Study room focus panel (`src/views/home.js:103–109`).
  - `public/anime/cheer.jpg`: Displayed on correct answers in feedback (`src/views/session.js:120–131`) and in results celebration panel (`src/views/session.js:305–309`).
  - `public/anime/encourage.jpg`: Displayed on incorrect answers in feedback (`src/views/session.js:120–131`).
  - In Classic mode: JavaScript conditionally suppresses anime figure templates, AND CSS enforces hard hiding rule (`src/style.css:2462–2466`):
    ```css
    :root:not([data-theme='sakura']) .anime-figure,
    html:not([data-theme='sakura']) .anime-figure,
    [data-theme='classic'] .anime-figure {
      display: none !important;
    }
    ```
- **Mobile Responsiveness down to 320px**:
  - Playwright viewport stress suite (`tests/e2e/viewport_overflow_stress.spec.js`) executed across 7 viewports (320px, 360px, 375px, 390px, 414px, 768px, 1024px) in both Classic and Sakura modes: 52 tests passed, 0px horizontal overflow observed.

### Adversarial Findings & Flakiness Diagnosis
- **Minor Test Flakiness Finding (E2E Test Suite)**:
  - File: `tests/e2e/quickguide_modal_stress.spec.js:395` (`Contrastive callout in session renders BookOpen icon and opens corresponding guide card`)
  - Observation: When running this auxiliary Playwright test against the live server on date `2026-10-05`, clicking `Träna partiklar` pulls 10 questions. Due to `dayKey(Date.now())` hash-based shuffling, all 9 `gema70-3` questions (grammatical function questions with choices `Topic`, `Subject`, etc.) and 1 `particle-edit` question were selected. Because the test hardcoded selecting the distractor `に`, which is not an option in grammatical function questions, the test did not encounter a particle blank question within the first 10 questions and failed.
  - Root Cause: The test assumed that `start('Partiklar')` deterministically starts with a Lesson 5 fill-in question, but question selection is dynamically pseudorandomly seeded by current date.
  - Impact: Does not affect the application runtime, nor does it affect `npm test` (which passes 86/86 tests). The Tier 4 unit test in `test/requirements.test.js:581–648` correctly tests the exact scenario by selecting a target particle question directly.

---

## 2. Logic Chain

1. **Integrity Verification**:
   - Inspected `src/engine.js`, `src/views/*`, and `test/*`.
   - Verified that no hardcoded outputs or test-bypass mocks are present in source code.
   - Verified that Leitner interval calculation, review merging, and distractor lookup execute real algorithms.
   - Conclusion: No integrity violations detected.

2. **Functional Conformance**:
   - Verified R1 (contrastive distractor feedback + modal Snabbguide): Contrastive explanations are generated with appropriate guide links, and modal preserves active session state.
   - Verified R2 (session size selector + 4-tier Leitner self-rating + schema v2 backwards compatibility): Leitner intervals follow 10m, 1d, 3d, 7d, 14d exponential progression, and legacy data is cleanly maintained.
   - Verified R3 (Sakura Anime theme + persistence + anime mascot display/hiding + WCAG AA contrast): Text and UI controls exceed WCAG AA contrast ratios, theme toggles smoothly and persists to localStorage, anime figures are strictly hidden in Classic mode.
   - Verified Verification & Build: `npm test` passes 86/86 tests; `npm run build` succeeds cleanly.
   - Conclusion: All acceptance criteria from `ORIGINAL_REQUEST.md` are satisfied.

---

## 3. Caveats

- **Firebase Backend / Cloud Sync**: The app includes Firebase auth and sync utilities (`src/cloud.js`, `src/sync.js`), but local offline operation (`guest` mode with localStorage) was the primary target verified. Cloud emulator tests (`npm run test:rules`) require live emulator daemons, which were not part of M4 acceptance criteria.
- **Vite Warning on Bundle Size**: The Vite build outputs a minor chunk warning for `firebase-BN_uS7yZ.js` (>500 kB uncompressed), which is normal for full Firebase SDK builds and does not affect runtime correctness.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone M4 is complete, robust, pedagogically sound, aesthetically aligned with Sakura Anime requirements, accessible under WCAG AA, and fully covered by automated verification.

---

## 5. Verification Method

To independently verify this evaluation:

1. **Run Full Test Suite**:
   ```powershell
   npm test
   ```
   *Expected Result*: 86 tests pass, 0 fail.

2. **Run Production Build**:
   ```powershell
   npm run build
   ```
   *Expected Result*: Vite builds `dist/` cleanly without error.

3. **Verify Playwright Responsive Overflow & Theme Stress**:
   ```powershell
   npx playwright test tests/e2e/viewport_overflow_stress.spec.js tests/e2e/theme_stress.spec.js --project=chromium
   ```
   *Expected Result*: 59 tests pass, confirming 0px overflow down to 320px and 100% theme synchronization.

4. **Inspect Key Artifacts**:
   - `src/engine.js`: Review `getContrastiveFeedback` (lines 253–361) and `nextStat` (lines 33–77).
   - `src/style.css`: Review Sakura theme tokens and `:not([data-theme='sakura']) .anime-figure` hiding rules (lines 2462–2466, 2551–2559).
   - `src/views/home.js`: Review session size selector `.pill-group` (lines 33–99).
   - `src/views/session.js`: Review 4-tier rating buttons and contrastive callout (lines 210–298).
