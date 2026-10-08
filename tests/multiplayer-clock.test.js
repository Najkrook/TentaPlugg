import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMultiplayerClock,
  isMultiplayerClockValid,
  multiplayerNow,
  synchronizeMultiplayerClock,
  invalidateMultiplayerClock,
  simulateMonotonicPause,
  setClockTransportForTesting,
  setTimeSourceForTesting,
  resetClockForTesting,
  MAX_CLOCK_UNCERTAINTY_MS,
  MAX_CLOCK_AGE_MS,
} from '../src/multiplayer-clock.js';

let fakeMonotonic = 10000;
let fakeWallTime = 1700000000000;
let mockDb;

beforeEach(() => {
  resetClockForTesting();
  fakeMonotonic = 10000;
  fakeWallTime = 1700000000000;
  setTimeSourceForTesting({
    monotonic: () => fakeMonotonic,
    now: () => fakeWallTime,
  });
  mockDb = { id: `test-db-${Math.random()}` };
});

test('uncalibrated clock returns wall time and valid=false with uncertainty Infinity', () => {
  const clock = getMultiplayerClock(mockDb);
  assert.equal(clock.valid, false);
  assert.equal(clock.uncertainty, Infinity);
  assert.equal(clock.status, 'uncalibrated');
  assert.equal(clock.now, fakeWallTime);
  assert.equal(isMultiplayerClockValid(mockDb), false);
});

test('accurate samples establish a valid, synced clock within 250ms uncertainty', async () => {
  const serverBaseTime = 1700000500000;
  setClockTransportForTesting(async (_db, _uid, index) => {
    // 60ms RTT -> 30ms uncertainty
    const rtt = 60 + index * 10;
    return {
      serverTime: serverBaseTime,
      roundTrip: rtt,
      uncertainty: rtt / 2,
      monotonicTime: fakeMonotonic + 30,
      measuredAt: serverBaseTime,
    };
  });

  const clock = await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(clock.valid, true);
  assert.equal(clock.status, 'synced');
  assert.equal(clock.uncertainty, 30); // 60ms / 2
  assert.equal(isMultiplayerClockValid(mockDb), true);

  fakeMonotonic += 500;
  assert.equal(multiplayerNow(mockDb), serverBaseTime + 500 - 30);
});

test('fastest sample is chosen, but if fastest sample is >250ms uncertain, clock is invalid', async () => {
  setClockTransportForTesting(async (_db, _uid, index) => {
    // Samples with 700ms, 800ms, 600ms RTT -> fastest is 600ms (uncertainty 300ms > 250ms)
    const rtts = [700, 800, 600];
    const rtt = rtts[index];
    return {
      serverTime: 1700000000000,
      roundTrip: rtt,
      uncertainty: rtt / 2,
      monotonicTime: fakeMonotonic,
      measuredAt: 1700000000000,
    };
  });

  const clock = await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(clock.valid, false);
  assert.equal(clock.status, 'uncertain');
  assert.equal(clock.uncertainty, 300); // 600 / 2
  assert.equal(clock.reason, 'high-uncertainty');
  assert.equal(isMultiplayerClockValid(mockDb), false);
});

test('all samples having 6 seconds delay results in uncertainty ~3s and invalid clock', async () => {
  setClockTransportForTesting(async () => {
    return {
      serverTime: 1700000000000,
      roundTrip: 6000,
      uncertainty: 3000,
      monotonicTime: fakeMonotonic + 3000,
      measuredAt: 1700000000000,
    };
  });

  const clock = await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(clock.valid, false);
  assert.equal(clock.status, 'uncertain');
  assert.equal(clock.uncertainty, 3000);
  assert.equal(clock.reason, 'high-uncertainty');
});

test('clock older than 60s transitions automatically to valid=false and status stale', async () => {
  setClockTransportForTesting(async () => ({
    serverTime: 1700000000000,
    roundTrip: 50,
    uncertainty: 25,
    monotonicTime: fakeMonotonic,
    measuredAt: 1700000000000,
  }));

  const initial = await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(initial.valid, true);

  // Advance monotonic time by 59 seconds: still valid
  fakeMonotonic += 59000;
  assert.equal(getMultiplayerClock(mockDb).valid, true);

  // Advance monotonic time past 60 seconds (60001 ms): stale!
  fakeMonotonic += 1001;
  const stale = getMultiplayerClock(mockDb);
  assert.equal(stale.valid, false);
  assert.equal(stale.status, 'stale');
  assert.equal(stale.reason, 'stale');
  assert.equal(isMultiplayerClockValid(mockDb), false);
});

test('simulated monotonic pause or invalidation marks clock invalid and requires recalibration', async () => {
  setClockTransportForTesting(async () => ({
    serverTime: 1700000000000,
    roundTrip: 40,
    uncertainty: 20,
    monotonicTime: fakeMonotonic,
    measuredAt: 1700000000000,
  }));

  await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(isMultiplayerClockValid(mockDb), true);

  simulateMonotonicPause(mockDb);
  assert.equal(isMultiplayerClockValid(mockDb), false);
  assert.equal(getMultiplayerClock(mockDb).status, 'invalidated');

  // Recalibration restores valid status
  await synchronizeMultiplayerClock(mockDb, 'user-1', { force: true });
  assert.equal(isMultiplayerClockValid(mockDb), true);
});

test('asynchronous calibrations apply strictly in version order; old calibration cannot overwrite newer', async () => {
  let resolveSlow;
  const slowPromise = new Promise((resolve) => {
    resolveSlow = resolve;
  });

  let attempt1Triggered = false;
  setClockTransportForTesting(async () => {
    if (!attempt1Triggered) {
      attempt1Triggered = true;
      // First attempt is slow
      await slowPromise;
      return {
        serverTime: 1700000000000,
        roundTrip: 100,
        uncertainty: 50,
        monotonicTime: fakeMonotonic,
        measuredAt: 1700000000000,
      };
    } else {
      // Second attempt is fast with higher server time
      return {
        serverTime: 1700000999000,
        roundTrip: 80,
        uncertainty: 40,
        monotonicTime: fakeMonotonic,
        measuredAt: 1700000999000,
      };
    }
  });

  // Start attempt 1
  const attempt1Promise = synchronizeMultiplayerClock(mockDb, 'user-1');

  // Invalidate or start attempt 2 with force: true
  fakeMonotonic += 100;
  const attempt2Promise = synchronizeMultiplayerClock(mockDb, 'user-1', { force: true });

  const result2 = await attempt2Promise;
  assert.equal(result2.valid, true);
  assert.equal(result2.uncertainty, 40);

  // Now let attempt 1 finish
  resolveSlow();
  await attempt1Promise;

  // The clock state must STILL reflect attempt 2, not attempt 1!
  const current = getMultiplayerClock(mockDb);
  assert.equal(current.uncertainty, 40);
  assert.equal(current.version, result2.version);
});

test('concurrent overlapping calibration attempts coalesce and share the same promise', async () => {
  let callCount = 0;
  setClockTransportForTesting(async () => {
    callCount++;
    return {
      serverTime: 1700000000000,
      roundTrip: 60,
      uncertainty: 30,
      monotonicTime: fakeMonotonic,
      measuredAt: 1700000000000,
    };
  });

  const [p1, p2, p3] = await Promise.all([
    synchronizeMultiplayerClock(mockDb, 'user-1'),
    synchronizeMultiplayerClock(mockDb, 'user-1'),
    synchronizeMultiplayerClock(mockDb, 'user-1'),
  ]);

  assert.equal(p1, p2);
  assert.equal(p2, p3);
  assert.equal(callCount, 3); // 3 samples for the single coordinated attempt
});

test('rapid repeated calibrations are rate-limited within 5s unless forced', async () => {
  let callCount = 0;
  setClockTransportForTesting(async () => {
    callCount++;
    return {
      serverTime: 1700000000000,
      roundTrip: 50,
      uncertainty: 25,
      monotonicTime: fakeMonotonic,
      measuredAt: 1700000000000,
    };
  });

  await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(callCount, 3);

  // Second call within 2 seconds
  fakeMonotonic += 2000;
  await synchronizeMultiplayerClock(mockDb, 'user-1');
  assert.equal(callCount, 3); // Not incremented, returned cached valid clock

  // Forced call
  await synchronizeMultiplayerClock(mockDb, 'user-1', { force: true });
  assert.equal(callCount, 6); // Re-sampled
});

test('failed sample collection throws, sets status to error, and clears active promise without hanging', async () => {
  setClockTransportForTesting(async () => {
    throw new Error('Injected network failure');
  });

  await assert.rejects(
    () => synchronizeMultiplayerClock(mockDb, 'user-1'),
    /Injected network failure/,
  );

  const clock = getMultiplayerClock(mockDb);
  assert.equal(clock.status, 'error');
  assert.equal(clock.valid, false);

  // Subsequent call does not hang on a stuck activePromise
  setClockTransportForTesting(async () => ({
    serverTime: 1700000000000,
    roundTrip: 40,
    uncertainty: 20,
    monotonicTime: fakeMonotonic,
    measuredAt: 1700000000000,
  }));

  const recovered = await synchronizeMultiplayerClock(mockDb, 'user-1', { force: true });
  assert.equal(recovered.valid, true);
  assert.equal(recovered.status, 'synced');
});

test('device wall clock skew (Date.now +- 60s) does not alter multiplayerNow calculation', async () => {
  setClockTransportForTesting(async () => ({
    serverTime: 1700000000000,
    roundTrip: 60,
    uncertainty: 30,
    monotonicTime: 10000,
    measuredAt: 1700000000000,
  }));

  await synchronizeMultiplayerClock(mockDb, 'user-1');

  // Normal calculation
  fakeMonotonic = 15000;
  const normalNow = multiplayerNow(mockDb);

  // Skew wall clock by +60 seconds
  fakeWallTime += 60000;
  const skewedPlus = multiplayerNow(mockDb);
  assert.equal(skewedPlus, normalNow);

  // Skew wall clock by -60 seconds
  fakeWallTime -= 120000;
  const skewedMinus = multiplayerNow(mockDb);
  assert.equal(skewedMinus, normalNow);
});
