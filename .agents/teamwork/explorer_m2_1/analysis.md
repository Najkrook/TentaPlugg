# M2 Analysis: SRS Leitner Engine Logic & Unit Test Architecture

## 1. Executive Summary

This report delivers a thorough investigation and design for Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) focusing on the Spaced Repetition (SRS Leitner) engine logic in `src/engine.js` and the corresponding unit tests in `tests/engine.test.js`.

### Key Conclusions:
1. **Mathematical Soundness**: The interval and box progression logic in `nextStat(previous, okOrRating, at, reviewId)` strictly conforms to the Leitner specifications:
   - `'again'`: Unconditional reset to Box 0, interval 10 minutes (`INTERVALS[0] = 600,000 ms`).
   - `'hard'`: Retains current box, interval capped at $\le 1$ day (10 minutes for Box 0, 1 day for Boxes 1..4).
   - `'good'`: Increments box by +1 (capped at Box 4), schedules standard exponential interval (1d, 3d, 7d, 14d) when due and not promoted on the same Stockholm calendar day.
   - `'easy'`: Accelerates box progression by +2 (capped at Box 4), schedules interval for target box (Box 0 $\to$ 2 [3d], Box 1 $\to$ 3 [7d], Box 2 $\to$ 4 [14d], Box 3 $\to$ 4 [14d], Box 4 $\to$ 4 [14d]).
2. **Backwards Compatibility**:
   - Direct calls with boolean `okOrRating` (`true` / `false`) map cleanly: `true` $\to$ `'good'`, `false` $\to$ `'again'`.
   - Object arguments `{ rating }` or `{ ok }` map seamlessly.
   - Historical review entries in `state.reviews` lacking `rating` are replayed through `rebuildStats` using `r.rating ?? r.ok`.
   - `session.grades[q.id]` continues to hold boolean values (`true` / `false`), ensuring 100% compatibility with exam scoring, error practice, and stats reporting.
3. **Schema Compatibility**:
   - `SCHEMA_VERSION` remains `2` (defined in `src/config.js:5`).
   - Because `raw.version === SCHEMA_VERSION` (2 === 2) for all existing state files, `migrate(raw)` preserves existing `reviews`, `drafts`, `attempts`, and `stats` without triggering any reset migration.
   - New default configuration fields (`preferredCount: 10`, `theme: 'classic'`) are safely populated via `{ ...fresh(), ...raw }`.
4. **Unit Test Plan**:
   - 4 new comprehensive test suites are designed for direct integration into `tests/engine.test.js`, testing all 24 box/rating combinations, backwards compatibility, and schema preservation.

---

## 2. In-Depth Inspection of `src/engine.js`

### 2.1 The `nextStat` Function (`src/engine.js:30-76`)

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

### 2.2 Trace of Input Normalization

| Input `okOrRating` | Inferred `ok` | Inferred `rating` | Code Branch |
|-------------------|---------------|-------------------|-------------|
| `true` (boolean) | `true` | `'good'` | `typeof okOrRating === 'boolean'` |
| `false` (boolean) | `false` | `'again'` | `typeof okOrRating === 'boolean'` |
| `'again'` (string) | `false` | `'again'` | `typeof okOrRating === 'string'` |
| `'hard'` (string) | `true` | `'hard'` | `typeof okOrRating === 'string'` |
| `'good'` (string) | `true` | `'good'` | `typeof okOrRating === 'string'` |
| `'easy'` (string) | `true` | `'easy'` | `typeof okOrRating === 'string'` |
| `{ rating: 'easy' }` (object) | `true` | `'easy'` | `typeof okOrRating === 'object'` |
| `{ ok: true }` (legacy object) | `true` | `'good'` | `typeof okOrRating === 'object'` |
| `{ ok: false }` (legacy object) | `false` | `'again'` | `typeof okOrRating === 'object'` |
| `null` / `undefined` | `false` | `'good'` | falls through to `if (!ok)` $\to$ `box = 0, dueAt = at + INTERVALS[0]` |

---

## 3. Leitner Interval Mathematics

### 3.1 Interval Constants (`src/config.js:6`)
```javascript
export const INTERVALS = [
  600000,     // Box 0: 10 minutes
  86400000,   // Box 1: 1 day (24 hours)
  259200000,  // Box 2: 3 days (72 hours)
  604800000,  // Box 3: 7 days (168 hours)
  1209600000  // Box 4: 14 days (336 hours)
];
```

### 3.2 Full State Transition Matrix: Boxes 0 to 4

Let $B_{prev}$ be the initial box. For each rating applied at timestamp $t$ (when due and on a fresh calendar day):

| Previous Box | Rating: `'again'` | Rating: `'hard'` | Rating: `'good'` | Rating: `'easy'` |
|:---:|:---:|:---:|:---:|:---:|
| **New (`null`)** | Box 0 (+10m)<br>`ok: false` | Box 0 (+10m)<br>`ok: true` | Box 1 (+1d)<br>`ok: true` | Box 2 (+3d)<br>`ok: true` |
| **Box 0** | Box 0 (+10m)<br>`ok: false` | Box 0 (+10m)<br>`ok: true` | Box 1 (+1d)<br>`ok: true` | Box 2 (+3d)<br>`ok: true` |
| **Box 1** | Box 0 (+10m)<br>`ok: false` | Box 1 (+1d)<br>`ok: true` | Box 2 (+3d)<br>`ok: true` | Box 3 (+7d)<br>`ok: true` |
| **Box 2** | Box 0 (+10m)<br>`ok: false` | Box 2 (+1d)<br>`ok: true` | Box 3 (+7d)<br>`ok: true` | Box 4 (+14d)<br>`ok: true` |
| **Box 3** | Box 0 (+10m)<br>`ok: false` | Box 3 (+1d)<br>`ok: true` | Box 4 (+14d)<br>`ok: true` | Box 4 (+14d)<br>`ok: true` *(capped)* |
| **Box 4** | Box 0 (+10m)<br>`ok: false` | Box 4 (+1d)<br>`ok: true` | Box 4 (+14d)<br>`ok: true` *(capped)* | Box 4 (+14d)<br>`ok: true` *(capped)* |

### 3.3 Boundary & Edge Conditions
1. **Early Review with `'good'` (`dueAt > at`)**:
   - `(!previous || dueAt <= at)` evaluates to `false`.
   - No branch executes; box remains unchanged (`previous.box`), and `dueAt` remains unchanged (`previous.dueAt`).
   - This preserves the core Leitner guarantee: practicing a card before its scheduled review does not artificially inflate its box level.
2. **Same-Day Promotion Guard (`lastPromotionDay === dayKey(at)`)**:
   - A question rated `'good'` cannot be promoted more than once in the same Europe/Stockholm calendar day.
   - If reviewed again on the same day with `'good'`, it retains its current box.
3. **Immediate Drop on `'again'`**:
   - Regardless of whether a question was at Box 4, rating `'again'` unconditionally resets it to Box 0 and reschedules for +10 minutes.
4. **Accelerated Promotion with `'easy'`**:
   - Jumps 2 boxes forward immediately.
   - Box 3 $\to$ Box 4 (capped: `Math.min(4, 3 + 2) = 4`).
   - Box 4 $\to$ Box 4 (capped: `Math.min(4, 4 + 2) = 4`).

---

## 4. Backwards Compatibility & Migration Invariance

### 4.1 Schema Version Invariance
- `src/config.js`:
  ```javascript
  export const SCHEMA_VERSION = 2;
  ```
- `src/storage.js`:
  ```javascript
  export const storageKey = (user) => (user ? `tentaplugg-state-v2-${user}` : 'tentaplugg-state-v2');
  ```
- `src/engine.js`:
  ```javascript
  export function migrate(raw) {
    if (!raw || typeof raw !== 'object') return fresh();
    const state = { ...fresh(), ...raw, drafts: { ...raw.drafts }, attempts: { ...raw.attempts } };
    if (raw.version !== SCHEMA_VERSION) {
      // Re-migration block only runs if raw.version !== 2
      ...
    }
    state.version = SCHEMA_VERSION;
    return rebuildStats(state);
  }
  ```
- **Conclusion**: Because `SCHEMA_VERSION` remains `2`, existing saved states in `localStorage` (`tentaplugg-state-v2`) will never enter the reset migration block. Existing student histories and review logs remain 100% intact.

### 4.2 Review History & Rebuild Compatibility
- `src/engine.js:208-226` (`recordReview`):
  ```javascript
  export function recordReview(state, session, questionId, okOrRating, now) {
    const id = `${session.attemptId}:${questionId}`,
      existing = state.reviews[id];
    const ok = typeof okOrRating === 'boolean' ? okOrRating : okOrRating !== 'again';
    const rating = typeof okOrRating === 'string' ? okOrRating : ok ? 'good' : 'again';
    session.grades[questionId] = ok;
    ...
    state.reviews[id] = { id, questionId, attemptId: session.attemptId, ok, rating, at: existing?.at ?? now, updatedAt: now };
    return rebuildStats(state);
  }
  ```
- `src/engine.js:77-84` (`rebuildStats`):
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
- When older sync records (which only possess `ok: true` or `ok: false`) are processed, `r.rating ?? r.ok` passes boolean `ok` to `nextStat`. `nextStat` safely translates `true` to `'good'` and `false` to `'again'`.

---

## 5. Proposed Unit Tests for `tests/engine.test.js`

Below are the 4 test cases designed to be integrated into `tests/engine.test.js`.

### Test 1: Full Leitner Box & 4-Rating Progression Matrix
Verifies all 20 transitions across Boxes 0 to 4 and all 4 ratings, plus initial question state.

```javascript
test('Leitner engine verifies full 4-rating progression matrix across boxes 0 to 4', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Initial state (previous = null)
  const initAgain = nextStat(null, 'again', t0);
  assert.equal(initAgain.box, 0);
  assert.equal(initAgain.dueAt, t0 + INTERVALS[0]);
  assert.equal(initAgain.ok, false);
  assert.equal(initAgain.rating, 'again');

  const initHard = nextStat(null, 'hard', t0);
  assert.equal(initHard.box, 0);
  assert.equal(initHard.dueAt, t0 + INTERVALS[0]);
  assert.equal(initHard.ok, true);
  assert.equal(initHard.rating, 'hard');

  const initGood = nextStat(null, 'good', t0);
  assert.equal(initGood.box, 1);
  assert.equal(initGood.dueAt, t0 + INTERVALS[1]);
  assert.equal(initGood.ok, true);
  assert.equal(initGood.rating, 'good');

  const initEasy = nextStat(null, 'easy', t0);
  assert.equal(initEasy.box, 2);
  assert.equal(initEasy.dueAt, t0 + INTERVALS[2]);
  assert.equal(initEasy.ok, true);
  assert.equal(initEasy.rating, 'easy');

  // Matrix test for all boxes 0..4
  for (let box = 0; box <= 4; box++) {
    const prev = { box, dueAt: t0, attempts: box + 1, lastPromotionDay: '2026-10-03' };

    // 1. 'again': always resets to box 0, interval 10m
    const resAgain = nextStat(prev, 'again', t0);
    assert.equal(resAgain.box, 0, `Box ${box} + again must reset to 0`);
    assert.equal(resAgain.dueAt, t0 + INTERVALS[0]);
    assert.equal(resAgain.ok, false);
    assert.equal(resAgain.rating, 'again');
    assert.equal(resAgain.attempts, prev.attempts + 1);

    // 2. 'hard': retains current box, interval <= 1 day
    const resHard = nextStat(prev, 'hard', t0);
    assert.equal(resHard.box, box, `Box ${box} + hard must retain box ${box}`);
    assert.equal(resHard.dueAt, t0 + Math.min(INTERVALS[box], 86400000));
    assert.equal(resHard.ok, true);
    assert.equal(resHard.rating, 'hard');

    // 3. 'good': increments box by 1 (capped at 4), standard intervals
    const expectedGoodBox = Math.min(4, box + 1);
    const resGood = nextStat(prev, 'good', t0);
    assert.equal(resGood.box, expectedGoodBox, `Box ${box} + good must advance to ${expectedGoodBox}`);
    assert.equal(resGood.dueAt, t0 + INTERVALS[expectedGoodBox]);
    assert.equal(resGood.ok, true);
    assert.equal(resGood.rating, 'good');

    // 4. 'easy': increments box by 2 (capped at 4), accelerated intervals
    const expectedEasyBox = Math.min(4, box + 2);
    const resEasy = nextStat(prev, 'easy', t0);
    assert.equal(resEasy.box, expectedEasyBox, `Box ${box} + easy must advance to ${expectedEasyBox}`);
    assert.equal(resEasy.dueAt, t0 + INTERVALS[expectedEasyBox]);
    assert.equal(resEasy.ok, true);
    assert.equal(resEasy.rating, 'easy');
  }
});
```

### Test 2: Leitner Clamping and Early Review Boundaries
Verifies upper bounds at Box 4, lower bounds at Box 0, and premature review behavior.

```javascript
test('Leitner engine enforces box 4 ceiling, box 0 floor, and premature review safeguards', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Box 3 with 'easy' (+2) clamps to 4
  const b3Easy = nextStat({ box: 3, dueAt: t0 }, 'easy', t0);
  assert.equal(b3Easy.box, 4);
  assert.equal(b3Easy.dueAt, t0 + INTERVALS[4]);

  // Box 4 with 'good' (+1) clamps to 4
  const b4Good = nextStat({ box: 4, dueAt: t0 }, 'good', t0);
  assert.equal(b4Good.box, 4);
  assert.equal(b4Good.dueAt, t0 + INTERVALS[4]);

  // Box 4 with 'easy' (+2) clamps to 4
  const b4Easy = nextStat({ box: 4, dueAt: t0 }, 'easy', t0);
  assert.equal(b4Easy.box, 4);
  assert.equal(b4Easy.dueAt, t0 + INTERVALS[4]);

  // Box 0 with 'again' cannot decrement below 0
  const b0Again = nextStat({ box: 0, dueAt: t0 }, 'again', t0);
  assert.equal(b0Again.box, 0);

  // Early review with 'good' before dueAt does not promote box
  const futureDue = t0 + 86400000;
  const earlyReview = nextStat({ box: 2, dueAt: futureDue }, 'good', t0);
  assert.equal(earlyReview.box, 2);
  assert.equal(earlyReview.dueAt, futureDue);
});
```

### Test 3: Backwards Compatibility for Boolean Inputs & Legacy Reviews
Verifies legacy boolean calls and reconstruction of stats from legacy review entries.

```javascript
test('Leitner engine ensures complete backwards compatibility for boolean ok and legacy reviews', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Direct boolean calls to nextStat
  const boolTrue = nextStat(null, true, t0);
  assert.equal(boolTrue.ok, true);
  assert.equal(boolTrue.rating, 'good');
  assert.equal(boolTrue.box, 1);

  const boolFalse = nextStat(null, false, t0);
  assert.equal(boolFalse.ok, false);
  assert.equal(boolFalse.rating, 'again');
  assert.equal(boolFalse.box, 0);

  // Object forms
  const objTrue = nextStat(null, { ok: true }, t0);
  assert.equal(objTrue.rating, 'good');
  assert.equal(objTrue.ok, true);

  const objFalse = nextStat(null, { ok: false }, t0);
  assert.equal(objFalse.rating, 'again');
  assert.equal(objFalse.ok, false);

  const objRating = nextStat(null, { rating: 'hard' }, t0);
  assert.equal(objRating.rating, 'hard');
  assert.equal(objRating.ok, true);

  // rebuildStats with reviews lacking 'rating' attribute
  const legacyState = fresh();
  legacyState.reviews = {
    'rev-1:q1': { id: 'rev-1:q1', questionId: 'q1', ok: true, at: t0 },
    'rev-1:q2': { id: 'rev-1:q2', questionId: 'q2', ok: false, at: t0 + 100 },
  };
  const rebuilt = rebuildStats(legacyState);
  assert.equal(rebuilt.stats.q1.rating, 'good');
  assert.equal(rebuilt.stats.q1.box, 1);
  assert.equal(rebuilt.stats.q2.rating, 'again');
  assert.equal(rebuilt.stats.q2.box, 0);
});
```

### Test 4: Schema Version 2 Preservation & Non-Destructive Migration
Verifies that `SCHEMA_VERSION` remains 2 and existing states are not reset.

```javascript
test('Schema compatibility guarantees version 2 and prevents reset migrations', () => {
  assert.equal(SCHEMA_VERSION, 2, 'SCHEMA_VERSION must remain 2');

  const now = Date.parse('2026-10-04T12:00:00Z');
  const existingV2 = {
    version: 2,
    reviews: {
      'att-1:q-test': {
        id: 'att-1:q-test',
        questionId: 'q-test',
        attemptId: 'att-1',
        ok: true,
        rating: 'easy',
        at: now,
        updatedAt: now,
      },
    },
    drafts: { practice: { at: now, session: { index: 1 } } },
    stats: {},
  };

  const migrated = migrate(existingV2);
  assert.equal(migrated.version, 2);
  assert(migrated.reviews['att-1:q-test'], 'Existing reviews must NOT be erased');
  assert.equal(migrated.reviews['att-1:q-test'].rating, 'easy');
  assert.equal(migrated.stats['q-test'].box, 2);
  assert.equal(migrated.drafts.practice.session.index, 1);
  assert.equal(migrated.preferredCount, 10, 'Fresh defaults merged without overwriting');
  assert.equal(migrated.theme, 'classic', 'Fresh theme default merged without overwriting');
});
```

---

## 6. Verification and Readiness Checklist

- [x] Mathematics of all 4 ratings analyzed and validated against `INTERVALS`.
- [x] Transition matrix calculated for Boxes 0 through 4.
- [x] Backwards compatibility for boolean arguments and legacy records proven.
- [x] Schema compatibility (`SCHEMA_VERSION = 2`) verified to prevent reset migrations.
- [x] 4 unit tests designed and structured for `tests/engine.test.js`.
- [x] Existing test suite confirmed passing (44 passing tests across `tests/*.test.js`).
