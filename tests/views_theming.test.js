import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { vocabularyView } from '../src/views/vocabulary.js';
import { particlesView, particleSessionView } from '../src/views/particles.js';
import { vocabularyList, kanjiList } from '../src/vocabulary-data.js';

/**
 * Helper to recursively serialize Lit-html TemplateResult to string
 */
function renderTemplateToString(result) {
  if (result === null || result === undefined || result === false) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'number' || typeof result === 'boolean') return String(result);
  if (Array.isArray(result)) return result.map(renderTemplateToString).join('');
  if (result.strings && Array.isArray(result.values)) {
    let out = '';
    for (let i = 0; i < result.strings.length; i++) {
      out += result.strings[i];
      if (i < result.values.length) {
        out += renderTemplateToString(result.values[i]);
      }
    }
    return out;
  }
  return '';
}

function createMockCtx(theme = 'classic', overrides = {}) {
  return {
    theme,
    state: { examDate: '2026-10-24', preferredCount: 10, stats: {} },
    now: Date.now(),
    plan: { tasks: [], completed: {} },
    progress: () => ({ done: 10, due: 0, wrong: 2 }),
    navigate: (id) => {},
    start: (topic) => {},
    openGuideModal: (id) => {},
    speak: (text) => {},
    tts: true,
    render: () => {},
    ...overrides,
  };
}

// ============================================================================
// 1. Vocabulary View Theming & Mode Separation
// ============================================================================

test('Vocabulary View: renders kawaii banner and tip callout in Sakura mode', () => {
  const ctx = createMockCtx('sakura');
  const html = renderTemplateToString(vocabularyView(ctx));

  // Must include the anime banner card with .anime-figure
  assert.ok(
    html.includes('anime-figure vocab-anime-banner-card'),
    'Sakura mode must render .anime-figure.vocab-anime-banner-card',
  );
  assert.ok(
    html.includes('/anime/encourage.jpg'),
    'Sakura banner must include /anime/encourage.jpg mascot image',
  );
  assert.ok(
    html.includes('🌸 GENKI I 単語帳 · VOCAB DRILL 🌸'),
    'Sakura banner must include Genki vocab drill badge',
  );
  assert.ok(html.includes('単語のお守り 🌸'), 'Sakura banner must include omamori pill badge');
  assert.ok(
    html.includes('先輩、単語をいっぱい覚えよう！(๑•̀ㅂ•́)و✧'),
    'Sakura banner must include cheerful Japanese mascot encouragement',
  );
  assert.ok(
    html.replace(/\s+/g, ' ').includes('Varje nytt ord öppnar en ny dörr! 💕'),
    'Sakura banner must include Swedish translation',
  );

  // Must include kawaii study tip callout
  assert.ok(
    html.includes('kawaii-vocab-tip kawaii-tip-callout'),
    'Sakura mode must render .kawaii-vocab-tip.kawaii-tip-callout',
  );
  assert.ok(html.includes('Kawaii Studietips'), 'Callout must have Kawaii Studietips header');
});

test('Vocabulary View: strictly omits all anime figures in Classic mode (Hard-Hiding Invariant)', () => {
  const ctx = createMockCtx('classic');
  const html = renderTemplateToString(vocabularyView(ctx));

  assert.equal(
    html.includes('anime-figure'),
    false,
    'Classic mode must NOT render any elements with class anime-figure',
  );
  assert.equal(
    html.includes('vocab-anime-banner-card'),
    false,
    'Classic mode must NOT render vocab-anime-banner-card',
  );
  assert.equal(
    html.includes('/anime/'),
    false,
    'Classic mode must NOT reference any /anime/ mascot images',
  );
  assert.equal(
    html.includes('kawaii-vocab-tip'),
    false,
    'Classic mode must NOT render kawaii tip callouts',
  );

  // Classic mode must render accessible standard notice
  assert.ok(
    html.includes('Referensordlista för Genki I'),
    'Classic mode must render clean academic reference notice',
  );
});

test('Vocabulary View: renders Genki I vocabulary and kanji data accurately', () => {
  const ctx = createMockCtx('classic');
  const html = renderTemplateToString(vocabularyView(ctx));

  assert.ok(html.includes('Genki I Ordförråd'), 'Must render view title');
  assert.ok(html.includes('vocab-card'), 'Must render vocab cards');
  assert.ok(html.includes('Lektion 3'), 'Must render lesson filters');
  assert.ok(html.includes('Lektion 4'), 'Must render lesson filters');
  assert.ok(html.includes('Lektion 5'), 'Must render lesson filters');

  // Verify first word from vocabularyList is present
  const firstWord = vocabularyList[0];
  assert.ok(
    html.includes(firstWord.kana) || (firstWord.kanji && html.includes(firstWord.kanji)),
    `First word (${firstWord.kana}) must be rendered in vocab view`,
  );
});

// ============================================================================
// 2. Particle View Theming & Mode Separation
// ============================================================================

test('Particle View: renders kawaii banner and grammar tip callout in Sakura mode', () => {
  const ctx = createMockCtx('sakura');
  const html = renderTemplateToString(particlesView(ctx));

  // Must include the anime banner card with .anime-figure
  assert.ok(
    html.includes('anime-figure particle-anime-banner-card'),
    'Sakura mode must render .anime-figure.particle-anime-banner-card',
  );
  assert.ok(
    html.includes('/anime/mascot_peek.jpg'),
    'Sakura banner must include /anime/mascot_peek.jpg mascot image',
  );
  assert.ok(
    html.includes('🌸 助詞完全攻略 · JOSHI MASTER 🌸'),
    'Sakura banner must include Joshi master badge',
  );
  assert.ok(html.includes('助詞マスター ✨'), 'Sakura banner must include omamori pill badge');
  assert.ok(
    html.includes('助詞を制する者は日本語を制す！💮✨'),
    'Sakura banner must include cheerful Japanese mascot encouragement',
  );
  assert.ok(
    html.replace(/\s+/g, ' ').includes('Bemästra partiklarnas magiska nyanser! 💕'),
    'Sakura banner must include Swedish translation',
  );

  // Must include kawaii grammar tip callout
  assert.ok(
    html.includes('kawaii-particle-tip kawaii-tip-callout'),
    'Sakura mode must render .kawaii-particle-tip.kawaii-tip-callout',
  );
  assert.ok(
    html.includes('Kawaii Grammatiktips · に vs で'),
    'Callout must have Kawaii Grammatiktips header with contrastive note',
  );
});

test('Particle View: strictly omits all anime figures in Classic mode (Hard-Hiding Invariant)', () => {
  const ctx = createMockCtx('classic');
  const html = renderTemplateToString(particlesView(ctx));

  assert.equal(
    html.includes('anime-figure'),
    false,
    'Classic mode must NOT render any elements with class anime-figure',
  );
  assert.equal(
    html.includes('particle-anime-banner-card'),
    false,
    'Classic mode must NOT render particle-anime-banner-card',
  );
  assert.equal(
    html.includes('/anime/'),
    false,
    'Classic mode must NOT reference any /anime/ mascot images',
  );
  assert.equal(
    html.includes('kawaii-particle-tip'),
    false,
    'Classic mode must NOT render kawaii tip callouts',
  );

  // Classic mode must render accessible standard notice
  assert.ok(
    html.includes('Partiklar (助詞, joshi) är grammatiska markörer'),
    'Classic mode must render clean academic particle notice',
  );
});

test('Particle View: renders core canonical particles with contrast notes', () => {
  const ctx = createMockCtx('classic');
  const html = renderTemplateToString(particlesView(ctx));

  const standardParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の'];
  for (const p of standardParticles) {
    assert.ok(html.includes(`data-particle="${p}"`), `Must render particle card for ${p}`);
  }

  // Verify contrastive feedback notes exist
  assert.ok(
    html.includes('は (känd information / tema) vs が'),
    'Must include contrast note for wa vs ga',
  );
  assert.ok(
    html.includes('に anger stillastående existens eller tidpunkt; で anger plats'),
    'Must include contrast note for ni vs de',
  );

  // Verify practice launch button
  assert.ok(html.includes('Starta partikelpass'), 'Must include practice launch button');
});

// ============================================================================
// 3. Routing & Navigation Contract for /vocabulary and /particles
// ============================================================================

test('Routing Contract: KNOWN_VIEWS in src/main.js includes vocabulary and particles', () => {
  const mainCode = fs.readFileSync(path.resolve('src/main.js'), 'utf8');

  assert.ok(
    mainCode.includes("'vocabulary'") && mainCode.includes("'particles'"),
    'src/main.js must define vocabulary and particles views',
  );
  assert.ok(
    mainCode.includes('vocabularyView') && mainCode.includes('particlesView'),
    'src/main.js must import and call vocabularyView and particlesView',
  );
  assert.ok(
    mainCode.includes("view === 'vocabulary'") || mainCode.includes('view === "vocabulary"'),
    'src/main.js must dispatch view === vocabulary',
  );
  assert.ok(
    mainCode.includes("view === 'particles'") || mainCode.includes('view === "particles"'),
    'src/main.js must dispatch view === particles',
  );
  assert.ok(
    mainCode.includes('window.history.pushState'),
    'src/main.js navigate must synchronize browser URL history',
  );
  assert.ok(
    mainCode.includes('popstate'),
    'src/main.js must listen for popstate events for browser back/forward buttons',
  );
});

// ============================================================================
// 4. CSS Rules & Theme Hard-Hiding Compliance
// ============================================================================

test('CSS Contract: style.css defines anime banner styles and preserves hard-hiding invariant', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');

  // Hard-hiding invariant (lines 2495-2511)
  assert.ok(
    css.includes(":root:not([data-theme='sakura']) .anime-figure") ||
      css.includes(':root:not([data-theme="sakura"]) .anime-figure'),
    'CSS must enforce :root:not([data-theme="sakura"]) .anime-figure',
  );
  assert.ok(
    css.includes("[data-theme='classic'] .anime-figure") ||
      css.includes('[data-theme="classic"] .anime-figure'),
    'CSS must enforce [data-theme="classic"] .anime-figure',
  );

  // New banner styling
  assert.ok(css.includes('.vocab-anime-banner-card'), 'CSS must style .vocab-anime-banner-card');
  assert.ok(
    css.includes('.particle-anime-banner-card'),
    'CSS must style .particle-anime-banner-card',
  );
  assert.ok(
    css.includes('.kawaii-vocab-tip') || css.includes('.kawaii-tip-callout'),
    'CSS must style kawaii tip callouts',
  );
  assert.ok(css.includes('.vocab-card'), 'CSS must style .vocab-card');
  assert.ok(css.includes('.particle-card'), 'CSS must style .particle-card');
});

test('Genki I vocabularyList has full data integrity and valid word types', () => {
  assert.ok(vocabularyList.length >= 170, `Expected >= 170 items, got ${vocabularyList.length}`);
  const ALLOWED_WORD_TYPES = [
    'noun',
    'time',
    'u-verb',
    'ru-verb',
    'irregular-verb',
    'i-adj',
    'na-adj',
    'adverb',
    'expression',
    'pronoun',
    'particle',
    'counter',
  ];
  const seenIds = new Set();
  for (let i = 0; i < vocabularyList.length; i++) {
    const item = vocabularyList[i];
    assert.ok(typeof item.id === 'string' && item.id.length > 0, `Item ${i} must have valid id`);
    assert.equal(seenIds.has(item.id), false, `Duplicate id found: ${item.id}`);
    seenIds.add(item.id);
    assert.ok(
      typeof item.kana === 'string' && item.kana.length > 0,
      `Item ${item.id} kana non-empty`,
    );
    assert.ok(
      typeof item.romaji === 'string' && item.romaji.length > 0,
      `Item ${item.id} romaji non-empty`,
    );
    assert.ok(typeof item.sv === 'string' && item.sv.length > 0, `Item ${item.id} sv non-empty`);
    assert.ok([3, 4, 5].includes(item.lesson), `Item ${item.id} lesson 3, 4, or 5`);
    assert.ok(
      ALLOWED_WORD_TYPES.includes(item.wordType),
      `Item ${item.id} valid wordType: ${item.wordType}`,
    );
  }
});

test('Genki I kanjiList has full data integrity with valid strokes and readings', () => {
  assert.ok(kanjiList.length >= 43, `Expected >= 43 kanji, got ${kanjiList.length}`);
  const seenKanjiIds = new Set();
  for (let i = 0; i < kanjiList.length; i++) {
    const k = kanjiList[i];
    assert.ok(typeof k.id === 'string' && k.id.length > 0);
    assert.equal(seenKanjiIds.has(k.id), false, `Duplicate kanji id: ${k.id}`);
    seenKanjiIds.add(k.id);
    assert.ok(
      typeof k.kanji === 'string' && k.kanji.length === 1,
      `Kanji must be 1 char: ${k.kanji}`,
    );
    assert.ok(typeof k.strokes === 'number' && k.strokes > 0, `Valid strokes: ${k.strokes}`);
    assert.ok(Array.isArray(k.onyomi) && Array.isArray(k.kunyomi), `Readings must be arrays`);
    assert.ok(Array.isArray(k.compounds) && k.compounds.length > 0, `Compounds must exist`);
  }
});

test('Early head script FOUT prevention contract in index.html', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(
    html.includes("localStorage.getItem('tentaplugg-theme')"),
    'index.html must check stored theme',
  );
  assert.ok(
    html.includes("document.documentElement.dataset.theme = 'sakura'"),
    'index.html sets dataset.theme early',
  );
  const headIdx = html.indexOf('<head>');
  const scriptIdx = html.indexOf("localStorage.getItem('tentaplugg-theme')");
  const bodyIdx = html.indexOf('<body');
  assert.ok(headIdx !== -1 && scriptIdx !== -1 && bodyIdx !== -1);
  assert.ok(
    headIdx < scriptIdx && scriptIdx < bodyIdx,
    'Theme FOUT script must execute in <head> before <body>',
  );
});
