import test from 'node:test';
import assert from 'node:assert/strict';
import { l1l5Questions } from '../src/l1l5-data.js';
import { questions } from '../src/data.js';
import { selectPractice, correct, getContrastiveFeedback } from '../src/engine.js';
import { answerSpeech } from '../src/speech.js';

test('L1-L5 dataset integrity and question inventory', () => {
  assert.equal(l1l5Questions.length, 101, 'Expected 101 total L1-L5 questions');

  const particles = l1l5Questions.filter((q) => q.topic === 'Partiklar');
  const multipleChoice = l1l5Questions.filter((q) => q.id.startsWith('l1l5-mc-'));
  const grammar = l1l5Questions.filter((q) => q.id.startsWith('l1l5-g-'));
  const translations = l1l5Questions.filter((q) => q.id.startsWith('l1l5-t-'));

  assert.equal(particles.length, 59, '59 particle blank questions');
  assert.equal(multipleChoice.length, 11, '11 multiple choice questions');
  assert.equal(grammar.length, 16, '16 grammar concept & pattern questions');
  assert.equal(translations.length, 15, '15 translation scrambled questions');

  for (const q of l1l5Questions) {
    assert.equal(q.set, 'l1l5', `${q.id} must belong to set l1l5`);
    assert.ok(q.explanation.length > 25, `${q.id} explanation must be descriptive`);
    assert.ok(!q.explanation.includes('undefined'), `${q.id} explanation must not have undefined`);
  }
});

test('L1-L5 questions are registered in the global question bank', () => {
  for (const q of l1l5Questions) {
    const found = questions.find((item) => item.id === q.id);
    assert.ok(found, `Question ${q.id} must exist in questions bank`);
    assert.equal(found.set, 'l1l5');
  }
});

test('L1-L5 translation questions have valid tiles matching accepted answers', () => {
  const translations = l1l5Questions.filter((q) => q.tiles);
  assert.equal(translations.length, 15);

  for (const q of translations) {
    const normTiles = q.tiles.join('').replace(/[\s。、.,!?！？]/g, '');
    const normAns = q.answers[0].replace(/[\s。、.,!?！？]/g, '');
    const sortedTiles = [...normTiles].sort().join('');
    const sortedAns = [...normAns].sort().join('');
    assert.equal(
      sortedTiles,
      sortedAns,
      `Tiles for ${q.id} should have the exact same characters as the expected answer`,
    );
  }
});

test('selectPractice filters L1-L5 topic correctly', () => {
  const stats = {};
  const selected = selectPractice(questions, stats, 'L1-L5', 20, Date.now());
  assert.equal(selected.length, 20);
  for (const id of selected) {
    const q = questions.find((item) => item.id === id);
    assert.equal(q.set, 'l1l5', `${id} should belong to l1l5`);
  }
});

test('speech synthesis correctly handles all L1-L5 questions without garbage text', () => {
  for (const q of l1l5Questions) {
    const s = answerSpeech(q);
    assert.ok(
      !/[A-Za-zåäö]{3,}/.test(s),
      `Speech output for ${q.id} contained invalid latin words: ${s}`,
    );
  }
});
