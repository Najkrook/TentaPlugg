import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
let env;
before(async () => {
  assert(process.env.FIRESTORE_EMULATOR_HOST, 'Only run against the local emulator');
  env = await initializeTestEnvironment({
    projectId: 'demo-tentaplugg',
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
});
after(async () => {
  await env?.cleanup();
});

test('clock samples require server time and are private to their owner', async () => {
  const owner = env.authenticatedContext('clock-owner').firestore();
  const stranger = env.authenticatedContext('clock-stranger').firestore();
  const ref = doc(owner, 'users/clock-owner/multiplayerClock/sample');
  await assertFails(setDoc(ref, { time: Timestamp.fromMillis(1000) }));
  await assertSucceeds(setDoc(ref, { time: serverTimestamp() }));
  const otherRef = doc(stranger, 'users/clock-owner/multiplayerClock/sample');
  await assertFails(getDoc(otherRef));
  await assertFails(deleteDoc(otherRef));
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(deleteDoc(ref));
});
test('owner can read/write, other users and guests cannot', async () => {
  const a = env.authenticatedContext('alice').firestore(),
    b = env.authenticatedContext('bob').firestore(),
    guest = env.unauthenticatedContext().firestore();
  await assertSucceeds(
    setDoc(doc(a, 'users/alice/progress/state'), { payload: '{"version":2}', updatedAt: 1 }),
  );
  await assertSucceeds(getDoc(doc(a, 'users/alice/progress/state')));
  await assertFails(getDoc(doc(b, 'users/alice/progress/state')));
  await assertFails(setDoc(doc(b, 'users/alice/progress/state'), { payload: '{}', updatedAt: 2 }));
  await assertFails(getDoc(doc(guest, 'users/alice/progress/state')));
});
test('invalid shapes and oversized payloads are rejected', async () => {
  const db = env.authenticatedContext('alice').firestore(),
    ref = doc(db, 'users/alice/progress/state');
  await assertFails(setDoc(ref, { payload: { a: 1 }, updatedAt: 1 }));
  await assertFails(setDoc(ref, { payload: '{}', updatedAt: 1, public: true }));
  await assertFails(setDoc(ref, { payload: 'x'.repeat(500001), updatedAt: 1 }));
});
test('leaderboard rejects arbitrary rating creation and only allows verified baseline stats', async () => {
  const a = env.authenticatedContext('alice').firestore(),
    b = env.authenticatedContext('bob').firestore(),
    guest = env.unauthenticatedContext().firestore();

  // Guest cannot write
  await assertFails(setDoc(doc(guest, 'leaderboard/alice'), { elo: 1200 }));

  // Alice cannot forge arbitrary starting ELO (must start at 1200 with 0 matches)
  await assertFails(
    setDoc(doc(a, 'leaderboard/alice'), {
      uid: 'alice',
      elo: 2500,
      wins: 10,
      losses: 0,
      draws: 0,
      matchesPlayed: 10,
    }),
  );

  // Bob cannot create Alice's profile
  await assertFails(
    setDoc(doc(b, 'leaderboard/alice'), {
      uid: 'alice',
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      matchesPlayed: 0,
    }),
  );

  // Alice successfully registers baseline profile
  await assertSucceeds(
    setDoc(doc(a, 'leaderboard/alice'), {
      uid: 'alice',
      displayName: 'Alice',
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      matchesPlayed: 0,
    }),
  );

  // Anyone can read leaderboard
  await assertSucceeds(getDoc(doc(guest, 'leaderboard/alice')));
  await assertSucceeds(getDoc(doc(b, 'leaderboard/alice')));

  // Alice can update cosmetic profile without changing rating
  await assertSucceeds(
    updateDoc(doc(a, 'leaderboard/alice'), {
      displayName: 'Alice In Wonderland',
    }),
  );

  // Alice cannot arbitrarily boost her rating
  await assertFails(
    updateDoc(doc(a, 'leaderboard/alice'), {
      elo: 1400,
      wins: 5,
    }),
  );
});
test('lobbies: only participants can update, outsiders are rejected', async () => {
  const a = env.authenticatedContext('alice').firestore(),
    b = env.authenticatedContext('bob').firestore(),
    charlie = env.authenticatedContext('charlie').firestore(),
    guest = env.unauthenticatedContext().firestore();

  await assertFails(getDoc(doc(guest, 'lobbies/lobby1')));
  await assertFails(setDoc(doc(guest, 'lobbies/lobby1'), { host: { uid: 'guest' } }));

  // Alice creates lobby as host
  await assertSucceeds(
    setDoc(doc(a, 'lobbies/lobby1'), {
      protocolVersion: 2,
      gameRevision: 0,
      game: null,
      host: { uid: 'alice' },
      guest: null,
      status: 'waiting',
    }),
  );

  // Charlie (outsider) cannot update Alice's lobby
  await assertFails(updateDoc(doc(charlie, 'lobbies/lobby1'), { status: 'in_progress' }));

  // Bob joins as guest
  await assertSucceeds(
    updateDoc(doc(b, 'lobbies/lobby1'), {
      guest: { uid: 'bob' },
    }),
  );

  // Now that lobby is full, Charlie (outsider) cannot overwrite guest or update game
  await assertFails(
    updateDoc(doc(charlie, 'lobbies/lobby1'), {
      guest: { uid: 'charlie' },
    }),
  );

  // Participants can update their game
  await assertSucceeds(
    updateDoc(doc(a, 'lobbies/lobby1'), {
      status: 'playing',
      gameRevision: 1,
      gameUpdatedAt: serverTimestamp(),
    }),
  );
});
test('auth emulator issues isolated identities and rejects a wrong password', async () => {
  const endpoint = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:';
  const email = `test-${Date.now()}@example.test`;
  const create = await fetch(endpoint + 'signUp?key=fake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'only-for-emulator', returnSecureToken: true }),
  });
  assert.equal(create.status, 200);
  const data = await create.json();
  assert(data.localId);
  assert(data.idToken);
  const wrong = await fetch(endpoint + 'signInWithPassword?key=fake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrong-password', returnSecureToken: true }),
  });
  assert.equal(wrong.status, 400);
});
test('lobbies 10-players: enforces max 10 player capacity and allows individual answers subcollection writes', async () => {
  const host = env.authenticatedContext('host1').firestore();
  const players = Array.from({ length: 10 }, (_, i) =>
    env.authenticatedContext(`p${i + 1}`).firestore(),
  );
  const outsider = env.authenticatedContext('p11').firestore();

  // Host creates lobby with 1 player
  await assertSucceeds(
    setDoc(doc(host, 'lobbies/party1'), {
      protocolVersion: 2,
      gameRevision: 0,
      game: null,
      host: { uid: 'host1' },
      players: { host1: { uid: 'host1' } },
      playerCount: 1,
      status: 'waiting',
    }),
  );

  // Players 1 to 9 join (total 10 players)
  let currentPlayers = { host1: { uid: 'host1' } };
  for (let i = 0; i < 9; i++) {
    const uid = `p${i + 1}`;
    currentPlayers = { ...currentPlayers, [uid]: { uid } };
    await assertSucceeds(
      updateDoc(doc(players[i], 'lobbies/party1'), {
        players: currentPlayers,
        playerCount: i + 2,
      }),
    );
  }

  // 11th player tries to join: must fail because playerCount > 10
  const overflowPlayers = { ...currentPlayers, p11: { uid: 'p11' } };
  await assertFails(
    updateDoc(doc(outsider, 'lobbies/party1'), {
      players: overflowPlayers,
      playerCount: 11,
    }),
  );

  // Legacy answer shape is rejected even for the owner in a versioned lobby.
  await assertFails(
    setDoc(doc(players[0], 'lobbies/party1/answers/0_p1'), {
      roundIndex: 0,
      uid: 'p1',
      answer: 'A',
      timestamp: 1000,
      isCorrect: true,
      pointsAwarded: 950,
    }),
  );

  // p1 cannot write an answer for p2
  await assertFails(
    setDoc(doc(players[0], 'lobbies/party1/answers/0_p2'), {
      roundIndex: 0,
      uid: 'p2',
      answer: 'B',
      timestamp: 1000,
      isCorrect: false,
      pointsAwarded: -250,
    }),
  );

  // p2 can read p1's answer
  await assertSucceeds(getDoc(doc(players[1], 'lobbies/party1/answers/0_p1')));
});
