# Handoff Report: Practice Session Self-Rating UI & Shortcuts (M2-3)

## 1. Observation

1. **Answer Evaluation & Feedback Flow in `src/views/session.js` (lines 16–19, 91–123)**:
   - Line 16: `const value = s.answers[q.id] || '', graded = typeof s.grades[q.id] === 'boolean';`
   - Line 17: `const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;`
   - Lines 100–116 currently show:
     ```javascript
     q.self
       ? html`<p>Stämmer ditt svar med de viktiga punkterna?</p>
           <div class="self-actions">
             <button class="secondary" @click=${() => ctx.grade(false, true)}>
               Behöver öva mer</button
             ><button class="primary" @click=${() => ctx.grade(true, true)}>
               Jag kunde detta
             </button>
           </div>`
       : !s.grades[q.id]
         ? html`<button class="text-button" @click=${() => ctx.grade(true)}>
             Mitt svar är också korrekt
           </button>`
         : ''
     ```
   - Line 120 in `.question-actions`:
     ```javascript
     ${s.index > 0 ? html`<button class="secondary" @click=${() => ctx.jump(s.index - 1)}>Föregående</button>` : html`<span></span>`}${s.mode === 'exam' && !s.review ? html`<button class="primary" @click=${ctx.next}>${s.index === s.ids.length - 1 ? 'Lämna in tentan' : 'Nästa fråga'} ${icon('ChevronRight')}</button>` : !feedback ? html`<button class="primary" @click=${ctx.check}>${q.self ? 'Visa modellösning' : 'Kontrollera svar'} ${icon('Check')}</button>` : !q.self ? html`<button class="primary" @click=${ctx.next}>${s.index === s.ids.length - 1 ? 'Visa resultat' : 'Nästa fråga'} ${icon('ChevronRight')}</button>` : ''}
     ```

2. **Grading & Review Persistence in `src/main.js` (lines 444–451)**:
   - Lines 444–451:
     ```javascript
     function grade(ok, advance = false) {
       const q = currentQ();
       recordReview(state, session, q.id, ok, Date.now());
       updateResult(state, session, questions, Date.now());
       persist(true);
       if (advance) next();
       else announce(ok ? 'Rätt svar.' : 'Inte rätt denna gång. Förklaringen visas.');
     }
     ```
   - `grade` passes `ok` directly to `recordReview(state, session, q.id, ok, Date.now())`.

3. **`recordReview` in `src/engine.js` (lines 208–226)**:
   - Lines 211–212:
     ```javascript
     const ok = typeof okOrRating === 'boolean' ? okOrRating : okOrRating !== 'again';
     const rating = typeof okOrRating === 'string' ? okOrRating : ok ? 'good' : 'again';
     ```
   - Lines 216–224:
     ```javascript
     state.reviews[id] = {
       id,
       questionId,
       attemptId: session.attemptId,
       ok,
       rating,
       at: existing?.at ?? now,
       updatedAt: now,
     };
     return rebuildStats(state);
     ```
   - `recordReview` already supports receiving strings `'again'`, `'hard'`, `'good'`, `'easy'`.

4. **Leitner Intervals in `src/config.js` (line 6)**:
   - `export const INTERVALS = [600000, 86400000, 259200000, 604800000, 1209600000];`
   - Box 0 = 600,000 ms (10 min)
   - Box 1 = 86,400,000 ms (1 day)
   - Box 2 = 259,200,000 ms (3 days)
   - Box 3 = 604,800,000 ms (7 days)
   - Box 4 = 1,209,600,000 ms (14 days)

5. **Playwright E2E Test Contract in `tests/e2e/app.spec.js`**:
   - Lines 41–43:
     ```javascript
     if (q.self)
       await page
         .getByRole('button', { name: correct ? 'Jag kunde detta' : 'Behöver öva mer', exact: true })
         .click();
     else await page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ }).click();
     ```
   - Lines 99–100 (in exam mode test `submission, self assessment and exam-specific mistakes preserve original score`):
     ```javascript
     await page.getByRole('button', { name: 'Rätta längre svar' }).click();
     await page.getByRole('button', { name: 'Jag kunde detta' }).click();
     ```
   - This explicitly demonstrates that Playwright relies on `"Jag kunde detta"` and `"Behöver öva mer"` during exam self-evaluation, and relies on `/^(Nästa fråga|Visa resultat)$/` when stepping through practice questions.

---

## 2. Logic Chain

1. **Practice Feedback UI vs Exam Review UI**:
   - In exam mode (`s.mode === 'exam'`), the goal is exam paper grading (100-point rubric), not Spaced Repetition scheduling. Playwright tests specifically click `"Jag kunde detta"` on line 100 of `tests/e2e/app.spec.js`.
   - Therefore, by preserving `"Jag kunde detta"` and `"Behöver öva mer"` conditionally when `s.mode === 'exam'`, 100% test compatibility with existing and future exam workflows is preserved.
   - In practice mode (`s.mode !== 'exam'`), the goal is Spaced Repetition retention. Therefore, when `feedback` is displayed, presenting the 4 rating buttons ("Igen", "Svårt", "Bra", "Lätt") fulfills Requirement R2.

2. **Automated vs Manual Practice Progression**:
   - In `tests/e2e/app.spec.js:43`, the test runner advances through practice sessions by clicking `page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ })`.
   - By keeping `<button class="primary" @click=${ctx.next}>Nästa fråga / Visa resultat</button>` in `.question-actions` for auto-graded questions, `npm test` and Playwright E2E tests continue to pass without modification.
   - For student practice, clicking any of the 4 rating buttons invokes `ctx.grade(rating, true)`, which updates the rating AND advances immediately (`advance = true`), providing a streamlined 1-click rating UX.

3. **Dynamic Interval Calculation**:
   - When a question enters feedback, its starting Leitner box `b` is captured (`s.startBox[q.id] ?? state.stats[q.id]?.box ?? 0`).
   - Using `INTERVALS`, the previews evaluate dynamically:
     - `again`: Box 0 -> `10m`
     - `hard`: `Math.min(INTERVALS[b], 86400000)` -> `<= 1d` (`10m` for Box 0, `1d` for Boxes 1–4)
     - `good`: `INTERVALS[Math.min(4, b + 1)]` -> `1d`, `3d`, `7d`, `14d`
     - `easy`: `INTERVALS[Math.min(4, b + 2)]` -> `3d`, `7d`, `14d`
   - Formatted via `formatInterval(ms)` into human-friendly strings (`10m`, `1d`, `3d`, `7d`, `14d`).

4. **Keyboard Accessibility**:
   - Single-key shortcuts `1`, `2`, `3`, `4` must not trigger when the student is typing in an active textarea or input, or during IME composition (`composing === true`), or when a modal `<dialog>` is open.
   - With those guards in place, pressing `1`–`4` provides rapid Anki-style keyboard grading without interfering with text entry or screen readers.

---

## 3. Caveats

1. **Storage Schema Version**: `SCHEMA_VERSION` remains `2`. Reviews already record `rating` as a string (`again` / `hard` / `good` / `easy`) without requiring database schema migration.
2. **Review Mode**: When a user reviews a completed session from `resultView`, clicking rating buttons updates their stat/review, but does not auto-advance if session is already completed.
3. **No other caveats**: All 44 unit and requirement tests currently pass (`npm test`).

---

## 4. Conclusion

The self-rating UI in `src/views/session.js` should be implemented with:
1. A 4-button rating component rendered when `feedback` is active in practice mode (`s.mode !== 'exam'`).
2. Real-time dynamic interval preview based on starting Leitner box (`b`):
   - `Igen (10m)`
   - `Svårt (1d)` (or `10m` if Box 0)
   - `Bra (3d)` (or standard progression for Box `b + 1`)
   - `Lätt (7d)` (or accelerated progression for Box `b + 2`)
3. Conditional rendering ensuring exam mode (`s.mode === 'exam'`) retains the exact buttons `"Jag kunde detta"` and `"Behöver öva mer"` for 100% Playwright compatibility.
4. Retention of the primary `"Nästa fråga"` button in `.question-actions` for auto-graded practice questions to maintain backward compatibility with automated test runners.
5. Window-level keyboard shortcut handler for `1`, `2`, `3`, `4` with IME, input, and modal safety guards.
6. CSS grid layout (4 columns on desktop, 2x2 grid on mobile) with WCAG AA compliant contrast (> 4.5:1).

---

## 5. Verification Method

1. **Project Unit & Requirement Test Suite**:
   ```powershell
   npm test
   ```
   *Expected*: All 44 tests pass with 0 failures.
2. **Playwright E2E Tests**:
   ```powershell
   npx playwright test tests/e2e/app.spec.js
   ```
   *Expected*: All 6 E2E tests pass, specifically:
   - `complete a practice session, keep focus and show real results` (verifies practice mode navigation)
   - `submission, self assessment and exam-specific mistakes preserve original score` (verifies exam mode `"Jag kunde detta"` and `"Behöver öva mer"`)
3. **Manual / Inspection Verification**:
   - Inspect `src/views/session.js` to confirm `s.mode === 'exam'` guards `.self-actions` with `"Jag kunde detta"`.
   - Inspect keyboard shortcuts to ensure `composing` and `isEditable` guards are present.
   - Inspect CSS tokens to verify text-to-background contrast ratios exceeding 4.5:1.
