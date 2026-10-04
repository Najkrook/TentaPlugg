import { correct, recordReview, scoreAttempt } from './engine.js';
export function createSession(ids, name, options = {}) {
  return {
    attemptId: crypto.randomUUID(),
    ids,
    index: 0,
    name,
    answers: {},
    grades: {},
    revealed: {},
    mode: 'practice',
    ...options,
  };
}
export function submitSession(state, session, bank, now) {
  if (!session.submittedAt) {
    if (session.mode === 'exam')
      for (const id of session.ids) {
        const q = bank.find((q) => q.id === id);
        if (q && !q.self)
          recordReview(state, session, id, correct(q, session.answers[id] || ''), now);
      }
    session.submittedAt = now;
  }
  session.done = true;
  updateResult(state, session, bank, now);
}
export function updateResult(state, session, bank, now) {
  if (!session.submittedAt) return;
  const result = scoreAttempt(session, bank);
  state.attempts[session.attemptId] = { ...structuredClone(session), updatedAt: now, result };
  state.history = [
    {
      id: session.attemptId,
      name: session.name,
      at: session.submittedAt,
      updatedAt: now,
      ok: result.ok,
      total: result.total,
      exam: session.exam || null,
    },
    ...state.history.filter((h) => h.id !== session.attemptId),
  ];
  if (session.taskId && state.plans[session.planDay])
    state.plans[session.planDay].completed[session.taskId] = now;
}
