# Analysis: Contrastive Feedback & Quick Guide Integration in `src/views/session.js`

**Milestone**: M1 (Pedagogik & Snabbguide)  
**Agent**: explorer_m1_2  
**Date**: 2026-10-04  
**Target File**: `src/views/session.js`  
**Related Files**: `src/engine.js`, `src/main.js`, `src/views/guide.js`, `src/style.css`

---

## 1. Executive Summary

Milestone 1 Requirement 1 (R1) in `ORIGINAL_REQUEST.md` mandates:
1. Providing contrastive feedback when students make common particle errors (e.g. explaining why に is used for location of existence while で is used for location of action).
2. Enabling students to open and inspect relevant grammar rules from the Snabbguide directly during an active session without losing their session progress or question state.

In this investigation, we analyzed `src/views/session.js`, the session lifecycle across practice and exam modes, the engine function `getContrastiveFeedback`, and the non-destructive modal trigger mechanism. We designed the complete, surgical code-level solution for `src/views/session.js`.

---

## 2. Examination of Current Feedback Flow in `src/views/session.js`

### 2.1 State Representation & Session Lifecycle

In `src/views/session.js`:
- Current question: `const q = questions.find((q) => q.id === s.ids[s.index]);`
- User answer: `const value = s.answers[q.id] || '';`
- Graded state: `const graded = typeof s.grades[q.id] === 'boolean';`
- Feedback active flag:
  ```javascript
  const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;
  ```

### 2.2 Practice Mode (`s.mode === 'practice'`)
1. **Unanswered / Editing**:
   - `s.grades[q.id]` is `undefined` -> `graded` is `false`.
   - `feedback` is `false`.
   - Textarea is interactive (`?readonly=${feedback}`).
   - Choices are clickable (`aria-disabled="false"`).
   - Primary action button is `"Kontrollera svar"` (or `"Visa modellösning"` if `q.self`).
2. **Checking Answer**:
   - User clicks `"Kontrollera svar"`, calling `ctx.check()`.
   - For objective questions (`!q.self`), `ctx.check()` calls `grade(correct(q, session.answers[q.id]))`.
   - `grade` records the review via `recordReview(...)`, saving `session.grades[q.id] = ok` (boolean `true` or `false`).
   - `render()` is called.
3. **Displaying Feedback**:
   - `graded` is now `true`, so `feedback` is `true`.
   - Choices receive `aria-disabled="true"` and the correct choice is marked with class `.right`.
   - Textarea receives `readonly`.
   - Bottom action button switches to `"Nästa fråga"` (or `"Visa resultat"` on the final card).
   - Current template renders:
     ```javascript
     <div class="feedback ${q.self ? 'neutral' : s.grades[q.id] ? 'good' : 'again'}">
       <h3>${q.self ? 'Jämför med modellösningen' : s.grades[q.id] ? 'Rätt svar!' : 'Titta på förklaringen och försök igen senare'}</h3>
       ${!q.self ? html`<p class="correct-answer" lang=${q.answerLang || 'sv'}>${languageText(q.answers?.join(' / '))}</p>` : ''}
       ${speechButton(ctx, answer, q.self ? 'Lyssna på modellsvaret' : 'Lyssna på svaret')}
       <p>${languageText(q.explanation || q.model)}</p>
       ...
       ${!q.self && !s.grades[q.id] ? html`<button class="text-button" @click=${() => ctx.grade(true)}>Mitt svar är också korrekt</button>` : ''}
     </div>
     ```

### 2.3 Exam Mode (`s.mode === 'exam'`)
1. **During Exam (`!s.review`)**:
   - `feedback` is **strictly false** because `s.mode === 'exam'` and `!s.review`.
   - Neither correct answer nor explanation is displayed. Student advances using `"Nästa fråga"` or the question jumper grid (`.question-jump`).
2. **After Submission & Review (`s.review === true`)**:
   - When the student finishes the exam, they can click `"Gå igenom svaren"` or review specific questions from `resultView(ctx)`.
   - `ctx.review(index)` sets `session.done = false; session.review = true; jump(index);`.
   - Because `s.review` is `true`, `feedback` evaluates to **`true`**.
   - If the student made an error on question `q.id`, `s.grades[q.id] === false`.
   - Therefore, contrastive feedback **will also automatically display during exam review**, reinforcing learning when reviewing test mistakes!

---

## 3. Integration Points for `getContrastiveFeedback`

### 3.1 Importing the Engine Function
In `src/views/session.js`, line 5 currently imports `scoreAttempt`:
```javascript
// BEFORE
import { scoreAttempt } from '../engine.js';

// PROPOSED
import { scoreAttempt, getContrastiveFeedback } from '../engine.js';
```

### 3.2 Invocation Conditions
Contrastive feedback should be computed when:
1. `feedback` is `true` (feedback is being shown).
2. `q.self` is `false` (objective question, not self-evaluated essay).
3. `s.grades[q.id] === false` (the student's answer was incorrect).
4. `value` has content.

```javascript
const isIncorrect = feedback && !q.self && s.grades[q.id] === false;
const contrastive = isIncorrect ? getContrastiveFeedback(q, value) : null;
```

### 3.3 Engine Contract (`getContrastiveFeedback`)
`getContrastiveFeedback(q, userAnswer)` returns:
- `null` if the answer is correct (handled via `correct(q, userAnswer)`), empty, or if no distractor rule matches.
- An object if a distractor rule matches:
  ```javascript
  {
    text: "Du valde で. で används för platsen där en aktiv handling sker (t.ex. 本を読みます), medan に här anger plats för existens (あります/います), mål för förflyttning, eller personen man träffar.",
    guideId: "ni-de"
  }
  ```

---

## 4. Template Rendering Design: Contrastive Callout

### 4.1 UI & UX Requirements
The callout must feature:
1. **Clear visual grouping**: An alert/callout box styled distinctly within `.feedback.again`.
2. **Side-by-side particle comparison**: Clear chips comparing what the student selected vs what the correct particle is:
   - Student's chosen particle: `value.trim()`
   - Correct particle: `q.answers?.join(' / ')`
3. **Contrastive pedagogical explanation**: `contrastive.text`, processed through `languageText(...)` to ensure all embedded Japanese text (`で`, `に`, `あります`, `います`, etc.) is marked with `lang="ja"`.
4. **Action button**: `"Öppna snabbguide"` with an accessible icon (`icon('BookOpen')` or `icon('Library')`).

### 4.2 Helper Function Design: `contrastiveCallout`
To keep `sessionView` clean, maintainable, and prevent merge conflicts with Milestone 2 (rating buttons) and Milestone 3 (anime figures), we encapsulate the rendering into a helper function `contrastiveCallout`:

```javascript
function contrastiveCallout(contrastive, userVal, answers, ctx) {
  if (!contrastive) return '';
  const cleanUser = (userVal || '').trim();
  const correctText = answers?.join(' / ') || '';
  return html`<div class="contrastive-callout" role="region" aria-label="Kontrastiv förklaring">
    <div class="contrastive-header">
      <div class="contrastive-comparison">
        <span class="contrastive-chip wrong" title="Ditt svar">
          <small>Ditt val:</small> <strong lang="ja">${cleanUser}</strong>
        </span>
        <span class="contrastive-vs" aria-hidden="true">vs</span>
        <span class="contrastive-chip correct" title="Rätt svar">
          <small>Rätt:</small> <strong lang="ja">${correctText}</strong>
        </span>
      </div>
    </div>
    <p class="contrastive-text">${languageText(contrastive.text)}</p>
    ${contrastive.guideId
      ? html`<button
          type="button"
          class="guide-link-btn text-button"
          @click=${(e) => {
            e.preventDefault();
            if (typeof ctx.openGuideModal === 'function') {
              ctx.openGuideModal(contrastive.guideId);
            } else {
              window.dispatchEvent(
                new CustomEvent('open-guide-modal', {
                  detail: { guideId: contrastive.guideId },
                  bubbles: true,
                }),
              );
            }
          }}
        >
          ${icon('BookOpen')} Öppna snabbguide
        </button>`
      : ''}
  </div>`;
}
```

### 4.3 Insertion Point in `sessionView`
In `sessionView(ctx)` lines 90-115, insert `${contrastiveCallout(contrastive, value, q.answers, ctx)}` directly after `<p>${languageText(q.explanation || q.model)}</p>`:

```javascript
        ${
          feedback
            ? html`<div class="feedback ${q.self ? 'neutral' : s.grades[q.id] ? 'good' : 'again'}">
                <h3>
                  ${q.self ? 'Jämför med modellösningen' : s.grades[q.id] ? 'Rätt svar!' : 'Titta på förklaringen och försök igen senare'}
                </h3>
                ${!q.self ? html`<p class="correct-answer" lang=${q.answerLang || 'sv'}>${languageText(q.answers?.join(' / '))}</p>` : ''}${speechButton(ctx, answer, q.self ? 'Lyssna på modellsvaret' : 'Lyssna på svaret')}
                <p>${languageText(q.explanation || q.model)}</p>
                ${contrastiveCallout(contrastive, value, q.answers, ctx)}
                ${
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
                }
              </div>`
            : ''
        }
```

---

## 5. Non-Destructive Snabbguide Modal Trigger & Session Preservation

### 5.1 Why Session Preservation Matters
In `src/main.js`:
```javascript
function navigate(id) {
  flush();
  session = null;
  view = id;
  render(true);
}
```
If a student were to navigate to `'guide'`, `session` is set to `null` and the view unmounts. To fulfill R1, the modal MUST open as a non-destructive dialog over the active session without touching `session`.

### 5.2 Click Handler Mechanics
1. **Primary Trigger**:
   Calls `ctx.openGuideModal(contrastive.guideId)`.
2. **Fallback Support**:
   Dispatches a `CustomEvent('open-guide-modal', { detail: { guideId: contrastive.guideId }, bubbles: true })` on `window`. This enables headless test fixtures or alternative event-listener architectures to intercept modal open requests without breaking.
3. **No Navigation or Reload**:
   - `session` in `ctx.session` remains untouched.
   - `s.index`, `s.answers`, and `s.grades` remain unchanged.
   - When the student closes the modal (via dialog close button, clicking the backdrop, or pressing Escape), the student is immediately returned to the exact question state with the contrastive feedback still displayed and the `"Nästa fråga"` button ready.

---

## 6. CSS Requirements for `src/style.css`

To coordinate with `explorer_m1_3` and implementer, the following CSS rules are designed for `.contrastive-callout`:

```css
/* Contrastive feedback callout */
.contrastive-callout {
  margin-top: 16px;
  margin-bottom: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border-left: 4px solid #d97736;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.contrastive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.contrastive-comparison {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.contrastive-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.contrastive-chip small {
  color: var(--muted);
  font-size: 11px;
}

.contrastive-chip strong {
  font-size: 14px;
}

.contrastive-chip.wrong {
  background: #fde8e8;
  color: #c53030;
}

.contrastive-chip.correct {
  background: #e6f4ea;
  color: #137333;
}

.contrastive-vs {
  color: var(--muted);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
}

.contrastive-text {
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #243e36;
}

.guide-link-btn {
  margin-top: 4px;
  color: #183f37;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.guide-link-btn:hover {
  color: #529574;
}
```

---

## 7. Concrete Code Diff for `src/views/session.js`

```diff
--- a/src/views/session.js
+++ b/src/views/session.js
@@ -2,7 +2,7 @@
 import { keyed } from 'lit-html/directives/keyed.js';
 import { live } from 'lit-html/directives/live.js';
 import { questions } from '../data.js';
-import { scoreAttempt } from '../engine.js';
+import { scoreAttempt, getContrastiveFeedback } from '../engine.js';
 import { promptSpeech, answerSpeech, japaneseText } from '../speech.js';
 import { icon, languageText, speechButton } from './shared.js';
 export function sessionView(ctx) {
@@ -14,6 +14,8 @@
   const value = s.answers[q.id] || '',
     graded = typeof s.grades[q.id] === 'boolean';
   const feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review;
+  const isIncorrect = feedback && !q.self && s.grades[q.id] === false;
+  const contrastive = isIncorrect ? getContrastiveFeedback(q, value) : null;
   const ask = promptSpeech(q),
     answer = feedback ? answerSpeech(q) : '';
   const showSpeech =
@@ -93,6 +95,7 @@
                 </h3>
                 ${!q.self ? html`<p class="correct-answer" lang=${q.answerLang || 'sv'}>${languageText(q.answers?.join(' / '))}</p>` : ''}${speechButton(ctx, answer, q.self ? 'Lyssna på modellsvaret' : 'Lyssna på svaret')}
                 <p>${languageText(q.explanation || q.model)}</p>
+                ${contrastiveCallout(contrastive, value, q.answers, ctx)}
                 ${
                   q.self
                     ? html`<p>Stämmer ditt svar med de viktiga punkterna?</p>
@@ -121,6 +124,37 @@
     )}`;
 }
+function contrastiveCallout(contrastive, userVal, answers, ctx) {
+  if (!contrastive) return '';
+  const cleanUser = (userVal || '').trim();
+  const correctText = answers?.join(' / ') || '';
+  return html`<div class="contrastive-callout" role="region" aria-label="Kontrastiv förklaring">
+    <div class="contrastive-header">
+      <div class="contrastive-comparison">
+        <span class="contrastive-chip wrong" title="Ditt svar">
+          <small>Ditt val:</small> <strong lang="ja">${cleanUser}</strong>
+        </span>
+        <span class="contrastive-vs" aria-hidden="true">vs</span>
+        <span class="contrastive-chip correct" title="Rätt svar">
+          <small>Rätt:</small> <strong lang="ja">${correctText}</strong>
+        </span>
+      </div>
+    </div>
+    <p class="contrastive-text">${languageText(contrastive.text)}</p>
+    ${contrastive.guideId
+      ? html`<button
+          type="button"
+          class="guide-link-btn text-button"
+          @click=${(e) => {
+            e.preventDefault();
+            if (typeof ctx.openGuideModal === 'function') {
+              ctx.openGuideModal(contrastive.guideId);
+            } else {
+              window.dispatchEvent(
+                new CustomEvent('open-guide-modal', {
+                  detail: { guideId: contrastive.guideId },
+                  bubbles: true,
+                }),
+              );
+            }
+          }}
+        >
+          ${icon('BookOpen')} Öppna snabbguide
+        </button>`
+      : ''}
+  </div>`;
+}
 function resultView(ctx) {
   const s = ctx.session,
     result = scoreAttempt(s, questions);
```
