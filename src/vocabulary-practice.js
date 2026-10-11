import { vocabularyList } from './vocabulary-data.js';

// Keep the source list intact; spell out the letter name in this kana-only mode.
export const practiceWords = vocabularyList.map((word) => ({
  ...word,
  kana: word.kana.replace('L', 'エル'),
}));
const contexts = {
  'v-l3-34': 'Om ljud',
  'v-l5-43': 'När du ställer en fråga',
  'v-l5-19': 'Om vädret',
  'v-l5-21': 'Om föremål, mat eller dryck',
};
// Conservative exclusions, including synonymous readings and overlapping senses.
const overlappingGroups = [
  ['v-l3-17', 'v-l3-18'],
  ['v-l3-31', 'v-l4-44'],
  ['v-l3-43', 'v-l5-45'],
  ['v-l3-52', 'v-l4-48', 'v-l5-48', 'v-l5-50'],
  ['v-l5-25', 'v-l5-31'],
  ['v-l4-49', 'v-l5-47'],
  ['v-l3-32', 'v-l5-44', 'v-l5-46'],
];
const tokens = (text) =>
  text
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .match(/[a-zåäö]{3,}/g) || [];
export function ambiguousWords(a, b) {
  return (
    a.kana === b.kana ||
    overlappingGroups.some((group) => group.includes(a.id) && group.includes(b.id)) ||
    tokens(a.sv).some((token) => tokens(b.sv).includes(token))
  );
}
export const vocabularyQuestions = practiceWords.flatMap((word) =>
  ['sv', 'kana'].map((direction) => ({
    id: `glosa-${word.id}-${direction}`,
    type: 'vocabulary-choice',
    topic: 'Glosor',
    wordId: word.id,
    lesson: word.lesson,
    direction,
    kana: word.kana,
    sv: word.sv,
    context: contexts[word.id] || '',
    prompt: direction === 'sv' ? word.kana : word.sv,
    promptLang: direction === 'sv' ? 'ja' : 'sv',
    answerLang: direction === 'sv' ? 'sv' : 'ja',
    answers: [direction === 'sv' ? word.sv : word.kana],
    explanation: `${word.kana} — ${word.sv}`,
  })),
);
export const vocabularyById = new Map(vocabularyQuestions.map((q) => [q.id, q]));
function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function vocabularyChoices(q, random = Math.random) {
  const word = practiceWords.find((w) => w.id === q.wordId);
  const candidates = shuffle(
    practiceWords.filter((w) => !ambiguousWords(word, w)),
    random,
  );
  // Prefer the same word class, without sacrificing unambiguous answers.
  candidates.sort(
    (a, b) => Number(b.wordType === word.wordType) - Number(a.wordType === word.wordType),
  );
  const choices = [q.answers[0]];
  for (const candidate of candidates) {
    const label = q.direction === 'sv' ? candidate.sv : candidate.kana;
    if (!choices.includes(label)) choices.push(label);
    if (choices.length === 4) break;
  }
  if (choices.length !== 4) throw new Error(`För få svarsalternativ för ${q.id}`);
  return shuffle(choices, random);
}
function alternate(items) {
  const queues = ['sv', 'kana'].map((d) => items.filter((q) => q.direction === d));
  const result = [];
  while (queues.some((queue) => queue.length)) {
    for (const queue of queues) if (queue.length) result.push(queue.shift());
  }
  return result;
}
export function selectVocabulary(stats, now, { lesson = 'all', extra = false, count = 10 } = {}) {
  const bank = vocabularyQuestions.filter((q) => lesson === 'all' || q.lesson === Number(lesson));
  const fresh = bank.filter((q) => !stats[q.id]);
  // Round-robin across lessons before interleaving the two directions.
  const queues = [3, 4, 5].map((l) => fresh.filter((q) => q.lesson === l));
  const spread = [];
  while (queues.some((queue) => queue.length)) {
    for (const queue of queues) if (queue.length) spread.push(queue.shift());
  }
  const unseen = alternate(spread);
  const due = bank
    .filter((q) => stats[q.id]?.dueAt <= now)
    .sort((a, b) => stats[a.id].dueAt - stats[b.id].dueAt || a.id.localeCompare(b.id));
  const selected = due.splice(0, Math.min(Math.floor(count / 2), due.length));
  while (unseen.length && selected.length < count) {
    const usedWords = new Set(selected.map((q) => q.wordId));
    const direction = selected.at(-1)?.direction === 'sv' ? 'kana' : 'sv';
    let index = unseen.findIndex((q) => !usedWords.has(q.wordId) && q.direction === direction);
    if (index < 0) index = unseen.findIndex((q) => !usedWords.has(q.wordId));
    // Only show both directions of one word if no other unseen words remain.
    selected.push(...unseen.splice(Math.max(0, index), 1));
  }
  selected.push(...due.splice(0, count - selected.length));
  if (extra && selected.length < count) {
    selected.push(
      ...bank
        .filter((q) => !selected.includes(q))
        .sort((a, b) => (stats[a.id]?.at || 0) - (stats[b.id]?.at || 0))
        .slice(0, count - selected.length),
    );
  }
  return alternate(selected).map((q) => q.id);
}
export function vocabularyProgress(stats, now, lesson = 'all') {
  const words = practiceWords.filter((w) => lesson === 'all' || w.lesson === Number(lesson));
  const pairs = words.map((w) => ['sv', 'kana'].map((d) => stats[`glosa-${w.id}-${d}`]));
  return {
    total: words.length,
    started: pairs.filter((p) => p.some(Boolean)).length,
    bothCorrect: pairs.filter((p) => p.every((s) => s?.ok)).length,
    due: pairs.filter((p) => p.some((s) => s?.dueAt <= now)).length,
  };
}
