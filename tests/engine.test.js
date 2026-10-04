import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize,
  correct,
  selectPractice,
  mergeProgress,
  getContrastiveFeedback,
  nextStat,
  fresh,
  rebuildStats,
  migrate,
} from '../src/engine.js';
import { questions, exams, examQuestions } from '../src/data.js';
import { existsSync } from 'node:fs';
import { INTERVALS, SCHEMA_VERSION } from '../src/config.js';
test('Japanese width and punctuation do not reject valid answers; long vowels remain meaningful', () => {
  assert.equal(normalize('　ｺｰﾋｰ。 '), 'コーヒー');
  assert(correct({ answers: ['たかかったです'] }, 'たかかったです。'));
  assert(!correct({ answers: ['おおさか'] }, 'おさか'));
});
test('repetition prioritizes due over unseen and excludes future questions', () => {
  const bank = [
    { id: 'a', topic: 'p' },
    { id: 'b', topic: 'p' },
    { id: 'c', topic: 'p' },
  ];
  assert.deepEqual(
    selectPractice(
      bank,
      { a: { ok: true, dueAt: 2000 }, c: { ok: false, dueAt: 500 } },
      'p',
      10,
      1000,
    ),
    ['c', 'b'],
  );
});
test('all question ids unique and every auto question has an answer', () => {
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  for (const q of questions) {
    assert(q.self || q.answers?.length, q.id);
    if (q.choices && !q.self)
      assert(
        q.answers.every((a) => q.choices.includes(a)),
        q.id,
      );
  }
});
test('all exams total 100 points and every original page exists', () => {
  for (const e of exams) {
    assert.equal(
      examQuestions.filter((q) => q.exam === e.id).reduce((n, q) => n + q.points, 0),
      100,
      e.id,
    );
  }
  for (const q of examQuestions)
    assert(
      existsSync(
        `public/material/${q.exam}-${q.exam === 'reading' ? String(q.page).padStart(2, '0') : q.page}.jpg`,
      ),
      q.id,
    );
});
test('cloud merge keeps latest answers, results and exam drafts', () => {
  const a = {
    stats: { x: { at: 20, ok: false } },
    history: [{ id: 's', at: 20, ok: 2 }],
    drafts: { e: { at: 20, session: null } },
    examDate: '2026-10-16',
    settingsAt: 20,
  };
  const b = {
    stats: { x: { at: 10, ok: true }, y: { at: 30, ok: true } },
    history: [{ id: 's', at: 10, ok: 1 }],
    drafts: { e: { at: 10, session: { index: 2 } } },
    examDate: '2026-01-01',
    settingsAt: 10,
  };
  const m = mergeProgress(a, b);
  assert.equal(m.stats.x.ok, false);
  assert.equal(m.stats.y.ok, true);
  assert.equal(m.history[0].ok, 2);
  assert.equal(m.drafts.e.session, null);
  assert.equal(m.examDate, '2026-10-16');
});

test('contrastive feedback returns null for correct answers (including alternatives and whitespace)', () => {
  // Single correct answer
  const qSingle = { id: 'test-1', topic: 'Partiklar', answers: ['で'], choices: ['に', 'で'] };
  assert.equal(getContrastiveFeedback(qSingle, 'で'), null);
  assert.equal(getContrastiveFeedback(qSingle, ' で '), null);
  assert.equal(getContrastiveFeedback(qSingle, 'で。'), null);

  // Alternative correct answers (e.g. に or へ for l5-10)
  const qMulti = {
    id: 'l5-10',
    topic: 'Partiklar',
    answers: ['に', 'へ'],
    choices: ['に', 'で', 'へ'],
  };
  assert.equal(getContrastiveFeedback(qMulti, 'に'), null);
  assert.equal(getContrastiveFeedback(qMulti, 'へ'), null);
  assert.equal(getContrastiveFeedback(qMulti, ' に '), null);
  assert.equal(getContrastiveFeedback(qMulti, ' へ '), null);

  // Alternative inflection answers (e.g. b-6 with 3 valid forms)
  const qBoj = questions.find((q) => q.id === 'b-6');
  if (qBoj) {
    for (const ans of qBoj.answers) {
      assert.equal(getContrastiveFeedback(qBoj, ans), null, `Answer "${ans}" must return null`);
    }
  }

  // Question bank l5-10 verification directly from questions
  const qL5_10 = questions.find((q) => q.id === 'l5-10');
  if (qL5_10) {
    assert.equal(getContrastiveFeedback(qL5_10, 'に'), null);
    assert.equal(getContrastiveFeedback(qL5_10, 'へ'), null);
  }

  // Edge cases: null, undefined, empty string, whitespace
  assert.equal(getContrastiveFeedback(null, 'で'), null);
  assert.equal(getContrastiveFeedback(qSingle, null), null);
  assert.equal(getContrastiveFeedback(qSingle, ''), null);
  assert.equal(getContrastiveFeedback(qSingle, '   '), null);
});

test('contrastive feedback provides pedagogical explanations and guideId for all known particle distractors', () => {
  // に vs で / へ
  const fbDeForNi = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'で');
  assert(fbDeForNi && fbDeForNi.guideId === 'ni-de' && fbDeForNi.text.includes('Du valde で'));

  const fbDeForNiHe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に', 'へ'] }, 'で');
  assert(
    fbDeForNiHe && fbDeForNiHe.guideId === 'ni-de' && fbDeForNiHe.text.includes('Du valde で'),
  );

  const fbNiForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'に');
  assert(fbNiForDe && fbNiForDe.guideId === 'ni-de' && fbNiForDe.text.includes('Du valde に'));

  const fbHeForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'へ');
  assert(fbHeForDe && fbHeForDe.guideId === 'ni-de' && fbHeForDe.text.includes('Du valde へ'));

  // は vs が
  const fbWaForGa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['が'] }, 'は');
  assert(fbWaForGa && fbWaForGa.guideId === 'wa-ga' && fbWaForGa.text.includes('Du valde は'));

  const fbGaForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'が');
  assert(fbGaForWa && fbGaForWa.guideId === 'wa-ga' && fbGaForWa.text.includes('Du valde が'));

  // を vs が
  const fbWoForGa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['が'] }, 'を');
  assert(fbWoForGa && fbWoForGa.guideId === 'wa-ga' && fbWoForGa.text.includes('Du valde を'));

  const fbGaForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'が');
  assert(fbGaForWo && fbGaForWo.guideId === 'wa-ga' && fbGaForWo.text.includes('Du valde が'));

  // を vs に
  const fbWoForNi = getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'を');
  assert(
    fbWoForNi && fbWoForNi.guideId === 'wo-to-no-mo' && fbWoForNi.text.includes('Du valde を'),
  );

  const fbNiForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'に');
  assert(
    fbNiForWo && fbNiForWo.guideId === 'wo-to-no-mo' && fbNiForWo.text.includes('Du valde に'),
  );

  // で vs を
  const fbDeForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, 'で');
  assert(
    fbDeForWo && fbDeForWo.guideId === 'wo-to-no-mo' && fbDeForWo.text.includes('Du valde で'),
  );

  const fbWoForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, 'を');
  assert(fbWoForDe && fbWoForDe.guideId === 'ni-de' && fbWoForDe.text.includes('Du valde を'));

  // と vs の
  const fbToForNo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['の'] }, 'と');
  assert(
    fbToForNo && fbToForNo.guideId === 'wo-to-no-mo' && fbToForNo.text.includes('Du valde と'),
  );

  const fbNoForTo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['と'] }, 'の');
  assert(
    fbNoForTo && fbNoForTo.guideId === 'wo-to-no-mo' && fbNoForTo.text.includes('Du valde の'),
  );

  // は vs の
  const fbWaForNo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['の'] }, 'は');
  assert(
    fbWaForNo && fbWaForNo.guideId === 'wo-to-no-mo' && fbWaForNo.text.includes('Du valde は'),
  );

  const fbNoForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'の');
  assert(fbNoForWa && fbNoForWa.guideId === 'wa-ga' && fbNoForWa.text.includes('Du valde の'));

  // は vs も
  const fbWaForMo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['も'] }, 'は');
  assert(
    fbWaForMo && fbWaForMo.guideId === 'wo-to-no-mo' && fbWaForMo.text.includes('Du valde は'),
  );

  const fbMoForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, 'も');
  assert(
    fbMoForWa && fbMoForWa.guideId === 'wo-to-no-mo' && fbMoForWa.text.includes('Du valde も'),
  );

  // に vs と
  const fbNiForTo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['と'] }, 'に');
  assert(
    fbNiForTo && fbNiForTo.guideId === 'wo-to-no-mo' && fbNiForTo.text.includes('Du valde に'),
  );

  // × (ingen partikel) rules
  for (const p of ['に', 'で', 'は', 'が', 'を', 'へ']) {
    const fb = getContrastiveFeedback({ topic: 'Partiklar', answers: ['×'] }, p);
    assert(fb && fb.guideId === 'no-particle' && fb.text.includes(`Du valde ${p}`));
  }

  const fbNoneForDe = getContrastiveFeedback({ topic: 'Partiklar', answers: ['で'] }, '×');
  assert(fbNoneForDe && fbNoneForDe.guideId === 'ni-de' && fbNoneForDe.text.includes('Du valde ×'));

  const fbNoneForWa = getContrastiveFeedback({ topic: 'Partiklar', answers: ['は'] }, '×');
  assert(fbNoneForWa && fbNoneForWa.guideId === 'wa-ga' && fbNoneForWa.text.includes('Du valde ×'));

  const fbNoneForWo = getContrastiveFeedback({ topic: 'Partiklar', answers: ['を'] }, '×');
  assert(
    fbNoneForWo && fbNoneForWo.guideId === 'wo-to-no-mo' && fbNoneForWo.text.includes('Du valde ×'),
  );
});

test('contrastive feedback handles custom contrastive overrides, non-particle topics, and returns null for unknown distractors', () => {
  // Custom contrastive map takes precedence
  const customQ = {
    topic: 'Partiklar',
    answers: ['に'],
    guideRef: 'custom-guide',
    contrastive: {
      で: 'Skräddarsydd förklaring för で.',
      を: { text: 'Objektpassus', guideId: 'custom-wo' },
    },
  };
  const fbCustom1 = getContrastiveFeedback(customQ, 'で');
  assert.equal(fbCustom1?.text, 'Skräddarsydd förklaring för で.');
  assert.equal(fbCustom1?.guideId, 'custom-guide');

  const fbCustom2 = getContrastiveFeedback(customQ, 'を');
  assert.equal(fbCustom2?.text, 'Objektpassus');
  assert.equal(fbCustom2?.guideId, 'custom-wo');

  // Non-particle topics: Böjningar and Moror & stavelser
  const qBoj = { topic: 'Böjningar', answers: ['たかかった'] };
  assert.equal(getContrastiveFeedback(qBoj, 'たかいでした')?.guideId, 'adjectives');
  assert.equal(getContrastiveFeedback(qBoj, 'たかかった'), null);

  const qMora = { topic: 'Moror & stavelser', answers: ['2, 4'] };
  assert.equal(getContrastiveFeedback(qMora, '3, 4')?.guideId, 'moras');
  assert.equal(getContrastiveFeedback(qMora, '2, 4'), null);

  // Unmatched distractors and unrelated topics return null
  assert.equal(getContrastiveFeedback({ topic: 'Partiklar', answers: ['に'] }, 'unknown'), null);
  assert.equal(getContrastiveFeedback({ topic: 'Ord & kanji', answers: ['やま'] }, 'かわ'), null);
  assert.equal(getContrastiveFeedback({ topic: 'Läsförståelse', answers: ['A'] }, 'B'), null);
});

test('Leitner engine verifies full 4-rating progression matrix across boxes 0 to 4', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Initial state (previous = null)
  const initAgain = nextStat(null, 'again', t0);
  assert.equal(initAgain.box, 0);
  assert.equal(initAgain.dueAt, t0 + INTERVALS[0]);
  assert.equal(initAgain.ok, false);
  assert.equal(initAgain.rating, 'again');

  const initHard = nextStat(null, 'hard', t0);
  assert.equal(initHard.box, 0);
  assert.equal(initHard.dueAt, t0 + INTERVALS[0]);
  assert.equal(initHard.ok, true);
  assert.equal(initHard.rating, 'hard');

  const initGood = nextStat(null, 'good', t0);
  assert.equal(initGood.box, 1);
  assert.equal(initGood.dueAt, t0 + INTERVALS[1]);
  assert.equal(initGood.ok, true);
  assert.equal(initGood.rating, 'good');

  const initEasy = nextStat(null, 'easy', t0);
  assert.equal(initEasy.box, 2);
  assert.equal(initEasy.dueAt, t0 + INTERVALS[2]);
  assert.equal(initEasy.ok, true);
  assert.equal(initEasy.rating, 'easy');

  // Matrix test for all boxes 0..4
  for (let box = 0; box <= 4; box++) {
    const prev = { box, dueAt: t0, attempts: box + 1, lastPromotionDay: '2026-10-03' };

    // 1. 'again': always resets to box 0, interval 10m
    const resAgain = nextStat(prev, 'again', t0);
    assert.equal(resAgain.box, 0, `Box ${box} + again must reset to 0`);
    assert.equal(resAgain.dueAt, t0 + INTERVALS[0]);
    assert.equal(resAgain.ok, false);
    assert.equal(resAgain.rating, 'again');
    assert.equal(resAgain.attempts, prev.attempts + 1);

    // 2. 'hard': retains current box, interval <= 1 day
    const resHard = nextStat(prev, 'hard', t0);
    assert.equal(resHard.box, box, `Box ${box} + hard must retain box ${box}`);
    assert.equal(resHard.dueAt, t0 + Math.min(INTERVALS[box], 86400000));
    assert.equal(resHard.ok, true);
    assert.equal(resHard.rating, 'hard');

    // 3. 'good': increments box by 1 (capped at 4), standard intervals
    const expectedGoodBox = Math.min(4, box + 1);
    const resGood = nextStat(prev, 'good', t0);
    assert.equal(
      resGood.box,
      expectedGoodBox,
      `Box ${box} + good must advance to ${expectedGoodBox}`,
    );
    assert.equal(resGood.dueAt, t0 + INTERVALS[expectedGoodBox]);
    assert.equal(resGood.ok, true);
    assert.equal(resGood.rating, 'good');

    // 4. 'easy': increments box by 2 (capped at 4), accelerated intervals
    const expectedEasyBox = Math.min(4, box + 2);
    const resEasy = nextStat(prev, 'easy', t0);
    assert.equal(
      resEasy.box,
      expectedEasyBox,
      `Box ${box} + easy must advance to ${expectedEasyBox}`,
    );
    assert.equal(resEasy.dueAt, t0 + INTERVALS[expectedEasyBox]);
    assert.equal(resEasy.ok, true);
    assert.equal(resEasy.rating, 'easy');
  }
});

test('Leitner engine enforces box 4 ceiling, box 0 floor, and premature review safeguards', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Box 3 with 'easy' (+2) clamps to 4
  const b3Easy = nextStat({ box: 3, dueAt: t0 }, 'easy', t0);
  assert.equal(b3Easy.box, 4);
  assert.equal(b3Easy.dueAt, t0 + INTERVALS[4]);

  // Box 4 with 'good' (+1) clamps to 4
  const b4Good = nextStat({ box: 4, dueAt: t0 }, 'good', t0);
  assert.equal(b4Good.box, 4);
  assert.equal(b4Good.dueAt, t0 + INTERVALS[4]);

  // Box 4 with 'easy' (+2) clamps to 4
  const b4Easy = nextStat({ box: 4, dueAt: t0 }, 'easy', t0);
  assert.equal(b4Easy.box, 4);
  assert.equal(b4Easy.dueAt, t0 + INTERVALS[4]);

  // Box 0 with 'again' cannot decrement below 0
  const b0Again = nextStat({ box: 0, dueAt: t0 }, 'again', t0);
  assert.equal(b0Again.box, 0);

  // Early review with 'good' before dueAt does not promote box
  const futureDue = t0 + 86400000;
  const earlyReview = nextStat({ box: 2, dueAt: futureDue }, 'good', t0);
  assert.equal(earlyReview.box, 2);
  assert.equal(earlyReview.dueAt, futureDue);
});

test('Leitner engine ensures complete backwards compatibility for boolean ok and legacy reviews', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // Direct boolean calls to nextStat
  const boolTrue = nextStat(null, true, t0);
  assert.equal(boolTrue.ok, true);
  assert.equal(boolTrue.rating, 'good');
  assert.equal(boolTrue.box, 1);

  const boolFalse = nextStat(null, false, t0);
  assert.equal(boolFalse.ok, false);
  assert.equal(boolFalse.rating, 'again');
  assert.equal(boolFalse.box, 0);

  // Object forms
  const objTrue = nextStat(null, { ok: true }, t0);
  assert.equal(objTrue.rating, 'good');
  assert.equal(objTrue.ok, true);

  const objFalse = nextStat(null, { ok: false }, t0);
  assert.equal(objFalse.rating, 'again');
  assert.equal(objFalse.ok, false);

  const objRating = nextStat(null, { rating: 'hard' }, t0);
  assert.equal(objRating.rating, 'hard');
  assert.equal(objRating.ok, true);

  // rebuildStats with reviews lacking 'rating' attribute
  const legacyState = fresh();
  legacyState.reviews = {
    'rev-1:q1': { id: 'rev-1:q1', questionId: 'q1', ok: true, at: t0 },
    'rev-1:q2': { id: 'rev-1:q2', questionId: 'q2', ok: false, at: t0 + 100 },
  };
  const rebuilt = rebuildStats(legacyState);
  assert.equal(rebuilt.stats.q1.rating, 'good');
  assert.equal(rebuilt.stats.q1.box, 1);
  assert.equal(rebuilt.stats.q2.rating, 'again');
  assert.equal(rebuilt.stats.q2.box, 0);
});

test('Schema compatibility guarantees version 2 and prevents reset migrations', () => {
  assert.equal(SCHEMA_VERSION, 2, 'SCHEMA_VERSION must remain 2');

  const now = Date.parse('2026-10-04T12:00:00Z');
  const existingV2 = {
    version: 2,
    reviews: {
      'att-1:q-test': {
        id: 'att-1:q-test',
        questionId: 'q-test',
        attemptId: 'att-1',
        ok: true,
        rating: 'easy',
        at: now,
        updatedAt: now,
      },
    },
    drafts: { practice: { at: now, session: { index: 1 } } },
    stats: {},
  };

  const migrated = migrate(existingV2);
  assert.equal(migrated.version, 2);
  assert(migrated.reviews['att-1:q-test'], 'Existing reviews must NOT be erased');
  assert.equal(migrated.reviews['att-1:q-test'].rating, 'easy');
  assert.equal(migrated.stats['q-test'].box, 2);
  assert.equal(migrated.drafts.practice.session.index, 1);
  assert.equal(migrated.preferredCount, 10, 'Fresh defaults merged without overwriting');
  assert.equal(migrated.theme, 'classic', 'Fresh theme default merged without overwriting');
});
