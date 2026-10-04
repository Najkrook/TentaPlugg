import assert from 'node:assert/strict';
import { homeView } from '../../../src/views/home.js';
import { sessionView } from '../../../src/views/session.js';
import { questions } from '../../../src/data.js';

function renderToString(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(renderToString).join('');
  if (val['_$litDirective$'] !== undefined && val.values) {
    return renderToString(val.values);
  }
  if (val['_$litType$'] !== undefined || val.strings) {
    let out = '';
    const strings = val.strings || [];
    const values = val.values || [];
    for (let i = 0; i < strings.length; i++) {
      out += strings[i];
      if (i < values.length) {
        out += renderToString(values[i]);
      }
    }
    return out;
  }
  return '';
}

// Base mock state
const mockState = {
  examDate: '2026-10-24',
  preferredCount: 10,
  stats: {},
  plans: {}
};

// 1. Home View Theme Check
console.log('Testing 1: Home View theme checks...');
const ctxSakura = {
  state: mockState,
  theme: 'sakura',
  now: Date.now(),
  plan: { tasks: [], completed: {} },
  progress: () => ({ done: 5, due: 3, wrong: 1 }),
  setPreferredCount: () => {},
  start: () => {}
};

const homeSakura = renderToString(homeView(ctxSakura));
assert(homeSakura.includes('/anime/study.jpg'), 'Sakura home must include study.jpg');
assert(homeSakura.includes('anime-study-panel'), 'Sakura home must include anime-study-panel');
assert(!homeSakura.includes('particle-art'), 'Sakura home must NOT include particle-art');

const ctxClassic = { ...ctxSakura, theme: 'classic' };
const homeClassic = renderToString(homeView(ctxClassic));
assert(!homeClassic.includes('study.jpg'), 'Classic home must NOT include study.jpg');
assert(!homeClassic.includes('anime-study-panel'), 'Classic home must NOT include anime-study-panel');
assert(homeClassic.includes('particle-art'), 'Classic home must include particle-art');
console.log('-> Home view checks PASSED!');

// 2. Session Feedback Mascot Check
console.log('Testing 2: Session feedback mascot checks...');
const q1 = questions.find(q => q.topic === 'Partiklar' && !q.self);
const mockSessionGood = {
  attemptId: 'test-attempt-good',
  mode: 'practice',
  title: 'Test Session',
  ids: [q1.id],
  index: 0,
  answers: { [q1.id]: q1.answers[0] },
  grades: { [q1.id]: true }, // Correct
  done: false
};

const sessionCtxSakuraGood = {
  ...ctxSakura,
  session: mockSessionGood,
  state: { ...mockState, baselineStats: {} }
};
const sessionSakuraGood = renderToString(sessionView(sessionCtxSakuraGood));
assert(sessionSakuraGood.includes('/anime/cheer.jpg'), 'Sakura correct answer must include cheer.jpg');
assert(sessionSakuraGood.includes('anime-feedback-mascot good'), 'Sakura feedback mascot good present');

const mockSessionWrong = {
  attemptId: 'test-attempt-wrong',
  mode: 'practice',
  title: 'Test Session',
  ids: [q1.id],
  index: 0,
  answers: { [q1.id]: 'wrong-ans' },
  grades: { [q1.id]: false }, // Incorrect
  done: false
};
const sessionCtxSakuraWrong = {
  ...ctxSakura,
  session: mockSessionWrong,
  state: { ...mockState, baselineStats: {} }
};
const sessionSakuraWrong = renderToString(sessionView(sessionCtxSakuraWrong));
assert(sessionSakuraWrong.includes('/anime/encourage.jpg'), 'Sakura wrong answer must include encourage.jpg');
assert(sessionSakuraWrong.includes('anime-feedback-mascot again'), 'Sakura feedback again mascot class present');

// Classic session feedback check
const sessionCtxClassic = {
  ...ctxClassic,
  session: mockSessionGood,
  state: { ...mockState, baselineStats: {} }
};
const sessionClassic = renderToString(sessionView(sessionCtxClassic));
assert(!sessionClassic.includes('cheer.jpg'), 'Classic session must NOT include cheer.jpg');
assert(!sessionClassic.includes('encourage.jpg'), 'Classic session must NOT include encourage.jpg');
assert(!sessionClassic.includes('anime-figure'), 'Classic session must NOT include anime-figure');
console.log('-> Session feedback checks PASSED!');

// 3. Session Result Mascot Check
console.log('Testing 3: Session results mascot checks...');
const mockSessionDone = {
  ...mockSessionGood,
  done: true
};
const resultCtxSakura = {
  ...ctxSakura,
  session: mockSessionDone,
  state: { ...mockState, baselineStats: {} }
};
const resultSakura = renderToString(sessionView(resultCtxSakura));
assert(resultSakura.includes('/anime/cheer.jpg'), 'Sakura results must include cheer.jpg');
assert(resultSakura.includes('anime-result-mascot'), 'Sakura results must include anime-result-mascot');

const resultCtxClassic = {
  ...ctxClassic,
  session: mockSessionDone,
  state: { ...mockState, baselineStats: {} }
};
const resultClassic = renderToString(sessionView(resultCtxClassic));
assert(!resultClassic.includes('cheer.jpg'), 'Classic results must NOT include cheer.jpg');
assert(!resultClassic.includes('anime-result-mascot'), 'Classic results must NOT include anime-result-mascot');
assert(resultClassic.includes('result-icon'), 'Classic results must include result-icon');
console.log('-> Session results mascot checks PASSED!');

// 4. Self-rated question session feedback check
console.log('Testing 4: Self-rated question mascot checks...');
const qSelf = questions.find(q => q.self);
const mockSessionSelfRevealed = {
  attemptId: 'test-attempt-self',
  mode: 'practice',
  title: 'Test Session Self',
  ids: [qSelf.id],
  index: 0,
  answers: { [qSelf.id]: 'mitt svar' },
  revealed: { [qSelf.id]: true },
  grades: {}, // not yet graded
  done: false
};
const selfCtxSakuraRevealed = {
  ...ctxSakura,
  session: mockSessionSelfRevealed,
  state: { ...mockState, baselineStats: {} }
};
const renderedSelfRevealed = renderToString(sessionView(selfCtxSakuraRevealed));
// In session.js line 116: (!q.self || typeof s.grades[q.id] === 'boolean')
// Before grading a self question, no mascot is shown (neutral model answer view)
assert(!renderedSelfRevealed.includes('anime-feedback-mascot'), 'Un-graded self question must not show good/again mascot prematurely');

// Now after self rating (e.g., 'good' -> grades[q.id] = true)
const mockSessionSelfGraded = {
  ...mockSessionSelfRevealed,
  grades: { [qSelf.id]: true }
};
const selfCtxSakuraGraded = {
  ...ctxSakura,
  session: mockSessionSelfGraded,
  state: { ...mockState, baselineStats: {} }
};
const renderedSelfGraded = renderToString(sessionView(selfCtxSakuraGraded));
assert(renderedSelfGraded.includes('/anime/cheer.jpg'), 'Graded self question shows cheer mascot');
console.log('-> Self-rated question mascot checks PASSED!');

console.log('\n=== ALL ADVERSARIAL CHECKS PASSED WITH ZERO ERRORS ===');
