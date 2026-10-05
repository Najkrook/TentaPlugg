import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEloChange,
  calculateMultiplayerEloChanges,
  applyElo,
  calculateTimePoints,
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

  // Verification that calculateMultiplayerEloChanges for N = 2 matches standard FIDE 1v1 exactly
  const mpTwoPlayers = [
    { uid: 'alice', elo: 1200, score: 5000 },
    { uid: 'bob', elo: 1200, score: 3000 },
  ];
  const mpDeltas = calculateMultiplayerEloChanges(mpTwoPlayers);
  assert.equal(mpDeltas.alice, 16, 'N=2 winner delta must be +16');
  assert.equal(mpDeltas.bob, -16, 'N=2 loser delta must be -16');
});

test('Multiplayer All-play-all ELO distributes points fairly for 10 players', () => {
  // 10 players, all starting at 1200 ELO with descending scores
  const players = Array.from({ length: 10 }, (_, i) => ({
    uid: `player_${i + 1}`,
    elo: 1200,
    score: (10 - i) * 1000, // 10000, 9000, ..., 1000
  }));

  const changes = calculateMultiplayerEloChanges(players);

  // Winner (player_1) beat all 9 opponents
  assert.equal(changes['player_1'], 16, '1st place winner should gain +16 ELO');

  // Last place (player_10) lost to all 9 opponents
  assert.equal(changes['player_10'], -16, '10th place should lose -16 ELO');

  // Middle players (e.g. 5th and 6th) should be near balanced
  assert.equal(changes['player_5'], 2, '5th place should have small positive delta');
  assert.equal(changes['player_6'], -2, '6th place should have small negative delta');

  // Conservation: total delta sum across all 10 players must equal 0 (no ELO inflation)
  const sumDeltas = Object.values(changes).reduce((a, b) => a + b, 0);
  assert.equal(sumDeltas, 0, 'Sum of all ELO changes in all-play-all must be exactly 0');
});

test('Time-based scoring awards points based on speed and penalizes incorrect answers', () => {
  // 0.5s response time (500ms): round(1000 * (1 - 500/8000)) = round(1000 * 0.9375) = 938
  const fastPoints = calculateTimePoints(true, 500);
  assert.equal(fastPoints, 938, 'Fast response (0.5s) should award ~938 points');

  // 6.0s response time (6000ms): round(1000 * (1 - 6000/8000)) = round(1000 * 0.25) = 250
  const slowPoints = calculateTimePoints(true, 6000);
  assert.equal(slowPoints, 250, 'Slow response (6s) should award 250 points');

  // 8.0s timeout response (8000ms): floor factor 0.2 -> 200 points
  const floorPoints = calculateTimePoints(true, 8000);
  assert.equal(floorPoints, 200, 'Boundary response (8s) should award floor of 200 points');

  // Beyond 8s clamped to 0.2 -> 200 points
  const clampedPoints = calculateTimePoints(true, 12000);
  assert.equal(clampedPoints, 200, 'Response > 8s clamped to 200 points');

  // Wrong answer is always penalized with -250 points
  const wrongFast = calculateTimePoints(false, 300);
  const wrongSlow = calculateTimePoints(false, 7000);
  assert.equal(wrongFast, -250, 'Wrong answer should always deduct -250 points');
  assert.equal(wrongSlow, -250, 'Wrong answer should always deduct -250 points');
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

  // Verify in round evaluation that answering へ yields points (> 0) and NOT -250 penalty
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
  assert.equal(
    roundAfterHe.scores.alice,
    875,
    'Alice receives time points (875p) for valid answer へ',
  );
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
    playerUids: ['alice', 'bob'],
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  // 1. Premature answer during countdown (before roundStartTime) is rejected
  const premature = evaluateRound(game, 'alice', 'B', 500);
  assert.equal(premature.scores.alice, 0, 'No points awarded before roundStartTime');
  assert(!premature.answers?.[0]?.alice, 'Answer not recorded before roundStartTime');

  // 2. Both players answer in round 0: Bob answers correctly at t=2000, Alice at t=2500
  const afterBob = evaluateRound(game, 'bob', 'B', 2000);
  assert.equal(afterBob.scores.bob, 875);
  assert.equal(afterBob.status, 'playing', 'Round still active waiting for Alice');

  const afterBoth = evaluateRound(afterBob, 'alice', 'A', 2500);
  assert.equal(afterBoth.scores.alice, -250, 'Alice penalized -250');
  assert.equal(
    afterBoth.status,
    'round_end',
    'Round ends adaptively when all players have answered',
  );

  // 3. Late submit after round is closed (round_end) cannot modify scores
  const lateAttempt = evaluateRound(afterBoth, 'bob', 'B', 3000);
  assert.equal(lateAttempt.scores.bob, 875, 'Score not modified after round closed');

  // 4. Test round timeout (> ROUND_TIME_MS)
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

test('Round evaluation: time-based scoring and adaptive round completion when all players answered', () => {
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
    playerUids: ['alice', 'bob'],
    hostElo: 1200,
    guestElo: 1200,
    scores: { alice: 0, bob: 0 },
    answers: {},
    roundWinners: {},
    status: 'playing',
  };

  // Alice answers wrong first ('A') at t=2000 (elapsed 1000ms)
  const afterAliceWrong = evaluateRound(mockGame, 'alice', 'A', 2000);
  assert.equal(
    afterAliceWrong.scores.alice,
    -250,
    'Alice receives -250 points penalty for wrong answer',
  );
  assert.equal(
    afterAliceWrong.status,
    'playing',
    'Round still active since Bob has not answered yet',
  );

  // Bob answers right ('B') at t=3000 (elapsed 2000ms) -> round(1000 * (1 - 2000/8000)) = 750 points
  const afterBobCorrect = evaluateRound(afterAliceWrong, 'bob', 'B', 3000);
  assert.equal(afterBobCorrect.scores.bob, 750, 'Bob receives 750 time-based points');
  assert.equal(afterBobCorrect.roundWinners[0], 'bob', 'Bob is marked as round winner');
  assert.equal(
    afterBobCorrect.status,
    'round_end',
    'Round ends adaptively as soon as both players have answered',
  );

  // Alice cannot answer again in this round
  const aliceRetry = evaluateRound(afterBobCorrect, 'alice', 'B', 3500);
  assert.equal(aliceRetry.scores.alice, -250, 'Alice score should not change on duplicate submit');

  // Advance to next round
  const round2 = advanceToNextRound(afterBobCorrect, 4000);
  assert.equal(round2.currentRoundIndex, 1);
  assert.equal(round2.status, 'playing');
  assert.equal(round2.roundWinner, null);

  // Round 2 (last round): both players answer
  const round2Alice = evaluateRound(round2, 'alice', 'C', 4500); // correct: 1000 - 500/8000 * 1000 = 938
  const finalGame = evaluateRound(round2Alice, 'bob', 'C', 5000); // correct: 1000 - 1000/8000 * 1000 = 875

  assert.equal(finalGame.status, 'finished', 'Match finishes on final question after all answered');
  assert.equal(finalGame.scores.bob, 750 + 875);
  assert.equal(finalGame.scores.alice, -250 + 938);
  assert.equal(finalGame.winnerUid, 'bob', 'Bob wins the match with higher score');
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
    playerUids: ['alice', 'bob'],
    hostElo: 1200,
    guestElo: 1200,
    scores: { alice: 1000, bob: 1000 },
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
