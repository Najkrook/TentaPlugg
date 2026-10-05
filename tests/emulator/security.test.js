import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
test('leaderboard is readable by anyone, only owner can write own record', async () => {
  const a = env.authenticatedContext('alice').firestore(),
    b = env.authenticatedContext('bob').firestore(),
    guest = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(a, 'leaderboard/alice'), { elo: 1250, wins: 2 }));
  await assertSucceeds(getDoc(doc(guest, 'leaderboard/alice')));
  await assertSucceeds(getDoc(doc(b, 'leaderboard/alice')));
  await assertFails(setDoc(doc(b, 'leaderboard/alice'), { elo: 900 }));
  await assertFails(setDoc(doc(guest, 'leaderboard/alice'), { elo: 900 }));
});
test('lobbies require authentication to read, create, update', async () => {
  const a = env.authenticatedContext('alice').firestore(),
    b = env.authenticatedContext('bob').firestore(),
    guest = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(guest, 'lobbies/lobby1')));
  await assertFails(setDoc(doc(guest, 'lobbies/lobby1'), { host: { uid: 'guest' } }));
  await assertSucceeds(
    setDoc(doc(a, 'lobbies/lobby1'), { host: { uid: 'alice' }, status: 'waiting' }),
  );
  await assertFails(setDoc(doc(a, 'lobbies/lobby2'), { host: { uid: 'bob' }, status: 'waiting' }));
  await assertSucceeds(getDoc(doc(b, 'lobbies/lobby1')));
  await assertSucceeds(
    setDoc(doc(b, 'lobbies/lobby1'), {
      host: { uid: 'alice' },
      guest: { uid: 'bob' },
      status: 'ready',
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
