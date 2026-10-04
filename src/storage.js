import { migrate } from './engine.js';
export const storageKey = (uid) => `tentaplugg-v1-${uid || 'guest'}`;
export function readLocal(storage, uid) {
  const raw = storage.getItem(storageKey(uid));
  if (!raw) return migrate(null);
  try {
    return migrate(JSON.parse(raw));
  } catch {
    throw new Error('Sparade data kunde inte läsas. Originalet finns kvar i webbläsaren.');
  }
}
export function createLocalSaver({
  storage,
  uid,
  getState,
  onSaved = () => {},
  onError = () => {},
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let timer,
    dirty = false;
  function flush() {
    cancel(timer);
    timer = undefined;
    if (!dirty) return true;
    try {
      const payload = JSON.stringify(getState());
      storage.setItem(storageKey(uid), payload);
      dirty = false;
      onSaved(payload);
      return true;
    } catch (error) {
      onError(error);
      return false;
    }
  }
  return {
    schedule() {
      dirty = true;
      cancel(timer);
      timer = schedule(flush, 300);
    },
    flush,
    mark() {
      dirty = true;
    },
    dispose() {
      flush();
      cancel(timer);
    },
  };
}
