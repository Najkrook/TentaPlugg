import { DEFAULT_EXAM_DATE, INTERVALS, SCHEMA_VERSION, STUDY_TIME_ZONE } from './config.js';
import { questions } from './data.js';
export const normalize = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s。、.,!?！？]/g, '');
export const correct = (q, value) =>
  (q.answers || []).some((a) => normalize(a) === normalize(value));
export const dayKey = (now) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: STUDY_TIME_ZONE }).format(new Date(now));
export function daysUntil(date, now) {
  return Math.round((Date.parse(date) - Date.parse(dayKey(now))) / 86400000);
}
export const fresh = () => ({
  version: SCHEMA_VERSION,
  baselineStats: {},
  reviews: {},
  stats: {},
  history: [],
  drafts: {},
  attempts: {},
  plans: {},
  examDate: DEFAULT_EXAM_DATE,
  settingsAt: 0,
});
export function nextStat(previous, ok, at, reviewId) {
  const day = dayKey(at);
  let box = previous?.box ?? 0,
    lastPromotionDay = previous?.lastPromotionDay ?? null,
    dueAt = previous?.dueAt ?? at;
  if (!ok) {
    box = 0;
    dueAt = at + INTERVALS[0];
  } else if ((!previous || dueAt <= at) && lastPromotionDay !== day) {
    box = Math.min(4, box + 1);
    dueAt = at + INTERVALS[box];
    lastPromotionDay = day;
  }
  return {
    ok,
    at,
    attempts: (previous?.attempts || 0) + 1,
    box,
    dueAt,
    lastReviewDay: day,
    lastPromotionDay,
    reviewId,
  };
}
export function rebuildStats(state) {
  state.stats = { ...state.baselineStats };
  for (const r of Object.values(state.reviews).sort(
    (a, b) => a.at - b.at || a.id.localeCompare(b.id),
  ))
    state.stats[r.questionId] = nextStat(state.stats[r.questionId], r.ok, r.at, r.id);
  return state;
}
export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return fresh();
  const state = { ...fresh(), ...raw, drafts: { ...raw.drafts }, attempts: { ...raw.attempts } };
  if (raw.version !== SCHEMA_VERSION) {
    state.baselineStats = Object.fromEntries(
      Object.entries(raw.stats || {}).map(([id, s]) => [
        id,
        {
          ...s,
          box: s.ok ? 1 : 0,
          dueAt: s.at + INTERVALS[s.ok ? 1 : 0],
          lastReviewDay: dayKey(s.at),
          lastPromotionDay: s.ok ? dayKey(s.at) : null,
        },
      ]),
    );
    state.reviews = {};
    for (const [examId, draft] of Object.entries(state.drafts)) {
      const session = draft?.session ? { ...draft.session } : null;
      if (!session) continue;
      state.drafts[examId] = { ...draft, session };
      session.attemptId ||= session.historyId || `legacy-${examId}-${draft.at}`;
      session.mode ||= 'exam';
      if (session.done || session.review) {
        const at = state.history.find((h) => h.id === session.historyId)?.at || draft.at;
        session.submittedAt ||= at;
        session.legacyGraded = true;
        session.scoreUnavailable = !session.ids?.every((id) => {
          const q = questions.find((q) => q.id === id);
          return q && (q.self || typeof session.grades?.[id] === 'boolean');
        });
        state.attempts[session.attemptId] = { ...session, submittedAt: at, updatedAt: at };
      }
    }
  }
  state.version = SCHEMA_VERSION;
  return rebuildStats(state);
}
const stamp = (x) => x?.updatedAt ?? x?.at ?? 0;
function mergeMap(a = {}, b = {}) {
  const result = { ...a };
  for (const [id, v] of Object.entries(b))
    if (
      !result[id] ||
      stamp(v) > stamp(result[id]) ||
      (stamp(v) === stamp(result[id]) && JSON.stringify(v) > JSON.stringify(result[id]))
    )
      result[id] = v;
  return result;
}
function mergeDrafts(a, b) {
  const all = {};
  for (const [key, draft] of [...Object.entries(a), ...Object.entries(b)]) {
    const id = draft.session?.attemptId || key;
    Object.assign(all, mergeMap(all, { [id]: draft }));
  }
  const result = mergeMap(a, b);
  for (const [id, draft] of Object.entries(all)) {
    const primary = draft.session?.mode === 'exam' ? draft.session.exam : 'practice';
    if (result[primary]?.session?.attemptId === id) result[primary] = draft;
    else result[`attempt-${id}`] = draft;
  }
  for (const [key, draft] of Object.entries(result)) {
    if (!key.startsWith('attempt-')) continue;
    const primary = draft.session?.mode === 'exam' ? draft.session.exam : 'practice';
    if (result[primary]?.session?.attemptId === draft.session?.attemptId) delete result[key];
  }
  return result;
}
export function mergeProgress(left, right) {
  const a = migrate(left),
    b = migrate(right);
  const state = {
    ...a,
    baselineStats: mergeMap(a.baselineStats, b.baselineStats),
    reviews: mergeMap(a.reviews, b.reviews),
    drafts: mergeDrafts(a.drafts, b.drafts),
    attempts: mergeMap(a.attempts, b.attempts),
  };
  state.history = Object.values(
    mergeMap(
      Object.fromEntries(a.history.map((h) => [h.id, h])),
      Object.fromEntries(b.history.map((h) => [h.id, h])),
    ),
  ).sort((x, y) => y.at - x.at);
  // Each question has its own revision: independent self-grading on two devices survives.
  for (const [id, attempt] of Object.entries(state.attempts)) {
    const grades = { ...attempt.grades };
    for (const review of Object.values(state.reviews))
      if (review.attemptId === id) grades[review.questionId] = review.ok;
    const revised = { ...attempt, grades };
    if (
      !revised.scoreUnavailable &&
      revised.ids?.every((qid) => questions.some((q) => q.id === qid))
    ) {
      revised.result = scoreAttempt(revised, questions);
      state.history = state.history.map((h) =>
        h.id === id ? { ...h, ok: revised.result.ok, total: revised.result.total } : h,
      );
    }
    state.attempts[id] = revised;
  }
  state.plans = { ...a.plans };
  for (const [day, p] of Object.entries(b.plans)) {
    const old = state.plans[day];
    if (!old) state.plans[day] = p;
    else {
      const chosen = p.createdAt < old.createdAt ? p : old;
      state.plans[day] = { ...chosen, completed: { ...old.completed, ...p.completed } };
    }
  }
  if (b.settingsAt > a.settingsAt) {
    state.examDate = b.examDate;
    state.settingsAt = b.settingsAt;
  }
  return rebuildStats(state);
}
export function importGuest(account, guest) {
  const state = mergeProgress(account, guest);
  state.examDate = account.examDate;
  state.settingsAt = account.settingsAt;
  return state;
}
export function recordReview(state, session, questionId, ok, now) {
  const id = `${session.attemptId}:${questionId}`,
    existing = state.reviews[id];
  const alreadyLegacy = session.legacyGraded && typeof session.grades[questionId] === 'boolean';
  session.grades[questionId] = ok;
  if (existing?.ok === ok || (alreadyLegacy && !existing)) return state;
  state.reviews[id] = {
    id,
    questionId,
    attemptId: session.attemptId,
    ok,
    at: existing?.at ?? now,
    updatedAt: now,
  };
  return rebuildStats(state);
}
function hash(value) {
  let n = 0;
  for (const c of value) n = (Math.imul(n, 31) + c.charCodeAt(0)) | 0;
  return n >>> 0;
}
export function selectPractice(
  bank,
  stats,
  topic = 'Alla',
  count = 10,
  now = Date.now(),
  { extra = false, seed = dayKey(now), weak = false } = {},
) {
  return bank
    .filter(
      (q) =>
        (topic === 'Alla' ? q.topic !== 'Kana' : q.topic === topic) &&
        (extra || !stats[q.id] || (stats[q.id].dueAt ?? 0) <= now),
    )
    .map((q) => ({ q, s: stats[q.id] }))
    .sort((a, b) => {
      const rank = (x) => (!x.s ? 1 : (x.s.dueAt ?? 0) <= now ? 0 : 2);
      return (
        rank(a) - rank(b) ||
        (weak ? Number(a.s?.ok ?? true) - Number(b.s?.ok ?? true) : 0) ||
        (rank(a) === 0 ? (a.s.dueAt ?? 0) - (b.s.dueAt ?? 0) : 0) ||
        hash(seed + a.q.id) - hash(seed + b.q.id)
      );
    })
    .slice(0, count)
    .map((x) => x.q.id);
}
export function scoreAttempt(attempt, bank) {
  const qs = attempt.ids.map((id) => bank.find((q) => q.id === id)).filter(Boolean);
  return {
    earned: qs.reduce((n, q) => n + (attempt.grades[q.id] === true ? q.points || 1 : 0), 0),
    max: qs.reduce((n, q) => n + (q.points || 1), 0),
    pending: qs.filter((q) => q.self && typeof attempt.grades[q.id] !== 'boolean').length,
    unanswered: qs.filter((q) => !attempt.answers[q.id]?.trim()).length,
    ok: qs.filter((q) => attempt.grades[q.id] === true).length,
    total: qs.length,
  };
}
export const latestAttempt = (state, exam) =>
  Object.values(state.attempts)
    .filter((a) => a.exam === exam && a.submittedAt)
    .sort((a, b) => b.submittedAt - a.submittedAt)[0];
export const examErrors = (attempt) =>
  attempt
    ? attempt.ids.filter((id) => attempt.grades[id] === false || !attempt.answers[id]?.trim())
    : [];
export function ensurePlan(state, bank, now) {
  const day = dayKey(now);
  if (state.plans[day]) return state.plans[day];
  const index = Math.floor(Date.parse(day) / 86400000),
    remaining = daysUntil(state.examDate, now),
    intensive = remaining >= 0 && remaining <= 3;
  const otherTopics = [
    'Böjningar',
    'Moror & stavelser',
    'Ordföljd',
    'Ord & kanji',
    'Grammatikteori',
    'Läsförståelse',
  ];
  const weak = otherTopics
    .map((topic) => {
      const seen = bank.filter((q) => q.topic === topic && state.stats[q.id]);
      return {
        topic,
        rate: seen.length ? seen.filter((q) => !state.stats[q.id].ok).length / seen.length : -1,
      };
    })
    .sort((a, b) => b.rate - a.rate);
  const topic = weak[0].rate > 0 ? weak[0].topic : otherTopics[index % 3];
  const choose = (list, t, n) =>
    selectPractice(list, state.stats, t, n, now, { extra: true, seed: day, weak: intensive });
  const failed = new Set(Object.values(state.attempts).flatMap(examErrors));
  let examBank = bank.filter((q) => q.exam);
  if (intensive && examBank.some((q) => failed.has(q.id)))
    examBank = examBank.filter((q) => failed.has(q.id));
  const first = bank.find((q) => q.id === choose(examBank, 'Alla', 1)[0]);
  const part = first?.self
    ? [first.id]
    : choose(
        examBank.filter((q) => !q.self && q.exam === first?.exam && q.section === first?.section),
        'Alla',
        3,
      );
  const plan = {
    day,
    createdAt: now,
    completed: {},
    tasks: [
      { id: `${day}-particles`, name: '10 partiklar', ids: choose(bank, 'Partiklar', 10) },
      { id: `${day}-topic`, name: `5 frågor · ${topic}`, ids: choose(bank, topic, 5) },
      { id: `${day}-exam`, name: 'En liten tentadel', ids: part },
    ],
  };
  state.plans[day] = plan;
  return plan;
}
