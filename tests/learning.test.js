import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fresh,
  migrate,
  nextStat,
  recordReview,
  mergeProgress,
  importGuest,
  ensurePlan,
  dayKey,
  daysUntil,
  scoreAttempt,
  latestAttempt,
  examErrors,
} from '../src/engine.js';
import { createSession, submitSession, updateResult } from '../src/session.js';
import { questions } from '../src/data.js';
import { INTERVALS, DEFAULT_EXAM_DATE } from '../src/config.js';
const now = Date.parse('2026-10-04T10:00:00Z');
test('Leitner advances only when due and not twice on one Stockholm day', () => {
  const first = nextStat(null, true, now, 'a');
  assert.equal(first.box, 1);
  assert.equal(first.dueAt, now + INTERVALS[1]);
  const extra = nextStat(first, true, now + 1000, 'b');
  assert.equal(extra.box, 1);
  assert.equal(extra.dueAt, first.dueAt);
  const second = nextStat(extra, true, first.dueAt, 'c');
  assert.equal(second.box, 2);
  assert.equal(second.dueAt, first.dueAt + INTERVALS[2]);
  const wrong = nextStat(first, false, now + 2000, 'd');
  assert.equal(wrong.box, 0);
  assert.equal(wrong.dueAt, now + 2000 + 600000);
  assert.equal(nextStat(wrong, true, now + 602000, 'e').box, 0);
  assert.equal(nextStat({ ...second, box: 4 }, true, second.dueAt, 'f').box, 4);
});
test('Stockholm calendar and DST determine day boundaries', () => {
  assert.equal(dayKey(Date.parse('2026-10-04T22:30Z')), '2026-10-05');
  assert.equal(daysUntil('2026-10-26', Date.parse('2026-10-24T22:30Z')), 1);
});
test('regrading is one review, reopening a result does not create reviews', () => {
  const s = fresh(),
    a = createSession(['l5-2'], 'test');
  recordReview(s, a, 'l5-2', false, now);
  recordReview(s, a, 'l5-2', true, now + 1000);
  recordReview(s, a, 'l5-2', true, now + 2000);
  assert.equal(Object.keys(s.reviews).length, 1);
  assert.equal(s.stats['l5-2'].attempts, 1);
  assert.equal(s.stats['l5-2'].box, 1);
  assert.equal(s.stats['l5-2'].at, now);
  a.answers['l5-2'] = 'で';
  submitSession(s, a, questions, now + 3000);
  submitSession(s, a, questions, now + 4000);
  assert.equal(s.stats['l5-2'].attempts, 1);
  assert.equal(s.history.length, 1);
});
test('migration preserves attempts/history/drafts and derives dueAt from historical time', () => {
  const raw = {
    stats: { q: { ok: true, at: now, attempts: 7 }, r: { ok: false, at: now, attempts: 3 } },
    history: [{ id: 'old', at: now, name: 'Old', ok: 1, total: 2 }],
    drafts: {
      gema70: {
        at: now,
        session: { ids: ['gema70-1.1'], exam: 'gema70', answers: {}, grades: {}, done: true },
      },
    },
    examDate: DEFAULT_EXAM_DATE,
  };
  const s = migrate(raw);
  assert.equal(s.stats.q.attempts, 7);
  assert.equal(s.stats.q.dueAt, now + 86400000);
  assert.equal(s.stats.r.dueAt, now + 600000);
  assert.equal(s.history[0].id, 'old');
  assert.equal(Object.keys(s.attempts).length, 1);
  assert.deepEqual(migrate(s).stats, s.stats);
});
test('merging independent devices preserves both reviews; corrected review wins', () => {
  const a = fresh(),
    b = fresh(),
    sa = createSession(['q'], 'A'),
    sb = createSession(['q'], 'B');
  recordReview(a, sa, 'q', true, now);
  recordReview(b, sb, 'q', false, now + 1);
  const merged = mergeProgress(a, b);
  assert.equal(merged.stats.q.attempts, 2);
  assert.equal(merged.stats.q.ok, false);
  assert.deepEqual(merged.stats, mergeProgress(b, a).stats);
  recordReview(b, sb, 'q', true, now + 5000);
  const revised = mergeProgress(merged, b);
  assert.equal(revised.stats.q.attempts, 2);
  assert.equal(revised.stats.q.ok, true);
});
test('import is idempotent, keeps account date and guest original', () => {
  const a = fresh(),
    g = fresh();
  a.examDate = '2027-01-01';
  const session = createSession(['q'], 'Guest');
  recordReview(g, session, 'q', true, now);
  g.drafts.practice = { at: now, session };
  const snapshot = JSON.stringify(g);
  const once = importGuest(a, g),
    twice = importGuest(once, g);
  assert.equal(twice.examDate, '2027-01-01');
  assert.equal(twice.stats.q.attempts, 1);
  assert.equal(JSON.stringify(g), snapshot);
  assert(twice.drafts.practice);
});
test('daily plan is stable, excludes kana, has bounded tasks and carries completion between devices', () => {
  const a = fresh(),
    p = ensurePlan(a, questions, now);
  assert.equal(p.tasks[0].ids.length, 10);
  assert.equal(p.tasks[1].ids.length, 5);
  assert(p.tasks[2].ids.length <= 3);
  assert(
    p.tasks
      .flatMap((t) => t.ids)
      .every((id) => questions.find((q) => q.id === id).topic !== 'Kana'),
  );
  const b = structuredClone(a);
  b.plans[p.day].completed[p.tasks[0].id] = now;
  assert.equal(ensurePlan(a, questions, now + 3600000), p);
  assert(mergeProgress(a, b).plans[p.day].completed[p.tasks[0].id]);
  const next = ensurePlan(a, questions, now + 86400000);
  assert.notEqual(next.day, p.day);
});
test('last three days prioritise actual exam errors and past dates still have a plan', () => {
  const a = fresh();
  a.examDate = '2026-10-05';
  a.attempts.x = {
    exam: 'gema70',
    submittedAt: now,
    ids: ['gema70-3-1'],
    answers: { 'gema70-3-1': 'bad' },
    grades: { 'gema70-3-1': false },
  };
  assert(ensurePlan(a, questions, now).tasks[2].ids.includes('gema70-3-1'));
  a.examDate = '2026-10-01';
  assert.equal(ensurePlan(a, questions, now + 86400000).tasks.length, 3);
});
test('tentas keep points, pending and unanswered separate; error practice cannot edit source', () => {
  const state = fresh(),
    s = createSession(['gema70-1.1', 'gema70-3-1'], 'exam', { mode: 'exam', exam: 'gema70' });
  s.answers['gema70-3-1'] = 'wrong';
  submitSession(state, s, questions, now);
  const result = scoreAttempt(s, questions);
  assert.equal(result.max, 11);
  assert.equal(result.pending, 1);
  assert.equal(result.unanswered, 1);
  assert.equal(result.earned, 0);
  recordReview(state, s, 'gema70-1.1', true, now + 10);
  updateResult(state, s, questions, now + 10);
  assert.equal(scoreAttempt(latestAttempt(state, 'gema70'), questions).earned, 10);
  const old = JSON.stringify(state.attempts[s.attemptId]);
  const practice = createSession(examErrors(s), 'errors', { sourceAttemptId: s.attemptId });
  recordReview(state, practice, 'gema70-3-1', true, now + 20);
  assert.equal(JSON.stringify(state.attempts[s.attemptId]), old);
});
test('exactly 142 kana and 24 each extra sound and word-order questions', () => {
  assert.equal(questions.filter((q) => q.id.startsWith('kana-')).length, 142);
  assert.equal(questions.filter((q) => q.id.startsWith('sound-extra-')).length, 24);
  assert.equal(questions.filter((q) => q.id.startsWith('sov-extra-')).length, 24);
  assert(questions.filter((q) => q.topic === 'Kana').every((q) => q.hidePromptSpeech));
});

test('independent self-assessments in one attempt merge without losing points', () => {
  const base = fresh();
  const s = createSession(['gema70-1.1', 'gema70-3-1'], 'Exam', { mode: 'exam', exam: 'gema70' });
  submitSession(base, s, questions, now);
  const a = structuredClone(base),
    b = structuredClone(base);
  const sa = structuredClone(s),
    sb = structuredClone(s);
  recordReview(a, sa, 'gema70-1.1', true, now + 10);
  updateResult(a, sa, questions, now + 10);
  recordReview(b, sb, 'gema70-3-1', true, now + 20);
  updateResult(b, sb, questions, now + 20);
  const merged = mergeProgress(a, b);
  assert.equal(merged.attempts[s.attemptId].result.earned, 11);
  assert.deepEqual(merged.attempts, mergeProgress(b, a).attempts);
});

test('guest import preserves two different unfinished attempts for the same exam', () => {
  const a = fresh(),
    b = fresh();
  const sa = createSession(['gema70-1.1'], 'Account', { mode: 'exam', exam: 'gema70' });
  const sb = createSession(['gema70-1.1'], 'Guest', { mode: 'exam', exam: 'gema70' });
  a.drafts.gema70 = { at: now, session: sa };
  b.drafts.gema70 = { at: now + 1, session: sb };
  const merged = importGuest(a, b);
  assert.equal(Object.keys(merged.drafts).length, 2);
  assert.equal(Object.keys(importGuest(merged, b).drafts).length, 2);
  assert.deepEqual(
    new Set(Object.values(merged.drafts).map((d) => d.session.attemptId)),
    new Set([sa.attemptId, sb.attemptId]),
  );
});
