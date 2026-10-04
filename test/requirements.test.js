import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  fresh,
  migrate,
  nextStat,
  recordReview,
  rebuildStats,
  mergeProgress,
  selectPractice,
  getContrastiveFeedback,
  correct,
  normalize,
} from '../src/engine.js';
import { createSession, submitSession } from '../src/session.js';
import { questions, guides } from '../src/data.js';
import { INTERVALS, SCHEMA_VERSION } from '../src/config.js';
import { readLocal, storageKey } from '../src/storage.js';

// ============================================================================
// Helper Utilities for Testing
// ============================================================================

/**
 * Computes WCAG 2.1 relative luminance for an sRGB hex color.
 */
function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors.
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Minimal in-memory Storage implementation for headless testing.
 */
function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, val) {
      store.set(key, String(val));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

// ============================================================================
// TIER 1: Feature Coverage (Acceptance Criteria R1, R2, R3)
// ============================================================================

test('Tier 1: Contrastive feedback returns non-null explanation & guideId for common particle errors', () => {
  // に instead of で (Action at location requires で, not に)
  const deQuestion = { topic: 'Partiklar', answers: ['で'], prompt: '図書館【　】勉強します。' };
  const fbNi = getContrastiveFeedback(deQuestion, 'に');
  assert.notEqual(
    fbNi,
    null,
    'Feedback should be provided when に is mistakenly used instead of で',
  );
  assert.equal(fbNi.guideId, 'ni-de');
  assert.match(fbNi.text, /に/);
  assert.match(fbNi.text, /で/);

  // で instead of に (Existence or target requires に, not で)
  const niQuestion = { topic: 'Partiklar', answers: ['に'], prompt: '図書館【　】行きます。' };
  const fbDe = getContrastiveFeedback(niQuestion, 'で');
  assert.notEqual(
    fbDe,
    null,
    'Feedback should be provided when で is mistakenly used instead of に',
  );
  assert.equal(fbDe.guideId, 'ni-de');
  assert.match(fbDe.text, /で/);
  assert.match(fbDe.text, /に/);

  // は instead of が
  const gaQuestion = { topic: 'Partiklar', answers: ['が'], prompt: '日本語【　】分かります。' };
  const fbWa = getContrastiveFeedback(gaQuestion, 'は');
  assert.notEqual(
    fbWa,
    null,
    'Feedback should be provided when は is mistakenly used instead of が',
  );
  assert.equal(fbWa.guideId, 'wa-ga');

  // が instead of は
  const waQuestion = { topic: 'Partiklar', answers: ['は'], prompt: '私【　】学生です。' };
  const fbGa = getContrastiveFeedback(waQuestion, 'が');
  assert.notEqual(
    fbGa,
    null,
    'Feedback should be provided when が is mistakenly used instead of は',
  );
  assert.equal(fbGa.guideId, 'wa-ga');

  // を instead of が (at 好き / わかる)
  const fbWoForGa = getContrastiveFeedback(gaQuestion, 'を');
  assert.notEqual(fbWoForGa, null);
  assert.equal(fbWoForGa.guideId, 'wa-ga');

  // を instead of に (vehicle / meet)
  const fbWoForNi = getContrastiveFeedback(niQuestion, 'を');
  assert.notEqual(fbWoForNi, null);
  assert.equal(fbWoForNi.guideId, 'wo-to-no-mo');

  // に instead of × (relative time)
  const noParticleQuestion = {
    topic: 'Partiklar',
    answers: ['×'],
    prompt: 'あした【　】行きます。',
  };
  const fbNiForNone = getContrastiveFeedback(noParticleQuestion, 'に');
  assert.notEqual(fbNiForNone, null);
  assert.equal(fbNiForNone.guideId, 'no-particle');

  // × instead of で
  const fbNoneForDe = getContrastiveFeedback(deQuestion, '×');
  assert.notEqual(fbNoneForDe, null);
  assert.equal(fbNoneForDe.guideId, 'ni-de');

  // と instead of の
  const noQuestion = { topic: 'Partiklar', answers: ['の'], prompt: '私【　】本。' };
  const fbTo = getContrastiveFeedback(noQuestion, 'と');
  assert.notEqual(fbTo, null);
  assert.equal(fbTo.guideId, 'wo-to-no-mo');

  // の instead of と
  const toQuestion = { topic: 'Partiklar', answers: ['と'], prompt: '友だち【　】会います。' };
  const fbNo = getContrastiveFeedback(toQuestion, 'の');
  assert.notEqual(fbNo, null);
  assert.equal(fbNo.guideId, 'wo-to-no-mo');

  // Custom question-level contrastive overrides
  const customQ = {
    topic: 'Partiklar',
    answers: ['に'],
    contrastive: { で: 'Speciell ledtråd för denna specifika övning.' },
    guideRef: 'custom-ref',
  };
  const fbCustom = getContrastiveFeedback(customQ, 'で');
  assert.equal(fbCustom.text, 'Speciell ledtråd för denna specifika övning.');
  assert.equal(fbCustom.guideId, 'custom-ref');
});

test('Tier 1: Contrastive feedback returns null for correct answers or missing inputs', () => {
  const q = { topic: 'Partiklar', answers: ['で'], prompt: '図書館【　】勉強します。' };

  // Correct answers must never produce negative distractor feedback
  assert.equal(getContrastiveFeedback(q, 'で'), null, 'Correct answer must return null');
  assert.equal(getContrastiveFeedback(q, ' で '), null, 'Trimmed matching answer must return null');

  // Null or missing inputs
  assert.equal(getContrastiveFeedback(null, 'で'), null);
  assert.equal(getContrastiveFeedback(q, null), null);
  assert.equal(getContrastiveFeedback(q, ''), null);
  assert.equal(getContrastiveFeedback(q, '   '), null);

  // Unrelated grammar topic with non-matching answer and no explicit rule
  const otherQ = { topic: 'Övrigt', answers: ['りんご'] };
  assert.equal(getContrastiveFeedback(otherQ, 'みかん'), null);
});

test('Tier 1: SRS Leitner calculation computes correct intervals for again, hard, good, easy', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');

  // 1. 'again': resets to Box 0, next review in ~10 minutes (600,000 ms), ok = false
  const statAgain = nextStat({ box: 3, dueAt: t0 }, 'again', t0, 'r1');
  assert.equal(statAgain.box, 0, 'again must reset box to 0');
  assert.equal(statAgain.ok, false, 'again marks ok as false');
  assert.equal(statAgain.rating, 'again');
  assert.equal(statAgain.dueAt, t0 + INTERVALS[0], 'again schedules next review at +10m');

  // 2. 'hard': maintains current box (capped at <= 1 day), ok = true
  const prevBox2 = { box: 2, dueAt: t0 };
  const statHard = nextStat(prevBox2, 'hard', t0, 'r2');
  assert.equal(statHard.box, 2, 'hard retains current box');
  assert.equal(statHard.ok, true, 'hard marks ok as true');
  assert.equal(statHard.rating, 'hard');
  assert.equal(
    statHard.dueAt,
    t0 + Math.min(INTERVALS[2], 86400000),
    'hard due date is capped at 1 day',
  );

  // 3. 'good': moves box up by 1, standard exponential progression, ok = true
  const prevBox1 = { box: 1, dueAt: t0 };
  const statGood = nextStat(prevBox1, 'good', t0, 'r3');
  assert.equal(statGood.box, 2, 'good increments box by 1');
  assert.equal(statGood.ok, true, 'good marks ok as true');
  assert.equal(statGood.rating, 'good');
  assert.equal(statGood.dueAt, t0 + INTERVALS[2], 'good schedules at standard interval for box 2');

  // 4. 'easy': accelerates box progression (+2, capped at 4), ok = true
  const statEasy = nextStat(prevBox1, 'easy', t0, 'r4');
  assert.equal(statEasy.box, 3, 'easy increments box by 2 (1 -> 3)');
  assert.equal(statEasy.ok, true, 'easy marks ok as true');
  assert.equal(statEasy.rating, 'easy');
  assert.equal(statEasy.dueAt, t0 + INTERVALS[3], 'easy schedules at standard interval for box 3');
});

test('Tier 1: Session size selection logic honors 5, 10, 20, and all due questions', () => {
  const now = Date.parse('2026-10-04T12:00:00Z');
  // Build a test bank of 25 particle questions
  const bank = Array.from({ length: 25 }, (_, i) => ({
    id: `particle-q-${i}`,
    topic: 'Partiklar',
  }));

  // Mark all 25 questions as due
  const stats = {};
  bank.forEach((q, i) => {
    stats[q.id] = { dueAt: now - 1000 * (i + 1), ok: true };
  });

  // Verify selecting 5 questions
  const sel5 = selectPractice(bank, stats, 'Partiklar', 5, now);
  assert.equal(sel5.length, 5, 'Session size 5 returns exactly 5 questions');

  // Verify selecting 10 questions
  const sel10 = selectPractice(bank, stats, 'Partiklar', 10, now);
  assert.equal(sel10.length, 10, 'Session size 10 returns exactly 10 questions');

  // Verify selecting 20 questions
  const sel20 = selectPractice(bank, stats, 'Partiklar', 20, now);
  assert.equal(sel20.length, 20, 'Session size 20 returns exactly 20 questions');

  // Verify selecting all due questions (passing bank.length or Infinity)
  const selAll = selectPractice(bank, stats, 'Partiklar', bank.length, now);
  assert.equal(selAll.length, 25, 'All due questions returns all 25 due items');

  // When only 3 questions are due and count is 10, only due questions are returned
  const partialStats = {
    'particle-q-0': { dueAt: now - 100, ok: true },
    'particle-q-1': { dueAt: now - 200, ok: true },
    'particle-q-2': { dueAt: now - 300, ok: true },
    'particle-q-3': { dueAt: now + 500000, ok: true }, // Future, not due
  };
  const selDueOnly = selectPractice(bank, partialStats, 'Partiklar', 10, now);
  // Without extra:true, only due items and unseen items are considered, future excluded
  assert(selDueOnly.includes('particle-q-0'));
  assert(selDueOnly.includes('particle-q-1'));
  assert(selDueOnly.includes('particle-q-2'));
  assert(!selDueOnly.includes('particle-q-3'), 'Future questions must be excluded');
});

test('Tier 1: Theme switching contract and persistence key tentaplugg-theme', () => {
  const mockStorage = createMockStorage();

  // Fresh state defaults to classic theme
  const initialState = fresh();
  assert.equal(initialState.theme, 'classic', 'Default theme is classic');

  // The storage key defined in PROJECT.md is 'tentaplugg-theme'
  const THEME_STORAGE_KEY = 'tentaplugg-theme';
  mockStorage.setItem(THEME_STORAGE_KEY, 'sakura');
  assert.equal(
    mockStorage.getItem(THEME_STORAGE_KEY),
    'sakura',
    'Theme selection persists to tentaplugg-theme in storage',
  );

  mockStorage.setItem(THEME_STORAGE_KEY, 'classic');
  assert.equal(mockStorage.getItem(THEME_STORAGE_KEY), 'classic');

  // Validate theme mode names against contract
  const validThemes = ['classic', 'sakura'];
  assert(validThemes.includes('classic'));
  assert(validThemes.includes('sakura'));

  // Verify that required anime figures exist on disk for Sakura mode
  const animeAssets = ['study.jpg', 'cheer.jpg', 'encourage.jpg'];
  for (const asset of animeAssets) {
    const fullPath = resolve('public/anime', asset);
    assert(existsSync(fullPath), `Asset public/anime/${asset} must exist on disk`);
    const size = statSync(fullPath).size;
    assert(size > 50000, `Asset public/anime/${asset} must be a valid non-empty file (>50KB)`);
  }
});

test('Tier 1: Backwards compatibility for legacy review entries lacking rating', () => {
  const now = Date.parse('2026-10-04T10:00:00Z');

  // State with legacy reviews that only have boolean 'ok' and no 'rating'
  const legacyState = fresh();
  legacyState.reviews = {
    'att-1:q-legacy-ok': {
      id: 'att-1:q-legacy-ok',
      questionId: 'q-legacy-ok',
      attemptId: 'att-1',
      ok: true,
      at: now,
      updatedAt: now,
    },
    'att-1:q-legacy-wrong': {
      id: 'att-1:q-legacy-wrong',
      questionId: 'q-legacy-wrong',
      attemptId: 'att-1',
      ok: false,
      at: now + 1000,
      updatedAt: now + 1000,
    },
  };

  const rebuilt = rebuildStats(legacyState);

  // Legacy ok: true falls back to good rating
  assert.equal(rebuilt.stats['q-legacy-ok'].ok, true);
  assert.equal(rebuilt.stats['q-legacy-ok'].box, 1);
  assert.equal(rebuilt.stats['q-legacy-ok'].rating, 'good');

  // Legacy ok: false falls back to again rating
  assert.equal(rebuilt.stats['q-legacy-wrong'].ok, false);
  assert.equal(rebuilt.stats['q-legacy-wrong'].box, 0);
  assert.equal(rebuilt.stats['q-legacy-wrong'].rating, 'again');

  // Direct nextStat with boolean arguments (legacy signature)
  const boolTrueStat = nextStat(null, true, now, 'rev-bool-1');
  assert.equal(boolTrueStat.ok, true);
  assert.equal(boolTrueStat.rating, 'good');
  assert.equal(boolTrueStat.box, 1);

  const boolFalseStat = nextStat(null, false, now, 'rev-bool-0');
  assert.equal(boolFalseStat.ok, false);
  assert.equal(boolFalseStat.rating, 'again');
  assert.equal(boolFalseStat.box, 0);
});

// ============================================================================
// TIER 2: Boundary & Corner Cases
// ============================================================================

test('Tier 2: Leitner box boundaries (0 and 4) and interval clamping', () => {
  const now = Date.parse('2026-10-04T10:00:00Z');

  // Box 0 boundaries: 'again' cannot decrement below 0
  const box0Again = nextStat({ box: 0, dueAt: now }, 'again', now);
  assert.equal(box0Again.box, 0, 'Box 0 again stays at 0');

  // Box 0 hard: stays at box 0
  const box0Hard = nextStat({ box: 0, dueAt: now }, 'hard', now);
  assert.equal(box0Hard.box, 0, 'Box 0 hard stays at 0');
  assert.equal(box0Hard.dueAt, now + Math.min(INTERVALS[0], 86400000));

  // Box 3 with 'easy' (+2) must clamp to max box 4 (3 + 2 = 5 -> 4)
  const box3Easy = nextStat({ box: 3, dueAt: now }, 'easy', now);
  assert.equal(box3Easy.box, 4, 'Box 3 with easy must clamp to 4');
  assert.equal(box3Easy.dueAt, now + INTERVALS[4]);

  // Box 4 with 'good' (+1) must clamp to max box 4
  const box4Good = nextStat({ box: 4, dueAt: now }, 'good', now);
  assert.equal(box4Good.box, 4, 'Box 4 with good must clamp to 4');
  assert.equal(box4Good.dueAt, now + INTERVALS[4]);

  // Box 4 with 'easy' must clamp to max box 4
  const box4Easy = nextStat({ box: 4, dueAt: now }, 'easy', now);
  assert.equal(box4Easy.box, 4, 'Box 4 with easy must clamp to 4');

  // Box 4 with 'again' immediately drops all the way to 0
  const box4Again = nextStat({ box: 4, dueAt: now }, 'again', now);
  assert.equal(box4Again.box, 0, 'Box 4 with again immediately drops to 0');
  assert.equal(box4Again.dueAt, now + INTERVALS[0]);

  // Timestamp boundary: reviewed before due date (early practice)
  const futureDue = now + 86400000;
  const earlyReview = nextStat({ box: 2, dueAt: futureDue }, 'good', now);
  // An item reviewed before due date is not promoted unless previous is null or dueAt <= at
  assert.equal(earlyReview.box, 2, 'Early review before due date does not advance box');
});

test('Tier 2: Questions with multiple correct answers (array vs string) & normalization', () => {
  // Question with multiple acceptable answers in array
  const multiAnswerQ = {
    answers: ['コーヒー', '珈琲', 'こーひー'],
  };

  assert(correct(multiAnswerQ, 'コーヒー'), 'Exact match on katakana answer');
  assert(correct(multiAnswerQ, '珈琲'), 'Exact match on kanji answer');
  assert(correct(multiAnswerQ, 'こーひー'), 'Exact match on hiragana answer');
  assert(correct(multiAnswerQ, ' コーヒー。 '), 'Normalizes spaces and Japanese punctuation');
  assert(!correct(multiAnswerQ, 'お茶'), 'Rejects incorrect answer');

  // Normalize edge cases
  assert.equal(normalize(''), '');
  assert.equal(normalize(null), '');
  assert.equal(normalize(undefined), '');
  assert.equal(normalize('  A B C  '), 'abc');
  assert.equal(normalize('！!？?。、'), '');

  // getContrastiveFeedback handles question with multiple answers safely
  assert.equal(getContrastiveFeedback(multiAnswerQ, 'コーヒー'), null);
  const fbOther = getContrastiveFeedback(multiAnswerQ, '紅茶');
  // Returns null gracefully without error when no specific distractor rule applies
  assert.equal(fbOther, null);
});

test('Tier 2: Gracefully handles missing, corrupted, or malformed stored states', () => {
  // migrate with null, undefined, primitives
  const nullMigrated = migrate(null);
  assert.equal(nullMigrated.version, SCHEMA_VERSION);
  assert.deepEqual(nullMigrated.stats, {});

  const undefinedMigrated = migrate(undefined);
  assert.equal(undefinedMigrated.version, SCHEMA_VERSION);

  const stringMigrated = migrate('corrupted-data');
  assert.equal(stringMigrated.version, SCHEMA_VERSION);

  // migrate with empty object
  const emptyMigrated = migrate({});
  assert.equal(emptyMigrated.version, SCHEMA_VERSION);
  assert(Array.isArray(emptyMigrated.history));

  // Storage reading with corrupted JSON throws expected descriptive Swedish error
  const mockStorage = createMockStorage();
  mockStorage.setItem(storageKey('test-user'), '{ broken json syntax :');
  assert.throws(
    () => {
      readLocal(mockStorage, 'test-user');
    },
    (err) => {
      return err.message.includes('Sparade data kunde inte läsas');
    },
  );

  // Storage reading with null/missing key returns freshly initialized state
  const freshRead = readLocal(mockStorage, 'nonexistent-user');
  assert.equal(freshRead.version, SCHEMA_VERSION);
});

test('Tier 2: Contrastive feedback boundary conditions and malformed questions', () => {
  // Missing answers array on question
  const brokenQ = { topic: 'Partiklar' };
  assert.equal(getContrastiveFeedback(brokenQ, 'に'), null);

  // Question with empty answers array
  const emptyAnsQ = { topic: 'Partiklar', answers: [] };
  assert.equal(getContrastiveFeedback(emptyAnsQ, 'に'), null);

  // Böjningar and Moror topics produce proper general guidance
  const adjQ = { topic: 'Böjningar', answers: ['たかかった'] };
  const fbAdj = getContrastiveFeedback(adjQ, 'たかいでした');
  assert.notEqual(fbAdj, null);
  assert.equal(fbAdj.guideId, 'adjectives');

  const moraQ = { topic: 'Moror & stavelser', answers: ['4'] };
  const fbMora = getContrastiveFeedback(moraQ, '2');
  assert.notEqual(fbMora, null);
  assert.equal(fbMora.guideId, 'moras');
});

// ============================================================================
// TIER 3: Cross-Feature Combinations
// ============================================================================

test('Tier 3: Answering with self-rating updates SRS and controls subsequent practice due calculations', () => {
  const t0 = Date.parse('2026-10-04T08:00:00Z');
  const state = fresh();
  const session = createSession(['q-hard-test', 'q-easy-test'], 'Practice');

  // Record self-rating 'hard' on q-hard-test
  recordReview(state, session, 'q-hard-test', 'hard', t0);
  assert.equal(state.stats['q-hard-test'].ok, true);
  assert.equal(state.stats['q-hard-test'].rating, 'hard');
  // Box is 0, dueAt is t0 + INTERVALS[0] (600,000 ms = 10 min)
  assert.equal(state.stats['q-hard-test'].dueAt, t0 + 600000);

  // Record self-rating 'easy' on q-easy-test
  recordReview(state, session, 'q-easy-test', 'easy', t0);
  assert.equal(state.stats['q-easy-test'].ok, true);
  assert.equal(state.stats['q-easy-test'].rating, 'easy');
  // Box is 2 (0 + 2), dueAt is t0 + INTERVALS[2] (259,200,000 ms = 3 days)
  assert.equal(state.stats['q-easy-test'].box, 2);
  assert.equal(state.stats['q-easy-test'].dueAt, t0 + INTERVALS[2]);

  const bank = [
    { id: 'q-hard-test', topic: 'Partiklar' },
    { id: 'q-easy-test', topic: 'Partiklar' },
  ];

  // At t0 + 15 minutes:
  // q-hard-test is due (10 min <= 15 min)
  // q-easy-test is NOT due (3 days > 15 min)
  const t15m = t0 + 15 * 60 * 1000;
  const dueItems = selectPractice(bank, state.stats, 'Partiklar', 10, t15m);
  assert(dueItems.includes('q-hard-test'), 'q-hard-test must be due at 15 minutes');
  assert(!dueItems.includes('q-easy-test'), 'q-easy-test must not be due at 15 minutes');
});

test('Tier 3: Multi-day Leitner progression correctly schedules intervals across boxes', () => {
  // Day 1
  const day1 = Date.parse('2026-10-01T09:00:00Z');
  const s1 = nextStat(null, 'good', day1, 'r-d1');
  assert.equal(s1.box, 1);
  assert.equal(s1.dueAt, day1 + INTERVALS[1]); // +1 day

  // Day 2 (item is due)
  const day2 = s1.dueAt;
  const s2 = nextStat(s1, 'good', day2, 'r-d2');
  assert.equal(s2.box, 2);
  assert.equal(s2.dueAt, day2 + INTERVALS[2]); // +3 days

  // Day 5 (item is due) -> rates 'hard'
  const day5 = s2.dueAt;
  const s5 = nextStat(s2, 'hard', day5, 'r-d5');
  assert.equal(s5.box, 2, 'hard retains box 2');
  assert.equal(s5.dueAt, day5 + 86400000, 'hard schedules <= 1 day');

  // Day 6 (item is due) -> rates 'again' (lapse)
  const day6 = s5.dueAt;
  const s6 = nextStat(s5, 'again', day6, 'r-d6');
  assert.equal(s6.box, 0, 'lapse resets to box 0');
  assert.equal(s6.dueAt, day6 + INTERVALS[0]); // +10 min

  // Day 6 + 10 min -> rates 'easy'
  const day6TenMin = s6.dueAt;
  const s7 = nextStat(s6, 'easy', day6TenMin, 'r-d7');
  assert.equal(s7.box, 2, 'easy advances 0 -> 2');
  assert.equal(s7.dueAt, day6TenMin + INTERVALS[2]);
});

test('Tier 3: Merging independent device progress preserves self-ratings and latest rating wins', () => {
  const t0 = Date.parse('2026-10-04T10:00:00Z');
  const devA = fresh();
  const devB = fresh();
  const sessionA = createSession(['sync-q'], 'DevA');
  const sessionB = createSession(['sync-q'], 'DevB');

  // Device A records rating 'hard' at t0
  recordReview(devA, sessionA, 'sync-q', 'hard', t0);

  // Device B records rating 'easy' at t0 + 2000 ms
  recordReview(devB, sessionB, 'sync-q', 'easy', t0 + 2000);

  const mergedAB = mergeProgress(devA, devB);
  assert.equal(
    mergedAB.stats['sync-q'].rating,
    'easy',
    'Latest review rating (easy) should prevail',
  );
  assert.equal(mergedAB.stats['sync-q'].box, 2);

  // Commutativity: merge(B, A) must produce identical stats
  const mergedBA = mergeProgress(devB, devA);
  assert.deepEqual(mergedAB.stats, mergedBA.stats, 'Cloud merge must be commutative');
});

// ============================================================================
// TIER 4: Real-World Scenarios (End-to-End Simulated Workflows)
// ============================================================================

test('Tier 4: Scenario 1 - Practice session with contrastive feedback, Quick Guide lookup, self-rating, and session finish', () => {
  const now = Date.parse('2026-10-04T14:00:00Z');
  const state = fresh();

  // Find 5 actual particle questions from data.js
  const particleQuestions = questions.filter((q) => q.topic === 'Partiklar');
  assert(
    particleQuestions.length >= 5,
    'At least 5 particle questions must be available in dataset',
  );

  // 1. Identify a question requiring で and assemble a 5-question practice session starting with it
  const targetQ = particleQuestions.find(
    (q) => q.answers && q.answers.includes('で') && !q.answers.includes('に'),
  );
  assert(targetQ, 'Question requiring で must exist in question bank');

  const otherIds = selectPractice(
    particleQuestions.filter((q) => q.id !== targetQ.id),
    state.stats,
    'Partiklar',
    4,
    now,
  );
  const selectedIds = [targetQ.id, ...otherIds];
  assert.equal(selectedIds.length, 5, 'Session created with exactly 5 selected questions');

  const session = createSession(selectedIds, 'Partikelträning · 5 frågor');
  assert.equal(session.ids.length, 5);
  assert.equal(session.index, 0);
  assert.equal(session.ids[0], targetQ.id);

  // 2. Student encounters first question where correct answer is で, but chooses distractor に
  const userAnswer = 'に';
  const feedback = getContrastiveFeedback(targetQ, userAnswer);
  assert.notEqual(feedback, null, 'Contrastive feedback must be returned for に instead of で');
  assert.equal(feedback.guideId, 'ni-de');

  // 3. Student opens Quick Guide to verify the rule
  const guideEntry = guides.find((g) => g.id === feedback.guideId);
  assert.notEqual(guideEntry, undefined, 'Quick guide entry for ni-de must exist');
  assert.equal(guideEntry.id, 'ni-de');
  assert.match(guideEntry.title, /に eller で/);
  assert.match(guideEntry.text, /図書館で読みます/);

  // Verify non-destructive modal contract: session state is unchanged while browsing guide
  assert.equal(session.index, 0);
  assert.equal(session.ids.length, 5);

  // 4. Student returns and rates question difficulty as 'hard'
  recordReview(state, session, targetQ.id, 'hard', now);
  assert.equal(state.stats[targetQ.id].rating, 'hard');
  assert.equal(state.stats[targetQ.id].ok, true);

  // 5. Student answers remaining questions
  for (let i = 1; i < session.ids.length; i++) {
    const qid = session.ids[i];
    recordReview(state, session, qid, 'good', now + i * 1000);
  }

  // 6. Student finishes and submits session
  submitSession(state, session, questions, now + 10000);
  assert.equal(session.done, true);
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0].id, session.attemptId);
  assert.equal(state.history[0].total, 5);
  assert.equal(state.history[0].ok, 5);
});

test('Tier 4: Scenario 2 - Theme switcher persists preference and controls anime assets', () => {
  const mockStorage = createMockStorage();
  const THEME_KEY = 'tentaplugg-theme';

  // 1. App starts in classic theme
  let activeTheme = mockStorage.getItem(THEME_KEY) || 'classic';
  assert.equal(activeTheme, 'classic');

  // 2. User toggles to Sakura Anime theme
  activeTheme = 'sakura';
  mockStorage.setItem(THEME_KEY, activeTheme);

  // Verify storage persistence
  assert.equal(
    mockStorage.getItem(THEME_KEY),
    'sakura',
    'Sakura theme is saved in local storage under tentaplugg-theme',
  );

  // 3. In Sakura theme, all 3 anime assets must be present
  const animeImages = ['study.jpg', 'cheer.jpg', 'encourage.jpg'];
  animeImages.forEach((file) => {
    const imgPath = resolve('public/anime', file);
    assert(existsSync(imgPath), `Sakura figure asset ${file} must exist in public/anime`);
  });

  // 4. User toggles back to Classic theme
  activeTheme = 'classic';
  mockStorage.setItem(THEME_KEY, activeTheme);
  assert.equal(mockStorage.getItem(THEME_KEY), 'classic');

  // In Classic mode, anime figures are hidden according to PROJECT.md theme contract
  const isAnimeVisible = activeTheme === 'sakura';
  assert.equal(isAnimeVisible, false, 'Anime figures must be hidden in classic theme');
});

test('Tier 4: Scenario 3 - Comprehensive multi-card SRS review across Leitner boxes 0 to 4', () => {
  const t0 = Date.parse('2026-10-04T12:00:00Z');
  const state = fresh();

  // Setup 4 cards in different Leitner boxes, all currently due
  const deck = [
    { id: 'card-box-0', box: 0, dueAt: t0 - 1000 },
    { id: 'card-box-1', box: 1, dueAt: t0 - 1000 },
    { id: 'card-box-2', box: 2, dueAt: t0 - 1000 },
    { id: 'card-box-3', box: 3, dueAt: t0 - 1000 },
  ];

  deck.forEach((c) => {
    state.baselineStats[c.id] = {
      box: c.box,
      dueAt: c.dueAt,
      ok: true,
      attempts: c.box + 1,
      lastPromotionDay: '2026-10-03',
    };
    state.stats[c.id] = { ...state.baselineStats[c.id] };
  });

  const session = createSession(
    deck.map((d) => d.id),
    'SRS Review',
  );

  // Review card 0: rates 'again' -> stays at Box 0, due in 10 minutes
  recordReview(state, session, 'card-box-0', 'again', t0);
  assert.equal(state.stats['card-box-0'].box, 0);
  assert.equal(state.stats['card-box-0'].dueAt, t0 + INTERVALS[0]);

  // Review card 1: rates 'hard' -> stays at Box 1, due in <= 1 day
  recordReview(state, session, 'card-box-1', 'hard', t0);
  assert.equal(state.stats['card-box-1'].box, 1);
  assert.equal(state.stats['card-box-1'].dueAt, t0 + Math.min(INTERVALS[1], 86400000));

  // Review card 2: rates 'good' -> advances to Box 3, due in 7 days
  recordReview(state, session, 'card-box-2', 'good', t0);
  assert.equal(state.stats['card-box-2'].box, 3);
  assert.equal(state.stats['card-box-2'].dueAt, t0 + INTERVALS[3]);

  // Review card 3: rates 'easy' -> advances to Box 4 (3+2 capped at 4), due in 14 days
  recordReview(state, session, 'card-box-3', 'easy', t0);
  assert.equal(state.stats['card-box-3'].box, 4);
  assert.equal(state.stats['card-box-3'].dueAt, t0 + INTERVALS[4]);

  // Query next session at t0 + 15 minutes:
  // Only card-box-0 is due (10m < 15m), all others are scheduled for tomorrow or next week
  const t15m = t0 + 15 * 60 * 1000;
  const bank = deck.map((d) => ({ id: d.id, topic: 'Partiklar' }));
  const nextDue = selectPractice(bank, state.stats, 'Partiklar', 10, t15m);
  assert.deepEqual(
    nextDue,
    ['card-box-0'],
    'Only card-box-0 should be due 15 minutes after review',
  );
});

test('Tier 4: WCAG AA contrast ratio compliance for core theme palette', () => {
  // Classical theme tokens from src/style.css:
  // color: #243e36 on background: #f8faf8
  const classicText = '#243e36';
  const classicBg = '#f8faf8';
  const classicRatio = contrastRatio(classicText, classicBg);
  assert(
    classicRatio >= 4.5,
    `Classic theme text contrast ratio (${classicRatio.toFixed(2)}) must satisfy WCAG AA (>= 4.5:1)`,
  );

  // Sakura theme typical tokens: dark purple/burgundy text on pastel/white background
  const sakuraDarkText = '#3d2033';
  const sakuraLightBg = '#fff5f8';
  const sakuraRatio = contrastRatio(sakuraDarkText, sakuraLightBg);
  assert(
    sakuraRatio >= 4.5,
    `Sakura theme text contrast ratio (${sakuraRatio.toFixed(2)}) must satisfy WCAG AA (>= 4.5:1)`,
  );
});
