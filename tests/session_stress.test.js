import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fresh,
  selectPractice,
  nextStat,
  recordReview,
  rebuildStats,
  scoreAttempt,
} from '../src/engine.js';
import { createSession, submitSession, updateResult } from '../src/session.js';
import { questions } from '../src/data.js';
import { INTERVALS } from '../src/config.js';

// ============================================================================
// EMPIRICAL STRESS TESTS: SESSION SIZING & DUE-ONLY FILTERING
// ============================================================================

test('Session Sizing: strictly honors counts 5, 10, 20 and all due questions on realistic bank', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');
  const particleQuestions = questions.filter((q) => q.topic === 'Partiklar');
  assert(particleQuestions.length >= 20, 'Particle question bank must have at least 20 items');

  // Case 1: Fresh state, no questions previously answered (all unseen)
  const freshStats = {};
  for (const count of [5, 10, 20]) {
    const ids = selectPractice(particleQuestions, freshStats, 'Partiklar', count, now);
    assert.equal(ids.length, count, `Fresh state: selecting ${count} must yield exactly ${count} items`);
    assert.equal(new Set(ids).size, count, `Fresh state: selecting ${count} must have no duplicates`);
  }

  // Case 2: Partial state where 7 questions are due, 10 are future, rest unseen
  const stats = {};
  particleQuestions.slice(0, 7).forEach((q, i) => {
    stats[q.id] = { dueAt: now - (1000 * (i + 1)), ok: true, box: 1 };
  });
  particleQuestions.slice(7, 17).forEach((q, i) => {
    stats[q.id] = { dueAt: now + (86400000 * (i + 1)), ok: true, box: 2 };
  });

  // Count 5: Should select exactly 5 due items (the 5 most urgent)
  const sel5 = selectPractice(particleQuestions, stats, 'Partiklar', 5, now);
  assert.equal(sel5.length, 5, 'Count 5 with 7 due must yield exactly 5 items');
  for (const id of sel5) {
    assert(stats[id]?.dueAt <= now, `Item ${id} in count 5 must be due`);
  }

  // Count 10: Should select all 7 due items + 3 unseen items
  const sel10 = selectPractice(particleQuestions, stats, 'Partiklar', 10, now);
  assert.equal(sel10.length, 10, 'Count 10 with 7 due must yield exactly 10 items');
  const dueInSel10 = sel10.filter((id) => stats[id]?.dueAt <= now);
  const unseenInSel10 = sel10.filter((id) => !stats[id]);
  assert.equal(dueInSel10.length, 7, 'All 7 due items must be included');
  assert.equal(unseenInSel10.length, 3, 'Remaining 3 items must be unseen');

  // Count 20: Should select all 7 due items + 13 unseen items
  const sel20 = selectPractice(particleQuestions, stats, 'Partiklar', 20, now);
  assert.equal(sel20.length, 20, 'Count 20 must yield exactly 20 items');
  const dueInSel20 = sel20.filter((id) => stats[id]?.dueAt <= now);
  const unseenInSel20 = sel20.filter((id) => !stats[id]);
  assert.equal(dueInSel20.length, 7, 'All 7 due items must be included');
  assert.equal(unseenInSel20.length, 13, 'Remaining 13 items must be unseen');

  // All due questions: bank filtered to due items only, count Infinity
  const dueBank = particleQuestions.filter((q) => stats[q.id]?.dueAt <= now);
  const selAllDue = selectPractice(dueBank, stats, 'Partiklar', Infinity, now);
  assert.equal(selAllDue.length, 7, 'All due questions must return strictly 7 items');
  assert.equal(new Set(selAllDue).size, 7, 'All due questions must be unique');
});

test('Session Sizing: Generative fuzz testing across arbitrary bank sizes and due distributions', () => {
  const now = 1000000;
  for (let seed = 1; seed <= 50; seed++) {
    const bankSize = 10 + (seed % 40); // 10 to 49
    const dueCount = seed % (bankSize + 1); // 0 to bankSize
    const futureCount = (seed * 3) % (bankSize - dueCount + 1);
    const unseenCount = bankSize - dueCount - futureCount;

    const mockBank = Array.from({ length: bankSize }, (_, idx) => ({
      id: `gen-q-${seed}-${idx}`,
      topic: 'TestTopic',
    }));

    const mockStats = {};
    for (let i = 0; i < dueCount; i++) {
      mockStats[mockBank[i].id] = { dueAt: now - 500 * (i + 1), ok: true };
    }
    for (let i = dueCount; i < dueCount + futureCount; i++) {
      mockStats[mockBank[i].id] = { dueAt: now + 50000 * (i + 1), ok: true };
    }
    // remaining are unseen

    // Test requesting counts [5, 10, 20, Infinity]
    for (const requestedCount of [5, 10, 20, Infinity]) {
      // 1. Without dueOnly (eligible = due + unseen)
      const eligibleTotal = dueCount + unseenCount;
      const expectedCount = Math.min(requestedCount === Infinity ? eligibleTotal : requestedCount, eligibleTotal);
      const res = selectPractice(mockBank, mockStats, 'TestTopic', requestedCount, now);

      assert.equal(
        res.length,
        expectedCount,
        `Seed ${seed}: requested ${requestedCount} on eligible ${eligibleTotal} must produce ${expectedCount}`,
      );
      assert.equal(new Set(res).size, res.length, `Seed ${seed}: all returned IDs must be unique`);

      // Verify no future items were returned
      for (const id of res) {
        assert(
          !mockStats[id] || mockStats[id].dueAt <= now,
          `Seed ${seed}: item ${id} must not be a future item`,
        );
      }

      // 2. With dueOnly (bank filtered to due only)
      const dueOnlyBank = mockBank.filter((q) => mockStats[q.id]?.dueAt <= now);
      const expectedDueCount = Math.min(requestedCount === Infinity ? dueCount : requestedCount, dueCount);
      const resDue = selectPractice(dueOnlyBank, mockStats, 'TestTopic', requestedCount, now);

      assert.equal(
        resDue.length,
        expectedDueCount,
        `Seed ${seed}: dueOnly requested ${requestedCount} on dueCount ${dueCount} must produce ${expectedDueCount}`,
      );
    }
  }
});

// ============================================================================
// SIMULATED PRACTICE FLOW: DIVERSE SELF-RATINGS & STATS ACCURACY
// ============================================================================

test('Practice Session Flow: 20-question session with diverse self-ratings and strict results verification', () => {
  const state = fresh();
  const now = Date.parse('2026-10-04T14:00:00Z');

  // Pick 20 questions
  const qIds = selectPractice(questions, state.stats, 'Partiklar', 20, now);
  assert.equal(qIds.length, 20, 'Selected 20 particle questions');

  const session = createSession(qIds, 'Stress Session');

  // Distribution of 20 ratings: 5 'again', 5 'hard', 5 'good', 5 'easy'
  const ratingSequence = [
    'again', 'good', 'hard', 'easy',
    'easy', 'again', 'good', 'hard',
    'hard', 'again', 'easy', 'good',
    'good', 'hard', 'again', 'easy',
    'easy', 'again', 'good', 'hard',
  ];
  assert.equal(ratingSequence.length, 20);

  // Expected counts:
  const countAgain = ratingSequence.filter((r) => r === 'again').length; // 5
  const countHard = ratingSequence.filter((r) => r === 'hard').length;   // 5
  const countGood = ratingSequence.filter((r) => r === 'good').length;   // 5
  const countEasy = ratingSequence.filter((r) => r === 'easy').length;   // 5
  const expectedOk = countHard + countGood + countEasy; // 15
  const expectedFail = countAgain; // 5

  assert.equal(countAgain, 5);
  assert.equal(expectedOk, 15);

  // Step through each question and record rating
  for (let i = 0; i < 20; i++) {
    const qId = qIds[i];
    const rating = ratingSequence[i];
    const at = now + i * 1000;

    session.index = i;
    session.answers[qId] = 'svar';

    // Record review
    recordReview(state, session, qId, rating, at);

    // Verify session grade: false for 'again', true for others
    const expectedOkForQuestion = rating !== 'again';
    assert.equal(
      session.grades[qId],
      expectedOkForQuestion,
      `Question ${qId} grade must match rating ${rating}`,
    );

    // Verify review history entry
    const revId = `${session.attemptId}:${qId}`;
    const review = state.reviews[revId];
    assert(review, `Review ${revId} must be created`);
    assert.equal(review.rating, rating);
    assert.equal(review.ok, expectedOkForQuestion);
    assert.equal(review.at, at);

    // Verify state.stats update
    const stat = state.stats[qId];
    assert(stat, `Stat for ${qId} must be updated`);
    assert.equal(stat.rating, rating);
    assert.equal(stat.ok, expectedOkForQuestion);
    assert.equal(stat.attempts, 1);

    if (rating === 'again') {
      assert.equal(stat.box, 0, 'again must set box to 0');
      assert.equal(stat.dueAt, at + INTERVALS[0], 'again must set dueAt to +10m');
    } else if (rating === 'hard') {
      assert.equal(stat.box, 0, 'hard on initial item must stay in box 0');
      assert.equal(stat.dueAt, at + Math.min(INTERVALS[0], 86400000));
    } else if (rating === 'good') {
      assert.equal(stat.box, 1, 'good on initial item must promote to box 1');
      assert.equal(stat.dueAt, at + INTERVALS[1]);
    } else if (rating === 'easy') {
      assert.equal(stat.box, 2, 'easy on initial item must promote to box 2');
      assert.equal(stat.dueAt, at + INTERVALS[2]);
    }
  }

  // Submit session
  const submitTime = now + 30000;
  submitSession(state, session, questions, submitTime);

  // Verify session completion
  assert.equal(session.done, true, 'Session must be marked done');
  assert.equal(session.submittedAt, submitTime, 'submittedAt must be set');

  // Verify scoreAttempt calculation
  const result = scoreAttempt(session, questions);
  assert.equal(result.ok, expectedOk, `Result ok count must be exactly ${expectedOk}`);
  assert.equal(result.total, 20, 'Result total count must be 20');
  assert.equal(result.unanswered, 0, 'No unanswered questions');
  assert.equal(result.pending, 0, 'No pending self-evaluation');

  // Verify state.attempts and state.history
  const recordedAttempt = state.attempts[session.attemptId];
  assert(recordedAttempt, 'Attempt must be saved in state.attempts');
  assert.deepEqual(recordedAttempt.result, result);

  const historyEntry = state.history.find((h) => h.id === session.attemptId);
  assert(historyEntry, 'History entry must exist');
  assert.equal(historyEntry.ok, expectedOk);
  assert.equal(historyEntry.total, 20);
  assert.equal(historyEntry.at, submitTime);

  // Verify results panel data integrity
  // In resultView(ctx): result.ok is rendered as the numerator and result.total as denominator
  assert.equal(`${result.ok} / ${result.total}`, '15 / 20');

  // Markers: grades[id] === true -> ✓, grades[id] === false -> ↻
  const checkmarks = qIds.filter((id) => session.grades[id] === true);
  const retries = qIds.filter((id) => session.grades[id] === false);
  assert.equal(checkmarks.length, 15);
  assert.equal(retries.length, 5);
});

test('Practice Session Flow: Repeated reviews across multiple days update boxes correctly', () => {
  const state = fresh();
  const day1 = Date.parse('2026-10-04T10:00:00Z');
  const day2 = Date.parse('2026-10-05T10:00:00Z');
  const day3 = Date.parse('2026-10-08T10:00:00Z');

  const qId = 'particle-flow-test';
  const qBank = [{ id: qId, topic: 'Partiklar', answers: ['に'] }];

  // Session 1 on Day 1: Answer with 'good'
  const sess1 = createSession([qId], 'Day 1');
  recordReview(state, sess1, qId, 'good', day1);
  assert.equal(state.stats[qId].box, 1);
  assert.equal(state.stats[qId].dueAt, day1 + INTERVALS[1]); // 1 day

  // Session 2 on Day 2 (due): Answer with 'easy'
  const sess2 = createSession([qId], 'Day 2');
  recordReview(state, sess2, qId, 'easy', day2);
  assert.equal(state.stats[qId].box, 3); // 1 + 2 = 3
  assert.equal(state.stats[qId].dueAt, day2 + INTERVALS[3]); // 6 days

  // Session 3 on Day 3 (early, not due): Answer with 'good'
  const sess3 = createSession([qId], 'Day 3');
  recordReview(state, sess3, qId, 'good', day3);
  // Early review with 'good' must NOT promote box because not due
  assert.equal(state.stats[qId].box, 3);

  // Session 4: Answer with 'again'
  const sess4 = createSession([qId], 'Day 4');
  recordReview(state, sess4, qId, 'again', day3 + 1000);
  assert.equal(state.stats[qId].box, 0);
  assert.equal(state.stats[qId].dueAt, day3 + 1000 + INTERVALS[0]);

  // Session 5: Rebuild stats matches incremental progression
  const rebuilt = rebuildStats(state);
  assert.deepEqual(rebuilt.stats[qId], state.stats[qId]);
});
