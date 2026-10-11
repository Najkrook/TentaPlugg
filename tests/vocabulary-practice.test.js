import test from 'node:test';
import assert from 'node:assert/strict';
import { vocabularyList } from '../src/vocabulary-data.js';
import {
  vocabularyQuestions,
  vocabularyById,
  vocabularyChoices,
  selectVocabulary,
  vocabularyProgress,
  practiceWords,
  ambiguousWords,
} from '../src/vocabulary-practice.js';
import { allQuestions } from '../src/question-bank.js';
import { fresh, recordReview, mergeProgress, migrate } from '../src/engine.js';
import { createSession, submitSession } from '../src/session.js';
import { readLocal, storageKey } from '../src/storage.js';

const now = Date.parse('2026-10-11T12:00:00Z');
test('all 170 words have both directions, four unique unambiguous options and kana-only Japanese', () => {
  assert.equal(vocabularyQuestions.length, 340);
  assert.equal(new Set(vocabularyQuestions.map((q) => q.id)).size, 340);
  for (const word of vocabularyList) {
    for (const direction of ['sv', 'kana']) {
      const q = vocabularyById.get(`glosa-${word.id}-${direction}`);
      assert.ok(q);
      assert.doesNotMatch(q.kana, /[\p{Script=Han}a-zA-Z]/u);
      assert.doesNotMatch(q.prompt + q.explanation, /\p{Script=Han}/u);
      for (let seed = 1; seed <= 5; seed++) {
        const choices = vocabularyChoices(q, () => seed / 6);
        assert.equal(new Set(choices).size, 4);
        assert.equal(choices.filter((c) => q.answers.includes(c)).length, 1);
        for (const label of choices.filter((c) => c !== q.answers[0])) {
          const matches = practiceWords.filter(
            (w) => (direction === 'sv' ? w.sv : w.kana) === label,
          );
          assert.ok(
            matches.every(
              (candidate) =>
                !ambiguousWords(
                  practiceWords.find((w) => w.id === word.id),
                  candidate,
                ),
            ),
          );
        }
      }
    }
  }
});
test('selection covers every direction, spreads lessons and reserves space for unseen questions', () => {
  const stats = {};
  const first = selectVocabulary(stats, now);
  assert.equal(first.length, 10);
  assert.equal(new Set(first.map((id) => vocabularyById.get(id).wordId)).size, 10);
  assert.equal(new Set(first.map((id) => vocabularyById.get(id).lesson)).size, 3);
  first.forEach((id, index) =>
    assert.equal(vocabularyById.get(id).direction, index % 2 ? 'kana' : 'sv'),
  );
  for (let i = 0; i < 34; i++) {
    const ids = selectVocabulary(stats, now);
    assert.equal(ids.length, 10);
    ids.forEach((id) => {
      stats[id] = { dueAt: now + 1000, ok: true };
    });
  }
  assert.equal(Object.keys(stats).length, 340);
  assert.deepEqual(selectVocabulary(stats, now), []);
  assert.equal(selectVocabulary(stats, now, { extra: true }).length, 10);
  assert.deepEqual(vocabularyProgress(stats, now), {
    total: 170,
    started: 170,
    bothCorrect: 170,
    due: 0,
  });
  const mixed = Object.fromEntries(
    vocabularyQuestions.slice(0, 20).map((q, i) => [q.id, { dueAt: now - 100 + i }]),
  );
  const ids = selectVocabulary(mixed, now);
  assert.equal(ids.filter((id) => mixed[id]).length, 5);
  assert.deepEqual(
    new Set(ids.filter((id) => mixed[id])),
    new Set(vocabularyQuestions.slice(0, 5).map((q) => q.id)),
  );
  assert.ok(
    selectVocabulary({}, now, { lesson: '4' }).every((id) => vocabularyById.get(id).lesson === 4),
  );
  assert.equal(
    selectVocabulary(
      Object.fromEntries(vocabularyQuestions.map((q) => [q.id, { dueAt: now }])),
      now,
    ).length,
    10,
  );
});
test('sessions survive storage and merge, retain options and keep mistake practice separate', () => {
  const state = fresh();
  const ids = selectVocabulary({}, now);
  const session = createSession(ids, 'Glosor', {
    vocabulary: true,
    vocabularyLesson: 'all',
    vocabularyChoices: Object.fromEntries(
      ids.map((id) => [id, vocabularyChoices(vocabularyById.get(id))]),
    ),
  });
  session.answers[ids[0]] = 'fel';
  recordReview(state, session, ids[0], false, now);
  recordReview(state, session, ids[0], false, now);
  assert.equal(state.stats[ids[0]].attempts, 1);
  assert.equal(state.stats[ids[0]].dueAt, now + 600000);
  recordReview(state, session, ids[1], true, now);
  assert.equal(state.stats[ids[1]].dueAt, now + 86400000);
  state.drafts.practice = { at: now, session };
  const storage = new Map([[storageKey(null), JSON.stringify(state)]]);
  const restored = readLocal({ getItem: (key) => storage.get(key) }, null);
  assert.deepEqual(restored.drafts.practice.session, session);
  const merged = mergeProgress(fresh(), restored);
  assert.deepEqual(merged.drafts.practice.session.vocabularyChoices, session.vocabularyChoices);
  assert.equal(merged.stats[ids[0]].ok, false);
  submitSession(state, session, allQuestions, now);
  const retry = createSession([ids[0]], 'Missarna', { vocabulary: true });
  recordReview(state, retry, ids[0], true, now + 1000);
  submitSession(state, retry, allQuestions, now + 1000);
  const final = mergeProgress(migrate(JSON.parse(JSON.stringify(state))), restored);
  assert.equal(final.attempts[session.attemptId].grades[ids[0]], false);
  assert.equal(final.attempts[retry.attemptId].grades[ids[0]], true);
  assert.equal(final.history.length, 2);
});
