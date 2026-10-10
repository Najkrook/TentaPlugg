import {
  doc,
  collection,
  setDoc,
  increment,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from './cloud.js';
import { observeLobby } from './multiplayer-transport.js';
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
export const MATCH_PROTOCOL_VERSION = 3;
export const START_PREPARATION_MS = 30000;
export const START_COUNTDOWN_MS = 3000;

function answerDocumentId(game, round, uid) {
  return `${game.startVersion > 1 ? `${game.startVersion}_` : ''}${round}_${uid}`;
}

function cancelledStart(data, reason) {
  return {
    status: 'waiting',
    game: null,
    start: { ...data.start, phase: 'waiting', reason },
    players: Object.fromEntries(
      Object.entries(data.players).map(([uid, p]) => [uid, { ...p, score: 0 }]),
    ),
    gameRevision: data.gameRevision + 1,
    gameUpdatedAt: serverTimestamp(),
  };
}

// Confirm only content already delivered to this client. A fresh read
// must never silently acknowledge a newer version than the view has prepared.
export async function acknowledgeMatchStart(lobbyId, uid, observed, stage = 'prepared') {
  const database = db;
  const sessionId = sessions(database).get(`${lobbyId}/${uid}`);
  const ref = doc(database, 'lobbies', lobbyId);
  const data = (await getDocFromServer(ref)).data();
  const clock = getMultiplayerClock(database);
  if (
    !data ||
    !clock.valid ||
    data.start.version !== observed.start.version ||
    data.start.sessions?.[uid] !== sessionId ||
    JSON.stringify(data.game?.questions) !== JSON.stringify(observed.game?.questions)
  )
    return data;
  const phase = stage === 'prepared' ? 'preparing' : 'countdown';
  if (data.start.phase !== phase || data.start[stage][uid]) return data;
  if (stage === 'entered' && clock.now + clock.uncertainty >= data.game.roundStartTime) return data;
  try {
    // Blind field transforms avoid lobby retries. A unary transaction also
    // avoids a persistent write stream per client (WebKit connection limit).
    // Rules bind the update to the observed version and this participant only.
    await runTransaction(database, async (tx) => {
      tx.update(ref, {
        'start.version': observed.start.version,
        [`start.${stage}.${uid}`]: {
          sessionId,
          at: serverTimestamp(),
          uncertainty: clock.uncertainty,
        },
        gameRevision: increment(1),
        gameUpdatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    const latest = (await getDocFromServer(ref)).data();
    if (
      error.code !== 'permission-denied' ||
      (latest?.start?.version === observed.start.version &&
        latest.start.phase === phase &&
        !latest.start[stage][uid])
    )
      throw error;
  }
  return (await getDocFromServer(ref)).data();
}

// Every participant may help complete or cancel a stalled preparation. There is
// no scoring finalization until every client has received the scheduled start.
export async function progressMatchStart(lobbyId, version, cancel = false) {
  const database = db;
  const ref = doc(database, 'lobbies', lobbyId);
  let attemptedRevision;
  return runTransaction(database, async (tx) => {
    const data = (await tx.get(ref)).data();
    if (
      !data ||
      data.start?.version !== version ||
      !['preparing', 'countdown'].includes(data.start.phase)
    )
      return data;
    attemptedRevision = data.gameRevision;
    const clock = getMultiplayerClock(database);
    if (!clock.valid || cancel) {
      const patch = cancelledStart(
        data,
        cancel ? 'Starten avbröts. Försök igen.' : 'Klockan kunde inte synkroniseras. Försök igen.',
      );
      tx.update(ref, patch);
      return { ...data, ...patch };
    }
    const presence = await readPresence(tx, database, lobbyId, data);
    const uids = data.game.playerUids;
    const expired = uids.some(
      (uid) =>
        !isPlayerPresent({ ...data, presence }, uid, clock.now - clock.uncertainty) ||
        presence[uid]?.sessionId !== data.start.sessions[uid],
    );
    const timedOut =
      clock.now - clock.uncertainty >= data.start.createdAt.toMillis() + START_PREPARATION_MS;
    const missedStart =
      data.start.phase === 'countdown' &&
      clock.now - clock.uncertainty >= data.game.roundStartTime &&
      !uids.every((uid) => data.start.entered[uid]);
    let patch;
    if (cancel || expired || timedOut || missedStart) {
      patch = cancelledStart(
        data,
        cancel
          ? 'Starten avbröts. Försök igen.'
          : 'Alla deltagare kunde inte förbereda starten i tid. Försök igen.',
      );
    } else if (data.start.phase === 'preparing' && uids.every((uid) => data.start.prepared[uid])) {
      patch = {
        status: 'playing',
        start: { ...data.start, phase: 'countdown' },
        game: { ...data.game, status: 'playing', roundStartTime: clock.now + START_COUNTDOWN_MS },
        gameRevision: data.gameRevision + 1,
        gameUpdatedAt: serverTimestamp(),
      };
    } else if (data.start.phase === 'countdown' && uids.every((uid) => data.start.entered[uid])) {
      patch = {
        start: { ...data.start, phase: 'confirmed' },
        gameRevision: data.gameRevision + 1,
        gameUpdatedAt: serverTimestamp(),
      };
    } else return { ...data, presence };
    tx.update(ref, patch);
    return { ...data, ...patch, presence };
  }).catch(async (error) => {
    if (error.code !== 'permission-denied') throw error;
    const latest = (await getDocFromServer(ref)).data();
    if (latest?.gameRevision > attemptedRevision) return latest;
    throw error;
  });
}

function requireCurrentProtocol(lobby) {
  if (lobby.protocolVersion !== MATCH_PROTOCOL_VERSION)
    throw new Error('Uppdatera sidan för att använda matchens protokoll');
}

export function getMultiplayerNow() {
  return multiplayerNow(db);
}

// One current connection per participant. Old tabs may observe, but cannot renew it.
const presenceSessions = new WeakMap();
function sessions(database) {
  if (!presenceSessions.has(database)) presenceSessions.set(database, new Map());
  return presenceSessions.get(database);
}
export function isPlayerPresent(lobby, uid, now = getMultiplayerNow()) {
  if (!lobby.presenceVersion)
    return now - (lobby.heartbeat || lobby.createdAt || 0) < HEARTBEAT_TTL_MS;
  const presence = lobby.presence?.[uid];
  return Boolean(presence?.seenAt && now - presence.seenAt.toMillis() < HEARTBEAT_TTL_MS);
}

export async function connectPlayerPresence(lobbyId, uid) {
  const database = db;
  const sessionId = crypto.randomUUID();
  const ref = doc(database, 'lobbies', lobbyId, 'presence', uid);
  const connected = await runTransaction(database, async (tx) => {
    const lobby = (await tx.get(doc(database, 'lobbies', lobbyId))).data();
    const previous = await tx.get(ref);
    if (
      !lobby?.players?.[uid] ||
      lobby.status === 'finished' ||
      lobby.game?.forfeitedUids?.includes(uid)
    )
      return;
    if (
      lobby.status !== 'waiting' &&
      (!previous.exists() ||
        getMultiplayerNow() - previous.data().seenAt.toMillis() >= HEARTBEAT_TTL_MS)
    )
      return;
    tx.set(ref, { uid, sessionId, seenAt: serverTimestamp() });
    return true;
  });
  if (!connected) return null;
  sessions(database).set(`${lobbyId}/${uid}`, sessionId);
  return sessionId;
}

// Read the presence documents in the same transaction as start/forfeit, so a
// renewal racing expiry forces a retry before any score or rating can change.
async function readPresence(tx, database, lobbyId, data) {
  const uids = Object.keys(data.players || {});
  const snapshots = await Promise.all(
    uids.map((uid) => tx.get(doc(database, 'lobbies', lobbyId, 'presence', uid))),
  );
  return Object.fromEntries(uids.map((uid, i) => [uid, snapshots[i].data()]));
}

export async function expireDisconnectedPlayers(lobbyId) {
  const database = db;
  if (!isMultiplayerClockValid(database)) return;
  const ref = doc(database, 'lobbies', lobbyId);
  // Each forfeit is its own atomic transition; each retry rechecks membership,
  // presence and finished state. All callers can safely help after host loss.
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const changed = await runTransaction(database, async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (
        !data?.presenceVersion ||
        !data.game ||
        data.game.status === 'finished' ||
        data.start?.phase !== 'confirmed'
      )
        return false;
      const presence = await readPresence(tx, database, lobbyId, data);
      const clock = getMultiplayerClock(database);
      if (!clock.valid) return false;
      const expired = getActivePlayerUids(data.game).find(
        (uid) => !isPlayerPresent({ ...data, presence }, uid, clock.now - clock.uncertainty),
      );
      if (!expired) return false;
      await applyForfeitInTransaction(tx, ref, data, expired, clock.now);
      return true;
    }).catch(async (error) => {
      // Firestore may evaluate the exactly-once rating rule before reporting a
      // competing commit as a transaction conflict. Reconcile its durable result.
      if (error.code !== 'permission-denied') throw error;
      const latest = await getDocFromServer(ref);
      if (latest.data()?.game?.status === 'finished') return false;
      throw error;
    });
    if (!changed) break;
  }
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
    protocolVersion: MATCH_PROTOCOL_VERSION,
    gameRevision: 0,
    start: { version: 0, phase: 'waiting' },
    presenceVersion: 1,
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
  await connectPlayerPresence(code, user.uid);
  return code;
}

/**
 * Renews only the current participant connection, without rewriting the lobby.
 */
export async function sendHeartbeat(
  lobbyId,
  uid,
  sessionId = sessions(db).get(`${lobbyId}/${uid}`),
) {
  if (!lobbyId || !uid || !sessionId) return false;
  const database = db;
  const ref = doc(database, 'lobbies', lobbyId, 'presence', uid);
  return runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().sessionId !== sessionId) return false;
    tx.update(ref, { seenAt: serverTimestamp() });
    return true;
  });
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

  const joined = await runTransaction(db, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn hittades inte');
    const data = snap.data();
    if (data.status !== 'waiting') throw new Error('Matchen har redan startat');
    requireCurrentProtocol(data);
    const presence = await readPresence(tx, db, cleanId, data);
    if (!isPlayerPresent({ ...data, presence }, data.host.uid))
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

    if (currentPlayers[user.uid]) return { ...data, presence };

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
    return { ...data, ...updatePayload, presence };
  });
  await connectPlayerPresence(cleanId, user.uid);
  return joined;
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

      if (data.start?.phase === 'preparing' || data.start?.phase === 'countdown') {
        const patch = cancelledStart(data, 'En deltagare lämnade. Försök igen.');
        if (isHost) tx.delete(lobbyRef);
        else {
          delete patch.players[uid];
          patch.playerCount = Object.keys(patch.players).length;
          patch.guest = Object.values(patch.players).find((p) => p.uid !== data.host.uid) || null;
          tx.update(lobbyRef, patch);
        }
        return;
      }

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
 * Prepares ten questions; every participant must acknowledge before countdown.
 * Host can start match as soon as at least 2 players have joined.
 */
export async function startMatch(lobbyId) {
  const database = db;
  let attemptedVersion;
  const lobbyRef = doc(database, 'lobbies', lobbyId);
  return runTransaction(database, async (tx) => {
    const snap = await tx.get(lobbyRef);
    if (!snap.exists()) throw new Error('Lobbyn finns inte');
    const data = snap.data();
    requireCurrentProtocol(data);
    attemptedVersion = data.start.version;
    if (data.status !== 'waiting') return data;

    const clock = getMultiplayerClock(database);
    if (!clock.valid) {
      throw new Error('Kunde inte starta: matchklockan är inte synkroniserad');
    }

    const playersMap = {
      ...(data.players || {
        [data.host.uid]: { ...data.host, joinedAt: getMultiplayerNow(), score: 0 },
        ...(data.guest
          ? { [data.guest.uid]: { ...data.guest, joinedAt: getMultiplayerNow(), score: 0 } }
          : {}),
      }),
    };

    const presence = await readPresence(tx, database, lobbyId, data);
    if (!isPlayerPresent({ ...data, presence }, data.host.uid))
      throw new Error('Värden är inte längre ansluten');
    for (const uid of Object.keys(playersMap)) {
      if (!isPlayerPresent({ ...data, presence }, uid)) delete playersMap[uid];
    }
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

    const guestUid = Object.keys(playersMap).find((id) => id !== data.host.uid) || null;

    const game = {
      protocolVersion: MATCH_PROTOCOL_VERSION,
      questions: questionsList,
      currentRoundIndex: 0,
      roundStartTime: null,
      startVersion: (data.start?.version || 0) + 1,
      firstAnswerAt: null,
      roundDeadline: null,
      hostUid: data.host.uid,
      guestUid,
      hostElo: data.host.elo || DEFAULT_ELO,
      guestElo: playersMap[guestUid]?.elo || DEFAULT_ELO,
      playerUids: Object.keys(playersMap),
      scores: initialScores,
      answers: {},
      roundWinners: {},
      roundWinner: null,
      status: 'preparing',
    };

    const patch = {
      status: 'preparing',
      start: {
        version: game.startVersion,
        phase: 'preparing',
        createdAt: serverTimestamp(),
        sessions: Object.fromEntries(
          Object.keys(playersMap).map((uid) => [uid, presence[uid].sessionId]),
        ),
        prepared: {},
        entered: {},
        reason: '',
      },
      gameRevision: data.gameRevision + 1,
      gameUpdatedAt: serverTimestamp(),
      players: playersMap,
      playerCount: count,
      guest: playersMap[guestUid] || null,
      game,
      updatedAt: now,
    };
    tx.update(lobbyRef, patch);
    return { ...data, ...patch, presence };
  }).catch(async (error) => {
    if (error.code !== 'permission-denied') throw error;
    const latest = (await getDocFromServer(lobbyRef)).data();
    // Rules can see a competing start before Firestore reports the conflict.
    if (latest?.start?.version > attemptedVersion) return latest;
    throw error;
  });
}

/**
 * Deterministic reduction of immutable receipts. Rebuild only the current round:
 * subtract its previous points first, so retries never award points twice.
 * Equal server timestamps are ordered by UID (code-point order); time points tie.
 */
export function summarizeRoundReceipts(game, receipts, now, playersMap = null, close = true) {
  if (game.status !== 'playing') return game;
  const round = game.currentRoundIndex;
  const previous = game.answers?.[round] || {};
  const scores = { ...game.scores };
  for (const [uid, answer] of Object.entries(previous)) {
    if (!game.forfeitedUids?.includes(uid)) scores[uid] -= answer.pointsAwarded;
  }
  const ordered = receipts
    .filter(
      (r) =>
        r &&
        r.protocolVersion === MATCH_PROTOCOL_VERSION &&
        r.startVersion === game.startVersion &&
        r.roundIndex === round &&
        game.playerUids.includes(r.uid) &&
        r.receivedAt?.toMillis() >= game.roundStartTime,
    )
    .sort(
      (a, b) =>
        a.receivedAt.toMillis() - b.receivedAt.toMillis() ||
        (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0),
    );
  const first = ordered[0]?.receivedAt.toMillis();
  const firstAnswerAt = first < game.roundStartTime + IDLE_ROUND_TIME_MS ? first : null;
  const deadline = getRoundDeadline({ ...game, firstAnswerAt });
  const answers = {};
  let winner = null;
  for (const receipt of ordered) {
    const timestamp = receipt.receivedAt.toMillis();
    if (timestamp >= deadline || firstAnswerAt == null) continue;
    const isCorrect = isAnswerCorrect(game.questions[round], receipt.answer);
    const pointsAwarded = calculateTimePoints(isCorrect, timestamp - firstAnswerAt);
    answers[receipt.uid] = { ...receipt, timestamp, isCorrect, pointsAwarded };
    if (!game.forfeitedUids?.includes(receipt.uid)) {
      scores[receipt.uid] = (scores[receipt.uid] || 0) + pointsAwarded;
      if (isCorrect && winner == null) winner = receipt.uid;
    }
  }
  const roundWinners = { ...game.roundWinners };
  if (winner) roundWinners[round] = winner;
  else delete roundWinners[round];
  const updated = {
    ...game,
    scores,
    answers: { ...game.answers, [round]: answers },
    firstAnswerAt,
    roundDeadline: firstAnswerAt == null ? null : deadline,
    roundWinner: winner,
    roundWinners,
  };
  return close && (now >= deadline || getActivePlayerUids(game).every((uid) => answers[uid]))
    ? closeRound(updated, now, playersMap)
    : updated;
}

async function readRoundReceipts(tx, database, lobbyId, game) {
  const snapshots = await Promise.all(
    game.playerUids.map((uid) =>
      tx.get(
        doc(
          database,
          'lobbies',
          lobbyId,
          'answers',
          answerDocumentId(game, game.currentRoundIndex, uid),
        ),
      ),
    ),
  );
  return snapshots.map((snap) => snap.data()).filter(Boolean);
}

/**
 * Receive independently of the shared lobby transaction, then reconcile. The
 * receipt document is create-only and its receivedAt must equal request.time.
 * Even if this caller disappears, any participant can complete the reduction.
 */
export async function submitPlayerAnswer(
  lobbyId,
  uid,
  roundIndex,
  selectedAnswer,
  attemptId = crypto.randomUUID(),
  expectedStartVersion = null,
) {
  const database = db;
  const initial = (await getDocFromServer(doc(database, 'lobbies', lobbyId))).data();
  if (!initial?.game) return { status: 'closed' };
  const startVersion = expectedStartVersion ?? initial.game.startVersion;
  if (initial.game.startVersion !== startVersion) return { status: 'stale-round' };
  const answerRef = doc(
    database,
    'lobbies',
    lobbyId,
    'answers',
    answerDocumentId(initial.game, roundIndex, uid),
  );
  const lobbyRef = doc(database, 'lobbies', lobbyId);
  let status;
  try {
    const reception = await runTransaction(database, async (tx) => {
      const receipt = (await tx.get(answerRef)).data();
      if (receipt) return { status: 'already-received' };
      // This read is deliberately outside the transaction's conflict set. Rules
      // validate current membership/round at commit; other answers do not retry
      // this receipt. Only a duplicate for this same participant can conflict.
      const data = (await getDocFromServer(lobbyRef)).data();
      if (!data?.game) return { status: 'closed' };
      requireCurrentProtocol(data);
      const game = data.game;
      if (!isMultiplayerClockValid(database))
        return { status: 'rejected', reason: 'clock-invalid' };
      if (game.currentRoundIndex !== roundIndex) return { status: 'stale-round' };
      if (game.status !== 'playing' || data.start.phase !== 'confirmed')
        return { status: 'closed' };
      if (
        game.startVersion !== startVersion ||
        !getActivePlayerUids(game).includes(uid) ||
        multiplayerNow(database) < game.roundStartTime
      )
        return { status: 'rejected' };
      // An unsummarized first receipt near 60s can extend the window by eight seconds.
      tx.set(answerRef, {
        protocolVersion: MATCH_PROTOCOL_VERSION,
        startVersion,
        uid,
        roundIndex,
        answer: selectedAnswer,
        attemptId,
        receivedAt: serverTimestamp(),
      });
      return { status: 'accepted' };
    });
    if (!['accepted', 'already-received'].includes(reception.status)) return reception;
    status = reception.status;
  } catch (error) {
    if (error.code !== 'permission-denied') throw error;
    const receipt = (await getDocFromServer(answerRef)).data();
    if (!receipt) {
      const latest = (await getDocFromServer(lobbyRef)).data()?.game;
      if (latest?.currentRoundIndex !== roundIndex) return { status: 'stale-round' };
      if (latest?.status !== 'playing') return { status: 'closed' };
      const upperBound =
        latest.firstAnswerAt == null
          ? latest.roundStartTime + IDLE_ROUND_TIME_MS + ROUND_TIME_MS
          : getRoundDeadline(latest);
      if (multiplayerNow(database) >= upperBound) return { status: 'late' };
      throw error; // A transport/permission failure is not evidence of a late answer.
    }
    status = 'already-received';
  }
  const game = await reconcileMatch(lobbyId, database);
  const answer = game?.answers?.[roundIndex]?.[uid];
  if (answer && !answer.timedOut) return { status, answer };
  return { status: 'late' };
}

export const submitAnswer = submitPlayerAnswer;

/** Read every participant's receipt, including absent documents, in the same
 * transaction as closing. A racing receipt forces a retry before timeout or ELO.
 */
async function reconcileMatch(lobbyId, database, retries = MAX_PLAYERS * 2) {
  const lobbyRef = doc(database, 'lobbies', lobbyId);
  let attemptedRevision;
  try {
    return await runTransaction(database, async (tx) => {
      const data = (await tx.get(lobbyRef)).data();
      if (!data?.game) return null;
      attemptedRevision = data.gameRevision;
      requireCurrentProtocol(data);
      const game = data.game;
      if (game.status === 'finished' || data.start?.phase !== 'confirmed') return game;
      const clock = getMultiplayerClock(database);
      if (!clock.valid) throw new Error('Matchklockan behöver synkroniseras före sammanställning');
      // Closing must not run ahead of server time within clock uncertainty.
      const now = clock.now - clock.uncertainty;
      let updated = game;
      if (game.status === 'playing') {
        const receipts = await readRoundReceipts(tx, database, lobbyId, game);
        updated = summarizeRoundReceipts(game, receipts, now, data.players);
      } else if (clock.valid && game.status === 'round_end' && now >= game.nextRoundAt) {
        updated = advanceToNextRound(game, clock.now);
      }
      if (JSON.stringify(updated) === JSON.stringify(game)) return game;
      const players = { ...data.players };
      for (const uid of Object.keys(updated.scores))
        if (players[uid]) players[uid] = { ...players[uid], score: updated.scores[uid] };
      if (updated.status === 'finished') {
        await finishMatchInTransaction(
          tx,
          lobbyRef,
          lobbyId,
          updated,
          clock.now,
          players,
          database,
          data.gameRevision + 1,
        );
      } else {
        tx.update(lobbyRef, {
          game: updated,
          players,
          status: updated.status,
          gameRevision: data.gameRevision + 1,
          gameUpdatedAt: serverTimestamp(),
          updatedAt: clock.now,
        });
      }
      return updated;
    });
  } catch (error) {
    // Competing finalizers can meet the exactly-once rating rule before Firestore
    // reports the optimistic conflict. Only a durable finish reconciles that error.
    if (error.code !== 'permission-denied') throw error;
    const latest = (await getDocFromServer(lobbyRef)).data();
    if (latest?.game?.status === 'finished') return latest.game;
    if (retries > 0 && latest?.gameRevision > attemptedRevision)
      return reconcileMatch(lobbyId, database, retries - 1);
    throw error;
  }
}

export async function advanceRoundIfDue(lobbyId) {
  return reconcileMatch(lobbyId, db);
}

/**
 * Handles match forfeit inside an active transaction.
 */
async function applyForfeitInTransaction(tx, lobbyRef, lobbyData, forfeitingUid, now) {
  requireCurrentProtocol(lobbyData);
  const receipts = await readRoundReceipts(tx, lobbyRef.firestore, lobbyData.id, lobbyData.game);
  const game = summarizeRoundReceipts(lobbyData.game, receipts, now, lobbyData.players, false);
  const activeUids = getActivePlayerUids(game);
  if (!activeUids.includes(forfeitingUid)) return;

  // Keep all participants for final ratings, but no longer wait for a departed player's answers.
  const scores = { ...game.scores, [forfeitingUid]: -9999 };
  const playersMap = { ...(lobbyData.players || {}) };
  for (const uid of Object.keys(scores))
    if (playersMap[uid]) playersMap[uid] = { ...playersMap[uid], score: scores[uid] };
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
    await finishMatchInTransaction(
      tx,
      lobbyRef,
      lobbyData.id,
      updated,
      now,
      playersMap,
      lobbyRef.firestore,
      lobbyData.gameRevision + 1,
    );
  } else {
    tx.update(lobbyRef, {
      game: updated,
      gameRevision: lobbyData.gameRevision + 1,
      gameUpdatedAt: serverTimestamp(),
      players: playersMap,
      status: updated.status,
      updatedAt: now,
    });
  }
}

/**
 * Atomically updates all players' leaderboard records in the transaction.
 */
async function finishMatchInTransaction(
  tx,
  lobbyRef,
  matchId,
  game,
  now,
  playersMap = null,
  database = lobbyRef.firestore,
  gameRevision,
) {
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
  const refs = uniqueUids.map((uid) => doc(database, 'leaderboard', uid));
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
    gameRevision,
    gameUpdatedAt: serverTimestamp(),
    game,
    updatedAt: now,
    ...(playersMap ? { players: playersMap } : {}),
  });
}

/**
 * Subscribes to live updates for a single lobby.
 */
export function subscribeToLobby(lobbyId, callback, onError) {
  let lobby = null;
  let presence = {};
  let receipts = [];
  let lobbyLoaded = false;
  let presenceLoaded = false;
  const publish = () => {
    if (lobbyLoaded && presenceLoaded)
      callback(
        lobby
          ? {
              ...lobby,
              presence,
              receiptsPending:
                lobby.game?.status === 'playing' &&
                receipts.some(
                  (r) =>
                    r.startVersion === lobby.game.startVersion &&
                    r.roundIndex === lobby.game.currentRoundIndex &&
                    !lobby.game.answers?.[r.roundIndex]?.[r.uid],
                ),
            }
          : null,
      );
  };
  const stopReceipts = onSnapshot(
    collection(db, 'lobbies', lobbyId, 'answers'),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      receipts = snap.docs.map((r) => r.data());
      publish();
    },
    onError,
  );
  const stopPresence = onSnapshot(
    collection(db, 'lobbies', lobbyId, 'presence'),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      presence = Object.fromEntries(snap.docs.map((p) => [p.id, p.data()]));
      presenceLoaded = true;
      publish();
    },
    onError,
  );
  const stopLobby = observeLobby(
    doc(db, 'lobbies', lobbyId),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      lobby = snap.exists() ? snap.data() : null;
      lobbyLoaded = true;
      publish();
    },
    onError,
  );
  return () => {
    stopReceipts();
    stopLobby();
    stopPresence();
  };
}

/**
 * Subscribes to waiting lobbies in real time, filtering out abandoned/full lobbies.
 */
export function subscribeToOpenLobbies(callback, onError) {
  const q = query(collection(db, 'lobbies'), where('status', '==', 'waiting'));
  let waiting = [];
  const watches = new Map();
  const presences = new Map();
  const publish = () => {
    const now = getMultiplayerNow();
    callback(
      waiting
        .map((data) => ({
          ...data,
          readyCount: data.presenceVersion
            ? Object.values(data.players || {}).filter(
                (p) =>
                  p.ready !== false &&
                  isPlayerPresent({ ...data, presence: presences.get(data.id) }, p.uid, now),
              ).length
            : data.playerCount || (data.guest ? 2 : 1),
        }))
        .filter((data) => {
          const count = data.playerCount || (data.guest ? 2 : 1);
          const isFull = count >= MAX_PLAYERS;
          const isFresh = isPlayerPresent(
            { ...data, presence: presences.get(data.id) },
            data.host.uid,
            now,
          );
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
      for (const [id, stop] of watches) {
        if (!waiting.some((lobby) => lobby.id === id)) {
          stop();
          watches.delete(id);
          presences.delete(id);
        }
      }
      for (const lobby of waiting) {
        if (!lobby.presenceVersion || watches.has(lobby.id)) continue;
        watches.set(
          lobby.id,
          onSnapshot(
            collection(db, 'lobbies', lobby.id, 'presence'),
            { includeMetadataChanges: true },
            (snap) => {
              if (snap.metadata.hasPendingWrites) return;
              presences.set(lobby.id, Object.fromEntries(snap.docs.map((p) => [p.id, p.data()])));
              publish();
            },
            onError,
          ),
        );
      }
      publish();
    },
    onError,
  );
  const expiryTimer = setInterval(publish, 1000);
  return () => {
    unsubscribe();
    clearInterval(expiryTimer);
    for (const stop of watches.values()) stop();
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
