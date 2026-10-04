import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalSaver, readLocal } from '../src/storage.js';
import { createSyncQueue } from '../src/sync.js';
function timers() {
  let clock = 0,
    id = 0;
  const jobs = new Map();
  return {
    schedule(fn, delay) {
      jobs.set(++id, { at: clock + delay, fn });
      return id;
    },
    cancel(id) {
      jobs.delete(id);
    },
    tick(ms) {
      clock += ms;
      for (const [id, j] of [...jobs])
        if (j.at <= clock) {
          jobs.delete(id);
          j.fn();
        }
    },
  };
}
test('typing is debounced at 300 ms, flush preserves the last character', () => {
  const t = timers(),
    writes = [],
    state = { text: '' };
  const saver = createLocalSaver({
    storage: { setItem: (k, v) => writes.push([k, v]) },
    uid: 'u',
    getState: () => state,
    schedule: t.schedule,
    cancel: t.cancel,
  });
  state.text = 'に';
  saver.schedule();
  t.tick(100);
  state.text = 'にほん';
  saver.schedule();
  t.tick(299);
  assert.equal(writes.length, 0);
  t.tick(1);
  assert.equal(writes.length, 1);
  assert.equal(JSON.parse(writes[0][1]).text, 'にほん');
  state.text += 'ご';
  saver.schedule();
  saver.flush();
  t.tick(300);
  assert.equal(writes.length, 2);
  assert.equal(JSON.parse(writes[1][1]).text, 'にほんご');
});
test('failed local writes remain retryable and corrupt originals are never overwritten on read', () => {
  let fail = true,
    errors = 0;
  const saver = createLocalSaver({
    storage: {
      setItem() {
        if (fail) throw Error();
      },
    },
    getState: () => ({ a: 1 }),
    onError: () => errors++,
  });
  saver.mark();
  assert.equal(saver.flush(), false);
  fail = false;
  assert.equal(saver.flush(), true);
  assert.equal(errors, 1);
  assert.throws(() => readLocal({ getItem: () => '{bad' }, null), /Originalet/);
});
test('old account request cannot report success into new account', async () => {
  let resolve;
  const statuses = [],
    merged = [],
    calls = [];
  const queue = createSyncQueue({
    uid: 'alice',
    push: (uid, s) => {
      calls.push(uid);
      return new Promise((r) => (resolve = r));
    },
    onStatus: (s) => statuses.push(s),
    onMerged: (s) => merged.push(s),
  });
  queue.queue({ v: 1 });
  const done = queue.flush();
  queue.dispose();
  resolve({ v: 1 });
  await done;
  assert.deepEqual(calls, ['alice']);
  assert.equal(merged.length, 0);
  assert(!statuses.includes('Sparat i ditt konto'));
});
test('failed cloud write remains queued and newer edits are preserved', async () => {
  let fail = true,
    received;
  const q = createSyncQueue({
    uid: 'u',
    push: async (_, s) => {
      if (fail) throw Error();
      received = s;
      return s;
    },
  });
  q.queue({ v: 1 });
  await q.flush();
  q.queue({ v: 2 });
  fail = false;
  await q.flush();
  assert.deepEqual(received, { v: 2 });
  q.dispose();
});
