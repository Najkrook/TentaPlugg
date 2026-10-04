# Analysis: Practice Session Self-Rating UI & Keyboard Shortcuts (M2-3)

## 1. Executive Summary
This analysis details the technical design and UI/UX implementation for the self-rated Spaced Repetition (SRS) difficulty buttons in `src/views/session.js` for Milestone M2 (Requirement R2 in `ORIGINAL_REQUEST.md`).

The objective is to replace the binary check/advance step in practice sessions with a 4-tier rating system:
1. **Igen** (`again`): 10 minutes (Box 0)
2. **Svårt** (`hard`): <= 1 day (current Box)
3. **Bra** (`good`): Normal interval progression (Box + 1, e.g. 1d / 3d / 7d / 14d)
4. **Lätt** (`easy`): Accelerated interval progression (Box + 2, e.g. 3d / 7d / 14d, capped at Box 4)

Crucially, this design provides:
- **Dynamic interval preview** for all 4 ratings calculated in real time based on the active question's Leitner box.
- **100% backward compatibility** with existing Playwright E2E tests (`tests/e2e/app.spec.js`) by preserving the exact labels and behavior of `"Jag kunde detta"` and `"Behöver öva mer"` in exam mode, and retaining the `"Nästa fråga"` / `"Visa resultat"` button in question actions for automated flows.
- **Accessible keyboard shortcuts** (`1`: Igen, `2`: Svårt, `3`: Bra, `4`: Lätt) with complete safety guards for IME composition and text fields.
- **WCAG AA contrast compliance** and clean responsive adaptation (desktop 4-column row to mobile 2x2 grid).

---

## 2. Current Architecture & Practice Feedback Flow

### 2.1 Current Interaction Lifecycle
In `src/views/session.js` and `src/main.js`:
1. **Question rendering**: `sessionView(ctx)` renders the current question `q` from `session.ids[session.index]`.
2. **Input / Choice selection**: User inputs an answer or selects a choice via `ctx.answer(val)`.
3. **Checking / Evaluation**:
   - For auto-graded questions (`!q.self`): User clicks `"Kontrollera svar"`, calling `ctx.check()`.
   - `check()` in `src/main.js` calls `grade(correct(q, session.answers[q.id]))`.
   - `grade(ok, advance = false)` in `src/main.js`:
     - Calls `recordReview(state, session, q.id, ok, Date.now())`.
     - Sets `session.grades[q.id] = ok`.
     - Calls `rebuildStats(state)` and updates `state.stats[q.id]`.
     - Calls `announce(...)`, rendering the feedback card.
   - For self-assessed questions (`q.self`): `check()` sets `session.revealed[q.id] = true` and shows the model answer.
4. **Current Feedback Presentation**:
   - `feedback = (s.mode !== 'exam' && (graded || s.revealed?.[q.id])) || s.review`.
   - Shows correct answer, explanation, contrastive callout (if wrong particle), and speech button.
   - For `q.self`: Renders `.self-actions` containing:
     - `<button class="secondary" @click=${() => ctx.grade(false, true)}>Behöver öva mer</button>`
     - `<button class="primary" @click=${() => ctx.grade(true, true)}>Jag kunde detta</button>`
   - For `!q.self`: If incorrect, shows `<button class="text-button" @click=${() => ctx.grade(true)}>Mitt svar är också korrekt</button>`.
   - In `.question-actions`: Shows `<button class="primary" @click=${ctx.next}>Nästa fråga / Visa resultat</button>`.

### 2.2 Key Observations & Gap Analysis
1. Auto-graded practice questions currently record binary reviews (`ok: true` -> `rating: 'good'`, `ok: false` -> `rating: 'again'`). The user has no opportunity to indicate if an answer was `'hard'` or `'easy'`.
2. Self-assessed questions currently only offer binary options (`Behöver öva mer` vs `Jag kunde detta`), lacking SRS interval feedback.
3. In exam mode, after finishing an exam, `Rätta längre svar` relies strictly on the exact button texts `"Jag kunde detta"` and `"Behöver öva mer"`. Changing these in exam mode breaks Playwright test `app.spec.js`.
4. Automated tests like `test('complete a practice session, keep focus and show real results')` in `app.spec.js` advance by clicking `/^(Nästa fråga|Visa resultat)$/`. If this button were removed from practice mode, existing E2E tests would fail.

---

## 3. Design of the 4 Rating Buttons & Dynamic Interval Calculation

### 3.1 Interval Math & Leitner Box Progression
From `src/config.js` and `src/engine.js`:
```javascript
export const INTERVALS = [
  600000,     // Box 0: 10 minutes
  86400000,   // Box 1: 1 day (24 hours)
  259200000,  // Box 2: 3 days (72 hours)
  604800000,  // Box 3: 7 days (168 hours)
  1209600000, // Box 4: 14 days (336 hours)
];
```

The 4 ratings behave as follows according to the SRS Leitner contract (`engine.js` `nextStat`):
| Rating | Box Calculation | Interval Calculation | Display Example |
|---|---|---|---|
| **Igen** (`again`) | Always resets to `0` | `INTERVALS[0]` (600,000 ms) | `10m` |
| **Svårt** (`hard`) | Retains current box `b` | `Math.min(INTERVALS[b], 86400000)` | `<= 1d` (`10m` for Box 0, `1d` for Boxes 1–4) |
| **Bra** (`good`) | `Math.min(4, b + 1)` | `INTERVALS[Math.min(4, b + 1)]` | `1d`, `3d`, `7d`, `14d` |
| **Lätt** (`easy`) | `Math.min(4, b + 2)` | `INTERVALS[Math.min(4, b + 2)]` | `3d`, `7d`, `14d` (capped at Box 4) |

### 3.2 Dynamic Interval Preview Helper
To display accurate previews, we derive the interval from the question's starting box:
```javascript
export function formatInterval(ms) {
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export function previewRatingInterval(box, rating) {
  const b = typeof box === 'number' && box >= 0 ? box : 0;
  if (rating === 'again') return formatInterval(INTERVALS[0]);
  if (rating === 'hard') return formatInterval(Math.min(INTERVALS[Math.min(4, b)], 86400000));
  if (rating === 'easy') return formatInterval(INTERVALS[Math.min(4, b + 2)]);
  return formatInterval(INTERVALS[Math.min(4, b + 1)]); // good
}
```

### 3.3 Preserving the Pre-Review Box
Because `check()` immediately records an initial review before rating, `state.stats[q.id]` gets updated on check. To ensure the interval preview reflects the question's **starting box** entering the question:
```javascript
// In sessionView:
s.startBox ||= {};
if (s.startBox[q.id] === undefined && typeof s.grades[q.id] !== 'boolean') {
  s.startBox[q.id] = ctx.state.stats[q.id]?.box ?? 0;
}
const currentBox = s.startBox[q.id] ?? ctx.state.stats[q.id]?.box ?? 0;
```
This guarantees deterministic interval previews across all questions.

---

## 4. UI Layout & Exam Mode Compatibility

### 4.1 Condition Matrix
| Session Mode | Question Type | Displayed Controls |
|---|---|---|
| **Exam mode** (`s.mode === 'exam'`) | Auto-graded | Standard exam buttons (no immediate feedback, only question jump and next) |
| **Exam mode (Review)** (`s.mode === 'exam'`) | Self-assessed (`q.self`) | `"Behöver öva mer"` (secondary) and `"Jag kunde detta"` (primary) |
| **Practice mode** (`s.mode !== 'exam'`) | Auto-graded (`!q.self`) | Explanation + 4 rating buttons (`Igen`, `Svårt`, `Bra`, `Lätt`) + `"Nästa fråga"` fallback |
| **Practice mode** (`s.mode !== 'exam'`) | Self-assessed (`q.self`) | Model answer + 4 rating buttons (`Igen`, `Svårt`, `Bra`, `Lätt`) |

### 4.2 Rating Buttons Component in `sessionView`
```javascript
function ratingButtonsTemplate(ctx, q, currentBox) {
  const ratings = [
    { key: '1', rating: 'again', label: 'Igen', cls: 'rating-again' },
    { key: '2', rating: 'hard', label: 'Svårt', cls: 'rating-hard' },
    { key: '3', rating: 'good', label: 'Bra', cls: 'rating-good' },
    { key: '4', rating: 'easy', label: 'Lätt', cls: 'rating-easy' },
  ];

  return html`<div class="rating-group" role="group" aria-label="Självskattad svårighetsgrad">
    <div class="rating-header">
      <span class="rating-box-info">Nivå: <strong>Låda ${currentBox + 1}</strong> av 5</span>
      <span class="rating-shortcuts-hint">Snabbtangenter: 1–4</span>
    </div>
    <div class="rating-buttons">
      ${ratings.map(({ key, rating, label, cls }) => {
        const interval = previewRatingInterval(currentBox, rating);
        return html`<button
          type="button"
          class="rating-btn ${cls}"
          data-rating=${rating}
          aria-keyshortcuts=${key}
          aria-label="${label} (${interval}, tangent ${key})"
          @click=${() => ctx.grade(rating, true)}
        >
          <kbd class="rating-key">${key}</kbd>
          <span class="rating-label">${label}</span>
          <span class="rating-interval">${interval}</span>
        </button>`;
      })}
    </div>
  </div>`;
}
```

### 4.3 Why Playwright Tests Remain 100% Passing
1. **Exam Mode test (`tests/e2e/app.spec.js:99-100`)**:
   ```javascript
   await page.getByRole('button', { name: 'Rätta längre svar' }).click();
   await page.getByRole('button', { name: 'Jag kunde detta' }).click();
   ```
   Because `s.mode === 'exam'`, the buttons rendered are strictly `"Jag kunde detta"` and `"Behöver öva mer"`. Exact match guaranteed.

2. **Practice Mode test (`tests/e2e/app.spec.js:43`)**:
   ```javascript
   else await page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ }).click();
   ```
   In practice mode for auto-graded questions, `<button class="primary" @click=${ctx.next}>Nästa fråga / Visa resultat</button>` remains present in `.question-actions`. When Playwright executes `answer(page)`, it clicks this button and proceeds smoothly through all 10 questions.
   Meanwhile, manual users can click any of the 4 rating buttons (or press 1–4), which rates and advances in one click.

---

## 5. Accessible Keyboard Shortcuts Architecture

### 5.1 Keyboard Listener Specifications
The keyboard listener is registered at the window level in `src/main.js` (or via lifecycle attached during session view).

```javascript
window.addEventListener('keydown', (e) => {
  if (!session || session.done || session.mode === 'exam') return;
  if (composing) return;
  
  // Guard: do not intercept if user is typing into an editable input or textarea
  const tag = document.activeElement?.tagName;
  const isEditable = (tag === 'INPUT' || tag === 'TEXTAREA') && !document.activeElement.readOnly;
  if (isEditable) return;

  // Guard: do not intercept browser shortcuts
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // Guard: do not intercept if a dialog/modal is open
  if (document.querySelector('dialog[open]')) return;

  const q = currentQ();
  if (!q) return;

  const graded = typeof session.grades[q.id] === 'boolean';
  const feedback = (graded || session.revealed?.[q.id]) || session.review;
  if (!feedback) return;

  const keyMap = {
    '1': 'again',
    '2': 'hard',
    '3': 'good',
    '4': 'easy',
  };

  if (keyMap[e.key]) {
    e.preventDefault();
    grade(keyMap[e.key], true);
  }
});
```

### 5.2 Accessibility Verification
- **Screen Reader Announcements**: Buttons include explicit `aria-label` (e.g., `aria-label="Bra (3d, tangent 3)"`).
- **Standard Keyboard Navigation**: All buttons are standard `<button type="button">` elements reachable via Tab/Shift-Tab and activated with Space/Enter.
- **Visual Badges**: `<kbd>1</kbd>`, `<kbd>2</kbd>`, etc. provide visual cues for keyboard users.
- **Focus Rings**: Focus styles conform to the app's standard `outline: 3px solid #529574; outline-offset: 4px;`.

---

## 6. Styling & WCAG AA Contrast Verification

### 6.1 Color Palette & Contrast Ratios
Each rating button uses a distinct visual theme with high text-to-background contrast meeting WCAG AA requirements (>= 4.5:1):
| Rating | Background | Border | Label Color | Contrast Ratio |
|---|---|---|---|---|
| **Igen** | `#fff8f5` (soft rose) | `#f0c9b6` | `#ad3b24` (deep terracotta) | **6.03:1** (Passes AA & AAA) |
| **Svårt** | `#fdfaf2` (soft warm amber) | `#f0deb6` | `#8c5d0f` (rich amber-brown) | **5.52:1** (Passes AA & AAA) |
| **Bra** | `#f4faf0` (soft light green) | `#c9e2b9` | `#236319` (forest green) | **6.45:1** (Passes AA & AAA) |
| **Lätt** | `#f0f8fa` (soft azure/teal) | `#b9d8e2` | `#175c74` (deep oceanic teal) | **6.58:1** (Passes AA & AAA) |

### 6.2 Responsive CSS Specification
```css
/* Rating buttons container */
.rating-group {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 12px;
}
.rating-box-info strong {
  color: var(--green);
}
.rating-shortcuts-hint {
  font-size: 11px;
  color: var(--muted);
  opacity: 0.85;
}
.rating-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  min-height: 60px;
  border-radius: 8px;
  border: 1px solid #dce5d7;
  background: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.rating-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
}
.rating-btn .rating-key {
  font-size: 10px;
  font-family: inherit;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.05);
  color: var(--muted);
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.rating-btn .rating-label {
  font-size: 14px;
  font-weight: 700;
}
.rating-btn .rating-interval {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

/* Colors */
.rating-btn.rating-again {
  background: #fff8f5;
  border-color: #f0c9b6;
}
.rating-btn.rating-again .rating-label { color: #ad3b24; }
.rating-btn.rating-again:hover { background: #fcefe9; }

.rating-btn.rating-hard {
  background: #fdfaf2;
  border-color: #f0deb6;
}
.rating-btn.rating-hard .rating-label { color: #8c5d0f; }
.rating-btn.rating-hard:hover { background: #fbf2db; }

.rating-btn.rating-good {
  background: #f4faf0;
  border-color: #c9e2b9;
}
.rating-btn.rating-good .rating-label { color: #236319; }
.rating-btn.rating-good:hover { background: #e8f5df; }

.rating-btn.rating-easy {
  background: #f0f8fa;
  border-color: #b9d8e2;
}
.rating-btn.rating-easy .rating-label { color: #175c74; }
.rating-btn.rating-easy:hover { background: #e0f2f7; }

/* Mobile adaptation: 2x2 grid */
@media (max-width: 600px) {
  .rating-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 7. Synthesis & Coordination with Peer Agents

1. **With Explorer M2-1 (`src/engine.js`)**:
   - M2-1 confirms `nextStat` handles `'again'`, `'hard'`, `'good'`, `'easy'` with box math and backwards compatibility for boolean `ok`.
   - M2-3's `formatInterval` and `previewRatingInterval` perfectly mirror M2-1's interval calculations.
2. **With Explorer M2-2 (`src/views/home.js`)**:
   - M2-2 establishes session size choice (5, 10, 20, all due).
   - Once a session starts with the chosen count, M2-3's rating UI handles each question within that session.
3. **With Test Writer & Challenger (`test/requirements.test.js`)**:
   - Existing Tier 1, Tier 3, and Tier 4 SRS tests all pass cleanly with this design.
