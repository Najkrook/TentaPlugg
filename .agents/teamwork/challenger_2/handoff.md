# Handoff Report: Challenger 2 (Empirical Boundary & Adversarial Test Harness)

Verdict: REQUEST_CHANGES

---

## 1. Observation

### Obs 1: Fatal V8 Heap Out of Memory Crash during `npm test`
- **Command executed**: `npm test` (which executes `node --test --test-isolation=none tests/*.test.js`)
- **Exit code**: `1`
- **Verbatim Error**:
  ```
  <--- Last few GCs --->
  [20400:0000019A56F41000]    10131 ms: Scavenge (interleaved) 4083.4 (4096.9) -> 4082.9 (4107.2) MB, pooled: 0 MB, 6.81 / 0.00 ms  (average mu = 0.212, current mu = 0.241) allocation failure; 
  [20400:0000019A56F41000]    11094 ms: Mark-Compact (reduce) 4089.7 (4107.2) -> 4086.2 (4098.7) MB, pooled: 0 MB, 902.27 / 0.00 ms  (+ 2.2 ms in 108 steps since start of marking, biggest step 1.5 ms, walltime since start of marking 913 ms) (average mu = 0.
  FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
  ```
- **Failing Location in Code**: `src/particles-fx.js:63-70`:
  ```javascript
  const count =
    typeof options.count === 'number' ? options.count : Math.floor(Math.random() * 3) + 5; // 5 to 7 particles
  ...
  for (let i = 0; i < count; i++) {
  ```
- **Trigger in Tests**: `tests/challenger_stress.test.js:737`:
  ```javascript
  [500, 500, { count: Infinity }],
  ```
  Executing `node --test --test-name-pattern="CHALLENGER 2.7" tests/challenger_stress.test.js` reproduces the exact fatal OOM crash in ~8.9s.

### Obs 2: `spawnParticleBurst()` Bypasses `prefers-reduced-motion` Media Query
- **Location**: `src/particles-fx.js:60-70` vs `src/particles-fx.js:144-149`
- `initClickParticles` has media query gating:
  ```javascript
  if (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  ```
- However, `spawnParticleBurst(x, y)` has NO check for `window.matchMedia('(prefers-reduced-motion: reduce)')`. Calling `spawnParticleBurst(100, 100)` directly in a mock DOM with `matchMedia('(prefers-reduced-motion: reduce)').matches = true` returns 5 to 7 particle elements rather than 0 elements.

### Obs 3: Screen Atmosphere Sakura Petals Lack Animation Suppression
- **Locations**: `index.html:29-38`, `src/style.css:1677-1682`, and `src/style.css:4795-4850`
- `index.html:29` defines `.anime-figure.sakura-petals-container` with 8 petals (`.sakura-petal.p1` ... `.p8`).
- `src/style.css:4808` defines:
  ```css
  .sakura-petal.p1 {
    animation:
      sakura-fall 10s linear infinite,
      sakura-sway 3s ease-in-out infinite;
  }
  ```
- `src/style.css:1677` reduced-motion rule only sets:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  It does not disable `animation` nor hide `.sakura-petals-container`.

### Obs 4: Prettier Code Style Issues
- **Command executed**: `npm run format:check`
- **Output**:
  ```
  Checking formatting...
  [warn] tests/challenger_stress.test.js
  [warn] Code style issues found in 1 file. Run Prettier with --write to fix.
  ```

### Obs 5: Verified Passing Areas
- `node --test tests/challenger_2_adversarial.test.js`: 9/9 PASS.
- Secondary filtered suite (`node --test tests/*.test.js` excluding the crash test): 158/158 PASS.
- `npx playwright test tests/e2e/viewport_overflow_stress.spec.js`: 52/52 PASS (0px overflow across 320px–1024px).
- `npm run build`: PASS (Vite exits 0 in 1.59s).
- Data integrity: 170/170 items in `vocabularyList` and 43/43 in `kanjiList` verified with zero dummy/undefined strings.

---

## 2. Logic Chain

1. **Premise 1 (Acceptance Criteria)**: `ORIGINAL_REQUEST.md:80-82` requires:
   - `npm test` runs and passes all 109+ tests with 0 failures and 0 regressions.
   - `npm run format:check` passes without prettier formatting violations.
2. **Step 2 (Obs 1)**: In JavaScript, `typeof Infinity === 'number'` is `true`. `src/particles-fx.js:63` assigns `count = options.count` when `typeof options.count === 'number'`.
3. **Step 3 (Obs 1)**: When `count = Infinity`, `for (let i = 0; i < count; i++)` runs indefinitely, allocating DOM elements and `setTimeout` closures without bound until V8 exhausts its 4 GB memory ceiling.
4. **Step 4 (Obs 1)**: `tests/challenger_stress.test.js:737` passes `{ count: Infinity }` to `spawnParticleBurst`. Running `npm test` invokes this test and crashes Node.js with exit code 1.
5. **Step 5 (Obs 2 & Obs 3)**: Requirement R2 specifies that particles must honor `prefers-reduced-motion`. Direct calls to `spawnParticleBurst()` produce elements under reduced motion, and continuous falling animations on `.sakura-petal` are never disabled in CSS.
6. **Step 6 (Obs 4)**: `npm run format:check` fails due to unformatted files in `tests/`.
7. **Conclusion**: Because critical acceptance criteria (test suite passing and formatting) fail, and an unbounded infinite loop crash was empirically reproduced in production code `src/particles-fx.js`, the work product cannot be approved in its current state.

---

## 3. Caveats

- In standard UI interactions, `options.count` is not passed as `Infinity` by the application click handler (which calls `spawnParticleBurst(x, y)` without options). However, `spawnParticleBurst` is an exported module function and parameter boundary protection is required for defense-in-depth and fuzz testing resilience.
- The formatting failure in `tests/challenger_stress.test.js` is in test code created by peer Challenger 1, not in core `src/` files.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The upgrade has strong architectural foundations in routing resilience, data integrity, and viewport responsiveness. However, approval is blocked by:
1. **Critical Defect**: Infinite loop in `src/particles-fx.js:63` when `options.count = Infinity` causing fatal OOM in `npm test`.
2. **Accessibility Gaps**: Lack of function-level reduced-motion check in `spawnParticleBurst()` and lack of CSS animation suppression for ambient `.sakura-petals-container`.
3. **Formatting**: `npm run format:check` failure.

---

## 5. Verification Method

### How to independently reproduce the findings:

1. **Reproduce the Fatal OOM Crash**:
   ```powershell
   node --test --test-name-pattern="CHALLENGER 2.7" tests/challenger_stress.test.js
   ```
   *Expected result*: After ~8 seconds, Node crashes with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`.

2. **Verify Challenger 2 Boundary Suite**:
   ```powershell
   node --test tests/challenger_2_adversarial.test.js
   ```
   *Expected result*: 9 passed tests verifying URL routing edge cases, theme persistence, and data integrity.

3. **Verify Prettier Violation**:
   ```powershell
   npm run format:check
   ```
   *Expected result*: Exits with code 1, reporting code style issues.

4. **Verify Viewport Responsiveness**:
   ```powershell
   npx playwright test tests/e2e/viewport_overflow_stress.spec.js --project=chromium
   ```
   *Expected result*: 52/52 passed tests.

### Invalidation Conditions:
- When `src/particles-fx.js` sanitizes `options.count` using `Number.isFinite` bounded by `MAX_CONCURRENT_PARTICLES`, `npm test` runs to completion with 0 errors.
- When `prettier --write tests/challenger_stress.test.js` is executed, `npm run format:check` exits with code 0.
