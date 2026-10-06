// Explicit word boundaries and particle annotations; kana alone never determine word class.
const p = (text) => ({ text, particle: true });
const definitions = [
  {
    parts: [
      'きのう',
      'としょかん',
      p('で'),
      'にほんご',
      p('を'),
      'べんきょうしました',
      '。',
      'うち',
      p('も'),
      'にほんご',
      p('を'),
      'べんきょうしました',
      '。',
    ],
    targetParts: [
      'きのう',
      'としょかん',
      p('で'),
      'にほんご',
      p('を'),
      'べんきょうしました',
      '。',
      'うち',
      p('で'),
      p('も'),
      'にほんご',
      p('を'),
      'べんきょうしました',
      '。',
    ],
    answers: [
      'きのうとしょかんでにほんごをべんきょうしました。うちでもにほんごをべんきょうしました。',
    ],
    context:
      'Avsikten är: Jag studerade japanska på biblioteket igår. Jag studerade japanska hemma också.',
  },
  {
    parts: [
      'こうこう',
      p('の'),
      'とき',
      '、',
      'よく',
      'バスてい',
      p('の'),
      'ちかく',
      p('で'),
      'たけしさん',
      p('に'),
      'あいました',
      '。',
    ],
    targetParts: [
      'こうこう',
      p('の'),
      'とき',
      '、',
      'よく',
      'バスてい',
      p('の'),
      'ちかく',
      p('で'),
      'たけしさん',
      p('に'),
      'あいました',
      '。',
    ],
    answers: ['こうこうのとき、よくバスていのちかくでたけしさんにあいました。'],
  },
  {
    parts: ['おてら', p('で'), 'しゃしん', 'たくさん', p('を'), 'とりました', '。'],
    targetParts: ['おてら', p('で'), 'しゃしん', p('を'), 'たくさん', 'とりました', '。'],
    answers: ['おてらでしゃしんをたくさんとりました。'],
    explanation:
      'を markerar objektet しゃしん och placeras här direkt efter det: しゃしんをたくさんとりました。で markerar platsen där bilderna togs.',
  },
  {
    parts: ['まいにち', '７じはん', p('で'), 'ねます', '。'],
    targetParts: ['まいにち', '７じはん', p('に'), 'ねます', '。'],
    answers: ['まいにち７じはんにねます。'],
    context: 'Avsikten är: Jag lägger mig halv åtta varje dag.',
    explanation:
      'Ett bestämt klockslag markeras med に: ７じはんにねます。まいにち står utan tidspartikel. Här behöver で bytas till に.',
    adapted: true,
  },
  {
    parts: ['よく', 'スーパー', p('で'), 'にく', p('と'), 'やさい', p('を'), 'かいます', '。'],
    targetParts: [
      'よく',
      'スーパー',
      p('で'),
      'にく',
      p('と'),
      'やさい',
      p('を'),
      'かいます',
      '。',
    ],
    answers: ['よくスーパーでにくとやさいをかいます。'],
  },
  {
    parts: [
      'きょう',
      'カフェ',
      p('で'),
      'コーヒー',
      p('を'),
      'のみました',
      '。',
      'きのう',
      p('も'),
      'カフェ',
      p('で'),
      p('も'),
      'コーヒー',
      p('を'),
      'のみました',
      '。',
    ],
    targetParts: [
      'きょう',
      'カフェ',
      p('で'),
      'コーヒー',
      p('を'),
      'のみました',
      '。',
      'きのう',
      p('も'),
      'カフェ',
      p('で'),
      'コーヒー',
      p('を'),
      'のみました',
      '。',
    ],
    answers: ['きょうカフェでコーヒーをのみました。きのうもカフェでコーヒーをのみました。'],
    context:
      'Avsikten är: Jag drack kaffe på kafé idag och igår också. ”Också” avser dagen; ingen jämförelse med andra platser görs.',
  },
];

export const particleChoices = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'へ', 'か'];
export const isPunctuation = (text) => /^[。、！？\s]+$/u.test(text);

export function particleDefinition(id) {
  const match = /^l5-review-([1-6])$/.exec(id);
  if (!match) return undefined;
  const definition = definitions[Number(match[1]) - 1];
  const tokens = definition.parts.map((part, i) => ({
    id: `original-${i}`,
    text: typeof part === 'string' ? part : part.text,
    particle: typeof part !== 'string',
  }));
  const targetParts = definition.targetParts || definition.parts;
  const targetTokens = targetParts.map((part, i) => ({
    id: `target-${i}`,
    text: typeof part === 'string' ? part : part.text,
    particle: typeof part !== 'string',
  }));
  return { ...definition, tokens, targetTokens, sentence: tokens.map((t) => t.text).join('') };
}

// Old sessions deliberately retain the original question and self-assessment behavior.
export function questionForSession(q, session) {
  const exercise =
    session?.exerciseVersion === 1 && session.mode !== 'exam' ? particleDefinition(q?.id) : null;
  if (!exercise) return q;
  return {
    ...q,
    type: 'particle-edit',
    self: false,
    exercise,
    prompt: `Hitta partiklarna och rätta meningen.\n${exercise.sentence}`,
    answers: exercise.answers,
    explanation: exercise.explanation || q.explanation,
    answerLang: 'ja',
  };
}

export function particleCharacters(exercise) {
  return exercise.tokens.flatMap((token) =>
    Array.from(token.text).map((text, i) => ({
      id: `${token.id}-${i}`,
      text,
      particle: token.particle,
    })),
  );
}

export function initialParticleState(q) {
  return {
    stage: 'mark',
    selected: [],
    tokens: structuredClone(q.exercise.tokens),
    nextId: 0,
    editor: null,
  };
}

export const particleSentence = (state) => state.tokens.map((t) => t.text).join('');

export function markingResult(q, state) {
  const chars = particleCharacters(q.exercise);
  const expected = chars.filter((c) => c.particle).map((c) => c.id);
  const right = state.selected.filter((id) => expected.includes(id));
  const wrong = state.selected.filter((id) => !expected.includes(id));
  const missed = expected.filter((id) => !state.selected.includes(id));
  return { right, wrong, missed, ok: wrong.length === 0 && missed.length === 0 };
}

// Returns a new serializable state, or the old reference for an invalid/locked action.
export function reduceParticle(q, current, action) {
  const state = structuredClone(current);
  const { type, id, index, text } = action;
  if (state.stage === 'done') return current;
  if (state.stage === 'mark') {
    if (
      type === 'toggle' &&
      particleCharacters(q.exercise).some((c) => c.id === id && !isPunctuation(c.text))
    ) {
      state.selected = state.selected.includes(id)
        ? state.selected.filter((x) => x !== id)
        : [...state.selected, id];
    } else if (type === 'check-mark') {
      state.marking = markingResult(q, state);
      state.stage = 'marked';
    } else return current;
    return state;
  }
  if (state.stage === 'marked') {
    if (type !== 'continue') return current;
    state.stage = 'edit';
    return state;
  }
  if (state.stage !== 'edit') return current;
  const target = state.tokens.findIndex((t) => t.id === id && t.particle);
  if (type === 'select' && target >= 0) state.editor = { mode: 'selected', id };
  else if (type === 'cancel') state.editor = null;
  else if (type === 'add') state.editor = { mode: 'insert-position' };
  else if (type === 'reset') {
    state.tokens = structuredClone(q.exercise.tokens);
    state.editor = null;
  } else if (type === 'remove' && target >= 0) {
    state.tokens.splice(target, 1);
    state.editor = null;
  } else if (type === 'move' && target >= 0) state.editor = { mode: 'move-position', id };
  else if (type === 'replace' && target >= 0) state.editor = { mode: 'replace-choice', id };
  else if (
    type === 'position' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < state.tokens.length
  ) {
    if (state.editor?.mode === 'insert-position') state.editor = { mode: 'insert-choice', index };
    else if (state.editor?.mode === 'move-position') {
      const from = state.tokens.findIndex((t) => t.id === state.editor.id && t.particle);
      if (from < 0) return current;
      const [token] = state.tokens.splice(from, 1);
      state.tokens.splice(index > from ? index - 1 : index, 0, token);
      state.editor = null;
    } else return current;
  } else if (type === 'choice' && particleChoices.includes(text)) {
    if (state.editor?.mode === 'replace-choice') {
      const token = state.tokens.find((t) => t.id === state.editor.id && t.particle);
      if (!token) return current;
      token.text = text;
    } else if (state.editor?.mode === 'insert-choice') {
      state.tokens.splice(state.editor.index, 0, {
        id: `added-${state.nextId++}`,
        text,
        particle: true,
      });
    } else return current;
    state.editor = null;
  } else if (type === 'check-edit') {
    state.correctionOk = q.answers.includes(particleSentence(state));
    state.stage = 'done';
    state.editor = null;
  } else return current;
  return state;
}

export function lcsIndices(uList, tList) {
  const m = uList.length;
  const n = tList.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (uList[i] === tList[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  const matchedU = new Set();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (uList[i - 1] === tList[j - 1] && dp[i][j] === dp[i - 1][j - 1] + 1) {
      matchedU.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matchedU;
}

export function evaluateUserTokens(userTokens, targetTokens = []) {
  if (!userTokens) return [];
  if (!targetTokens || targetTokens.length === 0) {
    return userTokens.map((t) => (t.particle ? { ...t, status: 'wrong' } : t));
  }

  const result = [];
  let uIdx = 0;
  let tIdx = 0;

  while (uIdx < userTokens.length || tIdx < targetTokens.length) {
    const uParticles = [];
    while (uIdx < userTokens.length && userTokens[uIdx].particle) {
      uParticles.push(userTokens[uIdx]);
      uIdx++;
    }
    const tParticles = [];
    while (tIdx < targetTokens.length && targetTokens[tIdx].particle) {
      tParticles.push(targetTokens[tIdx]);
      tIdx++;
    }

    const matchedU = lcsIndices(
      uParticles.map((p) => p.text),
      tParticles.map((p) => p.text),
    );

    for (let i = 0; i < uParticles.length; i++) {
      result.push({
        ...uParticles[i],
        status: matchedU.has(i) ? 'right' : 'wrong',
      });
    }

    if (uIdx < userTokens.length) {
      result.push(userTokens[uIdx]);
      uIdx++;
    }
    if (tIdx < targetTokens.length) {
      tIdx++;
    }
  }

  return result;
}
