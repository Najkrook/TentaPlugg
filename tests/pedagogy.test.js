import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, guides } from '../src/data.js';
import { correct, getContrastiveFeedback, getLearningTip } from '../src/engine.js';

const question = (id) => questions.find((q) => q.id === id);

test('all automatic questions explain mismatches, offer a next step and link only to existing guides', () => {
  for (const q of questions.filter((q) => !q.self)) {
    for (const wrong of q.choices?.filter((c) => !correct(q, c)) || ['fel']) {
      const feedback = getContrastiveFeedback(q, wrong);
      assert.ok(feedback?.text?.length > 25, `${q.id}: ${wrong}`);
      assert.ok(!feedback.text.includes('undefined'), q.id);
      if (feedback.guideId)
        assert.ok(
          guides.some((g) => g.id === feedback.guideId),
          q.id,
        );
    }
    assert.ok(getLearningTip(q), q.id);
    for (const answer of q.answers) assert.equal(getContrastiveFeedback(q, answer), null, q.id);
  }
});

test('every sound breakdown agrees with the stored answer and preserves all characters', () => {
  for (const q of questions.filter((q) => q.topic === 'Moror & stavelser')) {
    const { word, moras, syllables } = q.soundBreakdown;
    assert.equal(moras.join(''), word, q.id);
    assert.equal(syllables.join(''), word, q.id);
    assert.ok(correct(q, `${syllables.length}, ${moras.length}`), q.id);
  }
  const q = question('japc11-5.1-2');
  assert.match(getContrastiveFeedback(q, '2, 3').text, /stavelser stämmer/);
  assert.match(getContrastiveFeedback(q, '3, 4').text, /moror stämmer/);
  assert.match(getContrastiveFeedback(q, '4, 2').text, /omvänd ordning/);
  assert.match(q.explanation, /が・っ・こ・う/);
});

test('verb and negation feedback does not teach an unrelated adjective past form', () => {
  const verb = getContrastiveFeedback(question('b-10'), 'いきました');
  assert.match(verb.text, /ませんでした/);
  assert.equal(verb.guideId, 'verbs');
  assert.doesNotMatch(verb.text, /かった/);
  const negative = getContrastiveFeedback(question('b-1'), 'たかかったです');
  assert.match(negative.text, /くないです/);
  assert.equal(getContrastiveFeedback(question('b-13'), '本').guideId, null);
});

test('valid polite negatives are accepted without accepting the wrong tense', () => {
  for (const [id, answer] of [
    ['b-1', 'たかくありません'],
    ['b-2', 'たかくありませんでした'],
    ['b-4', 'よくありません'],
    ['b-6', 'しずかではないです'],
  ]) {
    assert.ok(correct(question(id), answer), id);
  }
  assert.equal(correct(question('b-1'), 'たかくありませんでした'), false);
});

test('function and class feedback explain the selected misconception in the actual sentence', () => {
  const train = getContrastiveFeedback(question('gema70-3-7'), 'Location of action');
  assert.match(train.text, /Handlingsplats/);
  assert.match(train.text, /しんかんせん/);
  assert.match(train.text, /transportmedel/);
  assert.equal(train.guideId, null, 'Do not invent an unrelated guide');
  const cat = getContrastiveFeedback(question('gema70-2-11'), 'noun.');
  assert.match(cat.text, /Substantiv/);
  assert.match(cat.text, /jamande/);
  assert.match(question('l5-1').explanation, /ひとりで/);
});

test('self-assessment has criteria, including the requested language and length', () => {
  for (const q of questions.filter((q) => q.self)) assert.ok(q.checklist.length >= 3, q.id);
  assert.match(question('japc11-1.1').checklist.join(' '), /4–5 meningar på engelska/);
  assert.match(question('reading-III.2').checklist.join(' '), /minst tre adjektiv/);
  assert.match(question('reading-II.2-4').explanation, /framför, inte inne på/);
});
