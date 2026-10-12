// Delas av vy och händelsehantering, även efter återupptagning.
export const immediateFeedback = (s) => s.feedbackTiming === 'immediate';
export const canCheck = (s) => s.mode !== 'exam' || immediateFeedback(s) || Boolean(s.submittedAt);
export const feedbackVisible = (s, id) =>
  canCheck(s) &&
  Boolean((s.review && s.submittedAt) || typeof s.grades[id] === 'boolean' || s.revealed?.[id]);
export const answerLocked = (s, id) =>
  Boolean(s.submittedAt || (immediateFeedback(s) && typeof s.grades[id] === 'boolean'));
