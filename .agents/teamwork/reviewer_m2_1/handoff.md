# Handoff Report: Reviewer Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek)

**Verdict**: APPROVE

---

## 1. Observation

1. **Session Size Selector (`src/views/home.js:33-99`)**:
   - Implements a responsive segmented pill group (`role="radiogroup"`, `aria-labelledby="session-size-label"`).
   - Renders 4 selectable options: `5`, `10`, `20`, and `Alla förfallna (${p.due})`.
   - When `p.due === 0`, the "Alla förfallna" button is disabled via `?disabled=${p.due === 0}` and `aria-disabled="true"`.
   - Keyboard arrow navigation (`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`) cycles through valid options.
   - Dynamic estimated time hint renders:
     - 5: `"5 frågor · cirka 3 minuter"`
     - 10: `"10 frågor · cirka 5 minuter"`
     - 20: `"20 frågor · cirka 10 minuter"`
     - all: `"${p.due} frågor · repetera allt förfallet"`
   - Clicking options calls `ctx.setPreferredCount(count)`.

2. **State & Lifecycle Management (`src/main.js:125-132, 340-379, 470-480, 667-698`)**:
   - `setPreferredCount(count)` validates input against `[5, 10, 20, 'all']`, updates `state.preferredCount`, sets `state.settingsAt = Date.now()`, and triggers `persist(true)` and `render()`.
   - `start(topic, options)` resolves `chosenCount = options.count !== undefined ? options.count : (state.preferredCount || 10)`. When `chosenCount === 'all'`, it sets `isAllDue = true`, `dueOnly = true`, and `count = Infinity`, querying `selectPractice` with due questions only. If 0 questions are due, it offers an extra practice prompt or announces cleanly.
   - `grade(okOrRating, advance = false)` accepts string ratings (`'again'`, `'hard'`, `'good'`, `'easy'`), updates review records with `recordReview(state, session, q.id, okOrRating, Date.now())`, recomputes results, and announces feedback.
   - Global keyboard listener captures keys `1`, `2`, `3`, `4` mapped to `'again'`, `'hard'`, `'good'`, `'easy'` with robust guards:
     - Bypassed if `!session`, `session.done`, or `session.mode === 'exam'`.
     - Bypassed during IME composition (`composing || e.isComposing`).
     - Bypassed when typing in active editable fields (`(tag === 'INPUT' || tag === 'TEXTAREA') && !active.readOnly`).
     - Bypassed on modifier keys (`ctrlKey || metaKey || altKey`).
     - Bypassed when modal dialogs are open (`document.querySelector('dialog[open]')`).
     - Active only when question feedback is displayed (`session.grades[q.id]` graded, revealed, or review mode).

3. **Self-Rating Review & Leitner Progression (`src/engine.js:30-76, 208-226`, `src/views/session.js:10-22, 32-36, 122-204`)**:
   - `nextStat(previous, okOrRating, at, reviewId)` handles all 4 rating tiers:
     - `'again'`: resets to Box 0, `dueAt = at + INTERVALS[0]` (10m), `ok = false`.
     - `'hard'`: retains current box, `dueAt = at + Math.min(INTERVALS[box], 86400000)` (<= 1 day), `ok = true`.
     - `'good'`: advances Box by +1 (capped at 4), standard exponential intervals, `ok = true`.
     - `'easy'`: accelerates Box by +2 (capped at 4), standard exponential intervals, `ok = true`.
   - `sessionView` pre-caches `s.startBox[q.id]` before grading so that `previewRatingInterval(currentBox, rating)` reliably displays the exact before-review transition interval rather than a post-graded recalculation.
   - `formatInterval(ms)` formats millisecond durations to compact human-readable strings (`10m`, `1d`, `3d`, `7d`, `14d`).
   - Exam mode preservation: in `s.mode === 'exam'`, self-assessed questions strictly present `"Jag kunde detta"` and `"Behöver öva mer"` without rating buttons. Auto-graded questions maintain standard flows and `"Mitt svar är också korrekt"`.

4. **Accessibility and WCAG AA Compliance (`src/style.css:2020-2261`)**:
   - Color contrasts for all four rating buttons exceed the 4.5:1 WCAG AA minimum threshold:
     - `rating-again`: `#ad3b24` text on `#fff8f5` background (contrast ratio: 5.83:1).
     - `rating-hard`: `#8c5d0f` text on `#fdfaf2` background (contrast ratio: 5.52:1).
     - `rating-good`: `#236319` text on `#f4faf0` background (contrast ratio: 6.45:1).
     - `rating-easy`: `#175c74` text on `#f0f8fa` background (contrast ratio: 6.58:1).
     - `pill-btn.active`: `#183f37` on `#d7f296` (contrast ratio: 9.15:1).
     - `pill-btn` (inactive): `#e2ede6` on `#183f37` (contrast ratio: 11.4:1).
   - Rating buttons switch to a 2x2 grid on screens $\le 600\text{px}$.
   - Focus rings: 2px lime on `.pill-btn:focus-visible`, 3px green on `.rating-btn:focus-visible`.

5. **Test Suite & Build Results**:
   - `npm test`:
     ```
     > node --test --test-isolation=none tests/*.test.js
     ✔ Japanese width and punctuation do not reject valid answers; long vowels remain meaningful (1.0675ms)
     ✔ repetition prioritizes due over unseen and excludes future questions (10.4916ms)
     ✔ all question ids unique and every auto question has an answer (0.3021ms)
     ✔ all exams total 100 points and every original page exists (5.0481ms)
     ✔ cloud merge keeps latest answers, results and exam drafts (1.2076ms)
     ✔ contrastive feedback returns null for correct answers (including alternatives and whitespace) (0.2733ms)
     ✔ contrastive feedback provides pedagogical explanations and guideId for all known particle distractors (0.2714ms)
     ✔ contrastive feedback handles custom contrastive overrides, non-particle topics, and returns null for unknown distractors (0.104ms)
     ✔ Leitner engine verifies full 4-rating progression matrix across boxes 0 to 4 (1.521ms)
     ✔ Leitner engine enforces box 4 ceiling, box 0 floor, and premature review safeguards (0.4348ms)
     ✔ Leitner engine ensures complete backwards compatibility for boolean ok and legacy reviews (0.7074ms)
     ✔ Schema compatibility guarantees version 2 and prevents reset migrations (0.1695ms)
     ...
     ℹ tests 48
     ℹ suites 0
     ℹ pass 48
     ℹ fail 0
     ℹ duration_ms 117.2868
     ```
   - `npm run build`:
     ```
     > vite build
     ✓ 1592 modules transformed.
     dist/index.html                     0.68 kB │ gzip:   0.41 kB
     dist/assets/index-SxEYtOkY.css     29.05 kB │ gzip:   6.89 kB
     dist/assets/index-BbBFvyr0.js      97.97 kB │ gzip:  35.34 kB
     dist/assets/firebase-BN_uS7yZ.js  531.30 kB │ gzip: 158.04 kB
     ✓ built in 1.93s
     ```
     Exit code: 0.

---

## 2. Logic Chain

1. **Requirement R2 Fulfillment (Session Size Selection)**:
   - Observation 1 & 2: `setPreferredCount` validates and persists user choice in `state.preferredCount`.
   - When a session starts, `chosenCount` resolves to the preferred count (defaulting to 10 if unset).
   - Passing `'all'` sets `count = Infinity` and filters the bank to due items, guaranteeing all and only due questions are scheduled.
   - Sizing values 5, 10, 20 properly limit practice batches via `selectPractice`'s `.slice(0, count)`.
   - Therefore, session size selection requirement is completely satisfied.

2. **Requirement R2 Fulfillment (Self-Rated Difficulty & Leitner Intervals)**:
   - Observation 3: In practice mode, the 4 rating buttons map directly to `'again'`, `'hard'`, `'good'`, `'easy'`.
   - `nextStat` implements the exact mathematical progression defined in the specification:
     - `'again'`: resets to Box 0, schedules at 10 minutes.
     - `'hard'`: retains current box, caps interval at $\le 1$ day.
     - `'good'`: advances Box +1, schedules standard intervals (1d, 3d, 7d, 14d).
     - `'easy'`: accelerates Box +2 (clamped at 4), schedules accelerated intervals.
   - Live intervals displayed on buttons reflect the starting state of the question, providing accurate expectations.
   - Therefore, self-rated difficulty requirement is completely satisfied.

3. **Backwards Compatibility & Exam Mode Integrity**:
   - Observation 2 & 3: Legacy reviews without `rating` evaluate `r.rating ?? r.ok` and correctly map `true` to `'good'` and `false` to `'again'`.
   - `SCHEMA_VERSION` remains 2; `migrate()` preserves existing version 2 states, reviews, attempts, and history without data loss.
   - Exam mode maintains the 100-point rubric and self-assessment workflow (`"Jag kunde detta"` and `"Behöver öva mer"`). Rating buttons and shortcuts are strictly disabled during exam mode.

4. **Integrity & Adversarial Verification**:
   - No hardcoded test responses, fake facades, or bypasses exist in the source code.
   - Stress testing verifies clamping at Box 0 and Box 4, handling of negative boxes, rapid successive submissions, out-of-order review playback, and resistance to malformed input types (NaN, Infinity, null, objects).
   - Shortcut guards prevent accidental rating during Japanese IME composition, textarea editing, and modal display.

---

## 3. Caveats

- **Early Review Policy**: Reviewing a card early with `'good'` before `dueAt` does not promote the card to the next box (per standard Leitner anti-cramming rules).
- **Session Selector in Exam Mode**: Session size selector only affects practice sessions; exam sessions always include all questions for the selected exam.
- No other caveats.

---

## 4. Conclusion

Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) is thoroughly verified, correct, robust, accessible, and backwards-compatible.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently verify this evaluation:

1. **Execute Complete Test Suite**:
   ```powershell
   npm test
   ```
   *Expected output*: 48 passed, 0 failed, execution time ~120ms.

2. **Execute Production Vite Build**:
   ```powershell
   npm run build
   ```
   *Expected output*: Vite transforms client modules and writes `dist/` with exit code 0.

3. **Inspect Implementation Points**:
   - Home selector: `src/views/home.js:33-99`
   - State and keyboard handling: `src/main.js:125-132, 340-379, 667-698`
   - Session rating template and preview: `src/views/session.js:10-22, 171-204`
   - SRS calculation: `src/engine.js:30-76, 208-226`
   - Contrast & styling: `src/style.css:2020-2261`

4. **Invalidation Conditions**:
   - If `SCHEMA_VERSION` is altered from 2, existing reviews in localStorage will be wiped on migration.
   - If `'hard'` interval does not clamp to $\le 1\text{d}$, SRS progression tests will fail.
