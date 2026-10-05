import { createSession } from './session.js';

// Unassessed answers are handled by self-assessment, never assumed to be wrong.
export function followUpQuestions(attempt, bank) {
  const known = new Set(bank.map((q) => q.id));
  return [...new Set(attempt.ids)]
    .filter((id) => known.has(id) && attempt.grades[id] === false)
    .slice(0, 5);
}

export function createFollowUp(attempt, bank) {
  const ids = followUpQuestions(attempt, bank);
  return ids.length
    ? createSession(ids, 'Öva vidare · senaste passet', { sourceAttemptId: attempt.attemptId })
    : null;
}
