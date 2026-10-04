# Handoff Report: E2E Requirements Test Suite (Tiers 1–4)

## 1. Observation
- **Test suite requirements**: Defined in `ORIGINAL_REQUEST.md` (§R1, §R2, §R3), `PROJECT.md` (§Interface Contracts), and `TEST_INFRA.md` (§Feature Inventory).
- **Target test file created**: `test/requirements.test.js` (718 lines).
- **Test runner integration proxy**: `tests/requirements.test.js` imports `../test/requirements.test.js` ensuring compatibility with `package.json` test script `"test": "node --test --test-isolation=none tests/*.test.js"`.
- **Direct test execution command**:
  `node --test test/requirements.test.js`
  Result:
  ```
  ✔ Tier 1: Contrastive feedback returns non-null explanation & guideId for common particle errors (0.7247ms)
  ✔ Tier 1: Contrastive feedback returns null for correct answers or missing inputs (0.154ms)
  ✔ Tier 1: SRS Leitner calculation computes correct intervals for again, hard, good, easy (10.3931ms)
  ✔ Tier 1: Session size selection logic honors 5, 10, 20, and all due questions (1.282ms)
  ✔ Tier 1: Theme switching contract and persistence key tentaplugg-theme (0.4766ms)
  ✔ Tier 1: Backwards compatibility for legacy review entries lacking rating (0.3751ms)
  ✔ Tier 2: Leitner box boundaries (0 and 4) and interval clamping (0.4916ms)
  ✔ Tier 2: Questions with multiple correct answers (array vs string) & normalization (0.2278ms)
  ✔ Tier 2: Gracefully handles missing, corrupted, or malformed stored states (0.6834ms)
  ✔ Tier 2: Contrastive feedback boundary conditions and malformed questions (0.1388ms)
  ✔ Tier 3: Answering with self-rating updates SRS and controls subsequent practice due calculations (1.8472ms)
  ✔ Tier 3: Multi-day Leitner progression correctly schedules intervals across boxes (0.4572ms)
  ✔ Tier 3: Merging independent device progress preserves self-ratings and latest rating wins (0.9143ms)
  ✔ Tier 4: Scenario 1 - Practice session with contrastive feedback, Quick Guide lookup, self-rating, and session finish (1.279ms)
  ✔ Tier 4: Scenario 2 - Theme switcher persists preference and controls anime assets (0.4375ms)
  ✔ Tier 4: Scenario 3 - Comprehensive multi-card SRS review across Leitner boxes 0 to 4 (0.8753ms)
  ✔ Tier 4: WCAG AA contrast ratio compliance for core theme palette (0.139ms)
  ℹ tests 17
  ℹ suites 0
  ℹ pass 17
  ℹ fail 0
  ```
- **Project-wide test command**:
  `npm test`
  Result:
  ```
  ℹ tests 41
  ℹ suites 0
  ℹ pass 41
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 106.5193
  ```
  All 24 original unit tests continue to pass alongside all 17 new requirements tests.
- **Production build command**:
  `npm run build`
  Result: Exited with code 0 (`built in 1.98s`).

## 2. Logic Chain
1. Step 1: `ORIGINAL_REQUEST.md` specifies three distinct improvement tracks (R1: Contrastive feedback & guide linking, R2: Flexible SRS intervals & custom session size, R3: Sakura theme & anime figures).
2. Step 2: `TEST_INFRA.md` breaks these down into four tiers: Tier 1 (Feature coverage), Tier 2 (Boundaries & corner cases), Tier 3 (Cross-feature interactions), and Tier 4 (Simulated student workflows).
3. Step 3: Implemented 17 rigorous, opaque-box, contract-driven test cases covering all 4 tiers:
   - **Tier 1**:
     - Particle contrastive feedback for `に vs で`, `は vs が`, `を vs が`, `を vs に`, `に vs ×`, `× vs で`, `と vs の`, and null for correct answers or missing inputs.
     - Leitner progression logic for self-ratings `'again'` (Box 0, ~10m), `'hard'` (current box, <= 1d), `'good'` (box + 1), and `'easy'` (box + 2, capped at 4).
     - Session size selection honoring 5, 10, 20, and all due questions without including future non-due questions.
     - Theme contract specifying localStorage key `'tentaplugg-theme'`, modes `'sakura'` and `'classic'`, and presence of required assets (`study.jpg`, `cheer.jpg`, `encourage.jpg`).
     - Backwards compatibility for legacy review entries lacking `rating` (falling back to `'good'` for `ok: true` and `'again'` for `ok: false`).
   - **Tier 2**:
     - Strict boundary clamping for box 0 (non-negative) and box 4 (upper bound), early reviews before due date not advancing.
     - Multiple correct answers (arrays vs strings) and punctuation/whitespace normalization.
     - Resilient handling of malformed and corrupted states in `migrate()` and `readLocal()`.
     - Edge cases in `getContrastiveFeedback()` (empty answers array, missing properties).
   - **Tier 3**:
     - Self-rating review updating state and controlling subsequent `selectPractice()` due filters.
     - Multi-day Leitner progression across boxes 0 to 4.
     - Cross-device merge resolving conflicting reviews with latest rating winning commutatively.
   - **Tier 4**:
     - Scenario 1: Complete 5-question practice session encountering a particle distractor error, consulting the Quick Guide non-destructively, self-rating as 'hard', and finishing session.
     - Scenario 2: Theme switching lifecycle persisting to storage and validating anime figure asset presence in Sakura mode vs hiding in Classic mode.
     - Scenario 3: Comprehensive multi-card SRS review across boxes 0 to 4 with diverse ratings.
     - WCAG AA contrast ratio compliance verification (>= 4.5:1 ratio) for core theme palettes.
4. Step 4: Verification demonstrates that `npm test` runs all 41 tests cleanly with zero regressions.

## 3. Caveats
- No implementation code was modified in `src/`, adhering to the strict QA / test writer mandate.
- Full UI browser interactions (such as pointer clicks and CSS DOM rendering) are tested at the contract/logic level in Node.js test runner; UI Playwright tests (`npm run test:e2e`) remain available for browser visual verification.

## 4. Conclusion
The comprehensive E2E requirements test suite in `test/requirements.test.js` is fully implemented, verified, formatted with Prettier, and integrated into `npm test`. All 17 new requirement test cases pass, all 24 existing tests continue to pass (41/41 passing), and the production build completes cleanly.

## 5. Verification Method
To independently verify this suite:
1. Run standalone requirement tests:
   `node --test test/requirements.test.js`
   Expected: 17 passing tests, 0 fails.
2. Run full test suite:
   `npm test`
   Expected: 41 passing tests (24 existing + 17 requirements), 0 fails.
3. Run build verification:
   `npm run build`
   Expected: Clean exit code 0.
