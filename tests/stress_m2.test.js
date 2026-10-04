import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nextStat,
  rebuildStats,
  migrate,
  fresh,
  mergeProgress,
  recordReview,
  selectPractice,
  dayKey,
  daysUntil,
} from '../src/engine.js';
import { INTERVALS, SCHEMA_VERSION } from '../src/config.js';
import { questions } from '../src/data.js';

// ============================================================================
// STRESS TEST SUITE: M2 Leitner SRS Engine & Intervals
// ============================================================================

test('Empirical Stress 1: Full 4-rating progression matrix across all Boxes 0 to 4', () => {
  const baseTime = Date.parse('2026-10-04T08:00:00Z');
  const ratings = ['again', 'hard', 'good', 'easy'];

  // 1. Initial state (previous = null)
  for (const r of ratings) {
    const stat = nextStat(null, r, baseTime, `rev-init-${r}`);
    assert(!Number.isNaN(stat.box), `Initial box must not be NaN for rating ${r}`);
    assert(!Number.isNaN(stat.dueAt), `Initial dueAt must not be NaN for rating ${r}`);
    assert(Number.isFinite(stat.dueAt), `Initial dueAt must be finite for rating ${r}`);

    if (r === 'again') {
      assert.equal(stat.box, 0);
      assert.equal(stat.ok, false);
      assert.equal(stat.dueAt, baseTime + INTERVALS[0]);
    } else if (r === 'hard') {
      assert.equal(stat.box, 0);
      assert.equal(stat.ok, true);
      assert.equal(stat.dueAt, baseTime + Math.min(INTERVALS[0], 86400000));
    } else if (r === 'good') {
      assert.equal(stat.box, 1);
      assert.equal(stat.ok, true);
      assert.equal(stat.dueAt, baseTime + INTERVALS[1]);
    } else if (r === 'easy') {
      assert.equal(stat.box, 2);
      assert.equal(stat.ok, true);
      assert.equal(stat.dueAt, baseTime + INTERVALS[2]);
    }
  }

  // 2. Full 5 x 4 matrix across boxes 0..4 when item is due and on a new day
  for (let box = 0; box <= 4; box++) {
    for (const r of ratings) {
      const prev = {
        box,
        dueAt: baseTime - 1000, // Due in the past
        attempts: box + 2,
        lastPromotionDay: '2026-10-01', // Different Stockholm day
      };
      const stat = nextStat(prev, r, baseTime, `rev-${box}-${r}`);

      assert(stat.box >= 0 && stat.box <= 4, `Box ${stat.box} out of range [0, 4] for box ${box} + ${r}`);
      assert(stat.dueAt > baseTime, `dueAt must be in the future`);
      assert(!Number.isNaN(stat.dueAt), `dueAt must not be NaN`);
      assert(Number.isFinite(stat.dueAt), `dueAt must be finite`);
      assert.equal(stat.attempts, prev.attempts + 1);

      if (r === 'again') {
        assert.equal(stat.box, 0, `Box ${box} + again must reset to 0`);
        assert.equal(stat.ok, false);
        assert.equal(stat.dueAt, baseTime + INTERVALS[0]);
      } else if (r === 'hard') {
        assert.equal(stat.box, box, `Box ${box} + hard must retain box ${box}`);
        assert.equal(stat.ok, true);
        assert.equal(stat.dueAt, baseTime + Math.min(INTERVALS[box], 86400000));
      } else if (r === 'good') {
        const expected = Math.min(4, box + 1);
        assert.equal(stat.box, expected, `Box ${box} + good must advance to ${expected}`);
        assert.equal(stat.ok, true);
        assert.equal(stat.dueAt, baseTime + INTERVALS[expected]);
      } else if (r === 'easy') {
        const expected = Math.min(4, box + 2);
        assert.equal(stat.box, expected, `Box ${box} + easy must advance to ${expected}`);
        assert.equal(stat.ok, true);
        assert.equal(stat.dueAt, baseTime + INTERVALS[expected]);
      }
    }
  }
});

test('Empirical Stress 2: Boundary ceilings, floors, and extreme box clamping', () => {
  const baseTime = Date.parse('2026-10-04T12:00:00Z');

  // Box 4 upper bound
  const box4 = { box: 4, dueAt: baseTime - 1000, lastPromotionDay: '2026-10-01' };
  const b4Good = nextStat(box4, 'good', baseTime);
  assert.equal(b4Good.box, 4, 'Box 4 with good must not exceed 4');
  assert.equal(b4Good.dueAt, baseTime + INTERVALS[4]);

  const b4Easy = nextStat(box4, 'easy', baseTime);
  assert.equal(b4Easy.box, 4, 'Box 4 with easy must not exceed 4');
  assert.equal(b4Easy.dueAt, baseTime + INTERVALS[4]);

  const b4Hard = nextStat(box4, 'hard', baseTime);
  assert.equal(b4Hard.box, 4, 'Box 4 with hard must stay 4');
  assert.equal(b4Hard.dueAt, baseTime + Math.min(INTERVALS[4], 86400000));

  const b4Again = nextStat(box4, 'again', baseTime);
  assert.equal(b4Again.box, 0, 'Box 4 with again must drop to 0');
  assert.equal(b4Again.dueAt, baseTime + INTERVALS[0]);

  // Box 0 lower bound
  const box0 = { box: 0, dueAt: baseTime - 1000, lastPromotionDay: '2026-10-01' };
  const b0Again = nextStat(box0, 'again', baseTime);
  assert.equal(b0Again.box, 0, 'Box 0 with again must stay at 0');
  assert.equal(b0Again.dueAt, baseTime + INTERVALS[0]);

  const b0Hard = nextStat(box0, 'hard', baseTime);
  assert.equal(b0Hard.box, 0, 'Box 0 with hard must stay at 0');
  assert.equal(b0Hard.dueAt, baseTime + Math.min(INTERVALS[0], 86400000));

  // Box 3 with easy (3 + 2 = 5 -> clamp to 4)
  const box3 = { box: 3, dueAt: baseTime - 1000, lastPromotionDay: '2026-10-01' };
  const b3Easy = nextStat(box3, 'easy', baseTime);
  assert.equal(b3Easy.box, 4, 'Box 3 + easy must clamp to 4');
  assert.equal(b3Easy.dueAt, baseTime + INTERVALS[4]);

  // Premature review safeguards (reviewing before due date)
  const futureDue = baseTime + 86400000;
  const earlyGood = nextStat({ box: 2, dueAt: futureDue }, 'good', baseTime);
  assert.equal(earlyGood.box, 2, 'Early review with good must not advance box');
  assert.equal(earlyGood.dueAt, futureDue, 'Early review with good must keep existing dueAt');
});

test('Empirical Stress 3: Identical timestamps, rapid succession, and same-day promotions', () => {
  const baseTime = Date.parse('2026-10-04T10:00:00Z');

  // Rapid succession: 50 reviews at identical timestamp baseTime
  let current = null;
  for (let i = 0; i < 50; i++) {
    current = nextStat(current, 'good', baseTime, `rapid-${i}`);
    assert(!Number.isNaN(current.box));
    assert(!Number.isNaN(current.dueAt));
    assert(Number.isFinite(current.dueAt));
    assert.equal(current.attempts, i + 1);
  }
  // Because all 50 reviews happen at baseTime (same Stockholm day and dueAt > baseTime after 1st promotion),
  // box advances to 1 on first review, and then MUST NOT advance further on the same day!
  assert.equal(current.box, 1, 'Rapid succession on same day must not advance beyond Box 1');

  // Same-day rating changes: 'good' then 'again' then 'good'
  let card = nextStat(null, 'good', baseTime, 'r1'); // Promoted to box 1, lastPromotionDay = day
  assert.equal(card.box, 1);
  assert.equal(card.dueAt, baseTime + INTERVALS[1]);

  // Card reviewed again on same day (lapse)
  card = nextStat(card, 'again', baseTime + 1000, 'r2');
  assert.equal(card.box, 0);
  assert.equal(card.dueAt, baseTime + 1000 + INTERVALS[0]);

  // Card answered 'good' 10 minutes later (still same day)
  card = nextStat(card, 'good', baseTime + 1000 + INTERVALS[0] + 1, 'r3');
  // Since lastPromotionDay was already set to day from r1, it must not advance to 1 on same day
  assert.equal(card.box, 0, 'Cannot re-advance on the same Stockholm day');

  // Next day (different Stockholm day)
  const nextDay = baseTime + 86400000;
  card = nextStat(card, 'good', nextDay, 'r4');
  assert.equal(card.box, 1, 'Advances to Box 1 on the following day');
});

test('Empirical Stress 4: Out-of-order review playback and rebuildStats idempotence', () => {
  const t0 = Date.parse('2026-10-01T10:00:00Z');
  const t1 = Date.parse('2026-10-02T10:00:00Z');
  const t2 = Date.parse('2026-10-05T10:00:00Z');
  const t3 = Date.parse('2026-10-12T10:00:00Z');

  const orderedReviews = [
    { id: 'rev-0', questionId: 'q-multi', at: t0, rating: 'good', ok: true },
    { id: 'rev-1', questionId: 'q-multi', at: t1, rating: 'good', ok: true },
    { id: 'rev-2', questionId: 'q-multi', at: t2, rating: 'hard', ok: true },
    { id: 'rev-3', questionId: 'q-multi', at: t3, rating: 'easy', ok: true },
  ];

  // Feed in forward order
  const stateForward = fresh();
  for (const r of orderedReviews) {
    stateForward.reviews[r.id] = r;
  }
  rebuildStats(stateForward);

  // Feed in reverse order
  const stateReverse = fresh();
  for (const r of [...orderedReviews].reverse()) {
    stateReverse.reviews[r.id] = r;
  }
  rebuildStats(stateReverse);

  // Feed in shuffled permutations
  const stateShuffled = fresh();
  stateShuffled.reviews['rev-2'] = orderedReviews[2];
  stateShuffled.reviews['rev-0'] = orderedReviews[0];
  stateShuffled.reviews['rev-3'] = orderedReviews[3];
  stateShuffled.reviews['rev-1'] = orderedReviews[1];
  rebuildStats(stateShuffled);

  assert.deepEqual(
    stateForward.stats['q-multi'],
    stateReverse.stats['q-multi'],
    'rebuildStats must produce identical stats regardless of review object key ordering',
  );
  assert.deepEqual(
    stateForward.stats['q-multi'],
    stateShuffled.stats['q-multi'],
    'rebuildStats must produce identical stats for shuffled reviews',
  );

  // Check expected state progression:
  // t0: box 0 -> 1
  // t1: box 1 -> 2
  // t2: hard -> box 2
  // t3: easy -> box 2 + 2 = 4
  assert.equal(stateForward.stats['q-multi'].box, 4);
  assert.equal(stateForward.stats['q-multi'].attempts, 4);
});

test('Empirical Stress 5: Backwards compatibility for boolean ok and legacy reviews without rating', () => {
  const baseTime = Date.parse('2026-10-04T12:00:00Z');

  // Boolean true
  const resTrue = nextStat(null, true, baseTime);
  assert.equal(resTrue.ok, true);
  assert.equal(resTrue.rating, 'good');
  assert.equal(resTrue.box, 1);
  assert.equal(resTrue.dueAt, baseTime + INTERVALS[1]);

  // Boolean false
  const resFalse = nextStat(null, false, baseTime);
  assert.equal(resFalse.ok, false);
  assert.equal(resFalse.rating, 'again');
  assert.equal(resFalse.box, 0);
  assert.equal(resFalse.dueAt, baseTime + INTERVALS[0]);

  // Object with only { ok: true }
  const resObjTrue = nextStat(null, { ok: true }, baseTime);
  assert.equal(resObjTrue.ok, true);
  assert.equal(resObjTrue.rating, 'good');

  // Object with only { ok: false }
  const resObjFalse = nextStat(null, { ok: false }, baseTime);
  assert.equal(resObjFalse.ok, false);
  assert.equal(resObjFalse.rating, 'again');

  // Object with explicit rating overriding ok
  const resObjRating = nextStat(null, { rating: 'hard', ok: false }, baseTime);
  assert.equal(resObjRating.rating, 'hard');
  assert.equal(resObjRating.ok, true);

  // Reviews without rating in stored state: rebuildStats fallback to ok
  const legacyV2State = fresh();
  legacyV2State.reviews = {
    'att-1:q-leg-1': {
      id: 'att-1:q-leg-1',
      questionId: 'q-leg-1',
      ok: true,
      at: baseTime,
      updatedAt: baseTime,
    },
    'att-1:q-leg-2': {
      id: 'att-1:q-leg-2',
      questionId: 'q-leg-2',
      ok: false,
      at: baseTime + 1000,
      updatedAt: baseTime + 1000,
    },
  };
  rebuildStats(legacyV2State);
  assert.equal(legacyV2State.stats['q-leg-1'].ok, true);
  assert.equal(legacyV2State.stats['q-leg-1'].rating, 'good');
  assert.equal(legacyV2State.stats['q-leg-1'].box, 1);
  assert.equal(legacyV2State.stats['q-leg-2'].ok, false);
  assert.equal(legacyV2State.stats['q-leg-2'].rating, 'again');
  assert.equal(legacyV2State.stats['q-leg-2'].box, 0);

  // Legacy v1 state migration: baselineStats correctly populates box and dueAt
  const legacyV1State = {
    version: 1,
    stats: {
      'q-v1-ok': { ok: true, at: baseTime, attempts: 5 },
      'q-v1-fail': { ok: false, at: baseTime, attempts: 2 },
    },
    history: [],
    drafts: {},
    attempts: {},
  };
  const migrated = migrate(legacyV1State);
  assert.equal(migrated.version, 2, 'Migration updates version to 2');
  assert.equal(migrated.stats['q-v1-ok'].box, 1);
  assert.equal(migrated.stats['q-v1-ok'].dueAt, baseTime + INTERVALS[1]);
  assert.equal(migrated.stats['q-v1-ok'].attempts, 5);
  assert.equal(migrated.stats['q-v1-fail'].box, 0);
  assert.equal(migrated.stats['q-v1-fail'].dueAt, baseTime + INTERVALS[0]);
  assert.equal(migrated.stats['q-v1-fail'].attempts, 2);

  // Subsequent review on migrated baseline stat correctly updates rating and box
  const nextReview = nextStat(migrated.stats['q-v1-ok'], 'good', baseTime + 86400000, 'new-rev');
  assert.equal(nextReview.box, 2);
  assert.equal(nextReview.rating, 'good');
  assert.equal(nextReview.attempts, 6);
});

test('Empirical Stress 6: SCHEMA_VERSION = 2 never triggers wipe migration and preserves existing data', () => {
  assert.equal(SCHEMA_VERSION, 2);

  const t0 = Date.parse('2026-10-04T12:00:00Z');
  const existingV2 = {
    version: 2,
    baselineStats: {
      'q-existing': { box: 3, dueAt: t0 + 100000, ok: true, attempts: 4 },
    },
    reviews: {
      'att:q-existing': {
        id: 'att:q-existing',
        questionId: 'q-existing',
        rating: 'hard',
        ok: true,
        at: t0,
        updatedAt: t0,
      },
    },
    stats: {},
    drafts: {
      practice: { at: t0, session: { index: 3, ids: ['q-existing'] } },
    },
    attempts: {
      att: { ids: ['q-existing'], answers: { 'q-existing': 'ans' }, grades: { 'q-existing': true } },
    },
    history: [{ id: 'att', at: t0, ok: 1, total: 1 }],
    theme: 'sakura',
    preferredCount: 20,
    examDate: '2026-10-20',
  };

  // Migrate state that is already version 2
  const migrated = migrate(existingV2);

  // Verify NOT wiped
  assert.equal(migrated.version, 2);
  assert.equal(Object.keys(migrated.reviews).length, 1, 'Reviews must not be wiped');
  assert.equal(migrated.reviews['att:q-existing'].rating, 'hard');
  assert.equal(migrated.drafts.practice.session.index, 3, 'Drafts session must be preserved');
  assert.equal(migrated.attempts.att.answers['q-existing'], 'ans', 'Attempts preserved');
  assert.equal(migrated.history.length, 1, 'History preserved');
  assert.equal(migrated.theme, 'sakura', 'User theme preference preserved');
  assert.equal(migrated.preferredCount, 20, 'User preferredCount preserved');
  assert.equal(migrated.examDate, '2026-10-20', 'Exam date preserved');
});

test('Empirical Stress 7: Fuzz testing - Valid finite numbers produced on valid & boundary inputs', () => {
  const validTime = Date.parse('2026-10-04T12:00:00Z');

  const variedRatings = [
    undefined,
    null,
    '',
    'unknown-rating',
    12345,
    true,
    false,
    {},
    { foo: 'bar' },
    { rating: null },
    { rating: undefined },
    { ok: 'truthy' },
    { ok: 0 },
    NaN,
    Infinity,
    -1,
  ];

  for (const r of variedRatings) {
    const stat = nextStat(null, r, validTime, 'fuzz');
    assert(
      typeof stat.box === 'number' && !Number.isNaN(stat.box) && Number.isFinite(stat.box),
      `stat.box is not a valid finite number for input: ${r}`,
    );
    assert(
      stat.box >= 0 && stat.box <= 4,
      `stat.box ${stat.box} is not in [0, 4] for input: ${r}`,
    );
    assert(
      typeof stat.dueAt === 'number' && !Number.isNaN(stat.dueAt) && Number.isFinite(stat.dueAt),
      `stat.dueAt is not a valid finite number for input: ${r}`,
    );
    assert(
      typeof stat.ok === 'boolean',
      `stat.ok is not boolean for input: ${r}`,
    );
  }

  // Previous stat structures with missing/default properties
  const validBoundaryPrevious = [
    {},
    { box: undefined, dueAt: undefined },
    { box: null, dueAt: null },
    { box: 0, dueAt: validTime },
    { box: 1, dueAt: validTime },
    { box: 4, dueAt: validTime },
    { attempts: 0 },
    { attempts: 100 },
  ];

  for (const prev of validBoundaryPrevious) {
    const stat = nextStat(prev, 'good', validTime, 'fuzz-prev');
    assert(!Number.isNaN(stat.box), `box must not be NaN for previous: ${JSON.stringify(prev)}`);
    assert(Number.isFinite(stat.dueAt), `dueAt must be finite for previous: ${JSON.stringify(prev)}`);
    assert(!Number.isNaN(stat.attempts), `attempts must not be NaN for previous: ${JSON.stringify(prev)}`);
  }
});

test('Empirical Stress 8: Interval array invariants and monotonic growth', () => {
  // INTERVALS must contain exactly 5 entries
  assert.equal(INTERVALS.length, 5, 'INTERVALS array must have exactly 5 tiers');

  // Verify strictly positive and monotonic
  for (let i = 0; i < INTERVALS.length; i++) {
    assert(INTERVALS[i] > 0, `INTERVALS[${i}] must be > 0`);
    if (i > 0) {
      assert(
        INTERVALS[i] > INTERVALS[i - 1],
        `INTERVALS[${i}] (${INTERVALS[i]}) must be strictly greater than INTERVALS[${i - 1}] (${INTERVALS[i - 1]})`,
      );
    }
  }

  // Exact configured intervals:
  // Box 0: 10 min (600,000 ms)
  // Box 1: 1 day (86,400,000 ms)
  // Box 2: 3 days (259,200,000 ms)
  // Box 3: 7 days (604,800,000 ms)
  // Box 4: 14 days (1,209,600,000 ms)
  assert.equal(INTERVALS[0], 10 * 60 * 1000);
  assert.equal(INTERVALS[1], 1 * 24 * 60 * 60 * 1000);
  assert.equal(INTERVALS[2], 3 * 24 * 60 * 60 * 1000);
  assert.equal(INTERVALS[3], 7 * 24 * 60 * 60 * 1000);
  assert.equal(INTERVALS[4], 14 * 24 * 60 * 60 * 1000);
});

test('Empirical Stress 9: Session size selection scaling & boundary conditions (5, 10, 20, all)', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');
  const bank = Array.from({ length: 50 }, (_, i) => ({
    id: `stress-q-${i}`,
    topic: 'Partiklar',
  }));

  const stats = {};
  // 30 questions due, 20 questions in future
  for (let i = 0; i < 30; i++) {
    stats[bank[i].id] = { dueAt: now - (30 - i) * 1000, ok: true };
  }
  for (let i = 30; i < 50; i++) {
    stats[bank[i].id] = { dueAt: now + (i - 30 + 1) * 100000, ok: true };
  }

  // Request 5
  const sel5 = selectPractice(bank, stats, 'Partiklar', 5, now);
  assert.equal(sel5.length, 5);

  // Request 10
  const sel10 = selectPractice(bank, stats, 'Partiklar', 10, now);
  assert.equal(sel10.length, 10);

  // Request 20
  const sel20 = selectPractice(bank, stats, 'Partiklar', 20, now);
  assert.equal(sel20.length, 20);

  // Request all due (count = bank.length or Infinity)
  const selAll = selectPractice(bank, stats, 'Partiklar', bank.length, now);
  assert.equal(selAll.length, 30, 'Should return exactly all 30 due questions and exclude future');

  // Verify none of the future items (indices 30..49) are included
  for (let i = 30; i < 50; i++) {
    assert(!selAll.includes(bank[i].id), `Future question ${bank[i].id} must not be selected`);
  }

  // Verify due questions are ordered by dueAt ascending (oldest due first)
  for (let i = 1; i < selAll.length; i++) {
    const prevDue = stats[selAll[i - 1]].dueAt;
    const currDue = stats[selAll[i]].dueAt;
    assert(prevDue <= currDue, `Practice queue must prioritize older due items: ${prevDue} <= ${currDue}`);
  }

  // Zero due questions
  const futureStats = {};
  bank.forEach((q) => {
    futureStats[q.id] = { dueAt: now + 999999, ok: true };
  });
  const selZero = selectPractice(bank, futureStats, 'Partiklar', 10, now);
  assert.equal(selZero.length, 0, 'No questions due and no unseen questions returns empty array');
});
