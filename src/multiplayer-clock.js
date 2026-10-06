import {
  collection,
  doc,
  runTransaction,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';

const clocks = new WeakMap();

// Calibrate once when entering a lobby. Never infer clock skew from an old lobby update.
export async function synchronizeMultiplayerClock(database, uid) {
  // Discard connection-startup latency by choosing the fastest of three samples.
  const samples = [];
  for (let i = 0; i < 3; i++) samples.push(await sampleClock(database, uid));
  samples.sort((a, b) => a.roundTrip - b.roundTrip);
  clocks.set(database, samples[0]);
}

async function sampleClock(database, uid) {
  const sampleRef = doc(collection(database, 'users', uid, 'multiplayerClock'));
  try {
    const sentAt = performance.now();
    // Use unary transaction commits: setDoc/deleteDoc would open a persistent write
    // stream in every tab, exhausting mobile WebKit's per-origin connection pool.
    await runTransaction(database, async (tx) => {
      tx.set(sampleRef, { time: serverTimestamp() });
    });
    const acknowledgedAt = performance.now();
    const sample = await getDocFromServer(sampleRef);
    const serverTime = sample.data()?.time?.toMillis();
    if (!Number.isFinite(serverTime)) throw new Error('Kunde inte synkronisera matchklockan');
    return {
      serverTime,
      roundTrip: acknowledgedAt - sentAt,
      // The server committed the timestamp between sending and acknowledging the write.
      monotonicTime: (sentAt + acknowledgedAt) / 2,
    };
  } finally {
    // Each sample has its own ID so concurrent tabs cannot overwrite one another's sample.
    await runTransaction(database, async (tx) => {
      tx.delete(sampleRef);
    }).catch(() => {});
  }
}

export function multiplayerNow(database) {
  const clock = clocks.get(database);
  // Before joining, the lobby browser can still display its list. All match participants
  // calibrate through createLobby/joinLobby before writing any game timestamps.
  return clock
    ? Math.round(clock.serverTime + performance.now() - clock.monotonicTime)
    : Date.now();
}
