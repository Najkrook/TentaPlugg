# R2 Technical Survey & Analysis Report: Flexibel Spaced Repetition & Sessionsstorlek med Självskattad Svårighet

**Subagent**: `explorer_survey_2`  
**Date**: 2026-10-04  
**Project**: TentaPlugg (GEMA70 / JAPC11)  
**Investigation Target**: Requirement R2 (Spaced Repetition, session length selection, self-rated difficulty, Leitner scheduling, backward compatibility, and sync).

---

## 1. Executive Summary

Requirement R2 requires two primary enhancements:
1. **Flexible Session Length from Study Room (`home.js`)**: Allow the student to select a session size of **5**, **10**, **20** questions, or **alla förfallna frågor** (all due questions) when starting practice.
2. **Self-Rated Difficulty (Igen, Svårt, Bra, Lätt)**: Allow the student to grade their repetition with 4 self-assessed difficulty tiers that update Leitner intervals proportionally, while maintaining 100% backwards compatibility with existing saved reviews, attempts, statistics, and cloud synchronization.

Our investigation of `src/engine.js`, `src/config.js`, `src/session.js`, `src/storage.js`, `src/cloud.js`, `src/main.js`, and `src/views/` revealed that **the core scheduling engine in `engine.js` was already partially prepared for 4 difficulty levels (`again`, `hard`, `good`, `easy`) and includes `preferredCount: 10` in `fresh()`**, but these capabilities were never hooked up to the user interface, session creation, or test suites.

This report documents the exact state of the system, call chains, data models, integration plan, and edge case mitigations.

---

## 2. SRS & Leitner Scheduling Logic and Storage Architecture

### 2.1 Scheduling Constants & State Structure (`src/config.js`, `src/engine.js`)
In `src/config.js`:
- `SCHEMA_VERSION = 2`
- `INTERVALS = [600000, 86400000, 259200000, 604800000, 1209600000]`
  - Box 0: 600,000 ms (10 minutes)
  - Box 1: 86,400,000 ms (1 day / 24 hours)
  - Box 2: 259,200,000 ms (3 days / 72 hours)
  - Box 3: 604,800,000 ms (7 days / 168 hours)
  - Box 4: 1,209,600,000 ms (14 days / 336 hours)
- `STUDY_TIME_ZONE = 'Europe/Stockholm'`

In `src/engine.js` lines 16–29:
```javascript
export const fresh = () => ({
  version: SCHEMA_VERSION,
  baselineStats: {},
  reviews: {},
  stats: {},
  history: [],
  drafts: {},
  attempts: {},
  plans: {},
  examDate: DEFAULT_EXAM_DATE,
  settingsAt: 0,
  theme: 'classic',
  preferredCount: 10,
});
```
Notice: `preferredCount: 10` is already part of the state object model in `fresh()`.

### 2.2 Core Leitner Transition Function: `nextStat` (`src/engine.js`: lines 30–76)
```javascript
export function nextStat(previous, okOrRating, at, reviewId) {
  const day = dayKey(at);
  let box = previous?.box ?? 0,
    lastPromotionDay = previous?.lastPromotionDay ?? null,
    dueAt = previous?.dueAt ?? at;

  let ok = false;
  let rating = 'good';
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
  return {
    ok,
    rating,
    at,
    attempts: (previous?.attempts || 0) + 1,
    box,
    dueAt,
    lastReviewDay: day,
    lastPromotionDay,
    reviewId,
  };
}
```

### 2.3 Review Recording & Stat Rebuilding (`src/engine.js`: lines 77–84, 208–226)
- Each review is stored uniquely by `${session.attemptId}:${questionId}` in `state.reviews`.
- `recordReview` updates `state.reviews[id]` with `{ id, questionId, attemptId, ok, rating, at, updatedAt }`.
- `session.grades[questionId] = ok` (boolean).
- If review already exists with same rating, it is a no-op; if modified (e.g. re-graded), it updates in place.
- `rebuildStats` re-runs `nextStat` on all reviews ordered by `r.at` ascending:
  ```javascript
  export function rebuildStats(state) {
    state.stats = { ...state.baselineStats };
    for (const r of Object.values(state.reviews).sort(
      (a, b) => a.at - b.at || a.id.localeCompare(b.id),
    ))
      state.stats[r.questionId] = nextStat(state.stats[r.questionId], r.rating ?? r.ok, r.at, r.id);
    return state;
  }
  ```
  Note: `r.rating ?? r.ok` provides seamless backward compatibility for older reviews where `rating` was undefined and only `ok` existed!

### 2.4 State Storage & Cloud Synchronization (`src/storage.js`, `src/sync.js`, `src/cloud.js`)
- **Local Storage**: `localStorage.getItem('tentaplugg-v1-${uid || "guest"}')` stores JSON-serialized state. Debounced by 300 ms via `createLocalSaver`.
- **Cloud Storage**: Firestore document `users/${userId}/progress/state` stores `{ payload: JSON.stringify(state), updatedAt: int }`.
- **Firestore Security Rules**: Document key must have only `['payload', 'updatedAt']`, payload size < 500 KB.
- **Conflict Resolution (`mergeProgress`)**:
  - `reviews` merged using `mergeMap` (latest `updatedAt` wins).
  - Independent question reviews survive across devices.
  - `settingsAt` determines winning `examDate`. Adding `preferredCount` and `theme` sync under `b.settingsAt > a.settingsAt` preserves cross-device settings seamlessly.

---

## 3. Due Questions Calculation, Filtering & Practice Selection

### 3.1 Current Selection Algorithm (`src/engine.js`: lines 331–357)
```javascript
export function selectPractice(
  bank,
  stats,
  topic = 'Alla',
  count = 10,
  now = Date.now(),
  { extra = false, seed = dayKey(now), weak = false } = {},
) {
  return bank
    .filter(
      (q) =>
        (topic === 'Alla' ? q.topic !== 'Kana' : q.topic === topic) &&
        (extra || !stats[q.id] || (stats[q.id].dueAt ?? 0) <= now),
    )
    .map((q) => ({ q, s: stats[q.id] }))
    .sort((a, b) => {
      const rank = (x) => (!x.s ? 1 : (x.s.dueAt ?? 0) <= now ? 0 : 2);
      return (
        rank(a) - rank(b) ||
        (weak ? Number(a.s?.ok ?? true) - Number(b.s?.ok ?? true) : 0) ||
        (rank(a) === 0 ? (a.s.dueAt ?? 0) - (b.s.dueAt ?? 0) : 0) ||
        hash(seed + a.q.id) - hash(seed + b.q.id)
      );
    })
    .slice(0, count)
    .map((x) => x.q.id);
}
```

### 3.2 Ranking & Prioritization Analysis
- `rank = 0`: Due questions (`dueAt <= now`). Sorted by `dueAt` ascending (most overdue first).
- `rank = 1`: Unseen questions (`!stats[q.id]`). Pseudo-randomized using deterministic day seed hash.
- `rank = 2`: Future questions (`dueAt > now`). Only included when `extra: true`.
- When `count` is 5, 10, or 20: Due questions are picked first. If due questions < count, unseen questions fill the remainder up to `count`.
- When "alla förfallna frågor" is chosen: Only due questions should be included (no unseen questions).

### 3.3 Enhancing `selectPractice` & `start` for "Alla förfallna"
In `selectPractice`:
Add support for `dueOnly = false` in options:
```javascript
(dueOnly
  ? stats[q.id] && (stats[q.id].dueAt ?? 0) <= now
  : (extra || !stats[q.id] || (stats[q.id].dueAt ?? 0) <= now))
```
In `start(topic, options = {})` in `src/main.js`:
Currently hardcodes `10`:
```javascript
// Current line 262:
let ids = selectPractice(bank, state.stats, topic, 10, Date.now(), options);
```
Enhanced:
```javascript
const sessionCount = options.count ?? state.preferredCount ?? 10;
const isDueOnly = sessionCount === 'all-due' || sessionCount === 'due' || options.dueOnly;
if (options.wrong) bank = bank.filter((q) => state.stats[q.id] && !state.stats[q.id].ok);
if (isDueOnly) bank = bank.filter((q) => state.stats[q.id]?.dueAt <= Date.now());
const countNumber = isDueOnly ? bank.length : Number(sessionCount) || 10;
let ids = selectPractice(bank, state.stats, topic, countNumber, Date.now(), {
  ...options,
  dueOnly: isDueOnly,
});
```

---

## 4. Study Room UI & Session Length Selection Integration

### 4.1 Current Study Room Layout (`src/views/home.js`)
- Line 9–23: Page heading + exam countdown.
- Line 24–44: Focus panel ("Dagens fokus", "Träna partiklar", hardcoded "10 frågor · cirka 5 minuter").
- Line 45–55: Stats strip (`p.done`, `p.due`, `p.wrong`).
- Line 56–81: Daily plan tasks (`plan.tasks`).
- Line 82–116: Topic grid (`topics.map(...)`, "Blanda alla ämnen", "Öva på dina misstag").
- Line 117–126: Exam banner.

### 4.2 Proposed UI Design for Session Length Selection
Add a prominent segmented pill selector in the study room (`home.js`), either immediately above or inside the focus panel / topic practice section:

```html
<section class="session-length-section" aria-label="Inställning för sessionslängd">
  <div class="session-length-header">
    <span class="session-length-title">${icon('Layers')} Passets längd:</span>
    <span class="session-length-hint">Välj hur många frågor du vill köra</span>
  </div>
  <div class="session-length-pills" role="radiogroup" aria-label="Välj sessionslängd">
    <button
      class="length-pill ${state.preferredCount === 5 ? 'active' : ''}"
      role="radio"
      aria-checked=${state.preferredCount === 5}
      @click=${() => ctx.setPreferredCount(5)}
    >
      5 frågor
    </button>
    <button
      class="length-pill ${state.preferredCount === 10 ? 'active' : ''}"
      role="radio"
      aria-checked=${state.preferredCount === 10}
      @click=${() => ctx.setPreferredCount(10)}
    >
      10 frågor
    </button>
    <button
      class="length-pill ${state.preferredCount === 20 ? 'active' : ''}"
      role="radio"
      aria-checked=${state.preferredCount === 20}
      @click=${() => ctx.setPreferredCount(20)}
    >
      20 frågor
    </button>
    <button
      class="length-pill ${state.preferredCount === 'all-due' ? 'active' : ''}"
      role="radio"
      aria-checked=${state.preferredCount === 'all-due'}
      @click=${() => ctx.setPreferredCount('all-due')}
    >
      Alla förfallna ${p.due > 0 ? `(${p.due})` : ''}
    </button>
  </div>
</section>
```

### 4.3 Dynamic Session Hint Updates in "Dagens fokus"
Update line 34 in `home.js`:
- For 5 questions: `5 frågor · cirka 2–3 minuter`
- For 10 questions: `10 frågor · cirka 5 minuter`
- For 20 questions: `20 frågor · cirka 10–12 minuter`
- For 'all-due': `${p.due > 0 ? `${p.due} förfallna frågor redo` : 'Alla förfallna frågor'}`

### 4.4 Handlers in `src/main.js`
In `main.js`:
```javascript
function setPreferredCount(count) {
  state.preferredCount = count;
  state.settingsAt = Date.now();
  persist(true);
  render();
}
```
Exposed on `ctx` so `homeView` can call `ctx.setPreferredCount(...)`.

---

## 5. Question Grading & Self-Rated Difficulty

### 5.1 Current Grading Flow (`src/main.js`, `src/views/session.js`)
Currently:
1. User enters answer or selects choice.
2. User clicks "Kontrollera svar" (or "Visa modellösning" for `q.self`).
3. `check()` in `main.js`:
   - If `q.self`: sets `session.revealed[q.id] = true`.
   - If auto: evaluates `ok = correct(q, session.answers[q.id])` and calls `grade(ok)`.
4. `grade(ok, advance)`:
   - Calls `recordReview(state, session, q.id, ok, Date.now())`.
   - `updateResult(state, session, questions, Date.now())`.
   - If `advance`: calls `next()`.
   - Else: displays feedback block.
5. In feedback block:
   - Auto questions show "Rätt svar!" or explanation + button "Mitt svar är också korrekt" (`ctx.grade(true)`).
   - `q.self` shows "Behöver öva mer" (`ctx.grade(false, true)`) and "Jag kunde detta" (`ctx.grade(true, true)`).
   - "Nästa fråga" / "Visa resultat" in action bar advances to next item.

### 5.2 Leitner Interval Mapping for Self-Rated Difficulty
The four difficulty options map to internal ratings:

| Swedish Label | Internal Rating | Correct (`ok`) | Box Update | Interval Calculation | Typical Resulting Interval |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Igen** | `'again'` | `false` | Resets to Box 0 | `at + INTERVALS[0]` | 10 minuter |
| **Svårt** | `'hard'` | `true` | Behåll nuvarande Box | `at + min(INTERVALS[box], 86400000)` | 10 min (Box 0) el. 1 dag (Box 1–4) |
| **Bra** | `'good'` | `true` | Öka Box +1 (om förfallen & ej redan befordrad idag) | `at + INTERVALS[newBox]` | Box 1 (1d), Box 2 (3d), Box 3 (7d), Box 4 (14d) |
| **Lätt** | `'easy'` | `true` | Öka Box +2 (max 4) | `at + INTERVALS[newBox]` | Box 2 (3d), Box 3 (7d), Box 4 (14d) |

### 5.3 Previewing Next Interval in UI
For the active question, we can calculate what the next due interval will be for each of the 4 buttons based on `state.stats[q.id]?.box ?? 0`:
- Box 0: Igen = 10m, Svårt = 10m, Bra = 1d, Lätt = 3d
- Box 1: Igen = 10m, Svårt = 1d, Bra = 3d, Lätt = 7d
- Box 2: Igen = 10m, Svårt = 1d, Bra = 7d, Lätt = 14d
- Box 3: Igen = 10m, Svårt = 1d, Bra = 14d, Lätt = 14d
- Box 4: Igen = 10m, Svårt = 1d, Bra = 14d, Lätt = 14d

Helper function format:
```javascript
export function formatInterval(ms) {
  if (ms <= 600000) return '10m';
  if (ms <= 86400000) return '1d';
  if (ms <= 259200000) return '3d';
  if (ms <= 604800000) return '7d';
  return '14d';
}
```

### 5.4 UI Presentation in Session View (`src/views/session.js`)
When feedback is visible in practice sessions (`s.mode !== 'exam'`):
1. **For auto questions**:
   - Initial check defaults to `'good'` if correct, or `'again'` if incorrect.
   - Display 4 rating buttons below the explanation / contrastive feedback:
     - `[ ↻ Igen (10m) ]`
     - `[ ⚡ Svårt (1d) ]`
     - `[ ✓ Bra (3d) ]`
     - `[ ★ Lätt (7d) ]`
   - Active rating (e.g. `Bra` if correct, `Igen` if incorrect) is subtly highlighted.
   - User can:
     - Click any of the 4 rating buttons to adjust difficulty and immediately advance (or update rating in place).
     - Or click "Nästa fråga", which proceeds with the active rating.
   - If user made a minor typo and was marked wrong, clicking `Svårt`, `Bra` or `Lätt` overrides `ok: true`, cleanly replacing the old "Mitt svar är också korrekt" button.
2. **For self-graded questions (`q.self`)**:
   - In practice mode: offer the 4 rating buttons `Igen`, `Svårt`, `Bra`, `Lätt` instead of just 2 buttons.
   - In exam mode (`s.mode === 'exam'`): retain the exact buttons "Jag kunde detta" and "Behöver öva mer" to preserve 100% compatibility with exam scoring and Playwright e2e test `tests/e2e/app.spec.js` lines 41 and 100.

---

## 6. Backwards Compatibility & Data Model Analysis

| Entity / Property | Previous State | New State | Compatibility Impact | Migration Required? |
| :--- | :--- | :--- | :--- | :--- |
| `SCHEMA_VERSION` | `2` | `2` (DO NOT CHANGE) | **Zero breaking change**. Must remain 2 so `migrate()` does not wipe reviews. | No |
| `state.preferredCount` | Already `10` in `fresh()` | `5`, `10`, `20`, `'all-due'` | Missing in legacy data is filled with `10` via `{ ...fresh(), ...raw }`. | No |
| `state.reviews[id]` | `{ ok, rating?, at, ... }` | `{ ok, rating, at, ... }` | `r.rating ?? r.ok` in `rebuildStats` handles missing `rating`. | No |
| `state.stats[q.id]` | `{ ok, rating?, box, dueAt, ... }` | `{ ok, rating, box, dueAt, ... }` | Rebuilt cleanly on reload/merge from `state.reviews`. | No |
| `session.ratings` | Did not exist | `{ [qid]: rating }` | Optional field. Falls back to `s.grades[qid] ? 'good' : 'again'`. | No |
| `session.grades` | `{ [qid]: boolean }` | `{ [qid]: boolean }` | `scoreAttempt` continues to check `grades[qid] === true`. | No |
| `state.history` | Array of attempts | Array of attempts | Same structure, no changes. | No |
| `state.drafts` | Map of drafts | Map of drafts | Same structure, no changes. | No |
| `mergeProgress` | Merged `reviews` & `examDate` | Also syncs `preferredCount` on `b.settingsAt > a.settingsAt` | Device with newer settings propagates `preferredCount`. | No |
| `firestore.rules` | Checks `payload is string` < 500 KB | Same string format | State remains JSON string within size limits. | No |

---

## 7. Relevant Files, Interfaces, and Data Models

### 7.1 Files to Modify During Implementation (Survey Scope - Read Only)
1. `src/config.js`:
   - Keep `SCHEMA_VERSION = 2`.
   - Optionally export `RATINGS` or difficulty label metadata.
2. `src/engine.js`:
   - Verify `nextStat` handles `'again'`, `'hard'`, `'good'`, `'easy'` and booleans.
   - Update `mergeProgress` to synchronize `preferredCount` when `b.settingsAt > a.settingsAt`.
   - Update `selectPractice` to support `options.dueOnly`.
3. `src/session.js`:
   - In `createSession`: add `ratings: {}`.
4. `src/main.js`:
   - Support `options.count` and `state.preferredCount` in `start()`.
   - Support `dueOnly` / `all-due`.
   - Add `setPreferredCount(count)` to `ctx`.
   - In `grade(okOrRating, advance)`: accept string rating (`again`, `hard`, `good`, `easy`) or boolean.
   - Record `session.ratings[q.id] = rating`.
5. `src/views/home.js`:
   - Add session length segmented control (5, 10, 20, Alla förfallna).
   - Dynamically display `p.due` count on "Alla förfallna".
   - Update "Dagens fokus" session hint text.
6. `src/views/session.js`:
   - Render SRS rating buttons (Igen, Svårt, Bra, Lätt) with interval badges for practice sessions.
   - Keep exam mode self-assessment buttons intact for e2e compatibility.
7. `src/style.css`:
   - Add styling for `.session-length-section`, `.session-length-pills`, `.length-pill`.
   - Add styling for `.rating-actions`, `.rating-btn` (`.again`, `.hard`, `.good`, `.easy`).
8. `tests/learning.test.js` & `tests/engine.test.js`:
   - Add comprehensive tests for self-rated difficulty, session lengths, due question filtering, and merge synchronization.

---

## 8. Potential Risks and Edge Cases

1. **Risk: "Alla förfallna" selected when 0 questions are due (`p.due === 0`)**
   - *Mitigation*: The UI button should display `Alla förfallna (0)` and either visually indicate 0 or offer the existing friendly confirmation dialog (`ask("Dagens repetition är klar för det här urvalet. Vill du träna extra?", "Träna extra")`).
2. **Risk: Bumping `SCHEMA_VERSION` causes data wipeout**
   - *Mitigation*: **Do NOT bump `SCHEMA_VERSION`**. Keep it at `2`. The current migration logic in `migrate()` clears `reviews = {}` if `version !== SCHEMA_VERSION`. Maintaining version 2 guarantees complete preservation of user reviews and history.
3. **Risk: Playwright E2E exact text match breakage**
   - *Observation*: `tests/e2e/app.spec.js` line 41 & 100 relies on exact button text `Jag kunde detta` during exam grading, and line 133 relies on `Träna partiklar`.
   - *Mitigation*: In exam mode (`session.mode === 'exam'`), keep exact button names `Jag kunde detta` and `Behöver öva mer`. In `home.js`, keep button text `Träna partiklar`.
4. **Risk: Same-day promotion rate limit**
   - *Observation*: `nextStat` line 60 checks `lastPromotionDay !== day`. If a question is reviewed twice on the same day as `Bra`, it is not promoted twice.
   - *Mitigation*: This is intentional and tested in `tests/learning.test.js` line 21. `again` and `hard` work correctly at any time on the same day.
5. **Risk: Cross-device merge losing user session length setting**
   - *Mitigation*: In `mergeProgress()`, when `b.settingsAt > a.settingsAt`, synchronize `state.preferredCount = b.preferredCount`.
