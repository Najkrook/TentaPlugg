import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { examQuestions, exams, questions } from '../src/data.js';
import {
  scoreAttempt,
  latestAttempt,
  recordReview,
  correct,
  getContrastiveFeedback,
  fresh,
} from '../src/engine.js';
import { createSession, submitSession, updateResult } from '../src/session.js';

test('goto-mock exam metadata and assets exist', () => {
  const exam = exams.find((e) => e.id === 'goto-mock');
  assert.ok(exam, 'goto-mock exam entry must exist');
  assert.equal(exam.title, 'Goto-sensei Mocktenta');
  assert.equal(exam.pages, 6);
  assert.equal(exam.points, 100);

  assert.ok(existsSync('Material/goto-mock.pdf'), 'Material/goto-mock.pdf must exist');
  assert.ok(existsSync('public/material/goto-mock.pdf'), 'public/material/goto-mock.pdf must exist');
  for (let p = 1; p <= 6; p++) {
    assert.ok(existsSync(`public/material/goto-mock-${p}.jpg`), `public/material/goto-mock-${p}.jpg must exist`);
  }
});

test('goto-mock question count and point sum total exactly 100 points', () => {
  const mockQs = examQuestions.filter((q) => q.exam === 'goto-mock');
  assert.equal(mockQs.length, 66, 'goto-mock should contain 66 sub-questions');
  const totalPoints = mockQs.reduce((sum, q) => sum + q.points, 0);
  assert.equal(totalPoints, 100, 'goto-mock must total exactly 100 points');

  // Verify section points
  const q1_1 = mockQs.find((q) => q.id === 'goto-mock-1.1');
  const q1_2 = mockQs.find((q) => q.id === 'goto-mock-1.2');
  assert.equal(q1_1.points, 10);
  assert.equal(q1_2.points, 9);

  const q1_3 = mockQs.filter((q) => q.id.startsWith('goto-mock-1.3-'));
  assert.equal(q1_3.length, 3);
  assert.equal(q1_3.reduce((s, q) => s + q.points, 0), 6);

  const q2 = mockQs.filter((q) => q.id.startsWith('goto-mock-2-'));
  assert.equal(q2.length, 18);
  assert.equal(q2.reduce((s, q) => s + q.points, 0), 18);

  const q3 = mockQs.filter((q) => q.id.startsWith('goto-mock-3-'));
  assert.equal(q3.length, 23);
  assert.equal(q3.reduce((s, q) => s + q.points, 0), 23);

  const q4 = mockQs.filter((q) => q.id.startsWith('goto-mock-4-'));
  assert.equal(q4.length, 11);
  assert.equal(q4.reduce((s, q) => s + q.points, 0), 22);

  const q5 = mockQs.filter((q) => q.id.startsWith('goto-mock-5-'));
  assert.equal(q5.length, 3);
  assert.equal(q5.reduce((s, q) => s + q.points, 0), 6);

  const q6 = mockQs.filter((q) => q.id.startsWith('goto-mock-6-'));
  assert.equal(q6.length, 6);
  assert.equal(q6.reduce((s, q) => s + q.points, 0), 6);
});

test('goto-mock romanization accepts Hepburn variations with flexible long vowels', () => {
  const q1 = questions.find((q) => q.id === 'goto-mock-1.3-1');
  assert.ok(correct(q1, 'byōin wa koko'));
  assert.ok(correct(q1, 'byooin wa koko'));
  assert.ok(correct(q1, 'byôin wa koko'));
  assert.ok(correct(q1, 'byoin wa koko'));
  assert.equal(correct(q1, 'byoin ha koko'), false); // 'ha' instead of 'wa' is rejected

  const q2 = questions.find((q) => q.id === 'goto-mock-1.3-2');
  assert.ok(correct(q2, 'daigaku e jitensha'));
  assert.equal(correct(q2, 'daigaku he jitensha'), false); // 'he' rejected

  const q3 = questions.find((q) => q.id === 'goto-mock-1.3-3');
  assert.ok(correct(q3, 'watashi wa toshokan'));
  assert.equal(correct(q3, 'watashi ha toshokan'), false);
});

test('goto-mock sound system accurately parses moras and syllables', () => {
  const stockholm = questions.find((q) => q.id === 'goto-mock-5-1');
  assert.equal(stockholm.soundBreakdown.word, 'ストックホルム');
  assert.equal(stockholm.soundBreakdown.syllables.length, 6);
  assert.equal(stockholm.soundBreakdown.moras.length, 7);
  assert.ok(correct(stockholm, '6, 7'));
  assert.ok(correct(stockholm, '6/7'));

  const shinjuku = questions.find((q) => q.id === 'goto-mock-5-2');
  assert.equal(shinjuku.soundBreakdown.word, 'しんじゅく');
  assert.equal(shinjuku.soundBreakdown.syllables.length, 3);
  assert.equal(shinjuku.soundBreakdown.moras.length, 4);
  assert.ok(correct(shinjuku, '3, 4'));

  const copenhagen = questions.find((q) => q.id === 'goto-mock-5-3');
  assert.equal(copenhagen.soundBreakdown.word, 'コペンハーゲン');
  assert.equal(copenhagen.soundBreakdown.syllables.length, 4);
  assert.equal(copenhagen.soundBreakdown.moras.length, 7);
  assert.ok(correct(copenhagen, '4, 7'));
});

test('goto-mock self assessment checklists and guide links exist', () => {
  const q1 = questions.find((q) => q.id === 'goto-mock-1.1');
  assert.ok(q1.self);
  assert.ok(q1.checklist.length >= 3);
  assert.equal(q1.guideId, 'writing-systems');

  const q2 = questions.find((q) => q.id === 'goto-mock-1.2');
  assert.ok(q2.self);
  assert.ok(q2.checklist.length >= 3);
  assert.equal(q2.guideId, 'writing-systems');

  const q4_1 = questions.find((q) => q.id === 'goto-mock-4-1');
  assert.ok(q4_1.self);
  assert.ok(q4_1.checklist.length >= 3);
  assert.equal(q4_1.guideId, 'sentence-parts');
});

test('goto-mock full exam session lifecycle and grading', () => {
  const mockIds = examQuestions.filter((q) => q.exam === 'goto-mock').map((q) => q.id);
  const session = createSession(mockIds, 'Exam', { mode: 'exam', exam: 'goto-mock' });
  assert.equal(session.ids.length, 66);
  assert.equal(session.exam, 'goto-mock');

  const state = fresh();
  let now = Date.now();
  for (const id of mockIds) {
    const q = questions.find((x) => x.id === id);
    if (!q.self) {
      session.answers[id] = q.answers[0];
    } else {
      session.answers[id] = 'Modellsvar övning';
    }
  }
  submitSession(state, session, questions, now);

  for (const id of mockIds) {
    const q = questions.find((x) => x.id === id);
    if (q.self) {
      recordReview(state, session, id, true, (now += 10));
    }
  }
  updateResult(state, session, questions, now);

  const attempt = latestAttempt(state, 'goto-mock');
  assert.ok(attempt);
  const score = scoreAttempt(attempt, questions);
  assert.equal(score.earned, 100);
  assert.equal(score.max, 100);
  assert.equal(score.pending, 0);
});
