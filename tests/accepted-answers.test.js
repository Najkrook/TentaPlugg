import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../src/data.js';
import { correct, getContrastiveFeedback } from '../src/engine.js';

test('flat-object counter accepts kanji and its kana reading', () => {
  const question = questions.find((q) => q.id === 'b-13');
  for (const answer of ['枚', 'まい', ' まい。 ']) {
    assert.equal(correct(question, answer), true, answer);
    assert.equal(getContrastiveFeedback(question, answer), null, answer);
  }
  for (const answer of ['', 'ま', 'ほん', '本']) {
    assert.equal(correct(question, answer), false, answer);
  }
});

test('café order accepts both valid choices without accepting an offer', () => {
  const question = questions.find((q) => q.id === 'l1l5-g-11');
  for (const answer of ['をおねがいします', 'をください']) {
    assert.ok(question.choices.includes(answer));
    assert.equal(correct(question, answer), true, answer);
    assert.equal(getContrastiveFeedback(question, answer), null, answer);
  }
  for (const answer of ['', 'をどうぞ']) {
    assert.equal(correct(question, answer), false, answer);
  }
});
