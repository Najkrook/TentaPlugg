# Forensic Audit Report: Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek)

**Work Product**: Milestone M2 modifications in `src/views/home.js`, `src/main.js`, `src/views/session.js`, `src/style.css`, `tests/engine.test.js`  
**Profile**: General Project (Development Mode per ORIGINAL_REQUEST.md)  
**Verdict**: **CLEAN**

---

### Phase Results
- **Hardcoded test results check**: PASS — Zero test mocks, constant test passes, or hardcoded test matchers in production source code.
- **Facade implementations check**: PASS — Fully functional implementations of session selection (`setPreferredCount`), question slicing (`selectPractice`), and Leitner interval math (`nextStat`, `recordReview`).
- **Fabricated verification outputs check**: PASS — No pre-populated test output logs, fake attestations, or static result dumps in workspace.
- **Self-certifying tests check**: PASS — Node test runner executes dynamic state transitions across 20 box-rating combinations and boundary conditions.
- **Session size selection logic verification**: PASS — Slices questions to 5, 10, 20, or all due items (`Infinity`) based on user choice.
- **Self-rated difficulty SRS progression verification**: PASS — Correctly calculates box updates (`again` $\to$ 0, `hard` $\to$ current, `good` $\to$ +1, `easy` $\to$ +2) and intervals (`10m`, `1d`, `3d`, `7d`, `14d`).
- **Accessibility & WCAG AA contrast check**: PASS — All rating button labels and pill controls exceed the 4.5:1 minimum contrast threshold (contrast ratios 5.46:1 to 9.69:1).
- **Behavioral verification (Test suite & build)**: PASS — `npm test` passed 48/48 tests, `npm run build` completed with code 0.

---

## 1. Observation

1. **Static Analysis — Absence of Prohibited Patterns**:
   - `grep_search` across `src/**/*.js` for `test` (case-insensitive): 0 matches.
   - File search across the project root for pre-existing `*.log`, `*result*`, `*output*`:
     Only `firestore-debug.log` (Firebase emulator trace) existed outside `node_modules`. No fake verification artifacts were present.

2. **Session Length Selection Implementation (`src/views/home.js:33-87`, `src/main.js:125-132, 340-350`)**:
   - In `src/views/home.js`:
     ```javascript
     <div class="pill-group" role="radiogroup" aria-labelledby="session-size-label">
       <button type="button" role="radio" aria-checked=${currentPref === 5} class="pill-btn ${currentPref === 5 ? 'active' : ''}" @click=${() => ctx.setPreferredCount?.(5)}>5</button>
       <button type="button" role="radio" aria-checked=${currentPref === 10} class="pill-btn ${currentPref === 10 ? 'active' : ''}" @click=${() => ctx.setPreferredCount?.(10)}>10</button>
       <button type="button" role="radio" aria-checked=${currentPref === 20} class="pill-btn ${currentPref === 20 ? 'active' : ''}" @click=${() => ctx.setPreferredCount?.(20)}>20</button>
       <button type="button" role="radio" aria-checked=${currentPref === 'all'} aria-disabled=${p.due === 0 ? 'true' : 'false'} ?disabled=${p.due === 0} class="pill-btn ${currentPref === 'all' ? 'active' : ''} ${p.due === 0 ? 'disabled' : ''}" @click=${() => p.due > 0 && ctx.setPreferredCount?.('all')}>Alla förfallna (${p.due})</button>
     </div>
     ```
   - In `src/main.js`:
     ```javascript
     function setPreferredCount(count) {
       const valid = [5, 10, 20, 'all'];
       if (!valid.includes(count)) return;
       state.preferredCount = count;
       state.settingsAt = Date.now();
       persist(true);
       render();
     }
     ```
   - In `src/main.js:start()`:
     ```javascript
     const pref = state.preferredCount || 10;
     const chosenCount = options.count !== undefined ? options.count : pref;
     const isAllDue = chosenCount === 'all';
     const dueOnly = options.dueOnly !== undefined ? options.dueOnly : options.extra ? false : isAllDue;
     const count = isAllDue ? Infinity : typeof chosenCount === 'number' ? chosenCount : 10;
     let candidateBank = questions;
     if (options.wrong) candidateBank = candidateBank.filter((q) => state.stats[q.id] && !state.stats[q.id].ok);
     let bank = dueOnly ? candidateBank.filter((q) => state.stats[q.id]?.dueAt <= Date.now()) : candidateBank;
     let ids = selectPractice(bank, state.stats, topic, count, Date.now(), options);
     ```
   - In `src/engine.js:420`:
     `selectPractice` slices the sorted candidate bank with `.slice(0, count)`.

3. **Spaced Repetition & Self-Rated Difficulty (`src/engine.js:30-76, 208-226`, `src/views/session.js:8-23, 123-157`)**:
   - In `src/engine.js`:
     `nextStat(previous, okOrRating, at, reviewId)` computes:
     - `'again'`: `box = 0`, `dueAt = at + INTERVALS[0]` (10m), `ok = false`.
     - `'hard'`: `box = Math.max(0, box)`, `dueAt = at + Math.min(INTERVALS[box], 86400000)` ($\le 1$d), `ok = true`.
     - `'good'`: `box = Math.min(4, box + 1)`, `dueAt = at + INTERVALS[box]`, `ok = true`.
     - `'easy'`: `box = Math.min(4, box + 2)`, `dueAt = at + INTERVALS[box]`, `ok = true`.
   - In `src/views/session.js`:
     `formatInterval(ms)` and `previewRatingInterval(box, rating)` correctly derive live countdown hints (`10m`, `1d`, `3d`, `7d`, `14d`).

4. **Empirical Independent Verification Execution**:
   - Independent test script evaluating all 20 matrix transitions across boxes 0..4, box 4 ceiling clamping, box 0 floor, and question slicing:
     ```
     All independent verification checks passed!
     All session view preview interval checks passed!
     ```
   - WCAG AA relative luminance contrast computation:
     - again `#ad3b24` on `#fff8f5`: 5.83:1 (Threshold: 4.5:1) $\to$ **PASS**
     - hard `#8c5d0f` on `#fdfaf2`: 5.46:1 (Threshold: 4.5:1) $\to$ **PASS**
     - good `#236319` on `#f4faf0`: 6.89:1 (Threshold: 4.5:1) $\to$ **PASS**
     - easy `#175c74` on `#f0f8fa`: 6.92:1 (Threshold: 4.5:1) $\to$ **PASS**
     - active pill `#183f37` on `#d7f296`: 9.44:1 (Threshold: 4.5:1) $\to$ **PASS**
     - inactive pill `#e2ede6` on `#183f37`: 9.69:1 (Threshold: 4.5:1) $\to$ **PASS**

5. **Test and Build Execution**:
   - `npm test`:
     ```
     > node --test --test-isolation=none tests/*.test.js
     ℹ tests 48
     ℹ suites 0
     ℹ pass 48
     ℹ fail 0
     ℹ duration_ms 116.3158
     ```
   - `npm run build`:
     ```
     > vite build
     ✓ built in 1.84s
     dist/index.html                     0.68 kB
     dist/assets/index-SxEYtOkY.css     29.05 kB
     dist/assets/index-BbBFvyr0.js      97.97 kB
     dist/assets/firebase-BN_uS7yZ.js  531.30 kB
     ```

---

## 2. Logic Chain

1. **Absence of Cheating / Facades**:
   - Source code analysis confirmed no test-specific bypass branches or hardcoded return values exist.
   - Functions `setPreferredCount`, `nextStat`, and `selectPractice` implement real mutations and mathematical calculations.
2. **Session Slicing Authenticity**:
   - Setting session length persists to `state.preferredCount`.
   - `start()` dynamically converts user choices `5`, `10`, `20`, and `'all'` into numerical counts or `Infinity`.
   - `selectPractice` executes `.slice(0, count)` against the filtered bank.
   - When 0 questions are due, the UI disables the "Alla förfallna (0)" button, preventing invalid session initiation.
3. **Leitner Engine Authenticity**:
   - `nextStat` updates `box`, `dueAt`, and `interval` according to Leitner spaced repetition rules for all 4 ratings (`again`, `hard`, `good`, `easy`).
   - Boundary safeguards prevent box overflow above 4 or underflow below 0.
   - Legacy reviews lacking the `rating` attribute seamlessly fall back to `'good'` or `'again'`, preserving backward compatibility with `SCHEMA_VERSION = 2`.
4. **Behavioral Integrity**:
   - All 48 tests pass independently in Node.js test runner without mocking or stubbing production source.
   - Vite production bundle compiles cleanly.

---

## 3. Caveats

- **Premature Review Rule**: A card reviewed with `'good'` before its scheduled `dueAt` maintains its existing box and due date without double-advancing on the same day. This is intentional Leitner behavior to avoid cramming distortion.
- **Exam Mode Exemption**: In exam mode, spaced repetition ratings are suppressed in favor of the 100-point rubric and self-assessment buttons (`"Jag kunde detta"` and `"Behöver öva mer"`).

---

## 4. Conclusion

The work product for Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) complies fully with all requirements in `ORIGINAL_REQUEST.md` and contains NO integrity violations, facades, or fabricated outputs.

**Verdict**: **CLEAN**

---

## 5. Verification Method

To independently reproduce and verify this audit:

1. **Run Unit Tests**:
   ```powershell
   npm test
   ```
   *Expectation*: 48 passed, 0 failed.

2. **Run Production Build**:
   ```powershell
   npm run build
   ```
   *Expectation*: Exit code 0, cleanly bundling into `dist/`.

3. **Verify Leitner Logic & Slicing Empirically**:
   ```powershell
   node -e "import('./src/engine.js').then(({ nextStat, selectPractice }) => { console.log(nextStat(null, 'easy', Date.now())); console.log(selectPractice([{id:'1',topic:'Partiklar'},{id:'2',topic:'Partiklar'}], {}, 'Partiklar', 1)); })"
   ```
   *Expectation*: `nextStat` returns `box: 2`, `rating: 'easy'`; `selectPractice` returns an array of length 1 `['1']`.
