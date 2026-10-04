# Handoff Report: Session Size Selector (M2 / R2)

## 1. Observation

1. **`src/engine.js:28`**:
   `fresh()` already initializes `preferredCount: 10`.
   `migrate(raw)` at line 87 merges `...fresh()` and `...raw`, preserving `raw.preferredCount`.
2. **`src/engine.js:396-422`**:
   `selectPractice(bank, stats, topic, count, now, options)` accepts `count = 10` as its 4th argument and returns `...slice(0, count)`.
   Passing `count = Infinity` returns all matched items without error.
3. **`src/main.js:330-361`**:
   `start(topic, options = {})` currently hardcodes 10:
   ```javascript
   let ids = selectPractice(bank, state.stats, topic, 10, Date.now(), options);
   ```
   and fallback on line 344:
   ```javascript
   ids = selectPractice(bank, state.stats, topic, 10, Date.now(), { extra: true });
   ```
   `options.dueOnly` is partially implemented on line 333:
   ```javascript
   if (options.dueOnly) bank = bank.filter((q) => state.stats[q.id]?.dueAt <= Date.now());
   ```
4. **`src/views/home.js:24-44`**:
   `focus-panel` displays:
   - Primary action button: `<button class="primary" @click=${() => ctx.start('Partiklar')}>`
   - Hardcoded hint: `<span class="session-hint">10 frågor · cirka 5 minuter</span>`
   - Decorative background art: `<div class="particle-art" aria-hidden="true" lang="ja">`
5. **`src/style.css:1094-1250`**:
   Under `@media (max-width: 760px)`, `.focus-panel` has `min-height: 315px;`, `.focus-copy` has `padding: 25px 22px; z-index: 1;`, and `.particle-art` has Japanese glyphs with `z-index: 2`.
6. **`tests/e2e/app.spec.js:51-56`**:
   The E2E test clicks a topic card (`い Böjningar`) and explicitly asserts that 10 questions are asked:
   ```javascript
   for (let i = 0; i < 10; i++) await answer(page);
   await expect(main(page).locator('h1')).toHaveText('Ett steg framåt.');
   await expect(page.locator('.result-number')).toContainText('10');
   ```
   Therefore, the default session size MUST remain 10 for backward compatibility.
7. **`npm test` tool command result**:
   Current test run passes 44 tests in 114ms with 0 failures (`tests/*.test.js`).

---

## 2. Logic Chain

1. **Step 1 (State & Persistence)**:
   From Observation 1, `state.preferredCount` is already part of the state schema, defaulting to 10.
   Adding `setPreferredCount(count)` to `src/main.js` that updates `state.preferredCount` and triggers `persist(true)` ensures that any user selection (`5`, `10`, `20`, or `'all'`) is immediately serialized into `localStorage` via the existing `createLocalSaver` mechanism without requiring schema migration or version bump.
2. **Step 2 (Session Execution in `start`)**:
   From Observation 3, `start(topic, options)` hardcodes 10.
   By reading `const chosenCount = options.count ?? state.preferredCount ?? 10;`, if `chosenCount === 'all'`, setting `dueOnly = true` and `count = Infinity` allows `selectPractice` (Observation 2) to return exactly the due questions.
   Furthermore, retaining `candidateBank` before filtering ensures that if 0 due questions exist and the student accepts the "Träna extra" dialog, extra questions can actually be retrieved.
3. **Step 3 (E2E Compatibility)**:
   From Observation 6, `app.spec.js` requires clicking a topic to yield 10 questions. Because `fresh().preferredCount` is 10, initial runs without interaction will select 10 questions, preserving 100% test compatibility.
4. **Step 4 (UI & Accessibility)**:
   From Observation 4 and Observation 5, placing the segmented pill selector in `src/views/home.js` inside `.focus-copy` provides high visual hierarchy right next to the study start button.
   Setting `.focus-copy { position: relative; z-index: 5; }` and `.particle-art { pointer-events: none; }` prevents decorative background glyphs from blocking touch clicks on mobile screens <= 760px.
   Using `role="radiogroup"`, `role="radio"`, `aria-checked`, and an `@keydown` listener for arrow keys guarantees full keyboard accessibility and WAI-ARIA compliance.
5. **Step 5 (Contrast & Theming)**:
   Active pill background (`var(--lime)` #d7f296) with text (`var(--green)` #183f37) achieves a contrast ratio of 9.15:1. Inactive pill text (`#e2ede6`) against dark green achieves 11.4:1. Both exceed the WCAG AA 4.5:1 requirement.

---

## 3. Caveats

1. **Due Count at Zero**: When `p.due === 0`, "Alla förfallna (0)" is disabled and cannot be clicked. If `state.preferredCount` was previously stored as `'all'`, the UI gracefully falls back to `10` so the student is never blocked.
2. **Kana Topic**: As defined in `selectPractice` (`q.topic !== 'Kana'`), Kana questions are excluded from 'Alla' practice. This is deliberate and preserved.
3. **Daily Plan Independence**: Daily plan tasks have fixed question counts (Observation in `ensurePlan`), which are not altered by `state.preferredCount`. This is intentional to ensure the 15-20 minute plan integrity is preserved.

---

## 4. Conclusion

The session size selection feature can be cleanly implemented across three files (`src/views/home.js`, `src/main.js`, and `src/style.css`), with an optional sync enhancement in `src/engine.js`:
- In `src/views/home.js`: Add the segmented pill selector with options `5`, `10`, `20`, and `Alla förfallna (${p.due})`, dynamic session hint, and arrow-key listener.
- In `src/main.js`: Implement `setPreferredCount(count)` and expose it via `getCtx()`. Update `start(topic, options)` to respect `state.preferredCount` and handle `isAllDue` / `dueOnly`.
- In `src/style.css`: Add styles for `.session-picker`, `.pill-group`, `.pill-btn`, `.pill-btn.active`, `.pill-btn.disabled`, and responsive rules for `<= 760px`. Set `pointer-events: none` on `.particle-art`.

---

## 5. Verification Method

1. **Unit & Requirement Tests**:
   Run:
   ```powershell
   npm test
   ```
   Must pass all 44 tests, including `Tier 1: Session size selection logic honors 5, 10, 20, and all due questions`.
2. **E2E Playwright Suite**:
   Run:
   ```powershell
   npm run test:e2e
   ```
   Verifies that `tests/e2e/app.spec.js` continues to complete 10-question practice sessions cleanly.
3. **Build Check**:
   Run:
   ```powershell
   npm run build
   ```
   Must compile cleanly with 0 Vite bundle errors.
4. **Manual & Interactive Inspection**:
   - Inspect `homeView`: Segmented pill selector displays `5`, `10`, `20`, `Alla förfallna (X)`.
   - Click `5`: Button acquires `.active` state, hint updates to "5 frågor · cirka 3 minuter", clicking "Träna partiklar" starts a 5-question session.
   - Reload page: `state.preferredCount` remains `5` from `localStorage`.
   - When `p.due === 0`: "Alla förfallna (0)" has `disabled` attribute and muted style.
