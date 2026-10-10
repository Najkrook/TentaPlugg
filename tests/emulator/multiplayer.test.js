import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { useDatabase } from './multiplayer-db.js';
import { interceptCommit } from './multiplayer-firestore.js';

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === 'firebase/firestore' &&
      context.parentURL === new URL('../../src/multiplayer.js', import.meta.url).href
    ) {
      return {
        url: new URL('./multiplayer-firestore.js', import.meta.url).href,
        shortCircuit: true,
      };
    }
    if (
      specifier === './cloud.js' &&
      context.parentURL === new URL('../../src/multiplayer.js', import.meta.url).href
    ) {
      return { url: new URL('./multiplayer-db.js', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const mp = await import('../../src/multiplayer.js');
hooks.deregister();
let env;
let sequence = 0;
before(async () => {
  assert(process.env.FIRESTORE_EMULATOR_HOST, 'Only run against the local emulator');
  env = await initializeTestEnvironment({
    projectId: 'demo-tentaplugg',
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
});
after(async () => env?.cleanup());

async function completeStart(code, users, as, database) {
  await as(0, () => mp.startMatch(code));
  const read = async () => (await getDoc(doc(database, 'lobbies', code))).data();
  for (let i = 0; i < users.length; i++) {
    const observed = await read();
    await as(i, () => mp.acknowledgeMatchStart(code, users[i].uid, observed));
  }
  const version = (await read()).start.version;
  await as(0, () => mp.progressMatchStart(code, version));
  for (let i = 0; i < users.length; i++) {
    const observed = await read();
    await as(i, () => mp.acknowledgeMatchStart(code, users[i].uid, observed, 'entered'));
  }
  await as(0, () => mp.progressMatchStart(code, version));
  assert.equal((await read()).start.phase, 'confirmed');
}

async function match(count, start = true) {
  const prefix = `arena-${++sequence}`;
  const users = Array.from({ length: count }, (_, i) => ({
    uid: `${prefix}-${i}`,
    displayName: `Player ${i}`,
  }));
  const databases = users.map((u) => env.authenticatedContext(u.uid).firestore());
  async function as(index, action) {
    useDatabase(databases[index]);
    return action();
  }
  const code = await as(0, () => mp.createLobby(users[0], 'particles'));
  for (let i = 1; i < count; i++) await as(i, () => mp.joinLobby(code, users[i]));
  if (start) await completeStart(code, users, as, databases[0]);
  const ref = doc(databases[0], 'lobbies', code);
  return {
    code,
    users,
    as,
    read: async () => (await getDoc(ref)).data(),
    update: (patch) =>
      updateDoc(ref, { ...patch, gameRevision: increment(1), gameUpdatedAt: serverTimestamp() }),
    profile: async (i) => (await getDoc(doc(databases[0], 'leaderboard', users[i].uid))).data(),
    answerDocument: async (i, round) =>
      getDoc(doc(databases[0], 'lobbies', code, 'answers', `${round}_${users[i].uid}`)),
  };
}

test('ten players finish the last round with every answer and rating saved exactly once', async () => {
  const m = await match(10);
  await m.update({ 'game.currentRoundIndex': 9, 'game.roundStartTime': Date.now() - 100 });
  const answer = (await m.read()).game.questions[9].correctAnswer;
  for (let i = 0; i < 10; i++) {
    await m.as(i, () => mp.submitPlayerAnswer(m.code, m.users[i].uid, 9, answer));
  }
  const finished = await m.read();
  assert.equal(finished.status, 'finished');
  assert.equal(Object.keys(finished.game.answers[9]).length, 10);
  for (let i = 0; i < 10; i++) {
    const uid = m.users[i].uid;
    assert((await m.answerDocument(i, 9)).exists());
    assert(finished.game.scores[uid] > 0);
    assert.equal(finished.players[uid].score, finished.game.scores[uid]);
    assert.equal((await m.profile(i)).matchesPlayed, 1);
  }
  await m.as(9, () => mp.submitPlayerAnswer(m.code, m.users[9].uid, 9, answer));
  await m.as(0, () => mp.advanceRoundIfDue(m.code));
  assert.deepEqual(await m.read(), finished);
  assert.equal((await m.profile(9)).matchesPlayed, 1);
});

test('simultaneous answers: ten receipts survive contention without false timeouts', async () => {
  const m = await match(10);
  await m.update({ 'game.roundStartTime': Date.now() - 100 });
  const answer = (await m.read()).game.questions[0].correctAnswer;
  const receipts = await Promise.all(
    m.users.map((user, i) => m.as(i, () => mp.submitPlayerAnswer(m.code, user.uid, 0, answer))),
  );
  assert.equal(receipts.filter((r) => r.status === 'accepted').length, 10);
  const saved = await m.read();
  for (let i = 0; i < 10; i++) {
    assert((await m.answerDocument(i, 0)).exists());
    assert.equal(saved.game.answers[0][m.users[i].uid].timedOut, undefined);
    assert.equal(saved.game.answers[0][m.users[i].uid].isCorrect, true);
  }
});

test('received answers survive a forced commit conflict after deadline, including final ratings', async () => {
  const m = await match(3);
  const now = Date.now();
  await m.update({ 'game.currentRoundIndex': 9, 'game.roundStartTime': now - 20000 });
  await seedReceipt(m, 0, 9, now - 12000);
  await seedReceipt(m, 1, 9, now - 12000); // exact tie: UID decides winner, points tie
  await seedReceipt(m, 2, 9, now - 4001); // one millisecond before the deadline
  const immutable = await Promise.all(
    m.users.map((_, i) => m.answerDocument(i, 9).then((s) => s.data())),
  );
  let attempts = 0;
  interceptCommit(async () => {
    if (++attempts === 1) {
      // Change a document read by the real transaction immediately before commit.
      await env.withSecurityRulesDisabled((context) =>
        updateDoc(doc(context.firestore(), 'lobbies', m.code), { updatedAt: Date.now() }),
      );
    }
  });
  try {
    await m.as(1, () => mp.advanceRoundIfDue(m.code));
  } finally {
    interceptCommit(null);
  }
  assert(attempts >= 2, `Expected a real transaction retry, got ${attempts}`);
  const game = (await m.read()).game;
  assert.equal(game.status, 'finished');
  assert.equal(game.firstAnswerAt, now - 12000);
  assert.equal(game.roundDeadline, now - 4000);
  assert.equal(game.roundWinners[9], m.users[0].uid);
  for (let i = 0; i < 3; i++) {
    const answer = game.answers[9][m.users[i].uid];
    assert.equal(answer.pointsAwarded, mp.calculateTimePoints(true, i === 2 ? 7999 : 0));
    assert.equal(answer.timedOut, undefined);
    assert.deepEqual((await m.answerDocument(i, 9)).data(), immutable[i]);
    assert.equal((await m.profile(i)).matchesPlayed, 1);
  }
  await m.as(0, () => Promise.all([mp.advanceRoundIfDue(m.code), mp.advanceRoundIfDue(m.code)]));
  for (let i = 0; i < 3; i++) assert.equal((await m.profile(i)).matchesPlayed, 1);
});

test('server receipts exactly on and after the deadline are excluded, before is included', async () => {
  const m = await match(4);
  const now = Date.now();
  await m.update({ 'game.roundStartTime': now - 20000 });
  for (const [i, offset] of [0, 7999, 8000, 8001].entries())
    await seedReceipt(m, i, 0, now - 10000 + offset);
  await m.as(0, () => Promise.all([mp.advanceRoundIfDue(m.code), mp.advanceRoundIfDue(m.code)]));
  const game = (await m.read()).game;
  assert.equal(game.answers[0][m.users[1].uid].pointsAwarded, 200);
  for (const i of [2, 3]) assert.equal(game.answers[0][m.users[i].uid].timedOut, true);
  assert.equal(game.firstAnswerAt, now - 10000);
});

test('two participants finalize the same last-round receipts atomically once', async () => {
  const m = await match(10);
  const now = Date.now();
  await m.update({ 'game.currentRoundIndex': 9, 'game.roundStartTime': now - 1000 });
  for (let i = 0; i < 10; i++) await seedReceipt(m, i, 9, now);
  await Promise.all([
    m.as(0, () => mp.advanceRoundIfDue(m.code)),
    m.as(1, () => mp.advanceRoundIfDue(m.code)),
  ]);
  const saved = await m.read();
  assert.equal(saved.game.status, 'finished');
  for (let i = 0; i < 10; i++) {
    assert.equal(saved.game.answers[9][m.users[i].uid].pointsAwarded, 1000);
    assert.equal(saved.players[m.users[i].uid].score, 1000);
    assert.equal((await m.profile(i)).matchesPlayed, 1);
    assert.equal((await m.profile(i)).draws, 1);
    assert.equal((await m.profile(i)).elo, 1200);
  }
});

test('forfeit reduces already received answers and keeps lobby scores in sync', async () => {
  const m = await match(3);
  const now = Date.now();
  await m.update({ 'game.roundStartTime': now - 1000 });
  await seedReceipt(m, 0, 0, now);
  await seedReceipt(m, 1, 0, now);
  await m.as(2, () => mp.leaveLobby(m.code, m.users[2].uid));
  const saved = await m.read();
  assert.equal(saved.game.status, 'round_end');
  for (const i of [0, 1]) {
    assert.equal(saved.game.scores[m.users[i].uid], 1000);
    assert.equal(saved.players[m.users[i].uid].score, 1000);
  }
});

test('receipt rules bind owner, version, round, identity, choice and immutable server time', async () => {
  const m = await match(2);
  await m.update({ 'game.roundStartTime': Date.now() - 100 });
  const database = env.authenticatedContext(m.users[0].uid).firestore();
  const ref = doc(database, 'lobbies', m.code, 'answers', `0_${m.users[0].uid}`);
  const raw = {
    protocolVersion: 3,
    startVersion: 1,
    uid: m.users[0].uid,
    roundIndex: 0,
    answer: 'A',
    attemptId: 'stable',
    receivedAt: serverTimestamp(),
  };
  for (const patch of [
    { protocolVersion: 1 },
    { uid: m.users[1].uid },
    { roundIndex: 1 },
    { receivedAt: Timestamp.fromMillis(Date.now() - 1000) },
  ])
    await assertFails(setDoc(ref, { ...raw, ...patch }));
  await assertFails(setDoc(doc(database, 'lobbies', m.code, 'answers', 'wrong-id'), raw));
  const outsider = env.authenticatedContext('outsider-receipts').firestore();
  await assertFails(
    setDoc(doc(outsider, 'lobbies', m.code, 'answers', '0_outsider-receipts'), {
      ...raw,
      uid: 'outsider-receipts',
    }),
  );
  const before = await m.read();
  await setDoc(ref, raw);
  assert.deepEqual(await m.read(), before, 'Receiving must not update the lobby');
  const saved = (await getDoc(ref)).data();
  await setDoc(ref, saved); // exact idempotent retransmission
  for (const patch of [{ answer: 'B' }, { attemptId: 'other' }, { receivedAt: serverTimestamp() }])
    await assertFails(updateDoc(ref, patch));
  const lobbyRef = doc(database, 'lobbies', m.code);
  await assertFails(updateDoc(lobbyRef, { 'game.firstAnswerAt': Date.now() }));
  await assertFails(updateDoc(lobbyRef, { protocolVersion: 1 }));
  await assertFails(updateDoc(lobbyRef, { 'game.protocolVersion': 1, gameRevision: increment(1) }));
  const guest = env.authenticatedContext(m.users[1].uid).firestore();
  const guestRef = doc(guest, 'lobbies', m.code, 'answers', `0_${m.users[1].uid}`);
  const guestReceipt = { ...raw, uid: m.users[1].uid };
  await m.update({ 'game.roundStartTime': Date.now() + 10000 });
  await assertFails(setDoc(guestRef, guestReceipt));
  await m.update({
    'game.roundStartTime': Date.now() - 20000,
    'game.firstAnswerAt': Date.now() - 9000,
  });
  await assertFails(setDoc(guestRef, guestReceipt));
});

test('legacy finished results remain readable without migrating their protocol', async () => {
  const m = await match(2);
  await m.as(0, () => mp.leaveLobby(m.code, m.users[0].uid));
  const finished = await m.read();
  const legacy = { ...finished, id: `${m.code}-legacy`, game: { ...finished.game } };
  delete legacy.protocolVersion;
  delete legacy.game.protocolVersion;
  await env.withSecurityRulesDisabled((context) =>
    setDoc(doc(context.firestore(), 'lobbies', legacy.id), legacy),
  );
  const reader = env.authenticatedContext(m.users[1].uid).firestore();
  assert.deepEqual((await getDoc(doc(reader, 'lobbies', legacy.id))).data(), legacy);
});

test('answer receipts reconcile a lost acknowledgement without changing the first choice or score', async () => {
  const m = await match(2);
  await m.update({ 'game.roundStartTime': Date.now() - 100 });
  const question = (await m.read()).game.questions[0];
  const submit = (choice, id = 'first-attempt') =>
    m.as(0, () => mp.submitPlayerAnswer(m.code, m.users[0].uid, 0, choice, id));
  const receipt = await submit(question.correctAnswer);
  assert.equal(receipt.status, 'accepted');
  assert.equal(receipt.answer.attemptId, 'first-attempt');
  const saved = await m.read();
  // The caller discards the first receipt and retries the stable attempt.
  assert.deepEqual(await submit(question.correctAnswer), {
    status: 'already-received',
    answer: receipt.answer,
  });
  assert.deepEqual(await submit('different choice', 'second-attempt'), {
    status: 'already-received',
    answer: receipt.answer,
  });
  assert.deepEqual(await m.read(), saved);
  const raw = (await m.answerDocument(0, 0)).data();
  assert.equal(raw.answer, receipt.answer.answer);
  assert.equal(raw.receivedAt.toMillis(), receipt.answer.timestamp);
  await m.update({ 'game.currentRoundIndex': 1 });
  assert.equal((await submit(question.correctAnswer)).status, 'already-received');
  assert.equal(
    (await m.as(1, () => mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, 'x'))).status,
    'stale-round',
  );
});

test('answer receipts distinguish late, closed and rejected rounds', async () => {
  const m = await match(3);
  let player = 0;
  const submit = () =>
    m.as(player, () => mp.submitPlayerAnswer(m.code, m.users[player].uid, 0, 'x'));
  await m.update({ 'game.roundStartTime': Date.now() - 61000 });
  assert.equal((await submit()).status, 'late');
  player = 1;
  await m.update({ 'game.status': 'round_end' });
  assert.equal((await submit()).status, 'closed');
  await m.update({ 'game.status': 'playing', 'game.roundStartTime': Date.now() + 10000 });
  assert.equal((await submit()).status, 'rejected');
  assert.equal((await m.answerDocument(1, 0)).exists(), false);
});

test('answer API rejects submissions during the initial countdown', async () => {
  const m = await match(2);
  await m.update({ 'game.roundStartTime': Date.now() + 3000 });
  const answer = (await m.read()).game.questions[0].correctAnswer;
  await m.as(1, () => mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, answer));
  assert.equal((await m.answerDocument(1, 0)).exists(), false);
  assert.equal((await m.read()).game.scores[m.users[1].uid], 0);
});

test('first answer near the idle limit still gives opponents eight seconds', async () => {
  const m = await match(2);
  const now = Date.now();
  await m.update({ 'game.roundStartTime': now - 60000 });
  await seedReceipt(m, 0, 0, now - 1000);
  await m.as(0, () => mp.advanceRoundIfDue(m.code));
  assert.equal((await m.read()).game.status, 'playing');
  const answer = (await m.read()).game.questions[0].correctAnswer;
  await m.as(1, () => mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, answer));
  assert.equal((await m.read()).game.answers[0][m.users[1].uid].isCorrect, true);
});

test('different wall clocks do not reject timely answers or prematurely expire rounds', async (t) => {
  const m = await match(3);
  await m.update({ 'game.roundStartTime': Date.now() - 1000 });
  const answer = (await m.read()).game.questions[0].correctAnswer;
  const realNow = Date.now.bind(Date);
  t.mock.method(Date, 'now', () => realNow() - 10000);
  await m.as(1, () => mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, answer));
  Date.now.mock.restore();
  await m.as(0, () => mp.advanceRoundIfDue(m.code));
  assert.equal((await m.read()).game.status, 'playing');
  t.mock.method(Date, 'now', () => realNow() + 10000);
  await m.as(2, () => mp.submitPlayerAnswer(m.code, m.users[2].uid, 0, answer));
  Date.now.mock.restore();
  assert.equal((await m.answerDocument(2, 0)).exists(), true);
});

test('a shared first place records a loss for lower scoring players', async () => {
  const m = await match(3);
  await m.update({
    'game.currentRoundIndex': 9,
    'game.roundStartTime': Date.now() - 61000,
    'game.scores': { [m.users[0].uid]: 1000, [m.users[1].uid]: 1000, [m.users[2].uid]: 0 },
  });
  await m.as(0, () => mp.advanceRoundIfDue(m.code));
  assert.equal((await m.profile(0)).draws, 1);
  assert.equal((await m.profile(1)).draws, 1);
  assert.equal((await m.profile(2)).draws, 0);
  assert.equal((await m.profile(2)).losses, 1);
});

test('host leaving keeps the arena running, excludes their answers, and records a forfeit at the end', async () => {
  const m = await match(3);
  await m.update({ 'game.roundStartTime': Date.now() - 100 });
  let game = (await m.read()).game;
  // A departed player's already submitted answer must not count as an active answer.
  await m.as(0, () =>
    mp.submitPlayerAnswer(m.code, m.users[0].uid, 0, game.questions[0].correctAnswer),
  );
  await m.as(0, () => mp.leaveLobby(m.code, m.users[0].uid));
  assert.equal((await m.read()).status, 'playing');
  assert.equal((await m.profile(0)).matchesPlayed, 0);
  await m.as(0, () => mp.leaveLobby(m.code, m.users[0].uid));
  await m.as(1, () =>
    mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, game.questions[0].correctAnswer),
  );
  assert.equal((await m.read()).status, 'playing');
  await m.as(2, () =>
    mp.submitPlayerAnswer(m.code, m.users[2].uid, 0, game.questions[0].correctAnswer),
  );
  assert.equal((await m.read()).status, 'round_end');
  await m.update({ 'game.nextRoundAt': Date.now() - 1 });
  await m.as(1, () => mp.advanceRoundIfDue(m.code));
  game = (await m.read()).game;
  await m.as(0, () =>
    mp.submitPlayerAnswer(m.code, m.users[0].uid, 1, game.questions[1].correctAnswer),
  );
  assert.equal((await m.answerDocument(0, 1)).exists(), false);
  await m.update({ 'game.currentRoundIndex': 9, 'game.roundStartTime': Date.now() - 61000 });
  await m.as(1, () => mp.advanceRoundIfDue(m.code));
  assert.equal((await m.read()).status, 'finished');
  assert.equal((await m.profile(0)).losses, 1);
  assert.equal((await m.profile(0)).matchesPlayed, 1);
});

test('leaving closes a round immediately when every remaining player has answered', async () => {
  const m = await match(3);
  await m.update({ 'game.roundStartTime': Date.now() - 100 });
  const answer = (await m.read()).game.questions[0].correctAnswer;
  for (const i of [0, 1])
    await m.as(i, () => mp.submitPlayerAnswer(m.code, m.users[i].uid, 0, answer));
  await m.as(2, () => mp.leaveLobby(m.code, m.users[2].uid));
  assert.equal((await m.read()).status, 'round_end');
  await m.as(1, () => mp.leaveLobby(m.code, m.users[1].uid));
  assert.equal((await m.read()).status, 'finished');
  assert.equal((await m.profile(0)).wins, 1);
  for (const i of [1, 2]) {
    assert.equal((await m.profile(i)).losses, 1);
    assert.equal((await m.profile(i)).matchesPlayed, 1);
  }
});

test('two-player forfeit still immediately awards the remaining player a win', async () => {
  const m = await match(2);
  await m.as(0, () => mp.leaveLobby(m.code, m.users[0].uid));
  assert.equal((await m.read()).status, 'finished');
  assert.equal((await m.profile(0)).elo, 1184);
  assert.equal((await m.profile(0)).losses, 1);
  assert.equal((await m.profile(1)).elo, 1216);
  assert.equal((await m.profile(1)).wins, 1);
});

test('clock quality enforcement blocks uncalibrated or invalidated matches and answers', async () => {
  const prefix = `arena-clock-${++sequence}`;
  const users = [
    { uid: `${prefix}-0`, displayName: 'Host' },
    { uid: `${prefix}-1`, displayName: 'Guest' },
  ];
  const databases = users.map((u) => env.authenticatedContext(u.uid).firestore());
  async function as(index, action) {
    useDatabase(databases[index]);
    return action();
  }

  // Calibration establishes valid clock on create and join
  const code = await as(0, () => mp.createLobby(users[0], 'particles'));
  await as(1, () => mp.joinLobby(code, users[1]));

  const lobbyInitial = (await getDoc(doc(databases[0], 'lobbies', code))).data();
  assert.equal(lobbyInitial.players[users[0].uid].ready, true);
  assert.equal(lobbyInitial.players[users[1].uid].ready, true);
  assert.equal(lobbyInitial.players[users[0].uid].clockStatus, 'synced');

  // Simulated monotonic pause or invalidation on host
  await as(0, () => mp.simulateMonotonicPause(databases[0]));
  assert.equal(await as(0, () => mp.isMultiplayerClockValid(databases[0])), false);

  // Attempting to start match while clock is invalid is rejected
  await assert.rejects(
    () => as(0, () => mp.startMatch(code)),
    /matchklockan är inte synkroniserad/,
  );

  // Recalibrating host restores validity and allows match start
  await as(0, () => mp.synchronizeMultiplayerClock(databases[0], users[0].uid, { force: true }));
  assert.equal(await as(0, () => mp.isMultiplayerClockValid(databases[0])), true);
  await as(0, () => mp.startMatch(code));

  await completeStart(code, users, as, databases[0]);

  // Match started
  const game = (await getDoc(doc(databases[0], 'lobbies', code))).data().game;
  assert.equal(game.status, 'playing');

  // Guest clock invalidation blocks answer submission
  await as(1, () => mp.simulateMonotonicPause(databases[1]));
  const rejectedReceipt = await as(1, () =>
    mp.submitPlayerAnswer(code, users[1].uid, 0, game.questions[0].correctAnswer),
  );
  assert.equal(rejectedReceipt.status, 'rejected');

  // Recalibrating guest allows timely answer submission
  await as(1, () => mp.synchronizeMultiplayerClock(databases[1], users[1].uid, { force: true }));
  await updateDoc(doc(databases[0], 'lobbies', code), {
    'game.roundStartTime': Date.now() - 100,
    gameRevision: increment(1),
    gameUpdatedAt: serverTimestamp(),
  });
  const acceptedReceipt = await as(1, () =>
    mp.submitPlayerAnswer(code, users[1].uid, 0, game.questions[0].correctAnswer),
  );
  assert.equal(acceptedReceipt.status, 'accepted');
});

async function agePresence(m, index, age) {
  await env.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'lobbies', m.code, 'presence', m.users[index].uid), {
      seenAt: Timestamp.fromMillis(Date.now() - age),
    });
  });
}

test('presence boundary is exclusive at 45 seconds', () => {
  const lobby = { presenceVersion: 1, presence: { p: { seenAt: Timestamp.fromMillis(1000) } } };
  assert.equal(mp.isPlayerPresent(lobby, 'p', 45999), true);
  assert.equal(mp.isPlayerPresent(lobby, 'p', 46000), false);
  assert.equal(mp.isPlayerPresent(lobby, 'missing', 1000), false);
});

test('presence uses server timestamps and ownership rules; heartbeats leave lobby untouched', async () => {
  const m = await match(2);
  const before = await m.read();
  await m.as(1, () => mp.sendHeartbeat(m.code, m.users[1].uid));
  assert.deepEqual(await m.read(), before);
  const guestDb = env.authenticatedContext(m.users[1].uid).firestore();
  const ref = doc(guestDb, 'lobbies', m.code, 'presence', m.users[1].uid);
  const saved = (await getDoc(ref)).data();
  assert(saved.seenAt instanceof Timestamp);
  await assertFails(updateDoc(ref, { seenAt: Timestamp.fromMillis(Date.now() + 60000) }));
  await assertFails(
    setDoc(doc(guestDb, 'lobbies', m.code, 'presence', m.users[0].uid), {
      uid: m.users[0].uid,
      sessionId: 'stolen',
      seenAt: serverTimestamp(),
    }),
  );
});

test('short interruption renews session without resetting round; old session cannot renew', async () => {
  const m = await match(3);
  const old = await m.as(1, () => mp.connectPlayerPresence(m.code, m.users[1].uid));
  const before = await m.read();
  await agePresence(m, 1, 30000);
  const current = await m.as(1, () => mp.connectPlayerPresence(m.code, m.users[1].uid));
  assert.notEqual(old, current);
  assert.equal(await m.as(1, () => mp.sendHeartbeat(m.code, m.users[1].uid, old)), false);
  await m.as(0, () => mp.expireDisconnectedPlayers(m.code));
  assert.deepEqual(await m.read(), before);
  assert.equal(await m.as(1, () => mp.sendHeartbeat(m.code, m.users[1].uid, current)), true);
});

test('concurrent expiry forfeits once, continues with two and finishes with one', async () => {
  const m = await match(3);
  const before = await m.read();
  await agePresence(m, 2, 46000);
  await assert.rejects(() => m.as(2, () => mp.sendHeartbeat(m.code, m.users[2].uid)));
  await m.as(0, () =>
    Promise.all([mp.expireDisconnectedPlayers(m.code), mp.expireDisconnectedPlayers(m.code)]),
  );
  const continuing = await m.read();
  assert.equal(continuing.status, 'playing');
  assert.deepEqual(continuing.game.forfeitedUids, [m.users[2].uid]);
  assert.equal(continuing.game.roundStartTime, before.game.roundStartTime);
  assert.equal(continuing.game.scores[m.users[2].uid], -9999);
  await agePresence(m, 1, 46000);
  await m.as(0, () =>
    Promise.all([mp.expireDisconnectedPlayers(m.code), mp.expireDisconnectedPlayers(m.code)]),
  );
  const finished = await m.read();
  assert.equal(finished.status, 'finished');
  for (let i = 0; i < 3; i++) assert.equal((await m.profile(i)).matchesPlayed, 1);
  assert.equal((await m.profile(0)).wins, 1);
  assert.equal((await m.profile(2)).losses, 1);
  await m.as(2, () => mp.connectPlayerPresence(m.code, m.users[2].uid));
  await assert.rejects(() => m.as(2, () => mp.sendHeartbeat(m.code, m.users[2].uid)));
  await m.as(0, () => mp.expireDisconnectedPlayers(m.code));
  assert.deepEqual(await m.read(), finished);
});

test('expired waiting guest cannot satisfy start requirement; expired host rejects joins', async () => {
  const m = await match(2, false);
  await agePresence(m, 1, 46000);
  await assert.rejects(() => m.as(0, () => mp.startMatch(m.code)), /minst en till/);
  await m.as(1, () => mp.connectPlayerPresence(m.code, m.users[1].uid));
  await agePresence(m, 0, 46000);
  await assert.rejects(() => m.as(1, () => mp.joinLobby(m.code, m.users[1])), /inte längre aktiv/);
});

test('a stale waiting guest is excluded when two present players start', async () => {
  const m = await match(3, false);
  await agePresence(m, 1, 46000);
  await m.as(0, () => mp.startMatch(m.code));
  const lobby = await m.read();
  assert.deepEqual(lobby.game.playerUids.sort(), [m.users[0].uid, m.users[2].uid].sort());
  assert.equal(lobby.game.guestUid, m.users[2].uid);
  assert.equal(lobby.guest.uid, m.users[2].uid);
  assert.equal(lobby.playerCount, 2);
});

// Admin fixtures only move time; production reads, reduction and rules stay real.
async function seedReceipt(m, player, round, time, patch = {}) {
  const question = (await m.read()).game.questions[round];
  await env.withSecurityRulesDisabled((context) =>
    setDoc(
      doc(context.firestore(), 'lobbies', m.code, 'answers', `${round}_${m.users[player].uid}`),
      {
        protocolVersion: 3,
        startVersion: 1,
        uid: m.users[player].uid,
        roundIndex: round,
        answer: question.correctAnswer,
        attemptId: `fixture-${player}`,
        receivedAt: Timestamp.fromMillis(time),
        ...patch,
      },
    ),
  );
}

test('startup binds acknowledgements to owner, content, version, clock and connection', async () => {
  const m = await match(2, false);
  const prepared = await m.as(0, () => mp.startMatch(m.code));
  await m.as(0, () => mp.acknowledgeMatchStart(m.code, m.users[0].uid, prepared));
  await m.as(0, () => mp.progressMatchStart(m.code, 1));
  assert.equal((await m.read()).status, 'preparing');
  await m.as(1, () =>
    mp.acknowledgeMatchStart(m.code, m.users[1].uid, {
      ...prepared,
      game: { ...prepared.game, questions: [] },
    }),
  );
  assert.equal(Object.keys((await m.read()).start.prepared).length, 1);
  const database = env.authenticatedContext(m.users[1].uid).firestore();
  const ref = doc(database, 'lobbies', m.code);
  const forged = (uid, patch = {}) => ({
    [`start.prepared.${uid}`]: {
      sessionId: prepared.start.sessions[uid],
      at: serverTimestamp(),
      uncertainty: 10,
      ...patch,
    },
    gameRevision: increment(1),
    gameUpdatedAt: serverTimestamp(),
  });
  await assertFails(updateDoc(ref, forged(m.users[0].uid)));
  await assertFails(updateDoc(ref, forged(m.users[1].uid, { sessionId: 'old-session' })));
  await assertFails(updateDoc(ref, forged(m.users[1].uid, { uncertainty: 251 })));
  await assertFails(updateDoc(ref, forged(m.users[1].uid, { at: Timestamp.fromMillis(1) })));
  await assertFails(
    updateDoc(ref, {
      'start.phase': 'confirmed',
      gameRevision: increment(1),
      gameUpdatedAt: serverTimestamp(),
    }),
  );
  await m.as(1, () => mp.acknowledgeMatchStart(m.code, m.users[1].uid, prepared));
  await m.as(0, () => mp.progressMatchStart(m.code, 1, true));
  await m.as(0, () => mp.startMatch(m.code));
  await m.as(1, () => mp.acknowledgeMatchStart(m.code, m.users[1].uid, prepared));
  const retry = await m.read();
  assert.equal(retry.start.version, 2);
  assert.deepEqual(retry.start.prepared, {});
  await m.as(0, () => mp.progressMatchStart(m.code, 1, true));
  assert.equal((await m.read()).start.phase, 'preparing');
  for (let i = 0; i < 2; i++) assert.equal((await m.profile(i)).matchesPlayed, 0);
});

test('startup concurrent host clicks create only one version and guests cannot initiate', async () => {
  const m = await match(2, false);
  await assert.rejects(() => m.as(1, () => mp.startMatch(m.code)));
  await Promise.all([m.as(0, () => mp.startMatch(m.code)), m.as(0, () => mp.startMatch(m.code))]);
  assert.equal((await m.read()).start.version, 1);
});

test('startup expired participant and preparation timeout cancel without forfeit or ELO', async () => {
  for (const expiredPresence of [true, false]) {
    const m = await match(2, false);
    await m.as(0, () => mp.startMatch(m.code));
    if (expiredPresence) await agePresence(m, 1, 46000);
    else
      await env.withSecurityRulesDisabled((context) =>
        updateDoc(doc(context.firestore(), 'lobbies', m.code), {
          'start.createdAt': Timestamp.fromMillis(Date.now() - 31000),
        }),
      );
    await m.as(0, () => mp.progressMatchStart(m.code, 1));
    const saved = await m.read();
    assert.equal(saved.status, 'waiting');
    assert.equal(saved.game, null);
    for (let i = 0; i < 2; i++) assert.equal((await m.profile(i)).matchesPlayed, 0);
  }
});

test('startup missing countdown acknowledgement cannot accept answers or award ELO', async () => {
  const m = await match(2, false);
  await m.as(0, () => mp.startMatch(m.code));
  const observed = await m.read();
  for (let i = 0; i < 2; i++)
    await m.as(i, () => mp.acknowledgeMatchStart(m.code, m.users[i].uid, observed));
  await m.as(0, () => mp.progressMatchStart(m.code, 1));
  await env.withSecurityRulesDisabled((context) =>
    updateDoc(doc(context.firestore(), 'lobbies', m.code), {
      'game.roundStartTime': Date.now() - 1000,
    }),
  );
  const late = await m.read();
  await m.as(1, () => mp.acknowledgeMatchStart(m.code, m.users[1].uid, late, 'entered'));
  assert.deepEqual((await m.read()).start.entered, {});
  await m.as(0, () => mp.advanceRoundIfDue(m.code));
  assert.equal((await m.profile(0)).matchesPlayed, 0);
  await m.as(0, () => mp.progressMatchStart(m.code, 1));
  assert.equal((await m.read()).game, null);
});

test('startup explicit departure cancels preparation and removes the departing participant', async () => {
  for (const leaving of [0, 1]) {
    const m = await match(2, false);
    await m.as(0, () => mp.startMatch(m.code));
    await m.as(leaving, () => mp.leaveLobby(m.code, m.users[leaving].uid));
    const saved = await m.read();
    if (leaving === 0) assert.equal(saved, undefined);
    else {
      assert.equal(saved.status, 'waiting');
      assert.equal(saved.playerCount, 1);
      assert.equal(saved.players[m.users[1].uid], undefined);
    }
    for (let i = 0; i < 2; i++) assert.equal((await m.profile(i)).matchesPlayed, 0);
  }
});
