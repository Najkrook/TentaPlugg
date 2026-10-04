# Milestone M2 Challenger Empirical Stress Test Report

**Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Direct Test Execution
- Executed `npm test` (`node --test --test-isolation=none tests/*.test.js`):
  ```
  ✔ Japanese width and punctuation do not reject valid answers; long vowels remain meaningful (1.1004ms)
  ✔ repetition prioritizes due over unseen and excludes future questions (10.797ms)
  ✔ all question ids unique and every auto question has an answer (1.0381ms)
  ✔ all exams total 100 points and every original page exists (4.9015ms)
  ✔ cloud merge keeps latest answers, results and exam drafts (1.0839ms)
  ✔ contrastive feedback returns null for correct answers (including alternatives and whitespace) (0.2532ms)
  ✔ contrastive feedback provides pedagogical explanations and guideId for all known particle distractors (0.2809ms)
  ✔ contrastive feedback handles custom contrastive overrides, non-particle topics, and returns null for unknown distractors (0.0883ms)
  ✔ Leitner engine verifies full 4-rating progression matrix across boxes 0 to 4 (1.1385ms)
  ✔ Leitner engine enforces box 4 ceiling, box 0 floor, and premature review safeguards (0.7678ms)
  ✔ Leitner engine ensures complete backwards compatibility for boolean ok and legacy reviews (0.6568ms)
  ✔ Schema compatibility guarantees version 2 and prevents reset migrations (0.1909ms)
  ...
  ✔ Empirical Stress 1: Full 4-rating progression matrix across all Boxes 0 to 4 (1.0934ms)
  ✔ Empirical Stress 2: Boundary ceilings, floors, and extreme box clamping (0.3788ms)
  ✔ Empirical Stress 3: Identical timestamps, rapid succession, and same-day promotions (1.7826ms)
  ✔ Empirical Stress 4: Out-of-order review playback and rebuildStats idempotence (0.5259ms)
  ✔ Empirical Stress 5: Backwards compatibility for boolean ok and legacy reviews without rating (0.5061ms)
  ✔ Empirical Stress 6: SCHEMA_VERSION = 2 never triggers wipe migration and preserves existing data (0.1744ms)
  ✔ Empirical Stress 7: Fuzz testing - Valid finite numbers produced on valid & boundary inputs (1.2164ms)
  ✔ Empirical Stress 8: Interval array invariants and monotonic growth (0.0733ms)
  ✔ Empirical Stress 9: Session size selection scaling & boundary conditions (5, 10, 20, all) (0.5737ms)
  ℹ tests 61
  ℹ suites 0
  ℹ pass 61
  ℹ fail 0
  ℹ duration_ms 163.6058
  ```
- Executed `npm run build` (`vite build`):
  ```
  vite v7.3.6 building client environment for production...
  ✓ 1592 modules transformed.
  dist/index.html                     0.68 kB │ gzip:   0.41 kB
  dist/assets/index-SxEYtOkY.css     29.05 kB │ gzip:   6.89 kB
  dist/assets/index-BbBFvyr0.js      97.97 kB │ gzip:  35.34 kB
  dist/assets/firebase-BN_uS7yZ.js  531.30 kB │ gzip: 158.04 kB
  ✓ built in 2.41s
  ```

### 1.2 Inspection of Implementation Code (`src/engine.js`)
- **Rating decoding** (`src/engine.js` lines 38–47):
  ```javascript
  if (typeof okOrRating === 'boolean') {
    ok = okOrRating;
    rating = ok ? 'good' : 'again';
  } else if (typeof okOrRating === 'string') {
    rating = okOrRating;
    ok = rating !== 'again';
  } else if (typeof okOrRating === 'object' && okOrRating !== null) {
    rating = okOrRating.rating || (okOrRating.ok ? 'good' : 'again');
    ok = rating !== 'again';
  }
  ```
- **SRS interval calculation & box transitions** (`src/engine.js` lines 49–64):
  ```javascript
  if (!ok || rating === 'again') {
    box = 0;
    dueAt = at + INTERVALS[0];
  } else if (rating === 'hard') {
    box = Math.max(0, box);
    dueAt = at + Math.min(INTERVALS[box], 86400000);
    lastPromotionDay = day;
  } else if (rating === 'easy') {
    box = Math.min(4, box + 2);
    dueAt = at + INTERVALS[box];
    lastPromotionDay = day;
  } else if ((!previous || dueAt <= at) && lastPromotionDay !== day) {
    box = Math.min(4, box + 1);
    dueAt = at + INTERVALS[box];
    lastPromotionDay = day;
  }
  ```
- **Interval configuration** (`src/config.js` line 6):
  ```javascript
  export const INTERVALS = [600000, 86400000, 259200000, 604800000, 1209600000];
  ```
  Configured intervals:
  - Box 0: 600,000 ms (10 min)
  - Box 1: 86,400,000 ms (1 day)
  - Box 2: 259,200,000 ms (3 days)
  - Box 3: 604,800,000 ms (7 days)
  - Box 4: 1,209,600,000 ms (14 days)

- **Migration & version protection** (`src/engine.js` lines 88, 120):
  ```javascript
  if (raw.version !== SCHEMA_VERSION) { ... }
  state.version = SCHEMA_VERSION;
  return rebuildStats(state);
  ```
  `SCHEMA_VERSION` is 2 (`src/config.js` line 5). For all states with `version: 2`, `state.reviews` is never reset.

---

## 2. Logic Chain

1. **Full 4-Rating Progression Across All Boxes 0 to 4**:
   - For all 5 boxes ($B \in \{0, 1, 2, 3, 4\}$) and all 4 ratings (`again`, `hard`, `good`, `easy`), all 20 transitions were tested (`Empirical Stress 1`).
   - `again` drops box to 0, sets interval to 10 minutes, and sets `ok: false`.
   - `hard` retains current box $B$, caps the interval at $\min(\text{INTERVALS}[B], 86400000)$ (10 min for box 0, 1 day for boxes 1–4), and sets `ok: true`.
   - `good` (when due and on a new calendar day) increments box to $\min(4, B + 1)$, scheduling with standard exponential interval, and sets `ok: true`.
   - `easy` increments box by $+2$ to $\min(4, B + 2)$, scheduling with accelerated interval, and sets `ok: true`.

2. **Ceiling & Floor Boundaries**:
   - `Box 4` + `easy` $\to$ `Box 4` (capped at 4 via `Math.min(4, box + 2)`).
   - `Box 4` + `good` $\to$ `Box 4` (capped at 4 via `Math.min(4, box + 1)`).
   - `Box 3` + `easy` $\to$ `Box 4` (3 + 2 = 5, clamped to 4).
   - `Box 0` + `again` $\to$ `Box 0` (floor at 0).
   - `Box 0` + `hard` $\to$ `Box 0` (floor at 0 via `Math.max(0, box)`).

3. **Temporal Invariants & Same-Day Safeguards**:
   - Rapid succession: 50 reviews executed with timestamp $t=0$ only advance the card once (to Box 1). All remaining 49 reviews do not advance the box because `dueAt > at` and `lastPromotionDay === day`.
   - Same-day lapse: When a card is promoted to Box 1, then lapses (`again`) on the same day, answering `good` later that same day keeps it at Box 0 because `lastPromotionDay` prevents multiple promotions on the same calendar day. Only upon reaching the next Stockholm calendar day does `good` promote the card to Box 1.

4. **Out-of-Order Review Handling & Determinism**:
   - `rebuildStats` sorts review entries deterministically by `a.at - b.at || a.id.localeCompare(b.id)`.
   - Inserting reviews in forward chronological order, reverse chronological order, or random shuffle results in bit-for-bit identical stats dictionaries (`Empirical Stress 4`).

5. **Backwards Compatibility**:
   - Calling `nextStat` with boolean `true` assigns `rating: 'good'`, `ok: true`, and advances box to 1.
   - Calling `nextStat` with boolean `false` assigns `rating: 'again'`, `ok: false`, and resets box to 0.
   - Calling `nextStat` with objects `{ ok: true }` or `{ ok: false }` decodes identically to booleans.
   - Reviews stored in schema v2 without `rating` fallback to `r.rating ?? r.ok` in `rebuildStats`, assigning `good` or `again`.
   - Legacy schema v1 state migration maps historical stats to `baselineStats` with valid boxes (0 or 1) and valid `dueAt` intervals, and subsequent reviews correctly assign self-ratings without data loss.

6. **Schema Version 2 Protection**:
   - States with `version: 2` bypass the destructive legacy baseline migration block (`if (raw.version !== SCHEMA_VERSION)`), fully preserving user reviews, session drafts, exam attempts, and preferences (`theme`, `preferredCount`).

7. **Session Size Scaling**:
   - `selectPractice` strictly honors counts of 5, 10, 20, and all due questions (`bank.length`). Future items are excluded unless `extra: true`. Older due items are prioritized.

---

## 3. Caveats

1. **Pre-corrupted NaN dueAt Injection**:
   - In `nextStat`: `let dueAt = previous?.dueAt ?? at;`.
   - If an external caller injects an artificially corrupted object containing `dueAt: NaN`, JavaScript nullish coalescing does not replace `NaN` with `at` (because `NaN !== null && NaN !== undefined`).
   - Consequently, `NaN <= at` evaluates to `false`, and `dueAt` remains `NaN` unless rated `again`, `hard`, or `easy`. Under normal application execution, `dueAt` is computed exclusively as integer additions (`at + INTERVALS[box]`) and is never `NaN`.
2. **Negative Box Parameter Injection**:
   - If an external caller passes `previous = { box: -5 }` and rates `good`, `Math.min(4, -5 + 1)` produces `-4`, resulting in `INTERVALS[-4]` (`undefined`) and `dueAt: NaN`. Under all application code paths, `box` is strictly initialized to `0` and bounded within $[0, 4]$.

---

## 4. Conclusion

**Verdict**: **APPROVE**

The Leitner SRS engine in `src/engine.js` satisfies all acceptance criteria for Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek):
- Full 4-rating progression matrix across Boxes 0 to 4 operates correctly with exact interval calculations.
- Boundary ceilings (Box 4) and floors (Box 0) are strictly enforced without out-of-bounds indexing.
- Rapid succession, same-day promotions, and timezone boundaries are handled predictably and safely.
- Deterministic review replay in `rebuildStats` guarantees idempotence across devices and out-of-order review arrival.
- Backwards compatibility for boolean flags, object formats, and legacy reviews is complete.
- `SCHEMA_VERSION = 2` ensures existing reviews and drafts are never wiped.
- All 61 automated tests pass cleanly and production build succeeds.

---

## 5. Verification Method

To independently verify the empirical results:

1. **Run full unit & stress test suite**:
   ```bash
   npm test
   ```
   *Expected output*: 61 tests pass, 0 fail.

2. **Run production build**:
   ```bash
   npm run build
   ```
   *Expected output*: Vite build completes with code 0 in `< 3s`.

3. **Inspect the empirical stress test file**:
   ```
   tests/stress_m2.test.js
   ```
