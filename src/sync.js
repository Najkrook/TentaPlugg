export function createSyncQueue({
  uid,
  push,
  onStatus = () => {},
  onMerged = () => {},
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let pending = null,
    timer,
    running = null,
    active = true;
  async function flush() {
    cancel(timer);
    if (running) return running;
    if (!pending) return;
    const snapshot = pending;
    pending = null;
    running = (async () => {
      try {
        const merged = await push(uid, snapshot);
        if (active) {
          onMerged(merged);
          onStatus('Sparat i ditt konto');
        }
      } catch {
        pending = pending || snapshot;
        if (active) onStatus('Lokalt sparat · väntar på synkning');
      } finally {
        running = null;
      }
    })();
    await running;
    if (pending && pending !== snapshot && active) timer = schedule(flush, 800);
  }
  return {
    queue(state) {
      pending = state;
      cancel(timer);
      if (active) onStatus('Lokalt sparat · synkar…');
      timer = schedule(flush, 800);
    },
    flush,
    dispose() {
      active = false;
      cancel(timer);
      pending = null;
    },
  };
}
