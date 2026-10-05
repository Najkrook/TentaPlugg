import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, guides } from '../src/data.js';
import { createFollowUp, followUpQuestions } from '../src/follow-up.js';
import { createSession, submitSession } from '../src/session.js';
import { fresh, recordReview } from '../src/engine.js';

test('follow-up selects at most five distinct assessed mistakes, not correct, pending or removed questions', () => {
  const ids = questions.slice(0, 9).map((q) => q.id);
  const attempt = createSession([...ids, ids[2], 'removed'], 'Original');
  attempt.grades = Object.fromEntries(ids.slice(2).map((id) => [id, false]));
  attempt.grades[ids[0]] = true;
  attempt.grades.removed = false;
  assert.deepEqual(followUpQuestions(attempt, questions), ids.slice(2, 7));
  const pending = createSession(['japc11-1.1'], 'Unassessed');
  assert.equal(createFollowUp(pending, questions), null);
  pending.grades['japc11-1.1'] = true;
  assert.equal(createFollowUp(pending, questions), null);
});

test('repeating a mistake starts fresh and cannot change the original attempt or its score', () => {
  const state = fresh();
  const original = createSession(['japc11-1.1'], 'Exam', { mode: 'exam', exam: 'japc11' });
  original.answers['japc11-1.1'] = 'Incomplete answer';
  recordReview(state, original, 'japc11-1.1', false, 1000);
  submitSession(state, original, questions, 1000);
  const before = JSON.stringify(state.attempts[original.attemptId]);
  const followUp = createFollowUp(original, questions);
  assert.notEqual(followUp.attemptId, original.attemptId);
  assert.equal(followUp.sourceAttemptId, original.attemptId);
  assert.equal(followUp.mode, 'practice');
  assert.deepEqual(followUp.answers, {});
  assert.deepEqual(followUp.grades, {});
  assert.deepEqual(followUp.revealed, {});
  recordReview(state, followUp, 'japc11-1.1', true, 2000);
  submitSession(state, followUp, questions, 2000);
  assert.equal(JSON.stringify(state.attempts[original.attemptId]), before);
});

test('every self-assessed question has specific criteria and an existing relevant guide', () => {
  for (const q of questions.filter((q) => q.self)) {
    assert.ok(q.checklist.length >= 3, q.id);
    assert.ok(!q.checklist[0].startsWith('Har du besvarat alla delar'), q.id);
    assert.ok(
      guides.some((g) => g.id === q.guideId),
      q.id,
    );
  }
  const get = (id) => questions.find((q) => q.id === id);
  assert.match(get('reading-II.2-4').checklist.join(' '), /framför universitetet/);
  assert.match(get('reading-I.1-2').checklist.join(' '), /くつ.*kutsu/);
  assert.equal(get('japc11-3.2-2').guideId, 'sentence-parts');
});
