import test from 'node:test';
import assert from 'node:assert/strict';
import { hayashiItems, hayashiQuestions, hayashiExams } from '../src/hayashi-data.js';
import { questions } from '../src/data.js';
import { correct, fresh, mergeProgress, recordReview, scoreAttempt } from '../src/engine.js';
import { createSession, submitSession } from '../src/session.js';
import { answerLocked, feedbackVisible, canCheck } from '../src/exam-policy.js';

test('Hayashi covers all pages and source items, with only the duplicated Tokyo question removed', () => {
  assert.deepEqual([...new Set(hayashiItems.map((q) => q.page))], [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(Object.groupBy(hayashiItems, (q) => q.key.split('-')[0])).map(([k, v]) => [
        k,
        v.length,
      ]),
    ),
    { number: 16, kyoto: 7, question: 21, word: 22, particle: 69 },
  );
  assert.equal(hayashiItems.filter((q) => q.prompt.includes('とうきょうはいま')).length, 1);
  const serious = hayashiQuestions.filter((q) => q.exam === 'hayashi-exam');
  const keys = new Set(serious.flatMap((q) => q.sourceKeys || [q.sourceKey]));
  for (const q of hayashiItems) assert.ok(keys.has(q.key), q.key);
  assert.equal(new Set(hayashiQuestions.map((q) => q.id)).size, hayashiQuestions.length);
  assert.deepEqual(
    hayashiExams.map((e) => e.points),
    [135, 131],
  );
  for (const e of hayashiExams)
    assert.equal(
      hayashiQuestions.filter((q) => q.exam === e.id).reduce((n, q) => n + q.points, 0),
      e.points,
    );
});

test('mobile offers four distinct choices and exactly one accepted option; prompts contain only blank source slots', () => {
  for (const q of hayashiQuestions) {
    assert.equal(q.originalAvailable, false);
    if (
      q.sourceKey.startsWith('particle-') ||
      q.sourceKey.startsWith('question-') ||
      q.sourceKey.startsWith('word-')
    ) {
      assert.doesNotMatch(q.prompt, /（[^\s）]+）/);
      assert.equal((q.prompt.match(/【　】/g) || []).length, 1);
    }
    if (!q.choices) continue;
    assert.equal(new Set(q.choices).size, 4, q.id);
    assert.equal(q.choices.filter((a) => correct(q, a)).length, 1, q.id);
    assert.ok(!q.choices.includes('×'));
  }
});

test('serious version accepts source variants, rejects romaji, and preserves Kyoto-specific criteria', () => {
  const get = (key) => questions.find((q) => q.id === `hayashi-exam-${key}`);
  assert.ok(correct(get('number-7'), 'ごぜんよじはちふん'));
  assert.ok(correct(get('number-8'), 'ごごしちじさんじゅっぷん'));
  assert.ok(correct(get('particle-11-2'), 'へ'));
  assert.ok(!correct(get('number-1'), 'sanzen nihyaku yonjuu san'));
  assert.ok(!correct(get('number-1'), '三千二百四十三'));
  const q = get('kyoto');
  assert.equal(q.points, 3);
  assert.equal(q.guideId, 'adjectives');
  assert.match(q.checklist.join(' '), /tre fullständiga.*dåtid.*hiragana/s);
});

test('feedback policy blocks early review and reveal flags; immediate feedback locks only answered questions', () => {
  const s = createSession(['q'], 'Test', { mode: 'exam' });
  s.revealed.q = true;
  s.grades.q = true;
  s.review = true;
  assert.equal(canCheck(s), false);
  assert.equal(feedbackVisible(s, 'q'), false);
  s.submittedAt = 100;
  assert.equal(feedbackVisible(s, 'q'), true);
  assert.equal(answerLocked(s, 'q'), true);
  const mobile = createSession(['q', 'other'], 'Mobile', {
    mode: 'exam',
    feedbackTiming: 'immediate',
  });
  assert.equal(feedbackVisible(mobile, 'q'), false);
  mobile.grades.q = false;
  const restored = JSON.parse(JSON.stringify(mobile));
  assert.equal(feedbackVisible(restored, 'q'), true);
  assert.equal(answerLocked(restored, 'q'), true);
  assert.equal(answerLocked(restored, 'other'), false);
});

test('both variants retain independent drafts, results and weighted self assessment', () => {
  const state = fresh();
  for (const e of hayashiExams) {
    const bank = questions.filter((q) => q.exam === e.id);
    const s = createSession(
      bank.map((q) => q.id),
      e.title,
      { mode: 'exam', exam: e.id, feedbackTiming: e.feedbackTiming },
    );
    for (const q of bank) s.answers[q.id] = q.self ? 'きょうとはさむかったです。' : q.answers[0];
    state.drafts[e.id] = { at: 100, session: s };
    submitSession(state, s, questions, 100);
    assert.equal(
      scoreAttempt(s, questions).earned,
      e.id === 'hayashi-exam' ? e.points - 3 : e.points,
    );
    if (e.id === 'hayashi-exam') {
      recordReview(state, s, 'hayashi-exam-kyoto', true, 101);
      assert.equal(scoreAttempt(s, questions).earned, e.points);
    }
  }
  const merged = mergeProgress(fresh(), state);
  assert.equal(Object.keys(merged.attempts).length, 2);
  assert.equal(merged.drafts['hayashi-mobile'].session.feedbackTiming, 'immediate');
  assert.equal(merged.drafts['hayashi-exam'].session.feedbackTiming, 'submission');
});
