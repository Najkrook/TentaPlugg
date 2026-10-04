# Handoff Report: Milestone 1 `src/views/session.js` Design

**Handoff Type**: Hard (Investigation & Design Complete)  
**Author**: explorer_m1_2  
**Target File**: `src/views/session.js`  
**Working Directory**: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m1_2`  

---

## 1. Observation

1. **`src/views/session.js` lines 15–17**:
   ```javascript
   const value = s.answers[q.id] || '',
     graded = typeof s.grades[q.id] === 'boolean';
   const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;
   ```
   In practice mode (`s.mode !== 'exam'`), `feedback` is true after `graded` becomes boolean. In exam mode (`s.mode === 'exam'`), `feedback` is false during testing, but evaluates to true when reviewing past attempts (`s.review === true`).

2. **`src/views/session.js` lines 90–115**:
   Feedback rendering only displays general question explanation:
   ```javascript
   <div class="feedback ${q.self ? 'neutral' : s.grades[q.id] ? 'good' : 'again'}">
     <h3>
       ${q.self ? 'Jämför med modellösningen' : s.grades[q.id] ? 'Rätt svar!' : 'Titta på förklaringen och försök igen senare'}
     </h3>
     ${!q.self ? html`<p class="correct-answer" lang=${q.answerLang || 'sv'}>${languageText(q.answers?.join(' / '))}</p>` : ''}${speechButton(ctx, answer, q.self ? 'Lyssna på modellsvaret' : 'Lyssna på svaret')}
     <p>${languageText(q.explanation || q.model)}</p>
   ```
   There is currently no distractor explanation, particle comparison, or link to Snabbguiden.

3. **`src/engine.js` line 227**:
   `export function getContrastiveFeedback(q, userAnswer)` exists in `src/engine.js` (lines 227–325) and returns `{ text: string, guideId: string }` or `null`. It is not imported or called anywhere in `src/views/session.js`.

4. **`src/main.js` lines 252–257**:
   ```javascript
   function navigate(id) {
     flush();
     session = null;
     view = id;
     render(true);
   }
   ```
   Calling standard navigation (`navigate('guide')`) sets `session = null` and terminates the active session. Opening the guide during an active session requires a non-destructive dialog overlay triggered via `openGuideModal(guideId)`.

5. **`tests/*.test.js`**:
   `npm test` executes `node --test --test-isolation=none tests/*.test.js` and currently passes with 24/24 passing unit tests.

---

## 2. Logic Chain

1. From **Observation 1**, `feedback` is true whenever feedback should be presented to the user (both immediately upon grading in practice mode and during review in exam mode). An incorrect objective answer is identified by `feedback && !q.self && s.grades[q.id] === false`.
2. From **Observation 2 & 3**, `getContrastiveFeedback(q, value)` must be imported from `../engine.js` and called when an answer is incorrect to retrieve distractor-specific pedagogical feedback.
3. From **Observation 2**, the feedback template must be augmented to render:
   - A comparison between the student's chosen particle (`cleanUser = (value || '').trim()`) and the correct particle (`q.answers?.join(' / ')`).
   - The contrastive explanation text (`contrastive.text`) formatted with `languageText(...)` to wrap Japanese characters in `<span lang="ja">`.
   - A button `"Öppna snabbguide"` linking to `contrastive.guideId`.
4. From **Observation 4**, clicking `"Öppna snabbguide"` must NOT call `navigate('guide')`. Instead, it must invoke `ctx.openGuideModal(contrastive.guideId)` (with fallback `CustomEvent('open-guide-modal')`), keeping `state.session` intact and unmutated.
5. Packaging the callout rendering in a dedicated helper `contrastiveCallout(contrastive, userVal, answers, ctx)` guarantees modularity and avoids merge collisions with Milestones M2 (rating buttons) and M3 (anime figures).

---

## 3. Caveats

1. **`ctx.openGuideModal` Dependency**: The click handler depends on `ctx.openGuideModal` being passed into `ctx` by `src/main.js` (Milestone M1 track handled by `explorer_m1_3`). A fallback `window.dispatchEvent(new CustomEvent('open-guide-modal', ...))` is included to prevent crashes if `ctx.openGuideModal` is undefined during initial integration or isolated tests.
2. **Distractor Coverage**: `getContrastiveFeedback` returns `null` for non-particle questions or unmapped distractors. When `contrastive` is `null`, `contrastiveCallout` returns `''`, leaving the standard feedback view unchanged.
3. **CSS Class Names**: Styling for `.contrastive-callout`, `.contrastive-comparison`, `.contrastive-chip`, and `.guide-link-btn` must be placed in `src/style.css` (owned by M1 / `explorer_m1_3`).

---

## 4. Conclusion

The exact code modifications for `src/views/session.js` are ready for implementation:
1. **Imports**: Add `getContrastiveFeedback` import from `'../engine.js'`.
2. **Logic**: Compute `const contrastive = (feedback && !q.self && s.grades[q.id] === false) ? getContrastiveFeedback(q, value) : null;`.
3. **Template**: Insert `${contrastiveCallout(contrastive, value, q.answers, ctx)}` right below the existing question explanation in `.feedback`.
4. **Helper**: Add `contrastiveCallout(contrastive, userVal, answers, ctx)` rendering the comparison chips, language-tagged explanation text, and the click handler invoking `ctx.openGuideModal(contrastive.guideId)`.

Full diff and implementation details are provided in `analysis.md`.

---

## 5. Verification Method

1. **Unit Test Command**:
   ```powershell
   npm test
   ```
   Verify that all existing 24 tests continue to pass without regression.
2. **Integration Verification**:
   - Inspect `src/views/session.js` to verify:
     - `import { scoreAttempt, getContrastiveFeedback } from '../engine.js';`
     - Call to `getContrastiveFeedback(q, value)` when `feedback && !q.self && s.grades[q.id] === false`.
     - Presence of `.contrastive-callout` container with `.contrastive-comparison`, `.contrastive-chip.wrong`, `.contrastive-chip.correct`.
     - Button labeled `"Öppna snabbguide"` triggering `ctx.openGuideModal(contrastive.guideId)`.
3. **Session State Invalidation Condition**:
   - Invalidation occurs if clicking `"Öppna snabbguide"` causes `session` to become `null`, restarts question index `s.index`, or triggers page reload. The test for non-destructive behavior confirms `ctx.session` is unchanged before and after opening/closing the modal dialog.
