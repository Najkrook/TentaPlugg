import test from 'node:test';
import assert from 'node:assert/strict';
import { japaneseText, promptSpeech, answerSpeech } from '../src/speech.js';
import { questions } from '../src/data.js';
const q = (id) => questions.find((x) => x.id === id);
test('speech extracts only Japanese and drops Swedish/parenthesised notes', () => {
  assert.equal(japaneseText('Romanisera: ともだちは'), 'ともだちは');
  assert.equal(
    japaneseText('きのうせんせい【　】ききました。（frågade）'),
    'きのうせんせい、ききました。',
  );
  assert.equal(japaneseText('Byt mellan kana och romaji: 京都（きょうと）'), '京都');
  assert.equal(japaneseText('Tシャツ【　】いちまいください。'), 'Tシャツ、いちまいください。');
  assert.equal(japaneseText('Ingen japanska här'), '');
});
test('answer speech fills the blank with the correct particle, × means nothing', () => {
  assert.equal(answerSpeech(q('l5-2')), 'しゅうまつひとりでうみでおよぎました。');
  assert.equal(answerSpeech(q('l5-1')), 'しゅうまつひとりでうみでおよぎました。');
  assert.equal(answerSpeech(q('b-0')), 'たかかったです');
  assert.equal(answerSpeech(q('gema70-1.4-1')), 'ともだちは');
  assert.equal(
    promptSpeech(q('gema70-3-1')),
    'わたしのすきなアニメはハイキューとワンパンマンです。',
  );
});
test('every question with Japanese gets something sensible to read', () => {
  for (const x of questions) {
    const s = answerSpeech(x);
    assert.ok(!/[A-Za-zåäö]{3,}/.test(s), `${x.id}: ${s}`);
  }
});
