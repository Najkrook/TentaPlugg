import {
  doc,
  collection,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { db } from './cloud.js';
import {
  multiplayerNow,
  synchronizeMultiplayerClock,
  getMultiplayerClock,
  isMultiplayerClockValid,
  invalidateMultiplayerClock,
  simulateMonotonicPause,
  MAX_CLOCK_UNCERTAINTY_MS,
  MAX_CLOCK_AGE_MS,
} from './multiplayer-clock.js';
import { questions } from './data.js';
import { extraQuestions } from './extra-content.js';
import { vocabularyList, kanjiList } from './vocabulary-data.js';
import { normalize } from './engine.js';

export {
  getMultiplayerClock,
  isMultiplayerClockValid,
  synchronizeMultiplayerClock,
  invalidateMultiplayerClock,
  simulateMonotonicPause,
  MAX_CLOCK_UNCERTAINTY_MS,
  MAX_CLOCK_AGE_MS,
};

export const DEFAULT_ELO = 1200;
export const K_FACTOR = 32;
export const ROUND_TIME_MS = 8000;
export const TIMEOUT_PENALTY = -50;
export const ROUND_PAUSE_MS = 2000;
export const QUESTIONS_PER_MATCH = 10;
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;
export const HEARTBEAT_TTL_MS = 45000; // 45s heartbeat timeout for lobbies
export const IDLE_ROUND_TIME_MS = 60000;

export function getMultiplayerNow() {
  return multiplayerNow(db);
}

export function getRoundDeadline(game) {
  if (game.firstAnswerAt != null) return game.firstAnswerAt + ROUND_TIME_MS;
  return game.roundStartTime != null ? game.roundStartTime + IDLE_ROUND_TIME_MS : null;
}

export function isRoundExpired(game, now = getMultiplayerNow()) {
  const deadline = getRoundDeadline(game);
  return game.status === 'playing' && deadline != null && now >= deadline;
}

/**
 * Calculates ELO change based on standard FIDE Elo rating formula for 1v1.
 * @param {number} playerElo
 * @param {number} opponentElo
 * @param {number} scoreOutcome - 1 for win, 0.5 for draw, 0 for loss
 * @returns {number} Integer rating delta (can be positive or negative)
 */
export function calculateEloChange(playerElo, opponentElo, scoreOutcome) {
  const p = playerElo || DEFAULT_ELO;
  const o = opponentElo || DEFAULT_ELO;
  const expected = 1 / (1 + Math.pow(10, (o - p) / 400));
  return Math.round(K_FACTOR * (scoreOutcome - expected));
}

/**
 * Calculates All-play-all ELO changes for 2 to 10 players.
 * Formula for player i:
 *   raw_delta_i = (K / (N - 1)) * sum_{j != i} (S_ij - E_ij)
 *   where E_ij = 1 / (1 + 10^((R_j - R_i) / 400))
 *   and S_ij = 1 (if score_i > score_j), 0.5 (if score_i == score_j), 0 (if score_i < score_j).
 * Integer deltas use largest-remainder rounding to preserve a zero sum before the rating floor.
 * @param {Array<{ uid: string, elo?: number, score?: number }> | Record<string, { elo?: number, score?: number }>} players
 * @param {Record<string, number>} [scoresOverride]
 * @returns {Record<string, number>} Map of uid -> integer ELO delta
 */
export function calculateMultiplayerEloChanges(players, scoresOverride = null) {
  let playerList = [];
  if (Array.isArray(players)) {
    playerList = players.map((p) => ({
      uid: p.uid,
      elo: p.elo || DEFAULT_ELO,
      score: scoresOverride ? (scoresOverride[p.uid] ?? 0) : (p.score ?? 0),
    }));
  } else if (players && typeof players === 'object') {
    playerList = Object.entries(players).map(([uid, p]) => ({
      uid,
      elo: p.elo || DEFAULT_ELO,
      score: scoresOverride ? (scoresOverride[uid] ?? 0) : (p.score ?? 0),
    }));
  }

  const n = playerList.length;
  const result = {};
  if (n <= 1) {
    for (const p of playerList) result[p.uid] = 0;
    return result;
  }

  // Stable ordering also keeps floating-point sums independent of lobby join order.
  playerList.sort((a, b) => (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  const remainders = [];
  for (let i = 0; i < n; i++) {
    const pi = playerList[i];
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const pj = playerList[j];
      const expected = 1 / (1 + Math.pow(10, (pj.elo - pi.elo) / 400));
      let outcome = 0.5;
      if (pi.score > pj.score) outcome = 1;
      else if (pi.score < pj.score) outcome = 0;
      sum += outcome - expected;
    }
    const rawDelta = (K_FACTOR / (n - 1)) * sum;
    result[pi.uid] = Math.floor(rawDelta);
    remainders.push({ uid: pi.uid, fraction: rawDelta - result[pi.uid] });
  }

  const pointsToDistribute = -Object.values(result).reduce((sum, delta) => sum + delta, 0);
  remainders.sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < pointsToDistribute; i++) result[remainders[i].uid]++;

  return result;
}

/**
 * Applies ELO delta with a minimum floor of 100.
 */
export function applyElo(currentElo, delta) {
  return Math.max(100, Math.round((currentElo || DEFAULT_ELO) + delta));
}

/**
 * Calculates time-based points for a round response:
 * - Correct: round(1000 * max(0.2, 1 - responseTimeMs / 8000)) (200 to 1000 points)
 * - Incorrect: -250 points penalty
 * @param {boolean} isCorrect
 * @param {number} responseTimeMs
 * @returns {number} Points awarded (positive or negative)
 */
export function calculateTimePoints(isCorrect, responseTimeMs) {
  if (!isCorrect) return -250;
  const clampedTime = Math.max(0, responseTimeMs || 0);
  const factor = Math.max(0.2, 1 - clampedTime / ROUND_TIME_MS);
  return Math.round(1000 * factor);
}

/**
 * Checks whether an answer matches any of the question's accepted valid answers.
 */
export function isAnswerCorrect(question, answer) {
  if (!question || answer === undefined || answer === null) return false;
  const norm = normalize(answer);
  if (Array.isArray(question.validAnswers) && question.validAnswers.length > 0) {
    return question.validAnswers.some((v) => normalize(v) === norm);
  }
  return normalize(question.correctAnswer) === norm;
}

/**
 * Builds 4 distinct choices ensuring no valid alternative answer is used as a distractor.
 */
export function buildFourChoices(primaryAnswer, validAnswers, distractorPool) {
  const normalizedValids = (validAnswers || [primaryAnswer]).map((a) => normalize(a));
  const seen = new Set();
  seen.add(normalize(primaryAnswer));
  for (const v of normalizedValids) seen.add(v);

  const safeDistractors = [];
  for (const d of shuffle(distractorPool)) {
    const normD = normalize(d);
    if (!seen.has(normD)) {
      seen.add(normD);
      safeDistractors.push(d);
      if (safeDistractors.length === 3) break;
    }
  }

  // If pool was too small, pad with safe fallback identifiers
  let padIndex = 1;
  while (safeDistractors.length < 3) {
    const fallback = `Alternativ ${padIndex++}`;
    if (!seen.has(normalize(fallback))) {
      seen.add(normalize(fallback));
      safeDistractors.push(fallback);
    }
  }

  return shuffle([primaryAnswer, ...safeDistractors.slice(0, 3)]);
}

/**
 * Generates a random 4-character lobby code (e.g. "JP42", "K7MN").
 */
export function generateLobbyCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates 10 multiple-choice questions for the chosen category with 4 distinct options.
 * @param {'particles' | 'vocab' | 'word_order'} category
 * @param {number} count
 * @returns {Array<{ id: string, prompt: string, choices: string[], correctAnswer: string, validAnswers: string[], explanation: string }>}
 */
export function generateQuestionsForCategory(category, count = QUESTIONS_PER_MATCH) {
  if (category === 'particles') {
    return generateParticleQuestions(count);
  } else if (category === 'vocab') {
    return generateVocabQuestions(count);
  } else if (category === 'word_order') {
    return generateWordOrderQuestions(count);
  }
  return generateParticleQuestions(count);
}

function generateParticleQuestions(count) {
  const pool = questions.filter((q) => q.topic === 'Partiklar' && q.prompt.includes('【　】'));
  const shuffled = shuffle(pool);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  const particleOptions = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'から', 'まで', '×'];

  return selected.map((q, idx) => {
    const validAnswers = q.answers && q.answers.length > 0 ? q.answers : ['×'];
    const primary = validAnswers[0];
    const choices = buildFourChoices(primary, validAnswers, particleOptions);

    return {
      id: `p-${q.id || idx}`,
      prompt: q.prompt,
      correctAnswer: primary,
      validAnswers,
      choices,
      explanation: q.explanation || '',
    };
  });
}

function generateVocabQuestions(count) {
  const items = shuffle(vocabularyList);
  const kanjis = shuffle(kanjiList);
  const generated = [];

  for (let i = 0; i < count; i++) {
    const type = i % 3; // 0: SV -> JA, 1: JA -> SV, 2: Kanji meaning
    if (type === 0) {
      const target = items[i % items.length];
      const primary =
        target.kanji && target.kanji !== target.kana
          ? `${target.kana} (${target.kanji})`
          : target.kana;
      const validAnswers = [primary, target.kana];
      if (target.kanji) validAnswers.push(target.kanji);

      const sameType = items.filter((v) => v.id !== target.id && v.wordType === target.wordType);
      const distractorPool = (
        sameType.length >= 3 ? sameType : items.filter((v) => v.id !== target.id)
      ).map((d) => (d.kanji && d.kanji !== d.kana ? `${d.kana} (${d.kanji})` : d.kana));

      const choices = buildFourChoices(primary, validAnswers, distractorPool);

      generated.push({
        id: `v-sv2ja-${target.id}`,
        prompt: `Vad heter "${target.sv}" på japanska?`,
        correctAnswer: primary,
        validAnswers,
        choices,
        explanation: `${target.sv} = ${target.kana}${target.kanji ? ` (${target.kanji})` : ''} [${target.romaji}]`,
      });
    } else if (type === 1) {
      const target = items[(i + 20) % items.length];
      const primary = target.sv;
      const validAnswers = [target.sv];
      if (target.en) validAnswers.push(target.en);

      const sameType = items.filter((v) => v.id !== target.id && v.wordType === target.wordType);
      const distractorPool = (
        sameType.length >= 3 ? sameType : items.filter((v) => v.id !== target.id)
      ).map((d) => d.sv);

      const choices = buildFourChoices(primary, validAnswers, distractorPool);

      generated.push({
        id: `v-ja2sv-${target.id}`,
        prompt: `Vad betyder "${target.kanji || target.kana}"?`,
        correctAnswer: primary,
        validAnswers,
        choices,
        explanation: `${target.kanji || target.kana} (${target.romaji}) betyder: ${target.sv}`,
      });
    } else {
      const target = kanjis[i % kanjis.length];
      const primary = target.meaning_sv;
      const validAnswers = [target.meaning_sv, target.meaning_en];

      const distractorPool = kanjis.filter((k) => k.id !== target.id).map((k) => k.meaning_sv);
      const choices = buildFourChoices(primary, validAnswers, distractorPool);

      generated.push({
        id: `v-kanji-${target.id}`,
        prompt: `Vad betyder tecknet 「${target.kanji}」?`,
        correctAnswer: primary,
        validAnswers,
        choices,
        explanation: `Kanji ${target.kanji}: ${target.meaning_sv}. Läsningar: ${[...target.kunyomi, ...target.onyomi].join(', ')}`,
      });
    }
  }
  return generated;
}

function generateWordOrderQuestions(count) {
  const sovPool = extraQuestions.filter((q) => q.topic === 'Ordföljd');
  const generated = [];

  const templates = [
    {
      sv: 'Studenten dricker vatten på biblioteket',
      correct: '学生が としょかんで みずを のみます。',
      distractors: [
        '学生を としょかんで みずが のみます。',
        'としょかんを 学生が みずで のみます。',
        '学生が としょかんに のみます みずを。',
      ],
    },
    {
      sv: 'Katten äter fisk hemma',
      correct: 'ねこが うちで さかなを たべます。',
      distractors: [
        'ねこを うちで さかなが たべます。',
        'うちを ねこが さかなで たべます。',
        'さかなが たべます うちで ねこを。',
      ],
    },
    {
      sv: 'Vännen köpte en tidning i affären',
      correct: 'ともだちが みせで ざっしを かいました。',
      distractors: [
        'ともだちを みせで ざっしが かいました。',
        'みせを ともだちが ざっしで かいました。',
        'ともだちが かいました ざっしを みせで。',
      ],
    },
    {
      sv: 'Läraren lyssnar på musik i morgon',
      correct: 'せんせいが あした おんがくを ききます。',
      distractors: [
        'せんせいを あした おんがくが ききます。',
        'せんせいが あしたに おんがくで ききます。',
        'おんがくを ききます せんせいが あした。',
      ],
    },
    {
      sv: 'Takeshi läser en bok i skolan',
      correct: 'たけしさんが がっこうで ほんを よみます。',
      distractors: [
        'たけしさんを がっこうで ほんが よみます。',
        'がっこうを たけしさんが ほんで よみます。',
        'たけしさんが ほんを よみます がっこうに。',
      ],
    },
  ];

  for (let i = 0; i < count; i++) {
    if (i % 2 === 0 && i / 2 < templates.length) {
      const t = templates[Math.floor(i / 2)];
      const choices = buildFourChoices(t.correct, [t.correct], t.distractors);
      generated.push({
        id: `wo-sentence-${i}`,
        prompt: `Vilken mening har korrekt ordföljd och partiklar för:\n"${t.sv}"?`,
        correctAnswer: t.correct,
        validAnswers: [t.correct],
        choices,
        explanation: `Korrekt led: Subjekt (が) + Plats för handling (で) + Objekt (を) + Verb.`,
      });
    } else {
      const q = sovPool[(i + 3) % sovPool.length];
      const validAnswers = q.answers || ['×'];
      const primary = validAnswers[0];
      const possibleParts = [
        'わたし',
        'ねこ',
        '友だち',
        '先生',
        '学生',
        '本',
        '魚',
        '水',
        '新聞',
        '読みます',
        '食べます',
        '飲みます',
        'saknas / utelämnat',
      ];
      const choices = buildFourChoices(primary, validAnswers, possibleParts);

      generated.push({
        id: `wo-sov-${q.id || i}`,
        prompt: q.prompt,
        correctAnswer: primary,
        validAnswers,
        choices,
        explanation: q.explanation || '',
      });
    }
  }
  return generated;
}

/** Participants still playing; departed players remain in the match for final ratings. */
export function getActivePlayerUids(game) {
  const participants =
    game.playerUids ||
    (game.players ? Object.keys(game.players) : [game.hostUid, game.guestUid].filter(Boolean));
  return participants.filter((uid) => !game.forfeitedUids?.includes(uid));
}

/** Outcome is per participant: a tie at the top is still a loss for everyone below it. */
export function getPlayerMatchOutcome(game, uid) {
  if (game.forfeitedUids?.includes(uid)) return 'loss';
  if (game.winnerUid === uid) return 'win';
  const scores = game.scores || {};
  const topScore = Math.max(...Object.values(scores));
  return game.isDraw && scores[uid] === topScore ? 'draw' : 'loss';
}

/**
 * Applies -50 point penalty to any active player who did not submit an answer in the round.
 */
export function applyTimeoutPenalties(game, now) {
  const roundIdx = game.currentRoundIndex || 0;
  const roundAnswers = { ...(game.answers?.[roundIdx] || {}) };
  const newScores = { ...(game.scores || {}) };
  const activeUids = getActivePlayerUids(game);

  for (const uid of activeUids) {
    if (!roundAnswers[uid]) {
      roundAnswers[uid] = {
        uid,
        roundIndex: roundIdx,
        answer: null,
        timestamp: now,
        isCorrect: false,
        pointsAwarded: TIMEOUT_PENALTY,
        timedOut: true,
      };
      newScores[uid] = (newScores[uid] || 0) + TIMEOUT_PENALTY;
    }
  }

  const answers = { ...(game.answers || {}), [roundIdx]: roundAnswers };
  return {
    ...game,
    scores: newScores,
    answers,
  };
}

export function closeRound(game, now, playersMap = null) {
  const penalized = applyTimeoutPenalties(game, now);

  if (penalized.currentRoundIndex >= penalized.questions.length - 1) {
    return finalizeMatch(penalized, now, playersMap);
  }
  const roundAnswers = penalized.answers?.[penalized.currentRoundIndex] || {};
  const leaderboardSnapshot = Object.values(playersMap || penalized.players || {})
    .map((p) => ({
      uid: p.uid,
      displayName: p.displayName,
      photoURL: p.photoURL || null,
      score: penalized.scores?.[p.uid] || 0,
      roundPoints: roundAnswers[p.uid]?.pointsAwarded || 0,
    }))
    .sort((a, b) => b.score - a.score);
  return {
    ...penalized,
    leaderboardSnapshot,
    status: 'round_end',
    roundWinner: penalized.roundWinners?.[penalized.currentRoundIndex] || 'none',
    roundEndAt: now,
    nextRoundAt: now + ROUND_PAUSE_MS,
  };
}

/**
 * Pure evaluation function for answering a round in a game.
 * Timing mechanic:
 * - 8-second countdown begins ONLY when the first player submits an answer.
 * - The first player gets responseTime = 0 (1000 points if correct, -250 if wrong).
 * - Subsequent players measure response time from that first answer (up to 8 seconds).
 * - Anyone who does not answer before the 8s countdown expires gets -50 points.
 *
 * Adaptively ends round when all active players have answered.
 */
export function evaluateRound(
  game,
  uid,
  selectedAnswer,
  now = getMultiplayerNow(),
  playersMap = null,
) {
  if (!game || game.status !== 'playing') return game;
  const playerUids = getActivePlayerUids(game);
  if (!playerUids.includes(uid)) return game;

  const roundIdx = game.currentRoundIndex || 0;
  const currentQ = game.questions?.[roundIdx];
  if (!currentQ) return game;

  // 1. Guard against submissions before initial round countdown ends (round 0 only)
  if (game.roundStartTime && now < game.roundStartTime) {
    return game;
  }

  // 2. Submission and advancement must agree on the exact deadline, including idle rounds.
  if (isRoundExpired(game, now)) {
    return game;
  }

  // 3. Guard against duplicate submission from same user in this round
  const roundAnswers = { ...(game.answers?.[roundIdx] || {}) };
  if (roundAnswers[uid]) {
    return game;
  }

  const isFirstAnswer = game.firstAnswerAt == null;
  const firstAnswerAt = isFirstAnswer ? now : game.firstAnswerAt;
  const isCorrect = isAnswerCorrect(currentQ, selectedAnswer);

  // First answer starts the 8-second timer; response time for first answer is 0.
  // Subsequent answers measure response time from when the first answer was submitted.
  const responseTimeMs = isFirstAnswer ? 0 : Math.max(0, now - firstAnswerAt);
  const pointsAwarded = calculateTimePoints(isCorrect, responseTimeMs);

  roundAnswers[uid] = {
    uid,
    roundIndex: roundIdx,
    answer: selectedAnswer,
    timestamp: now,
    isCorrect,
    pointsAwarded,
  };

  const newScores = { ...(game.scores || {}) };
  newScores[uid] = (newScores[uid] || 0) + pointsAwarded;

  const roundWinners = { ...(game.roundWinners || {}) };
  let roundWinner = game.roundWinner || null;

  if (isCorrect && !roundWinners[roundIdx]) {
    roundWinners[roundIdx] = uid;
    roundWinner = uid;
  }

  const answers = { ...(game.answers || {}), [roundIdx]: roundAnswers };
  const updated = {
    ...game,
    firstAnswerAt,
    roundDeadline: firstAnswerAt + ROUND_TIME_MS,
    scores: newScores,
    answers,
    roundWinners,
    roundWinner,
  };

  return playerUids.every((id) => Boolean(roundAnswers[id]))
    ? closeRound(updated, now, playersMap)
    : updated;
}

/**
 * Advances game from 'round_end' to next round.
 */
export function advanceToNextRound(game, now = getMultiplayerNow()) {
  if (!game || game.status !== 'round_end') return game;
  const nextIdx = (game.currentRoundIndex || 0) + 1;
  if (nextIdx >= game.questions.length) {
    return finalizeMatch(game, now);
  }
  return {
    ...game,
    status: 'playing',
    currentRoundIndex: nextIdx,
    roundStartTime: now,
    firstAnswerAt: null,
    roundDeadline: null,
    roundWinner: null,
    roundEndAt: null,
    nextRoundAt: null,
  };
}

/**
 * Finalizes match, calculates winner, leaderboards and All-play-all ELO ratings for 2–10 players.
 */
export function finalizeMatch(game, now = getMultiplayerNow(), playersMap = null) {
  const playersSource = playersMap || game.players || {};
  let uids = Object.keys(game.scores || {});
  if (uids.length === 0) {
    if (game.hostUid) uids.push(game.hostUid);
    if (game.guestUid) uids.push(game.guestUid);
  }
  if (uids.length === 0 && playersSource) {
    uids = Object.keys(playersSource);
  }

  const playersList = uids.map((uid) => {
    const p = playersSource[uid] || {};
    const elo = p.elo || (uid === game.hostUid ? game.hostElo : game.guestElo) || DEFAULT_ELO;
    const score = game.scores?.[uid] ?? p.score ?? 0;
    return { uid, elo, score };
  });

  const eligiblePlayers = playersList.filter((p) => !game.forfeitedUids?.includes(p.uid));
  const scoresList = eligiblePlayers.map((p) => p.score);
  const maxScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
  const topPlayers = eligiblePlayers.filter((p) => p.score === maxScore);
  const isDraw = topPlayers.length > 1;
  const winnerUid = isDraw || topPlayers.length === 0 ? null : topPlayers[0].uid;

  const eloChanges = calculateMultiplayerEloChanges(playersList);

  const leaderboardSnapshot = playersList
    .map((p) => {
      const info = playersSource[p.uid] || {};
      return {
        uid: p.uid,
        displayName: info.displayName || (p.uid === game.hostUid ? 'Värd' : 'Spelare'),
        photoURL: info.photoURL || null,
        score: p.score,
        roundPoints: game.answers?.[game.currentRoundIndex]?.[p.uid]?.pointsAwarded || 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    ...game,
    status: 'finished',
    winnerUid,
    isDraw,
    finishedAt: now,
    eloChanges,
    leaderboardSnapshot,
  };
}

/* =========================================================================
   Firestore Realtime Operations with Atomic Cross-Collection Sync
   ========================================================================= */

/**
 * Register the player's baseline before a match can update both profiles.
 */
async function ensureLeaderboardProfile(user) {
  const ref = doc(db, 'leaderboard', user.uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const profile = {
      ...(snap.exists()
        ? snap.data()
        : {
            uid: user.uid,
            elo: DEFAULT_ELO,
            wins: 0,
            losses: 0,
            draws: 0,
            matchesPlayed: 0,
            lastMatchId: '',
          }),
      displayName: user.displayName || 'Spelare',
      photoURL: user.photoURL || null,
    };
    tx.set(ref, profile);
    return profile;
  });
}

/**
 * Creates a multiplayer lobby supporting up to 10 players.
 */
export async function createLobby(user, category) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  await synchronizeMultiplayerClock(db, user.uid);
  const clock = getMultiplayerClock(db);
  const code = generateLobbyCode();
  const lobbyRef = doc(db, 'lobbies', code);

  const profile = await ensureLeaderboardProfile(user);
  const hostElo = profile.elo;

  const now = getMultiplayerNow();
  const lobbyData = {
    id: code,
    category,
    status: 'waiting',
    createdAt: now,
    updatedAt: now,
    heartbeat: now,
    host: {
      uid: user.uid,
      displayName: user.displayName || 'Spelare 1',
      photoURL: user.photoURL || null,
      elo: hostElo,
    },
    players: {
      [user.uid]: {
        uid: user.uid,
        displayName: user.displayName || 'Spelare 1',
        photoURL: user.photoURL || null,
        elo: hostElo,
        joinedAt: now,
        score: 0,
        ready: clock.valid,
        clockStatus: clock.status,
      },
    },
    playerCount: 1,
    guest: null,
    game: null,
  };

  await setDoc(lobbyRef, lobbyData);
  return code;
}

/**
 * Sends a heartbeat for a lobby to keep it active in the open lobby list.
 */
export async function sendHeartbeat(lobbyId, uid) {
  if (!lobbyId || !uid) return;
  try {
    const lobbyRef = doc(db, 'lobbies', lobbyId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lobbyRef);
      if (snap.exists() && snap.data().status === 'waiting' && snap.data().host?.uid === uid) {
        tx.update(lobbyRef, { heartbeat: getMultiplayerNow(), updatedAt: getMultiplayerNow() });
      }
    });
  } catch {}
}

/**
 * Updates a player's clock readiness in the lobby.
 */
export async function updatePlayerClockStatus(lobbyId, uid, clock = getMultiplayerClock(db)) {
  if (!lobbyId || !uid) return;
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lobbyRef);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status !== 'waiting') return;
      const players = data.players || {};
      if (!players[uid]) return;
      if (players[uid].ready === clock.valid && players[uid].clockStatus === clock.status) return;
      tx.update(lobbyRef, {
        [`players.${uid}.ready`]: clock.valid,
        [`players.${uid}.clockStatus`]: clock.status,
        updatedAt: getMultiplayerNow(),
      });
    });
  } catch {}
}

/**
 * Joins an existing lobby (supports up to 10 players).
 */
export async function joinLobby(lobbyId, user) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  await synchronizeMultiplayerClock(db, user.uid);
  const clock = getMultiplayerClock(db);
  const cleanId = lobbyId.toUpperCase().trim();
  const lobbyRef = doc(db, 'lobbies', cleanId);

  const profile = await ensureLeaderboardProfile(user);
  const guestElo = profile.elo;

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn hittades inte');
    const data = snap.data();
    if (data.status !== 'waiting') throw new Error('Matchen har redan startat');
    if (getMultiplayerNow() - (data.heartbeat || data.createdAt || 0) >= HEARTBEAT_TTL_MS)
      throw new Error('Lobbyn är inte längre aktiv');

    const currentPlayers = data.players || {
      [data.host.uid]: {
        uid: data.host.uid,
        displayName: data.host.displayName,
        photoURL: data.host.photoURL || null,
        elo: data.host.elo || DEFAULT_ELO,
        joinedAt: data.createdAt || getMultiplayerNow(),
        score: 0,
        ready: true,
      },
    };

    if (currentPlayers[user.uid]) return data;

    const count = Object.keys(currentPlayers).length;
    if (count >= MAX_PLAYERS || (data.playerCount && data.playerCount >= MAX_PLAYERS)) {
      throw new Error('Lobbyn är redan full (max 10 spelare)');
    }

    const now = getMultiplayerNow();
    const guestData = {
      uid: user.uid,
      displayName: user.displayName || `Spelare ${count + 1}`,
      photoURL: user.photoURL || null,
      elo: guestElo,
      joinedAt: now,
      score: 0,
      ready: clock.valid,
      clockStatus: clock.status,
    };

    const updatedPlayers = {
      ...currentPlayers,
      [user.uid]: guestData,
    };

    const updatePayload = {
      players: updatedPlayers,
      playerCount: Object.keys(updatedPlayers).length,
      updatedAt: now,
    };

    if (!data.guest) {
      updatePayload.guest = {
        uid: user.uid,
        displayName: user.displayName || 'Spelare 2',
        photoURL: user.photoURL || null,
        elo: guestElo,
      };
    }

    tx.update(lobbyRef, updatePayload);
    return { ...data, ...updatePayload };
  });
}

/**
 * Leaves or cancels a lobby. If in progress, triggers a forfeit.
 */
export async function leaveLobby(lobbyId, uid) {
  if (!lobbyId || !uid) return;
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lobbyRef);
      if (!snap.exists()) return;
      const data = snap.data();

      const isHost = data.host?.uid === uid;
      const isPlayer = Boolean(data.players?.[uid] || data.guest?.uid === uid || isHost);
      if (!isPlayer) return;

      // If in progress or finished, forfeiting or exiting
      if (data.game && data.game.status !== 'finished' && data.status !== 'waiting') {
        await applyForfeitInTransaction(tx, lobbyRef, data, uid, getMultiplayerNow());
        return;
      }

      if (data.status === 'finished') {
        return; // Already recorded
      }

      // Waiting status: host leaving deletes lobby, other players leaving removes them
      if (isHost) {
        tx.delete(lobbyRef);
      } else {
        const updatedPlayers = { ...(data.players || {}) };
        delete updatedPlayers[uid];
        const newCount = Object.keys(updatedPlayers).length;
        const newGuest =
          data.guest?.uid === uid
            ? Object.values(updatedPlayers).find((p) => p.uid !== data.host.uid) || null
            : data.guest;

        tx.update(lobbyRef, {
          players: updatedPlayers,
          playerCount: newCount,
          guest: newGuest,
          updatedAt: getMultiplayerNow(),
        });
      }
    });
  } catch (err) {
    console.error('Kunde inte lämna lobby:', err);
  }
}

/**
 * Starts match by initializing 10 questions and starting countdown.
 * Host can start match as soon as at least 2 players have joined.
 */
export async function startMatch(lobbyId) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn finns inte');
    const data = snap.data();
    if (data.status !== 'waiting') return data.game;

    const clock = getMultiplayerClock(db);
    if (!clock.valid) {
      throw new Error('Kunde inte starta: matchklockan är inte synkroniserad');
    }

    const playersMap = data.players || {
      [data.host.uid]: { ...data.host, joinedAt: getMultiplayerNow(), score: 0 },
      ...(data.guest
        ? { [data.guest.uid]: { ...data.guest, joinedAt: getMultiplayerNow(), score: 0 } }
        : {}),
    };

    const count = Object.keys(playersMap).length;
    if (count < MIN_PLAYERS) {
      throw new Error('Väntar på att minst en till motståndare ansluter');
    }

    for (const p of Object.values(playersMap)) {
      if (p.ready === false) {
        throw new Error('Väntar på att alla spelare ska bli redo');
      }
    }

    const questionsList = generateQuestionsForCategory(data.category, QUESTIONS_PER_MATCH);
    const now = getMultiplayerNow();

    const initialScores = {};
    for (const pUid of Object.keys(playersMap)) {
      initialScores[pUid] = 0;
    }

    const guestUid =
      data.guest?.uid || Object.keys(playersMap).find((id) => id !== data.host.uid) || null;

    const game = {
      questions: questionsList,
      currentRoundIndex: 0,
      roundStartTime: now + 3000, // 3s countdown before first round
      firstAnswerAt: null,
      roundDeadline: null,
      hostUid: data.host.uid,
      guestUid,
      hostElo: data.host.elo || DEFAULT_ELO,
      guestElo: data.guest?.elo || DEFAULT_ELO,
      playerUids: Object.keys(playersMap),
      scores: initialScores,
      answers: {},
      roundWinners: {},
      roundWinner: null,
      status: 'playing',
    };

    tx.update(lobbyRef, {
      status: 'playing',
      game,
      updatedAt: now,
    });
    return game;
  });
}

/**
 * Submits an answer in the current round.
 * Writes atomically to `/lobbies/{lobbyId}/answers/{roundIndex}_{uid}`
 * and updates game state in transaction.
 * If all connected players have answered or if last round finishes, updates standings.
 * Returns { status, answer? }: accepted/already-received include the persisted
 * answer; late/stale-round/closed/rejected never imply success. Transport errors
 * reject the promise. Retrying callers must retain their choice and attemptId.
 */
export async function submitPlayerAnswer(
  lobbyId,
  uid,
  roundIndex,
  selectedAnswer,
  attemptId = crypto.randomUUID(),
) {
  const answerRef = doc(db, 'lobbies', lobbyId, 'answers', `${roundIndex}_${uid}`);
  const lobbyRef = doc(db, 'lobbies', lobbyId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) return { status: 'closed' };
    const data = snap.data();
    if (!data.game) return { status: 'closed' };

    const game = data.game;
    const now = getMultiplayerNow();

    // Reconcile even after the round has advanced: a lost acknowledgement must
    // never turn a committed answer into another choice or another score.
    const existing = game.answers?.[roundIndex]?.[uid];
    if (existing && !existing.timedOut) return { status: 'already-received', answer: existing };
    if (!isMultiplayerClockValid(db)) return { status: 'rejected', reason: 'clock-invalid' };
    if (game.currentRoundIndex !== roundIndex) return { status: 'stale-round' };
    if (game.status !== 'playing' || existing) return { status: 'closed' };
    if (isRoundExpired(game, now)) return { status: 'late' };
    const updatedGame = evaluateRound(game, uid, selectedAnswer, now, data.players);
    if (updatedGame === game) return { status: 'rejected' };
    updatedGame.answers[roundIndex][uid].attemptId = attemptId;

    const updatedPlayers = { ...(data.players || {}) };
    for (const pUid of Object.keys(updatedGame.scores || {})) {
      if (updatedPlayers[pUid]) {
        updatedPlayers[pUid] = { ...updatedPlayers[pUid], score: updatedGame.scores[pUid] };
      }
    }

    if (updatedGame.status === 'finished') {
      // This helper reads every profile before queuing writes. The answer must be queued after it.
      await finishMatchInTransaction(tx, lobbyRef, lobbyId, updatedGame, now, updatedPlayers);
    } else {
      tx.update(lobbyRef, {
        game: updatedGame,
        players: updatedPlayers,
        status: updatedGame.status,
        updatedAt: now,
      });
    }
    tx.set(answerRef, updatedGame.answers[roundIndex][uid]);

    return { status: 'accepted', answer: updatedGame.answers[roundIndex][uid] };
  });
}

export const submitAnswer = submitPlayerAnswer;

/**
 * Advances to next round if pause timer elapsed or handles round timeout.
 */
export async function advanceRoundIfDue(lobbyId) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (!data.game) return;

    const now = getMultiplayerNow();
    const game = data.game;

    if (game.status === 'round_end' && game.nextRoundAt && now >= game.nextRoundAt) {
      const nextGame = advanceToNextRound(game, now);
      tx.update(lobbyRef, {
        game: nextGame,
        status: nextGame.status,
        updatedAt: now,
      });
    } else if (isRoundExpired(game, now)) {
      const playersMap = data.players || {};
      const updated = closeRound(game, now, playersMap);
      if (updated.status === 'finished') {
        await finishMatchInTransaction(tx, lobbyRef, lobbyId, updated, now, playersMap);
      } else {
        tx.update(lobbyRef, { game: updated, status: updated.status, updatedAt: now });
      }
    }
  });
}

/**
 * Handles match forfeit inside an active transaction.
 */
async function applyForfeitInTransaction(tx, lobbyRef, lobbyData, forfeitingUid, now) {
  const game = lobbyData.game;
  const activeUids = getActivePlayerUids(game);
  if (!activeUids.includes(forfeitingUid)) return;

  // Keep all participants for final ratings, but no longer wait for a departed player's answers.
  const scores = { ...game.scores, [forfeitingUid]: -9999 };
  const playersMap = { ...(lobbyData.players || {}) };
  if (playersMap[forfeitingUid]) {
    playersMap[forfeitingUid] = { ...playersMap[forfeitingUid], score: scores[forfeitingUid] };
  }
  let updated = {
    ...game,
    scores,
    forfeitedBy: forfeitingUid,
    forfeitedUids: [...(game.forfeitedUids || []), forfeitingUid],
  };
  const remaining = getActivePlayerUids(updated);
  if (remaining.length <= 1) {
    updated = finalizeMatch(updated, now, playersMap);
  } else if (
    updated.status === 'playing' &&
    remaining.every((uid) => Boolean(updated.answers?.[updated.currentRoundIndex]?.[uid]))
  ) {
    updated = closeRound(updated, now, playersMap);
  } else if (updated.leaderboardSnapshot) {
    updated.leaderboardSnapshot = updated.leaderboardSnapshot
      .map((p) => ({ ...p, score: scores[p.uid] || 0 }))
      .sort((a, b) => b.score - a.score);
  }

  if (updated.status === 'finished') {
    await finishMatchInTransaction(tx, lobbyRef, lobbyData.id, updated, now, playersMap);
  } else {
    tx.update(lobbyRef, {
      game: updated,
      players: playersMap,
      status: updated.status,
      updatedAt: now,
    });
  }
}

/**
 * Atomically updates all players' leaderboard records in the transaction.
 */
async function finishMatchInTransaction(tx, lobbyRef, matchId, game, now, playersMap = null) {
  const playersSource = playersMap || game.players || {};
  let uids = Object.keys(game.scores || {});
  if (uids.length === 0 && game.playerUids) {
    uids = [...game.playerUids];
  }
  if (uids.length === 0) {
    if (game.hostUid) uids.push(game.hostUid);
    if (game.guestUid) uids.push(game.guestUid);
  }
  if (uids.length === 0 && playersSource) {
    uids = Object.keys(playersSource);
  }

  // Deduplicate UIDs
  const uniqueUids = [...new Set(uids.filter(Boolean))];

  // Firestore requires every read before any write in a transaction.
  const refs = uniqueUids.map((uid) => doc(db, 'leaderboard', uid));
  const snapshots = await Promise.all(refs.map((ref) => tx.get(ref)));

  for (const [index, uid] of uniqueUids.entries()) {
    const leadRef = refs[index];
    const snap = snapshots[index];
    const pInfo = playersSource[uid] || {};
    const existing = snap.exists()
      ? snap.data()
      : {
          uid,
          displayName: pInfo.displayName || 'Spelare',
          photoURL: pInfo.photoURL || null,
          elo: DEFAULT_ELO,
          wins: 0,
          losses: 0,
          draws: 0,
          matchesPlayed: 0,
        };

    const outcome = getPlayerMatchOutcome(game, uid);
    const isWinner = outcome === 'win';
    const isDraw = outcome === 'draw';
    const isLoss = outcome === 'loss';
    const diff = game.eloChanges?.[uid] || 0;
    const newElo = applyElo(existing.elo, diff);

    const updated = {
      ...existing,
      uid,
      elo: newElo,
      wins: existing.wins + (isWinner ? 1 : 0),
      losses: existing.losses + (isLoss ? 1 : 0),
      draws: existing.draws + (isDraw ? 1 : 0),
      matchesPlayed: (existing.matchesPlayed || 0) + 1,
      lastMatchId: matchId,
      lastPlayed: now,
    };

    tx.set(leadRef, updated);
  }
  tx.update(lobbyRef, {
    status: 'finished',
    game,
    updatedAt: now,
    ...(playersMap ? { players: playersMap } : {}),
  });
}

/**
 * Subscribes to live updates for a single lobby.
 */
export function subscribeToLobby(lobbyId, callback, onError) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return onSnapshot(
    lobbyRef,
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(null);
      }
    },
    onError,
  );
}

/**
 * Subscribes to waiting lobbies in real time, filtering out abandoned/full lobbies.
 */
export function subscribeToOpenLobbies(callback, onError) {
  const q = query(collection(db, 'lobbies'), where('status', '==', 'waiting'));
  let waiting = [];
  const publish = () => {
    const now = getMultiplayerNow();
    callback(
      waiting
        .filter((data) => {
          const count = data.playerCount || (data.guest ? 2 : 1);
          const isFull = count >= MAX_PLAYERS;
          const isFresh = now - (data.heartbeat || data.createdAt || 0) < HEARTBEAT_TTL_MS;
          return !isFull && isFresh;
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20),
    );
  };
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      waiting = snapshot.docs.map((snapshot) => snapshot.data());
      publish();
    },
    onError,
  );
  const expiryTimer = setInterval(publish, 1000);
  return () => {
    unsubscribe();
    clearInterval(expiryTimer);
  };
}

/**
 * Subscribes to top players on the leaderboard.
 */
export function subscribeToLeaderboard(callback) {
  const q = query(collection(db, 'leaderboard'), orderBy('elo', 'desc'), limit(25));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push(doc.data());
    });
    callback(list);
  });
}
