import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../src/data.js';
import { createSession, submitSession } from '../src/session.js';
import { fresh, scoreAttempt, recordReview, mergeProgress } from '../src/engine.js';
import {
  questionForSession,
  initialParticleState,
  particleCharacters,
  markingResult,
  reduceParticle,
  particleSentence,
} from '../src/particles.js';

const session = () => createSession(['l5-review-3'], 'Partiklar');
const question = (n, s = session()) =>
  questionForSession(
    questions.find((q) => q.id === `l5-review-${n}`),
    s,
  );
function editState(
  q,
  selected = particleCharacters(q.exercise)
    .filter((c) => c.particle)
    .map((c) => c.id),
) {
  let state = { ...initialParticleState(q), selected };
  state = reduceParticle(q, state, { type: 'check-mark' });
  return reduceParticle(q, state, { type: 'continue' });
}
function run(q, state, actions) {
  return actions.reduce((s, a) => reduceParticle(q, s, a), state);
}

test('annotations distinguish repeated kana, word content, and incorrectly placed particles', () => {
  const q = question(3);
  const chars = particleCharacters(q.exercise);
  assert.equal(chars.map((c) => c.text).join(''), 'おてらでしゃしんたくさんをとりました。');
  assert.deepEqual(
    chars.filter((c) => c.particle).map((c) => c.text),
    ['で', 'を'],
  );
  assert.equal(markingResult(q, initialParticleState(q)).missed.length, 2);
  const selected = [chars[0].id, chars.find((c) => c.text === 'で').id];
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(markingResult(q, { selected })).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.length : v,
      ]),
    ),
    { right: 1, wrong: 1, missed: 1, ok: false },
  );
  const repeated = particleCharacters(question(2).exercise).filter((c) => c.text === 'の');
  assert.equal(new Set(repeated.map((c) => c.id)).size, repeated.length);
  assert.ok(repeated.length > 1);
  const synthetic = {
    exercise: {
      tokens: [
        { id: 'word', text: 'です', particle: false },
        { id: 'p', text: 'で', particle: true },
      ],
    },
  };
  assert.deepEqual(
    particleCharacters(synthetic.exercise).map((c) => c.particle),
    [false, false, true],
  );
});

test('all six exercises have valid boundaries and a reachable canonical answer', () => {
  for (let n = 1; n <= 6; n++) {
    const q = question(n);
    assert.equal(q.type, 'particle-edit');
    const state = editState(q);
    assert.equal(state.marking.ok, true);
    const words = q.exercise.tokens.filter((t) => !t.particle).map((t) => t.text);
    let remaining = q.answers[0];
    for (const word of words) {
      const at = remaining.indexOf(word);
      assert.ok(at >= 0, `word order preserved for ${q.id}: ${word}`);
      remaining = remaining.slice(at + word.length);
    }
  }
});

test('marking locks after checking and completion locks all editing', () => {
  const q = question(3);
  const initial = initialParticleState(q);
  const marked = reduceParticle(q, initial, { type: 'check-mark' });
  assert.equal(marked.stage, 'marked');
  assert.strictEqual(reduceParticle(q, marked, { type: 'toggle', id: 'original-1-0' }), marked);
  assert.strictEqual(reduceParticle(q, marked, { type: 'check-edit' }), marked);
  const done = reduceParticle(q, editState(q), { type: 'check-edit' });
  assert.equal(done.correctionOk, false);
  assert.strictEqual(reduceParticle(q, done, { type: 'reset' }), done);
});

test('move を before たくさん; reset only the edited sentence', () => {
  const q = question(3);
  const start = editState(q);
  const edited = run(q, start, [
    { type: 'move', id: 'original-4' },
    { type: 'position', index: 3 },
  ]);
  assert.equal(particleSentence(edited), q.answers[0]);
  const reset = reduceParticle(q, edited, { type: 'reset' });
  assert.equal(particleSentence(reset), q.exercise.sentence);
  assert.deepEqual(reset.marking, start.marking);
  assert.equal(reduceParticle(q, edited, { type: 'check-edit' }).correctionOk, true);
});

test('insert で before も, replace time particle, and remove extra も', () => {
  const cases = [
    [1, [{ type: 'add' }, { type: 'position', index: 8 }, { type: 'choice', text: 'で' }]],
    [
      4,
      [
        { type: 'replace', id: 'original-2' },
        { type: 'choice', text: 'に' },
      ],
    ],
    [6, [{ type: 'remove', id: 'original-11' }]],
  ];
  for (const [n, actions] of cases) {
    const q = question(n);
    const edited = run(q, editState(q), actions);
    assert.equal(particleSentence(edited), q.answers[0]);
    assert.equal(reduceParticle(q, edited, { type: 'check-edit' }).correctionOk, true);
  }
  for (const n of [2, 5]) {
    const q = question(n);
    assert.equal(reduceParticle(q, editState(q), { type: 'check-edit' }).correctionOk, true);
  }
});

test('state survives serialization and merge, one review per attempt, separate step outcomes', () => {
  const q = question(5);
  const s = createSession([q.id], 'Partiklar');
  s.particles[q.id] = reduceParticle(q, editState(q, []), { type: 'check-edit' });
  const step = s.particles[q.id];
  assert.equal(step.marking.ok, false);
  assert.equal(step.correctionOk, true);
  s.answers[q.id] = particleSentence(step);
  const state = fresh();
  recordReview(state, s, q.id, step.marking.ok && step.correctionOk, Date.now());
  recordReview(state, s, q.id, 'good', Date.now());
  assert.equal(Object.keys(state.reviews).length, 1);
  submitSession(state, s, questions, Date.now());
  assert.equal(scoreAttempt(s, questions).pending, 0);
  assert.equal(scoreAttempt(s, questions).ok, 1);
  state.drafts.practice = { at: Date.now(), session: s };
  const merged = mergeProgress(fresh(), JSON.parse(JSON.stringify(state)));
  assert.deepEqual(merged.drafts.practice.session.particles, s.particles);
});

test('unversioned sessions and exam sessions keep original questions and self-assessment', () => {
  const legacy = session();
  delete legacy.exerciseVersion;
  const q = question(4, legacy);
  assert.equal(q.self, true);
  assert.ok(q.prompt.includes('７じはんぐらい'));
  legacy.ids = [q.id];
  legacy.answers[q.id] = 'Mitt gamla svar';
  assert.equal(scoreAttempt(legacy, questions).pending, 1);
  assert.equal(scoreAttempt(createSession([q.id], 'Nytt'), questions).pending, 0);
  assert.equal(question(4, createSession([q.id], 'Tenta', { mode: 'exam' })).self, true);
});

test('moving forward preserves token identity and fixed words cannot be edited', () => {
  const q = question(3);
  const initial = editState(q);
  const moved = run(q, initial, [
    { type: 'move', id: 'original-1' },
    { type: 'position', index: 5 },
  ]);
  assert.deepEqual(
    moved.tokens.map((t) => t.id),
    [
      'original-0',
      'original-2',
      'original-3',
      'original-4',
      'original-1',
      'original-5',
      'original-6',
    ],
  );
  for (const type of ['select', 'move', 'remove', 'replace']) {
    assert.strictEqual(reduceParticle(q, initial, { type, id: 'original-0' }), initial);
  }
  const adding = reduceParticle(q, initial, { type: 'add' });
  assert.strictEqual(reduceParticle(q, adding, { type: 'position', index: -1 }), adding);
  assert.strictEqual(reduceParticle(q, adding, { type: 'choice', text: 'で' }), adding);
  const choice = reduceParticle(q, adding, { type: 'position', index: 2 });
  assert.strictEqual(reduceParticle(q, choice, { type: 'choice', text: 'ねこ' }), choice);
  assert.equal(particleSentence(initial), q.exercise.sentence);
});
