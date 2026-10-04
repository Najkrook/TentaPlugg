import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fresh,
  nextStat,
  recordReview,
  mergeProgress,
  migrate,
  getContrastiveFeedback,
} from '../src/engine.js';
import { createSession } from '../src/session.js';
import { formatInterval, previewRatingInterval } from '../src/views/session.js';
import { questions } from '../src/data.js';
import { INTERVALS } from '../src/config.js';

const now = Date.parse('2026-10-04T10:00:00Z');

test('easy respects both the due date and the one-promotion-per-day limit', () => {
  const first = nextStat(null, 'easy', now, 'first');
  const extra = nextStat(first, 'easy', now + 1000, 'extra');
  assert.equal(extra.box, 2);
  assert.equal(extra.dueAt, first.dueAt);
  const earlyNextDay = nextStat(first, 'easy', now + 86400000, 'early');
  assert.equal(earlyNextDay.box, 2);
  assert.equal(earlyNextDay.dueAt, first.dueAt);
  const due = nextStat(first, 'easy', first.dueAt, 'due');
  assert.equal(due.box, 4);
  assert.equal(due.dueAt, first.dueAt + INTERVALS[4]);

  for (const rating of ['good', 'easy']) {
    const lapse = nextStat(first, 'again', now + 1000, 'lapse');
    const retried = nextStat(lapse, rating, lapse.dueAt, 'retry');
    assert.equal(retried.box, 0, 'A lapse does not allow another promotion that day');
    assert.equal(
      retried.dueAt,
      lapse.dueAt + INTERVALS[0],
      'A completed review must not remain due',
    );
  }
});

test('hard does not consume a promotion and good schedules a future review when due', () => {
  const hard = nextStat(null, 'hard', now, 'hard');
  assert.equal(hard.lastPromotionDay, null);
  const good = nextStat(hard, 'good', now + 11 * 60000, 'good');
  assert.equal(good.box, 1);
  assert.equal(good.dueAt, now + 11 * 60000 + INTERVALS[1]);
});

test('session length and exam date merge independently in either device order', () => {
  const original = fresh();
  const deviceA = { ...original, examDate: '2026-11-01', settingsAt: now };
  const deviceB = { ...original, preferredCount: 20, preferredCountAt: now + 1000 };
  for (const [left, right] of [
    [deviceA, deviceB],
    [deviceB, deviceA],
  ]) {
    const merged = mergeProgress(left, right);
    assert.equal(merged.examDate, '2026-11-01');
    assert.equal(merged.settingsAt, now);
    assert.equal(merged.preferredCount, 20);
    assert.equal(merged.preferredCountAt, now + 1000);
    assert.deepEqual(migrate(merged), merged);
  }
  const legacy = { ...original, preferredCount: 5 };
  delete legacy.preferredCountAt;
  assert.equal(migrate(legacy).preferredCount, 5);
});

test('rating labels match saved scheduling during extra practice and after resuming feedback', () => {
  const state = fresh();
  recordReview(state, createSession(['p-2'], 'first'), 'p-2', 'easy', now);
  const session = createSession(['p-2'], 'extra');
  // Checking an answer writes a default grade before a difficulty is chosen.
  recordReview(state, session, 'p-2', false, now + 1000);
  const savedState = structuredClone(state);
  const savedSession = structuredClone(session);
  for (const rating of ['again', 'hard', 'good', 'easy']) {
    const at = now + 60000;
    const preview = previewRatingInterval(state, session, 'p-2', rating, at);
    const actual = structuredClone(state);
    recordReview(actual, structuredClone(session), 'p-2', rating, at);
    assert.equal(preview, formatInterval(actual.stats['p-2'].dueAt - at), rating);
  }
  assert.deepEqual(state, savedState, 'Preview must not change saved reviews');
  assert.deepEqual(session, savedSession, 'Preview must not grade the session');
  assert.equal(previewRatingInterval(state, session, 'p-2', 'good', now + 60000), '3d');
});

test('particle feedback uses the actual question context for means, time, lists and quotes', () => {
  for (const [id, wrong] of [
    ['p-2', 'に'],
    ['p-8', 'に'],
    ['l5-11', 'で'],
    ['l5-17', 'に'],
    ['p-13', 'の'],
  ]) {
    const q = questions.find((q) => q.id === id);
    const feedback = getContrastiveFeedback(q, wrong);
    assert.ok(feedback, id);
    assert.ok(feedback.text.includes(q.explanation), `${id}: ${feedback.text}`);
    assert.equal(getContrastiveFeedback(q, q.answers[0]), null);
  }
});
