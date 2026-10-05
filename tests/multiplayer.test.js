import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEloChange,
  applyElo,
  generateLobbyCode,
  generateQuestionsForCategory,
  evaluateRound,
  advanceToNextRound,
  finalizeMatch,
  isAnswerCorrect,
  buildFourChoices,
  DEFAULT_ELO,
  ROUND_TIME_MS,
} from '../src/multiplayer.js';

test('ELO rating calculations match FIDE formulas', () => {
  // Equal rating players (1200 vs 1200)
  const winDelta = calculateEloChange(1200, 1200, 1);
  const lossDelta = calculateEloChange(1200, 1200, 0);
  const drawDelta = calculateEloChange(1200, 1200, 0.5);

  assert.equal(winDelta, 16);
  assert.equal(lossDelta, -16);
  assert.equal(drawDelta, 0);

  // Lower rated player beating higher rated player (1000 vs 1400)
  const underdogWin = calculateEloChange(1000, 1400, 1);
  assert(underdogWin > 25, `Underdog win should give substantial points: got ${underdogWin}`);

  // Higher rated player beating lower rated player (1400 vs 1000)
  const favoriteWin = calculateEloChange(1400, 1000, 1);
  assert(favoriteWin < 10, `Favorite win should give few points: got ${favoriteWin}`);

  // Floor at 100
  assert.equal(applyElo(105, -50), 100);
  assert.equal(applyElo(1200, 20), 1220);
});

test('Lobby code generator produces 4 alphanumeric uppercase characters', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateLobbyCode();
    assert.equal(code.length, 4);
    assert(/^[2-9A-Z]{4}$/.test(code), `Code ${code} must match regex`);
  }
});

test('Question generator produces 10 balanced questions with 4 unique choices for all 3 categories', () => {
  for (const cat of ['particles', 'vocab', 'word_order']) {
    const questions = generateQuestionsForCategory(cat, 10);
    assert.equal(questions.length, 10, `Category ${cat} should have 10 questions`);

    for (const q of questions) {
      assert(q.prompt, `Question prompt must exist in ${cat}`);
      assert.equal(
        q.choices.length,
        4,
        `Question in ${cat} must have 4 choices: got ${q.choices.length}`,
      );
      const uniqueChoices = new Set(q.choices);
      assert.equal(uniqueChoices.size, 4, `All 4 choices must be distinct in ${cat}: ${q.choices}`);
      assert(
        q.choices.includes(q.correctAnswer),
        `Choices in ${cat} must include correctAnswer (${q.correctAnswer})`,
      );
    }
  }
});

test('P2 Fix: Valid alternative Japanese answers are accepted and never used as distractors', () => {
  // Scenario: こうえん【　】いきませんか。 has valid answers ['に', 'へ']
  const particleOptions = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで', '×'];
  const validAnswers = ['に', 'へ'];
  const primary = 'に';

  const choices = buildFourChoices(primary, validAnswers, particleOptions);
  assert.equal(choices.length, 4, 'Must have exactly 4 choices');
  assert(choices.includes('に'), 'Choices must include primary answer');
  assert(
    !choices.includes('へ'),
    'Choices must NEVER include the valid alternative answer へ as a distractor',
  );

  const question = {
    prompt: 'こうえん【　】いきませんか。',
    correctAnswer: 'に',
    validAnswers: ['に', 'へ'],
    choices,
  };

  // Both に and へ must be recognized as correct!
  assert.equal(isAnswerCorrect(question, 'に'), true, 'に must be accepted');
  assert.equal(isAnswerCorrect(question, 'へ'), true, 'へ must be accepted');
  assert.equal(isAnswerCorrect(question, 'で'), false, 'で is wrong');

  // Verify in round evaluation that answering へ yields +1 point and NOT -1 penalty
  const testGame = {
    questions: [question],
    currentRoundIndex: 0,
    roundStartTime: 1000,
    hostUid: 'alice',
    guestUid: 'bob',
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  const roundAfterHe = evaluateRound(testGame, 'alice', 'へ', 2000);
  assert.equal(roundAfterHe.scores.alice, 1, 'Alice must receive +1 point for valid answer へ');
  assert.equal(roundAfterHe.roundWinners[0], 'alice', 'Alice is marked as round winner');
});

test('P1 Fix: Late answers cannot modify closed rounds or expired rounds', () => {
  const game = {
    questions: [
      {
        id: 'q1',
        prompt: 'Fråga 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        validAnswers: ['B'],
      },
      {
        id: 'q2',
        prompt: 'Fråga 2',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'C',
        validAnswers: ['C'],
      },
    ],
    currentRoundIndex: 0,
    roundStartTime: 1000, // Round starts at t=1000
    hostUid: 'alice',
    guestUid: 'bob',
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  // 1. Premature answer during countdown (before roundStartTime) is rejected
  const premature = evaluateRound(game, 'alice', 'B', 500);
  assert.equal(premature.scores.alice, 0, 'No points awarded before roundStartTime');
  assert(!premature.answers?.[0]?.alice, 'Answer not recorded before roundStartTime');

  // 2. Bob answers correctly at t=2000 and wins round 0
  const afterBobWin = evaluateRound(game, 'bob', 'B', 2000);
  assert.equal(afterBobWin.scores.bob, 1);
  assert.equal(afterBobWin.roundWinners[0], 'bob');
  assert.equal(afterBobWin.status, 'round_end');

  // 3. Alice submits late (wrong answer 'A') AFTER Bob already won the round
  const aliceLateWrong = evaluateRound(afterBobWin, 'alice', 'A', 2500);
  assert.equal(
    aliceLateWrong.scores.alice,
    0,
    'Alice must NOT receive -1 penalty after round is already won',
  );

  // 4. Alice submits late (correct answer 'B') AFTER Bob already won the round
  const aliceLateCorrect = evaluateRound(afterBobWin, 'alice', 'B', 2500);
  assert.equal(
    aliceLateCorrect.scores.alice,
    0,
    'Alice must NOT receive +1 point after round is already won',
  );

  // 5. Test round timeout (> ROUND_TIME_MS)
  const freshGame = {
    questions: [
      {
        id: 'q1',
        prompt: 'Fråga 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        validAnswers: ['B'],
      },
    ],
    currentRoundIndex: 0,
    roundStartTime: 1000,
    hostUid: 'alice',
    guestUid: 'bob',
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  // Submitting at t=10000 (elapsed = 9000ms > 8000ms timeout)
  const timedOutSubmit = evaluateRound(freshGame, 'alice', 'B', 10000);
  assert.equal(timedOutSubmit.scores.alice, 0, 'Submission after 8s timeout must NOT award points');
  assert(!timedOutSubmit.answers?.[0]?.alice, 'Timed out submission must not be recorded');
});

test('Vocab category draws from parsed Genki vocabulary dataset', () => {
  const vocabQuestions = generateQuestionsForCategory('vocab', 10);
  assert.equal(vocabQuestions.length, 10);
  const hasSwedishPrompt = vocabQuestions.some(
    (q) => q.prompt.includes('Vad heter') || q.prompt.includes('Vad betyder'),
  );
  assert(
    hasSwedishPrompt,
    'Vocab questions must include Swedish definitions from vocabulary-data.js',
  );
});

test('Round evaluation: fastest correct answer receives +1 point, wrong answer receives -1 point', () => {
  const mockGame = {
    questions: [
      {
        id: 'q1',
        prompt: 'Fråga 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        validAnswers: ['B'],
      },
      {
        id: 'q2',
        prompt: 'Fråga 2',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'C',
        validAnswers: ['C'],
      },
    ],
    currentRoundIndex: 0,
    roundStartTime: 1000,
    hostUid: 'alice',
    guestUid: 'bob',
    hostElo: 1200,
    guestElo: 1200,
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  // Alice answers wrong first ('A')
  const afterAliceWrong = evaluateRound(mockGame, 'alice', 'A', 2000);
  assert.equal(
    afterAliceWrong.scores.alice,
    -1,
    'Alice receives -1 point penalty for wrong answer',
  );
  assert.equal(afterAliceWrong.roundWinners[0], undefined, 'No round winner yet');
  assert.equal(afterAliceWrong.status, 'playing', 'Round still active since no one answered right');

  // Bob answers right ('B')
  const afterBobCorrect = evaluateRound(afterAliceWrong, 'bob', 'B', 3000);
  assert.equal(afterBobCorrect.scores.bob, 1, 'Bob receives +1 point for correct answer');
  assert.equal(afterBobCorrect.roundWinners[0], 'bob', 'Bob is marked as round winner');
  assert.equal(afterBobCorrect.status, 'round_end', 'Round ends when someone gets it right');

  // Alice cannot answer again in this round
  const aliceRetry = evaluateRound(afterBobCorrect, 'alice', 'B', 3500);
  assert.equal(aliceRetry.scores.alice, -1, 'Alice score should not change on duplicate submit');

  // Advance to next round
  const round2 = advanceToNextRound(afterBobCorrect, 4000);
  assert.equal(round2.currentRoundIndex, 1);
  assert.equal(round2.status, 'playing');
  assert.equal(round2.roundWinner, null);

  // Round 2 is last round: Bob gets it right again ('C')
  const finalGame = evaluateRound(round2, 'bob', 'C', 5000);
  assert.equal(finalGame.status, 'finished', 'Match finishes on final question');
  assert.equal(finalGame.winnerUid, 'bob', 'Bob wins the match');
  assert.equal(finalGame.scores.bob, 2);
  assert.equal(finalGame.scores.alice, -1);
  assert(finalGame.eloChanges.bob > 0, 'Bob gains ELO');
  assert(finalGame.eloChanges.alice < 0, 'Alice loses ELO');
});

test('Match finalization properly handles draws with equal scores', () => {
  const tiedGame = {
    questions: [
      {
        id: 'q1',
        prompt: 'Fråga 1',
        choices: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        validAnswers: ['A'],
      },
    ],
    currentRoundIndex: 0,
    roundStartTime: 1000,
    hostUid: 'alice',
    guestUid: 'bob',
    hostElo: 1200,
    guestElo: 1200,
    scores: { alice: 1, bob: 1 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  const finished = finalizeMatch(tiedGame, Date.now());
  assert.equal(finished.status, 'finished');
  assert.equal(finished.winnerUid, null);
  assert.equal(finished.isDraw, true);
  assert.equal(finished.eloChanges.alice, 0);
  assert.equal(finished.eloChanges.bob, 0);
});
