import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useDatabase } from './multiplayer-db.js';

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
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

async function match(count) {
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
  await as(0, () => mp.startMatch(code));
  const ref = doc(databases[0], 'lobbies', code);
  return {
    code,
    users,
    as,
    read: async () => (await getDoc(ref)).data(),
    update: (patch) => updateDoc(ref, patch),
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
  assert.deepEqual((await m.answerDocument(0, 0)).data(), receipt.answer);
  await m.update({ 'game.currentRoundIndex': 1 });
  assert.equal((await submit(question.correctAnswer)).status, 'already-received');
  assert.equal(
    (await m.as(1, () => mp.submitPlayerAnswer(m.code, m.users[1].uid, 0, 'x'))).status,
    'stale-round',
  );
});

test('answer receipts distinguish late, closed and rejected rounds', async () => {
  const m = await match(2);
  const submit = () => m.as(0, () => mp.submitPlayerAnswer(m.code, m.users[0].uid, 0, 'x'));
  await m.update({ 'game.roundStartTime': Date.now() - 61000 });
  assert.equal((await submit()).status, 'late');
  await m.update({ 'game.status': 'round_end' });
  assert.equal((await submit()).status, 'closed');
  await m.update({ 'game.status': 'playing', 'game.roundStartTime': Date.now() + 10000 });
  assert.equal((await submit()).status, 'rejected');
  assert.equal((await m.answerDocument(0, 0)).exists(), false);
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
  await m.update({ 'game.roundStartTime': now - 60000, 'game.firstAnswerAt': now - 1000 });
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
