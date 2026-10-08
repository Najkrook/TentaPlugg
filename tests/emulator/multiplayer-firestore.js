// Transport seam only: every callback and commit still uses the real emulator.
export * from 'firebase/firestore';
import { runTransaction as realTransaction } from 'firebase/firestore';
let beforeCommit = null;
export function interceptCommit(callback) {
  beforeCommit = callback;
}
export function runTransaction(database, callback, options) {
  return realTransaction(
    database,
    async (tx) => {
      const result = await callback(tx);
      await beforeCommit?.();
      return result;
    },
    options,
  );
}
