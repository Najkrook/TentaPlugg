import {
  collection,
  doc,
  runTransaction,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';

export const MAX_CLOCK_UNCERTAINTY_MS = 250;
export const MAX_CLOCK_AGE_MS = 60000;
export const MIN_CALIBRATION_INTERVAL_MS = 5000;
export const SAMPLE_COUNT = 3;

let timeSource = {
  now: () => Date.now(),
  monotonic: () => performance.now(),
};
let testSampleTransport = null;

export function setClockTransportForTesting(transport) {
  testSampleTransport = transport;
}

export function setTimeSourceForTesting(source) {
  timeSource = source;
}

export function resetClockForTesting() {
  testSampleTransport = null;
  timeSource = {
    now: () => Date.now(),
    monotonic: () => performance.now(),
  };
}

const clocks = new WeakMap();
const defaultStateHolder = { current: null };

function createClockState() {
  return {
    version: 0,
    counter: 0,
    sample: null,
    status: 'uncalibrated',
    activePromise: null,
    invalidated: false,
    invalidationReason: null,
    lastAttemptAt: 0,
    lastError: null,
  };
}

function getClockState(database) {
  if (!database || typeof database !== 'object') {
    if (!defaultStateHolder.current) {
      defaultStateHolder.current = createClockState();
    }
    return defaultStateHolder.current;
  }
  let state = clocks.get(database);
  if (!state) {
    state = createClockState();
    clocks.set(database, state);
  }
  return state;
}

export function getMultiplayerClock(database) {
  const state = getClockState(database);
  const mNow = timeSource.monotonic();

  if (!state.sample) {
    return {
      now: timeSource.now(),
      uncertainty: Infinity,
      measuredAt: 0,
      age: Infinity,
      valid: false,
      status: state.status,
      version: state.version,
      reason: state.lastError ? 'error' : 'uncalibrated',
    };
  }

  const age = mNow - state.sample.monotonicTime;
  const uncertainty = state.sample.uncertainty;
  const estimatedNow = Math.round(state.sample.serverTime + (mNow - state.sample.monotonicTime));

  if (state.invalidated) {
    return {
      now: estimatedNow,
      uncertainty,
      measuredAt: state.sample.measuredAt,
      age,
      valid: false,
      status: 'invalidated',
      version: state.version,
      reason: state.invalidationReason || 'invalidated',
    };
  }

  if (state.status === 'syncing') {
    return {
      now: estimatedNow,
      uncertainty,
      measuredAt: state.sample.measuredAt,
      age,
      valid: false,
      status: 'syncing',
      version: state.version,
      reason: 'syncing',
    };
  }

  if (uncertainty > MAX_CLOCK_UNCERTAINTY_MS) {
    return {
      now: estimatedNow,
      uncertainty,
      measuredAt: state.sample.measuredAt,
      age,
      valid: false,
      status: 'uncertain',
      version: state.version,
      reason: 'high-uncertainty',
    };
  }

  if (age > MAX_CLOCK_AGE_MS) {
    return {
      now: estimatedNow,
      uncertainty,
      measuredAt: state.sample.measuredAt,
      age,
      valid: false,
      status: 'stale',
      version: state.version,
      reason: 'stale',
    };
  }

  return {
    now: estimatedNow,
    uncertainty,
    measuredAt: state.sample.measuredAt,
    age,
    valid: true,
    status: 'synced',
    version: state.version,
    reason: null,
  };
}

export function multiplayerNow(database) {
  return getMultiplayerClock(database).now;
}

export function isMultiplayerClockValid(database) {
  return getMultiplayerClock(database).valid;
}

export function invalidateMultiplayerClock(database, reason = 'invalidated') {
  const state = getClockState(database);
  state.version = ++state.counter;
  state.invalidated = true;
  state.invalidationReason = reason;
  state.status = 'invalidated';
  return getMultiplayerClock(database);
}

export function simulateMonotonicPause(database, durationMs = 0) {
  return invalidateMultiplayerClock(database, 'simulated-pause');
}

export async function synchronizeMultiplayerClock(database, uid, { force = false } = {}) {
  const state = getClockState(database);
  const mNow = timeSource.monotonic();

  // If already syncing and not forced, coordinate overlapping attempts
  if (!force && state.activePromise) {
    return state.activePromise;
  }

  // Rate-limiting: if recently calibrated and valid, don't spam requests unless forced
  if (!force && !state.invalidated && state.sample) {
    const current = getMultiplayerClock(database);
    if (current.valid && current.age < MIN_CALIBRATION_INTERVAL_MS) {
      return current;
    }
  }

  const attemptVersion = ++state.counter;
  state.status = 'syncing';
  state.lastAttemptAt = mNow;

  const promise = (async () => {
    try {
      const samples = [];
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        if (state.counter > attemptVersion) break;
        const sample = testSampleTransport
          ? await testSampleTransport(database, uid, i)
          : await sampleClock(database, uid);
        if (sample) samples.push(sample);
      }

      // Check if this attempt was superseded by a newer version
      if (attemptVersion < state.version) {
        return getMultiplayerClock(database);
      }

      if (samples.length === 0) {
        throw new Error('Kunde inte synkronisera matchklockan');
      }

      // Sort by roundTrip ascending (fastest sample first)
      samples.sort((a, b) => a.roundTrip - b.roundTrip);
      const best = samples[0];

      state.version = attemptVersion;
      state.sample = best;
      state.invalidated = false;
      state.invalidationReason = null;
      state.lastError = null;

      if (best.uncertainty > MAX_CLOCK_UNCERTAINTY_MS) {
        state.status = 'uncertain';
      } else {
        state.status = 'synced';
      }

      return getMultiplayerClock(database);
    } catch (err) {
      if (attemptVersion >= state.version) {
        state.lastError = err;
        state.status = 'error';
      }
      throw err;
    }
  })();

  state.activePromise = promise;
  return promise.finally(() => {
    if (state.activePromise === promise) {
      state.activePromise = null;
    }
  });
}

async function sampleClock(database, uid) {
  const sampleRef = doc(collection(database, 'users', uid, 'multiplayerClock'));
  try {
    const sentAt = timeSource.monotonic();
    // Use unary transaction commits: setDoc/deleteDoc would open a persistent write
    // stream in every tab, exhausting mobile WebKit's per-origin connection pool.
    await runTransaction(database, async (tx) => {
      tx.set(sampleRef, { time: serverTimestamp() });
    });
    const acknowledgedAt = timeSource.monotonic();
    const sample = await getDocFromServer(sampleRef);
    const readAt = timeSource.monotonic();
    const serverTime = sample.data()?.time?.toMillis();
    if (!Number.isFinite(serverTime)) throw new Error('Kunde inte synkronisera matchklockan');
    const writeRoundTrip = acknowledgedAt - sentAt;
    const totalRoundTrip = readAt - sentAt;
    const roundTrip = Math.max(writeRoundTrip, totalRoundTrip);
    return {
      serverTime,
      roundTrip,
      uncertainty: roundTrip / 2,
      monotonicTime: (sentAt + acknowledgedAt) / 2,
      measuredAt: serverTime,
    };
  } finally {
    // Each sample has its own ID so concurrent tabs cannot overwrite one another's sample.
    await runTransaction(database, async (tx) => {
      tx.delete(sampleRef);
    }).catch(() => {});
  }
}
