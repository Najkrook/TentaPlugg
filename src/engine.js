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
  theme: 'classic',
  preferredCount: 10,
});
export function nextStat(previous, okOrRating, at, reviewId) {
  const day = dayKey(at);
  let box = previous?.box ?? 0,
    lastPromotionDay = previous?.lastPromotionDay ?? null,
    dueAt = previous?.dueAt ?? at;

  let ok = false;
  let rating = 'good';
  if (typeof okOrRating === 'boolean') {
    ok = okOrRating;
    rating = ok ? 'good' : 'again';
  } else if (typeof okOrRating === 'string') {
    rating = okOrRating;
    ok = rating !== 'again';
  } else if (typeof okOrRating === 'object' && okOrRating !== null) {
    rating = okOrRating.rating || (okOrRating.ok ? 'good' : 'again');
    ok = rating !== 'again';
  }

  if (!ok || rating === 'again') {
    box = 0;
    dueAt = at + INTERVALS[0];
  } else if (rating === 'hard') {
    box = Math.max(0, box);
    dueAt = at + Math.min(INTERVALS[box], 86400000);
    lastPromotionDay = day;
  } else if (rating === 'easy') {
    box = Math.min(4, box + 2);
    dueAt = at + INTERVALS[box];
    lastPromotionDay = day;
  } else if ((!previous || dueAt <= at) && lastPromotionDay !== day) {
    box = Math.min(4, box + 1);
    dueAt = at + INTERVALS[box];
    lastPromotionDay = day;
  }
  return {
    ok,
    rating,
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
    state.stats[r.questionId] = nextStat(state.stats[r.questionId], r.rating ?? r.ok, r.at, r.id);
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
export function recordReview(state, session, questionId, okOrRating, now) {
  const id = `${session.attemptId}:${questionId}`,
    existing = state.reviews[id];
  const ok = typeof okOrRating === 'boolean' ? okOrRating : okOrRating !== 'again';
  const rating = typeof okOrRating === 'string' ? okOrRating : ok ? 'good' : 'again';
  const alreadyLegacy = session.legacyGraded && typeof session.grades[questionId] === 'boolean';
  session.grades[questionId] = ok;
  if ((existing?.ok === ok && existing?.rating === rating) || (alreadyLegacy && !existing)) return state;
  state.reviews[id] = {
    id,
    questionId,
    attemptId: session.attemptId,
    ok,
    rating,
    at: existing?.at ?? now,
    updatedAt: now,
  };
  return rebuildStats(state);
}
export function getContrastiveFeedback(q, userAnswer) {
  if (!q || !userAnswer) return null;
  const cleanAns = String(userAnswer).trim();
  if (!cleanAns) return null;
  if (correct(q, userAnswer)) return null;

  if (q.contrastive && q.contrastive[cleanAns]) {
    const val = q.contrastive[cleanAns];
    if (typeof val === 'object' && val !== null) {
      return {
        text: val.text,
        guideId: val.guideId || q.guideRef || 'ni-de',
      };
    }
    return {
      text: val,
      guideId: q.guideRef || 'ni-de',
    };
  }

  const hasAns = (ans) => (q.answers || []).some((a) => normalize(a) === normalize(ans));
  const correctAns = normalize(q.answers?.[0] || '');

  // Common particle rules for Japanese
  if (q.topic === 'Partiklar' || q.choices?.includes('は')) {
    if (cleanAns === 'で' && (hasAns('に') || hasAns('へ'))) {
      return {
        text: 'Du valde で. で används för platsen där en aktiv handling sker (t.ex. 本を読みます), medan に här anger plats för existens (あります/います), mål för förflyttning, eller personen man träffar.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'に' && hasAns('で')) {
      return {
        text: 'Du valde に. に anger riktning, bestämd tidpunkt eller existens (あります/います), medan で markerar platsen där en handling eller aktivitet faktiskt utförs.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'へ' && hasAns('で')) {
      return {
        text: 'Du valde へ. へ anger riktning mot ett mål, medan で markerar platsen där handlingen utförs.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'は' && hasAns('が')) {
      return {
        text: 'Du valde は. は sätter meningens övergripande tema (vad satsen handlar om), medan が här markerar objektet vid 好き/嫌い/わかります, eller lyfter fram subjektet som ny information.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'が' && hasAns('は')) {
      return {
        text: 'Du valde が. が används för ny information eller vid verb som 分かる/好き, men här etableras ett övergripande tema för hela satsen med は.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && hasAns('が')) {
      return {
        text: 'Du valde を. を markerar direkt objekt vid transitiva handlingar (t.ex. 食べます), men vid 好き (tycka om) och わかります (förstå) används partikeln が i japanska.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'が' && hasAns('を')) {
      return {
        text: 'Du valde が. が markerar grammatiskt subjekt eller komplement vid verb som 分かる/好き, medan transitiva handlingar tar partikeln を för det direkta objektet.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'を' && hasAns('に')) {
      return {
        text: 'Du valde を. を markerar direkt objekt, men vid transportmedel (som バスに乗ります) eller personen man träffar eller frågar används partikeln に.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'に' && hasAns('を')) {
      return {
        text: 'Du valde に. に anger destination, tidpunkt eller mottagare, medan det direkta objektet som påverkas av en handling markeras med を.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'で' && hasAns('を')) {
      return {
        text: 'Du valde で. で anger medel, verktyg eller handlingsplats, medan transitiva verb tar を för objektet som handlingen påverkar.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'を' && hasAns('で')) {
      return {
        text: 'Du valde を. を markerar direkt objekt, men när ett språk, verktyg eller medel används (t.ex. 日本語で) används partikeln で.',
        guideId: 'ni-de',
      };
    }
    if (cleanAns === 'と' && hasAns('の')) {
      return {
        text: 'Du valde と. と betyder ”tillsammans med” eller binder ihop sidoordnade substantiv (”och”), medan の knyter ihop substantiv där det ena beskriver eller äger det andra.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'の' && hasAns('と')) {
      return {
        text: 'Du valde の. の anger ägande eller bestämning (”Xs Y”), medan と binder samman två separata substantiv (”X och Y”) eller anger sällskap.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'は' && hasAns('の')) {
      return {
        text: 'Du valde は. は gör ordet till tema för hela satsen, medan の binder ihop två substantiv för att visa ägande eller tillhörighet (Xs Y).',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'の' && hasAns('は')) {
      return {
        text: 'Du valde の. の binder ihop två substantiv, medan は presenterar satsens övergripande tema eller ämne.',
        guideId: 'wa-ga',
      };
    }
    if (cleanAns === 'は' && hasAns('も')) {
      return {
        text: 'Du valde は. は sätter meningens normala tema, men när man vill uttrycka ”också/även” (som i ”jag också”) ersätts は med partikeln も.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'も' && hasAns('は')) {
      return {
        text: 'Du valde も. も betyder ”också/även” och förutsätter att samma sak redan sagts om någon annan, medan は är standardmarkören för meningens ämne.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (cleanAns === 'に' && hasAns('と')) {
      return {
        text: 'Du valde に. に anger riktning, tid eller existens, medan sällskap (”tillsammans med”) uttrycks med と.',
        guideId: 'wo-to-no-mo',
      };
    }
    if (['に', 'で', 'は', 'が', 'を', 'へ'].includes(cleanAns) && hasAns('×')) {
      return {
        text: `Du valde ${cleanAns}. Relativa tidsord (あした, きのう, まいにち), adverb (とても, たいてい) och räkneord tar normalt ingen partikel (markeras med ×).`,
        guideId: 'no-particle',
      };
    }
    if (cleanAns === '×' && ['に', 'で', 'を', 'は', 'が', 'と', 'の', 'へ', 'も'].some(hasAns)) {
      const needed = (q.answers || []).map(normalize).find((a) => ['に', 'で', 'を', 'は', 'が', 'と', 'の', 'へ', 'も'].includes(a)) || correctAns;
      return {
        text: `Du valde × (ingen partikel). Här behövs partikeln ${needed} för att binda samman orden och klargöra satsens grammatiska relation.`,
        guideId: ['に', 'で', 'へ'].includes(needed) ? 'ni-de' : ['は', 'が'].includes(needed) ? 'wa-ga' : 'wo-to-no-mo',
      };
    }
  }

  if (q.topic === 'Böjningar') {
    return {
      text: 'Kontrollera stammen och böjningsmönstret för ordklassen (i-adjektiv böjs med ～かった, na-adjektiv och substantiv med ～でした).',
      guideId: 'adjectives',
    };
  }

  if (q.topic === 'Moror & stavelser') {
    return {
      text: 'Kom ihåg att ん, っ och förlängda vokaler räknas som egna moror, men bildar stavelser tillsammans med föregående vokal.',
      guideId: 'moras',
    };
  }

  return null;
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
