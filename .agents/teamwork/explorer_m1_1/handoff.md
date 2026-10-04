# Handoff Report: Milestone M1 Contrastive Feedback & Engine Unit Tests

**Agent**: `explorer_m1_1`  
**Working Directory**: `.agents/teamwork/explorer_m1_1`  
**Recipient**: Orchestrator / Implementer Agent  
**Date**: 2026-10-04  

---

## 1. Observation

1. **`src/engine.js` (lines 227–232)**:
   ```javascript
   export function getContrastiveFeedback(q, userAnswer) {
     if (!q || !userAnswer) return null;
     const cleanAns = String(userAnswer).trim();
     const correctAns = q.answers?.[0] || '';
     if (cleanAns === correctAns) return null;
   ```
   - In `src/engine.js` lines 9–10:
     ```javascript
     export const correct = (q, value) =>
       (q.answers || []).some((a) => normalize(a) === normalize(value));
     ```
   - Verbatim Node.js test execution on existing code:
     ```bash
     $ node -e "import('./src/engine.js').then(async eng => { const data = await import('./src/data.js'); const q = data.questions.find(x => x.id === 'b-6'); console.log(eng.getContrastiveFeedback(q, 'しずかではありません')); })"
     {
       text: 'Kontrollera stammen och böjningsmönstret för ordklassen (i-adjektiv böjs med ～かった, na-adjektiv och substantiv med ～でした).',
       guideId: 'adjectives'
     }
     ```
     Result: Question `b-6` has three valid answers: `['しずかじゃないです', 'しずかではありません', 'しずかじゃありません']`. Answering the valid alternative answer `'しずかではありません'` failed `cleanAns === correctAns` (because `correctAns` was index 0 `'しずかじゃないです'`) and returned an erroneous inflection error explanation on a correct answer.

2. **Question bank multi-answer questions**:
   - `node -e "import('./src/data.js').then(m => { console.log(m.questions.filter(q => q.topic === 'Partiklar' && q.answers.length > 1).map(q => [q.id, q.answers])); })"`:
     `l5-10` is the only multi-answer particle question: `answers: ['に', 'へ']`, prompt: `こうえん【　】いきませんか。`.
   - If a student answers `へ`, `correct(q, 'へ')` is `true`.

3. **Distractor coverage in `src/engine.js` (lines 240–308)**:
   - Lines 242–308 implement 11 pairwise rules:
     `cleanAns === 'で' && ['に', 'へ'].includes(correctAns)` (`ni-de`),
     `cleanAns === 'に' && correctAns === 'で'` (`ni-de`),
     `cleanAns === 'は' && correctAns === 'が'` (`wa-ga`),
     `cleanAns === 'が' && correctAns === 'は'` (`wa-ga`),
     `cleanAns === 'を' && correctAns === 'が'` (`wa-ga`),
     `cleanAns === 'を' && correctAns === 'に'` (`wo-to-no-mo`),
     `cleanAns === 'に' && correctAns === '×'` (`no-particle`),
     `cleanAns === '×' && ['に', 'で', 'を', 'は', 'が', 'と', 'の'].includes(correctAns)` (`ni-de` / `wa-ga` / `wo-to-no-mo`),
     `cleanAns === 'と' && correctAns === 'の'` (`wo-to-no-mo`),
     `cleanAns === 'の' && correctAns === 'と'` (`wo-to-no-mo`),
     `cleanAns === 'へ' && correctAns === 'で'` (`ni-de`).
   - Missing common distractors:
     - `cleanAns === 'が' && correctAns === 'を'` (e.g. `p-3`: `パン【　】食べます。` Ans: `を`) -> returns `null`.
     - `cleanAns === 'で' && correctAns === 'を'` (e.g. `p-3`: `パン【　】食べます。`) -> returns `null`.
     - `cleanAns === 'を' && correctAns === 'で'` (e.g. `p-2`: `日本語【　】手紙を書きます。` Ans: `で`) -> returns `null`.
     - `cleanAns === 'に' && correctAns === 'を'` (e.g. `l5-8`: `Tシャツ【　】いちまいください。` Ans: `を`) -> returns `null`.
     - `cleanAns === 'は' && correctAns === 'も'` (e.g. `p-6`: `わたし【　】学生です。（jag också）` Ans: `も`) -> returns `null`.
     - `cleanAns === 'も' && correctAns === 'は'` (e.g. `p-4`: `わたし【　】学生です。` Ans: `は`) -> returns `null`.
     - `cleanAns === 'は' && correctAns === 'の'` (e.g. `p-9`: `わたし【　】本です。` Ans: `の`) -> returns `null`.
     - `cleanAns === 'の' && correctAns === 'は'` (e.g. `わたし【の】学生です`) -> returns `null`.
     - `cleanAns === 'に' && correctAns === 'と'` (e.g. `p-7`: `ともだち【　】映画を見ました。` Ans: `と`) -> returns `null`.
     - `cleanAns in ['で', 'は', 'が', 'を', 'へ'] && correctAns === '×'` (e.g. `p-11`, `l5-1`, `l5-3`, `l5-5`, `l5-9`, `l5-14`, `l5-19`, `l5-22`) -> returns `null`.

4. **Guide IDs in `src/data.js` (lines 745–776)**:
   - The 6 guide entries have IDs:
     `'wa-ga'`, `'ni-de'`, `'wo-to-no-mo'`, `'no-particle'`, `'adjectives'`, `'moras'`.

5. **Test suite status**:
   - `package.json` line 9: `"test": "node --test --test-isolation=none tests/*.test.js"`.
   - `npm test` runs 41 tests (24 original + 17 from `tests/requirements.test.js` via proxy). All 41 pass.
   - `tests/engine.test.js` currently contains 0 tests for `getContrastiveFeedback`.

---

## 2. Logic Chain

1. **Premise 1 (from Observation 1 & 2)**: Answering a valid alternative answer must never produce contrastive error feedback.
2. **Deduction 1**: Because `correct(q, userAnswer)` already implements canonical multi-answer and normalized evaluation, replacing `const correctAns = q.answers?.[0] || ''; if (cleanAns === correctAns) return null;` with:
   ```javascript
   if (!cleanAns) return null;
   if (correct(q, userAnswer)) return null;
   ```
   guarantees that any correct answer (single, array-based alternative like `['に', 'へ']`, trimmed/normalized, or inflection variants like `b-6`) returns `null` immediately.
3. **Premise 2 (from Observation 3 & 4)**: All common particle distractors encountered in the practice deck must have pedagogical explanations and navigate to valid Snabbguide chapters.
4. **Deduction 2**: Using `hasAns(target)` instead of `correctAns === target` ensures multi-answer questions are evaluated accurately regardless of answer array ordering. Adding the missing 10 distractor rules covers all typical particle confusions without creating false positives.
5. **Premise 3 (from Observation 5)**: Milestone 1 requires comprehensive unit test coverage in the engine test suite.
6. **Deduction 3**: Adding 3 focused unit test suites to `tests/engine.test.js` (covering correct answer null returns, all pairwise particle distractors, and edge cases/overrides) provides immediate regression protection without breaking any existing tests.

---

## 3. Caveats

- **Scope boundary**: This investigation is strictly read-only. No source files (`src/engine.js`, `tests/engine.test.js`) were edited during this investigation.
- **UI integration boundary**: Rendering the contrastive callout box and linking to the guide modal is handled by peer subagents `explorer_m1_2` (`src/views/session.js`) and `explorer_m1_3` (`src/main.js`, `src/views/guide.js`, `src/style.css`). The engine interface contract (`getContrastiveFeedback(q, value) -> { text, guideId } | null`) perfectly fulfills the UI requirements.
- **Custom `q.contrastive` format**: In addition to string values, `q.contrastive[cleanAns]` was made backwards-compatible with object structures `{ text, guideId }` should custom questions specify an explicit guide chapter.

---

## 4. Conclusion

1. **`src/engine.js`**: Replace lines 227–325 with the enhanced `getContrastiveFeedback` function specified in Section 4.1 of `analysis.md`.
2. **`tests/engine.test.js`**:
   - Update import to include `getContrastiveFeedback`.
   - Append the 3 comprehensive unit test suites specified in Section 5.2 of `analysis.md`.

---

## 5. Verification Method

1. **Verify Correct Answer Null Returns**:
   Run the following Node command:
   ```bash
   node -e "import('./src/engine.js').then(async eng => { const data = await import('./src/data.js'); const qMulti = { topic: 'Partiklar', answers: ['に', 'へ'] }; console.assert(eng.getContrastiveFeedback(qMulti, 'に') === null); console.assert(eng.getContrastiveFeedback(qMulti, 'へ') === null); console.assert(eng.getContrastiveFeedback(qMulti, ' に ') === null); const qBoj = data.questions.find(x => x.id === 'b-6'); console.assert(eng.getContrastiveFeedback(qBoj, 'しずかではありません') === null); console.log('Correct answer verification PASSED'); })"
   ```
   **Expected result**: Output `Correct answer verification PASSED` with no assertion errors.

2. **Verify Distractor Feedback & Guide IDs**:
   ```bash
   node -e "import('./src/engine.js').then(eng => { const fb1 = eng.getContrastiveFeedback({ topic: 'Partiklar', answers: ['に', 'へ'] }, 'で'); console.assert(fb1 && fb1.guideId === 'ni-de'); const fb2 = eng.getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'が'); console.assert(fb2 && fb2.guideId === 'wa-ga'); const fb3 = eng.getContrastiveFeedback({ topic: 'Partiklar', answers: ['×'] }, 'に'); console.assert(fb3 && fb3.guideId === 'no-particle'); console.log('Distractor verification PASSED'); })"
   ```

3. **Verify Full Test Suite**:
   ```bash
   npm test
   ```
   **Expected result**: All existing tests plus new unit tests pass with exit code 0.
