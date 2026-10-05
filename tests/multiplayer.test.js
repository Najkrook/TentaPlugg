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
  DEFAULT_ELO,
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

test('Vocab category draws from parsed Genki vocabulary dataset', () => {
  const vocabQuestions = generateQuestionsForCategory('vocab', 10);
  assert.equal(vocabQuestions.length, 10);
  // Verify prompts contain Japanese/Swedish questions
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
      { id: 'q1', prompt: 'Fråga 1', choices: ['A', 'B', 'C', 'D'], correctAnswer: 'B' },
      { id: 'q2', prompt: 'Fråga 2', choices: ['A', 'B', 'C', 'D'], correctAnswer: 'C' },
    ],
    currentRoundIndex: 0,
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
  const afterAliceWrong = evaluateRound(mockGame, 'alice', 'A', 1000);
  assert.equal(
    afterAliceWrong.scores.alice,
    -1,
    'Alice receives -1 point penalty for wrong answer',
  );
  assert.equal(afterAliceWrong.roundWinners[0], undefined, 'No round winner yet');
  assert.equal(afterAliceWrong.status, 'playing', 'Round still active since no one answered right');

  // Bob answers right ('B')
  const afterBobCorrect = evaluateRound(afterAliceWrong, 'bob', 'B', 1500);
  assert.equal(afterBobCorrect.scores.bob, 1, 'Bob receives +1 point for correct answer');
  assert.equal(afterBobCorrect.roundWinners[0], 'bob', 'Bob is marked as round winner');
  assert.equal(afterBobCorrect.status, 'round_end', 'Round ends when someone gets it right');

  // Alice cannot answer again in this round
  const aliceRetry = evaluateRound(afterBobCorrect, 'alice', 'B', 2000);
  assert.equal(aliceRetry.scores.alice, -1, 'Alice score should not change on duplicate submit');

  // Advance to next round
  const round2 = advanceToNextRound(afterBobCorrect, 3000);
  assert.equal(round2.currentRoundIndex, 1);
  assert.equal(round2.status, 'playing');
  assert.equal(round2.roundWinner, null);

  // Round 2 is last round: Bob gets it right again ('C')
  const finalGame = evaluateRound(round2, 'bob', 'C', 4000);
  assert.equal(finalGame.status, 'finished', 'Match finishes on final question');
  assert.equal(finalGame.winnerUid, 'bob', 'Bob wins the match');
  assert.equal(finalGame.scores.bob, 2);
  assert.equal(finalGame.scores.alice, -1);
  assert(finalGame.eloChanges.bob > 0, 'Bob gains ELO');
  assert(finalGame.eloChanges.alice < 0, 'Alice loses ELO');
});

test('Match finalization properly handles draws with equal scores', () => {
  const tiedGame = {
    questions: [{ id: 'q1', prompt: 'Fråga 1', choices: ['A', 'B', 'C', 'D'], correctAnswer: 'A' }],
    currentRoundIndex: 0,
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
