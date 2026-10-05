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

export const DEFAULT_ELO = 1200;
export const K_FACTOR = 32;
export const ROUND_TIME_MS = 8000;
export const ROUND_PAUSE_MS = 1500;
export const QUESTIONS_PER_MATCH = 10;

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
 * @returns {Array<{ id: string, prompt: string, choices: string[], correctAnswer: string, explanation: string }>}
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
    const correct = (q.answers && q.answers[0]) || '×';
    const otherParticles = shuffle(particleOptions.filter((p) => p !== correct));
    const choices = shuffle([correct, ...otherParticles.slice(0, 3)]);
    return {
      id: `p-${q.id || idx}`,
      prompt: q.prompt,
      correctAnswer: correct,
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
      const correct =
        target.kanji && target.kanji !== target.kana
          ? `${target.kana} (${target.kanji})`
          : target.kana;
      const sameType = items.filter((v) => v.id !== target.id && v.wordType === target.wordType);
      const distractorPool =
        sameType.length >= 3 ? sameType : items.filter((v) => v.id !== target.id);
      const distractors = shuffle(distractorPool)
        .slice(0, 3)
        .map((d) => (d.kanji && d.kanji !== d.kana ? `${d.kana} (${d.kanji})` : d.kana));
      const choices = shuffle(Array.from(new Set([correct, ...distractors])));
      while (choices.length < 4) {
        const extra = items[Math.floor(Math.random() * items.length)].kana;
        if (!choices.includes(extra)) choices.push(extra);
      }
      generated.push({
        id: `v-sv2ja-${target.id}`,
        prompt: `Vad heter "${target.sv}" på japanska?`,
        correctAnswer: correct,
        choices: shuffle(choices.slice(0, 4)),
        explanation: `${target.sv} = ${target.kana}${target.kanji ? ` (${target.kanji})` : ''} [${target.romaji}]`,
      });
    } else if (type === 1) {
      const target = items[(i + 20) % items.length];
      const correct = target.sv;
      const sameType = items.filter((v) => v.id !== target.id && v.wordType === target.wordType);
      const distractorPool =
        sameType.length >= 3 ? sameType : items.filter((v) => v.id !== target.id);
      const distractors = shuffle(distractorPool)
        .slice(0, 3)
        .map((d) => d.sv);
      const choices = shuffle(Array.from(new Set([correct, ...distractors])));
      while (choices.length < 4) {
        const extra = items[Math.floor(Math.random() * items.length)].sv;
        if (!choices.includes(extra)) choices.push(extra);
      }
      generated.push({
        id: `v-ja2sv-${target.id}`,
        prompt: `Vad betyder "${target.kanji || target.kana}"?`,
        correctAnswer: correct,
        choices: shuffle(choices.slice(0, 4)),
        explanation: `${target.kanji || target.kana} (${target.romaji}) betyder: ${target.sv}`,
      });
    } else {
      const target = kanjis[i % kanjis.length];
      const correct = target.meaning_sv;
      const distractors = shuffle(kanjis.filter((k) => k.id !== target.id))
        .slice(0, 3)
        .map((k) => k.meaning_sv);
      const choices = shuffle(Array.from(new Set([correct, ...distractors])));
      while (choices.length < 4) {
        const extra = kanjis[Math.floor(Math.random() * kanjis.length)].meaning_sv;
        if (!choices.includes(extra)) choices.push(extra);
      }
      generated.push({
        id: `v-kanji-${target.id}`,
        prompt: `Vad betyder tecknet 「${target.kanji}」?`,
        correctAnswer: correct,
        choices: shuffle(choices.slice(0, 4)),
        explanation: `Kanji ${target.kanji}: ${target.meaning_sv}. Läsningar: ${[...target.kunyomi, ...target.onyomi].join(', ')}`,
      });
    }
  }
  return generated;
}

function generateWordOrderQuestions(count) {
  const sovPool = extraQuestions.filter((q) => q.topic === 'Ordföljd');
  const generated = [];

  // Scramble templates using parsed vocabulary items
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
      generated.push({
        id: `wo-sentence-${i}`,
        prompt: `Vilken mening har korrekt ordföljd och partiklar för:\n"${t.sv}"?`,
        correctAnswer: t.correct,
        choices: shuffle([t.correct, ...t.distractors]),
        explanation: `Korrekt led: Subjekt (が) + Plats för handling (で) + Objekt (を) + Verb.`,
      });
    } else {
      const q = sovPool[(i + 3) % sovPool.length];
      const correct = q.answers[0] || '×';
      // Create sensible distractors for SOV identification
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
      const filteredParts = possibleParts.filter((p) => p !== correct);
      const distractors = shuffle(filteredParts).slice(0, 3);
      const choices = shuffle(Array.from(new Set([correct, ...distractors])));
      while (choices.length < 4) {
        choices.push(`Alternativ ${choices.length + 1}`);
      }
      generated.push({
        id: `wo-sov-${q.id || i}`,
        prompt: q.prompt,
        correctAnswer: correct,
        choices: shuffle(choices.slice(0, 4)),
        explanation: q.explanation || '',
      });
    }
  }
  return generated;
}

/**
 * Pure evaluation function for answering a round in a game.
 * Evaluates points (+1 for fastest correct, -1 for wrong answer), sets round winner,
 * and determines if round/match has ended.
 */
export function evaluateRound(game, uid, selectedAnswer, now = Date.now()) {
  if (!game || game.status === 'finished') return game;
  const roundIdx = game.currentRoundIndex || 0;
  const currentQ = game.questions[roundIdx];
  if (!currentQ) return game;

  const roundAnswers = { ...(game.answers?.[roundIdx] || {}) };
  if (roundAnswers[uid]) {
    // User already answered this round
    return game;
  }

  const isCorrect = String(selectedAnswer).trim() === String(currentQ.correctAnswer).trim();
  roundAnswers[uid] = {
    answer: selectedAnswer,
    timestamp: now,
    isCorrect,
  };

  const newScores = { ...game.scores };
  const roundWinners = { ...(game.roundWinners || {}) };
  let roundWinner = game.roundWinner || null;

  if (isCorrect) {
    if (!roundWinners[roundIdx]) {
      // First player to answer correctly wins the point!
      roundWinners[roundIdx] = uid;
      roundWinner = uid;
      newScores[uid] = (newScores[uid] || 0) + 1;
    }
  } else {
    // Wrong answer gets -1 point penalty
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

  // Round ends if someone got it right, or both answered
  if (hasWinner || bothAnswered) {
    if (roundIdx >= game.questions.length - 1) {
      // Match is finished!
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
   Firestore Realtime Operations
   ========================================================================= */

/**
 * Creates a new lobby document in Firestore.
 */
export async function createLobby(user, category) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  const code = generateLobbyCode();
  const lobbyRef = doc(db, 'lobbies', code);

  // Fetch host's current elo from leaderboard if exists
  let hostElo = DEFAULT_ELO;
  try {
    const pSnap = await getDoc(doc(db, 'leaderboard', user.uid));
    if (pSnap.exists()) hostElo = pSnap.data().elo || DEFAULT_ELO;
  } catch {}

  const lobbyData = {
    id: code,
    category,
    status: 'waiting',
    createdAt: Date.now(),
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
 * Joins an existing lobby as guest.
 */
export async function joinLobby(lobbyId, user) {
  if (!user || !user.uid) throw new Error('Inloggning krävs');
  const lobbyRef = doc(db, 'lobbies', lobbyId.toUpperCase().trim());

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
    if (data.host.uid === user.uid) return data; // Host rejoining
    if (data.guest && data.guest.uid !== user.uid) throw new Error('Lobbyn är redan full');

    const guestData = {
      uid: user.uid,
      displayName: user.displayName || 'Spelare 2',
      photoURL: user.photoURL || null,
      elo: guestElo,
    };
    tx.update(lobbyRef, { guest: guestData });
    return { ...data, guest: guestData };
  });
}

/**
 * Leaves or cancels a lobby.
 */
export async function leaveLobby(lobbyId, uid) {
  if (!lobbyId || !uid) return;
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  try {
    const snap = await getDoc(lobbyRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.host.uid === uid) {
      await deleteDoc(lobbyRef);
    } else if (data.guest?.uid === uid) {
      await runTransaction(db, async (tx) => {
        tx.update(lobbyRef, { guest: null, status: 'waiting' });
      });
    }
  } catch (err) {
    console.error('Kunde inte lämna lobby:', err);
  }
}

/**
 * Starts match by initializing 10 questions and game state.
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
      status: 'in_progress',
      game,
    });
    return game;
  });
}

/**
 * Submits an answer for a player in the current round.
 */
export async function submitAnswer(lobbyId, uid, roundIndex, selectedAnswer) {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.game || data.game.currentRoundIndex !== roundIndex) return null;

    const updatedGame = evaluateRound(data.game, uid, selectedAnswer, Date.now());
    const isFinished = updatedGame.status === 'finished';

    tx.update(lobbyRef, {
      game: updatedGame,
      status: isFinished ? 'finished' : data.status,
    });

    return updatedGame;
  });
}

/**
 * Advances to next round if the pause timer has elapsed or round timed out.
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
      tx.update(lobbyRef, { game: nextGame });
    } else if (
      data.game.status === 'playing' &&
      data.game.roundStartTime &&
      now - data.game.roundStartTime > ROUND_TIME_MS
    ) {
      // 8-second round timeout with no correct answer: mark round as ended
      const roundIdx = data.game.currentRoundIndex;
      const updated = {
        ...data.game,
        roundWinner: data.game.roundWinners?.[roundIdx] || 'none',
      };
      if (roundIdx >= data.game.questions.length - 1) {
        tx.update(lobbyRef, {
          game: finalizeMatch(updated, now),
          status: 'finished',
        });
      } else {
        updated.status = 'round_end';
        updated.roundEndAt = now;
        updated.nextRoundAt = now + ROUND_PAUSE_MS;
        tx.update(lobbyRef, { game: updated });
      }
    }
  });
}

/**
 * Saves match outcome and updates ELO and win/loss records in the leaderboard.
 */
export async function recordMatchLeaderboard(user, isWinner, isDraw, eloDelta) {
  if (!user || !user.uid) return;
  const leadRef = doc(db, 'leaderboard', user.uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(leadRef);
    const existing = snap.exists()
      ? snap.data()
      : {
          uid: user.uid,
          displayName: user.displayName || 'Anonym',
          photoURL: user.photoURL || null,
          elo: DEFAULT_ELO,
          wins: 0,
          losses: 0,
          draws: 0,
          matchesPlayed: 0,
        };

    const newElo = applyElo(existing.elo, eloDelta);
    const updated = {
      ...existing,
      displayName: user.displayName || existing.displayName,
      photoURL: user.photoURL || existing.photoURL,
      elo: newElo,
      wins: existing.wins + (isWinner ? 1 : 0),
      losses: existing.losses + (!isWinner && !isDraw ? 1 : 0),
      draws: existing.draws + (isDraw ? 1 : 0),
      matchesPlayed: (existing.matchesPlayed || 0) + 1,
      lastPlayed: Date.now(),
    };
    tx.set(leadRef, updated);
    return updated;
  });
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
 * Subscribes to waiting lobbies in real time.
 */
export function subscribeToOpenLobbies(callback) {
  const q = query(collection(db, 'lobbies'), where('status', '==', 'waiting'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const lobbies = [];
    snapshot.forEach((doc) => {
      lobbies.push(doc.data());
    });
    // Sort by newest first
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
