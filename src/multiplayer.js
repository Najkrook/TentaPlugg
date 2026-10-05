import {
  doc,
  collection,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { db } from './cloud.js';
import { questions } from './data.js';
import { extraQuestions } from './extra-content.js';
import { vocabularyList, kanjiList } from './vocabulary-data.js';
import { normalize } from './engine.js';

export const DEFAULT_ELO = 1200;
export const K_FACTOR = 32;
export const ROUND_TIME_MS = 8000;
export const ROUND_PAUSE_MS = 1500;
export const QUESTIONS_PER_MATCH = 10;
export const HEARTBEAT_TTL_MS = 45000; // 45s heartbeat timeout for lobbies

/**
 * Calculates ELO change based on standard FIDE Elo rating formula.
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
 * Applies ELO delta with a minimum floor of 100.
 */
export function applyElo(currentElo, delta) {
  return Math.max(100, Math.round((currentElo || DEFAULT_ELO) + delta));
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

/**
 * Pure evaluation function for answering a round in a game.
 * Strictly checks:
 * 1. game.status === 'playing'
 * 2. now >= game.roundStartTime (countdown completed)
 * 3. now - game.roundStartTime <= ROUND_TIME_MS (not expired)
 * 4. !game.roundWinners[roundIdx] (not already won by opponent)
 * 5. !game.answers[roundIdx][uid] (not already answered by this player)
 */
export function evaluateRound(game, uid, selectedAnswer, now = Date.now()) {
  if (!game || game.status !== 'playing') return game;

  const roundIdx = game.currentRoundIndex || 0;
  const currentQ = game.questions?.[roundIdx];
  if (!currentQ) return game;

  // 1. Guard against submissions before round countdown ends
  if (game.roundStartTime && now < game.roundStartTime) {
    return game;
  }

  // 2. Guard against submissions after round time has expired (> ROUND_TIME_MS)
  if (game.roundStartTime && now - game.roundStartTime > ROUND_TIME_MS) {
    return game;
  }

  // 3. Guard against submissions after round has already been won
  if (game.roundWinners && game.roundWinners[roundIdx]) {
    return game;
  }

  // 4. Guard against duplicate submission from same user in this round
  const roundAnswers = { ...(game.answers?.[roundIdx] || {}) };
  if (roundAnswers[uid]) {
    return game;
  }

  const isCorrect = isAnswerCorrect(currentQ, selectedAnswer);

  roundAnswers[uid] = {
    answer: selectedAnswer,
    timestamp: now,
    isCorrect,
  };

  const newScores = { ...game.scores };
  const roundWinners = { ...(game.roundWinners || {}) };
  let roundWinner = game.roundWinner || null;

  if (isCorrect) {
    roundWinners[roundIdx] = uid;
    roundWinner = uid;
    newScores[uid] = (newScores[uid] || 0) + 1;
  } else {
    newScores[uid] = (newScores[uid] || 0) - 1;
  }

  const answers = { ...(game.answers || {}), [roundIdx]: roundAnswers };
  const updated = {
    ...game,
    scores: newScores,
    answers,
    roundWinners,
    roundWinner,
  };

  const hostUid = game.hostUid;
  const guestUid = game.guestUid;
  const bothAnswered = Boolean(roundAnswers[hostUid] && roundAnswers[guestUid]);
  const hasWinner = Boolean(roundWinners[roundIdx]);

  if (hasWinner || bothAnswered) {
    if (roundIdx >= game.questions.length - 1) {
      return finalizeMatch(updated, now);
    } else {
      updated.status = 'round_end';
      updated.roundEndAt = now;
      updated.nextRoundAt = now + ROUND_PAUSE_MS;
    }
  }

  return updated;
}

/**
 * Advances game from 'round_end' to next round.
 */
export function advanceToNextRound(game, now = Date.now()) {
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
    roundWinner: null,
    roundEndAt: null,
    nextRoundAt: null,
  };
}

/**
 * Finalizes match, calculates winner and ELO ratings.
 */
export function finalizeMatch(game, now = Date.now()) {
  const hostUid = game.hostUid;
  const guestUid = game.guestUid;
  const hostScore = game.scores[hostUid] || 0;
  const guestScore = game.scores[guestUid] || 0;

  let winnerUid = null;
  let isDraw = false;
  if (hostScore > guestScore) {
    winnerUid = hostUid;
  } else if (guestScore > hostScore) {
    winnerUid = guestUid;
  } else {
    isDraw = true;
  }

  const hostElo = game.hostElo || DEFAULT_ELO;
  const guestElo = game.guestElo || DEFAULT_ELO;

  const hostOutcome = winnerUid === hostUid ? 1 : isDraw ? 0.5 : 0;
  const guestOutcome = winnerUid === guestUid ? 1 : isDraw ? 0.5 : 0;

  const hostDiff = calculateEloChange(hostElo, guestElo, hostOutcome);
  const guestDiff = calculateEloChange(guestElo, hostElo, guestOutcome);

  return {
    ...game,
    status: 'finished',
    winnerUid,
    isDraw,
    finishedAt: now,
    eloChanges: {
      [hostUid]: hostDiff,
      [guestUid]: guestDiff,
    },
  };
}

/* =========================================================================
   Firestore Realtime Operations with Atomic Cross-Collection Sync
   ========================================================================= */

/**
 * Creates a new lobby document in Firestore with heartbeat.
 */
export async function createLobby(user, category) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  const code = generateLobbyCode();
  const lobbyRef = doc(db, 'lobbies', code);

  let hostElo = DEFAULT_ELO;
  try {
    const pSnap = await getDoc(doc(db, 'leaderboard', user.uid));
    if (pSnap.exists()) hostElo = pSnap.data().elo || DEFAULT_ELO;
  } catch {}

  const now = Date.now();
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
    guest: null,
    game: null,
  };

  await setDoc(lobbyRef, lobbyData);
  return code;
}

/**
 * Sends a heartbeat for a lobby to keep it active in the open lobby list.
 */
export async function sendHeartbeat(lobbyId) {
  if (!lobbyId) return;
  try {
    const lobbyRef = doc(db, 'lobbies', lobbyId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(lobbyRef);
      if (snap.exists() && snap.data().status === 'waiting') {
        tx.update(lobbyRef, { heartbeat: Date.now(), updatedAt: Date.now() });
      }
    });
  } catch {}
}

/**
 * Joins an existing lobby as guest.
 */
export async function joinLobby(lobbyId, user) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  const cleanId = lobbyId.toUpperCase().trim();
  const lobbyRef = doc(db, 'lobbies', cleanId);

  let guestElo = DEFAULT_ELO;
  try {
    const pSnap = await getDoc(doc(db, 'leaderboard', user.uid));
    if (pSnap.exists()) guestElo = pSnap.data().elo || DEFAULT_ELO;
  } catch {}

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn hittades inte');
    const data = snap.data();
    if (data.status !== 'waiting') throw new Error('Matchen har redan startat');
    if (data.host.uid === user.uid) return data;
    if (data.guest && data.guest.uid !== user.uid) throw new Error('Lobbyn är redan full');

    const guestData = {
      uid: user.uid,
      displayName: user.displayName || 'Spelare 2',
      photoURL: user.photoURL || null,
      elo: guestElo,
    };
    tx.update(lobbyRef, { guest: guestData, updatedAt: Date.now() });
    return { ...data, guest: guestData };
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

      // If in progress or finished, forfeiting or exiting
      if (data.status === 'playing' || data.status === 'round_end') {
        // Player forfeits match
        await applyForfeitInTransaction(tx, lobbyRef, data, uid, Date.now());
        return;
      }

      if (data.status === 'finished') {
        return; // Already recorded
      }

      // Waiting status: cleanup
      if (data.host.uid === uid) {
        tx.delete(lobbyRef);
      } else if (data.guest?.uid === uid) {
        tx.update(lobbyRef, { guest: null, updatedAt: Date.now() });
      }
    });
  } catch (err) {
    console.error('Kunde inte lämna lobby:', err);
  }
}

/**
 * Starts match by initializing 10 questions and starting countdown.
 */
export async function startMatch(lobbyId) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn finns inte');
    const data = snap.data();
    if (!data.guest) throw new Error('Väntar på att en motståndare ansluter');

    const questionsList = generateQuestionsForCategory(data.category, QUESTIONS_PER_MATCH);
    const now = Date.now();
    const game = {
      questions: questionsList,
      currentRoundIndex: 0,
      roundStartTime: now + 3000, // 3s countdown before first round
      hostUid: data.host.uid,
      guestUid: data.guest.uid,
      hostElo: data.host.elo || DEFAULT_ELO,
      guestElo: data.guest.elo || DEFAULT_ELO,
      scores: {
        [data.host.uid]: 0,
        [data.guest.uid]: 0,
      },
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
 * Atomically updates round outcome and, if final question, writes leaderboard for BOTH players.
 */
export async function submitAnswer(lobbyId, uid, roundIndex, selectedAnswer) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.game) return null;

    const game = data.game;
    const now = Date.now();

    // Guard checks:
    if (game.status !== 'playing') return null;
    if (game.currentRoundIndex !== roundIndex) return null;
    if (game.roundStartTime && now < game.roundStartTime) return null;
    if (game.roundStartTime && now - game.roundStartTime > ROUND_TIME_MS) return null;
    if (game.roundWinners?.[roundIndex]) return null;
    if (game.answers?.[roundIndex]?.[uid]) return null;

    const updatedGame = evaluateRound(game, uid, selectedAnswer, now);
    const isFinished = updatedGame.status === 'finished';

    tx.update(lobbyRef, {
      game: updatedGame,
      status: isFinished ? 'finished' : updatedGame.status,
      updatedAt: now,
    });

    // If match finished, atomically update both players' leaderboard stats!
    if (isFinished) {
      await updateBothLeaderboardsInTransaction(tx, lobbyId, updatedGame, now);
    }

    return updatedGame;
  });
}

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

    const now = Date.now();
    if (data.game.status === 'round_end' && data.game.nextRoundAt && now >= data.game.nextRoundAt) {
      const nextGame = advanceToNextRound(data.game, now);
      tx.update(lobbyRef, {
        game: nextGame,
        status: nextGame.status,
        updatedAt: now,
      });
    } else if (
      data.game.status === 'playing' &&
      data.game.roundStartTime &&
      now - data.game.roundStartTime > ROUND_TIME_MS
    ) {
      const roundIdx = data.game.currentRoundIndex;
      const updated = {
        ...data.game,
        roundWinner: data.game.roundWinners?.[roundIdx] || 'none',
      };
      if (roundIdx >= data.game.questions.length - 1) {
        const finalGame = finalizeMatch(updated, now);
        tx.update(lobbyRef, {
          game: finalGame,
          status: 'finished',
          updatedAt: now,
        });
        await updateBothLeaderboardsInTransaction(tx, lobbyId, finalGame, now);
      } else {
        updated.status = 'round_end';
        updated.roundEndAt = now;
        updated.nextRoundAt = now + ROUND_PAUSE_MS;
        tx.update(lobbyRef, {
          game: updated,
          status: 'round_end',
          updatedAt: now,
        });
      }
    }
  });
}

/**
 * Handles match forfeit inside an active transaction.
 */
async function applyForfeitInTransaction(tx, lobbyRef, lobbyData, forfeitingUid, now) {
  const game = lobbyData.game;
  const hostUid = lobbyData.host.uid;
  const guestUid = lobbyData.guest.uid;
  const winnerUid = forfeitingUid === hostUid ? guestUid : hostUid;

  const hostElo = game?.hostElo || lobbyData.host.elo || DEFAULT_ELO;
  const guestElo = game?.guestElo || lobbyData.guest.elo || DEFAULT_ELO;

  const hostOutcome = winnerUid === hostUid ? 1 : 0;
  const guestOutcome = winnerUid === guestUid ? 1 : 0;

  const hostDiff = calculateEloChange(hostElo, guestElo, hostOutcome);
  const guestDiff = calculateEloChange(guestElo, hostElo, guestOutcome);

  const finishedGame = {
    ...(game || {}),
    status: 'finished',
    winnerUid,
    isDraw: false,
    forfeitedBy: forfeitingUid,
    finishedAt: now,
    scores: game?.scores || { [hostUid]: 0, [guestUid]: 0 },
    eloChanges: {
      [hostUid]: hostDiff,
      [guestUid]: guestDiff,
    },
  };

  tx.update(lobbyRef, {
    status: 'finished',
    game: finishedGame,
    updatedAt: now,
  });

  await updateBothLeaderboardsInTransaction(tx, lobbyData.id, finishedGame, now);
}

/**
 * Atomically updates both players' leaderboard records in the transaction.
 */
async function updateBothLeaderboardsInTransaction(tx, matchId, game, now) {
  const hostUid = game.hostUid;
  const guestUid = game.guestUid;
  const winnerUid = game.winnerUid;
  const isDraw = game.isDraw;

  for (const uid of [hostUid, guestUid]) {
    const leadRef = doc(db, 'leaderboard', uid);
    const snap = await tx.get(leadRef);
    const existing = snap.exists()
      ? snap.data()
      : {
          uid,
          displayName: 'Spelare',
          photoURL: null,
          elo: DEFAULT_ELO,
          wins: 0,
          losses: 0,
          draws: 0,
          matchesPlayed: 0,
        };

    const isWinner = winnerUid === uid;
    const isLoss = !isWinner && !isDraw;
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
}

/**
 * Subscribes to live updates for a single lobby.
 */
export function subscribeToLobby(lobbyId, callback) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return onSnapshot(lobbyRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribes to waiting lobbies in real time, filtering out abandoned/stale lobbies.
 */
export function subscribeToOpenLobbies(callback) {
  const q = query(collection(db, 'lobbies'), where('status', '==', 'waiting'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const now = Date.now();
    const lobbies = [];
    snapshot.forEach((d) => {
      const data = d.data();
      // Filter out abandoned lobbies whose heartbeat is older than TTL
      const isHeartbeatFresh = !data.heartbeat || now - data.heartbeat < HEARTBEAT_TTL_MS;
      if (isHeartbeatFresh) {
        lobbies.push(data);
      }
    });
    lobbies.sort((a, b) => b.createdAt - a.createdAt);
    callback(lobbies);
  });
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
