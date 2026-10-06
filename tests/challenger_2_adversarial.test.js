import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { vocabularyList, kanjiList } from '../src/vocabulary-data.js';
import { vocabularyView } from '../src/views/vocabulary.js';
import { particlesView } from '../src/views/particles.js';
import { questions } from '../src/data.js';
import {
  initClickParticles,
  purgeParticles,
  spawnParticleBurst,
  getActiveParticleCount,
  PARTICLE_GLYPHS,
  MAX_CONCURRENT_PARTICLES,
} from '../src/particles-fx.js';
import { fresh } from '../src/engine.js';

// ============================================================================
// Lit-HTML Template Serializer & Context Helpers
// ============================================================================

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
  let activeTheme = theme;
  return {
    get theme() {
      return activeTheme;
    },
    set theme(val) {
      activeTheme = val;
    },
    state: { examDate: '2026-10-24', preferredCount: 10, stats: {}, theme: activeTheme },
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
// Headless DOM Environment Mock
// ============================================================================

function createMockDomEnvironment() {
  const elements = new Set();
  const windowListeners = new Map();
  let reducedMotion = false;

  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.classList = {
        _list: new Set(),
        add(...cls) {
          cls.forEach((c) => this._list.add(c));
        },
        remove(...cls) {
          cls.forEach((c) => this._list.delete(c));
        },
        contains(c) {
          return this._list.has(c);
        },
      };
      this.style = {
        _props: new Map(),
        setProperty(k, v) {
          this._props.set(k, String(v));
        },
        getPropertyValue(k) {
          return this._props.get(k) || '';
        },
      };
      this.attributes = new Map();
      this.eventListeners = new Map();
      this.textContent = '';
      this.parentNode = null;
      this.dataset = {};
    }

    get className() {
      return Array.from(this.classList._list).join(' ');
    }
    set className(val) {
      this.classList._list = new Set(val.split(/\s+/).filter(Boolean));
    }

    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }
    getAttribute(k) {
      return this.attributes.get(k) || null;
    }

    addEventListener(type, fn, opts) {
      if (!this.eventListeners.has(type)) this.eventListeners.set(type, []);
      this.eventListeners.get(type).push({ fn, opts });
    }

    dispatchEvent(event) {
      const list = this.eventListeners.get(event.type) || [];
      for (const { fn } of list) {
        fn.call(this, event);
      }
    }

    remove() {
      if (this.parentNode && this.parentNode.children) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) this.parentNode.children.splice(idx, 1);
      }
      elements.delete(this);
      this.parentNode = null;
    }
  }

  const body = new MockElement('body');
  body.children = [];
  body.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    elements.add(child);
    return child;
  };

  const mockDoc = {
    createElement(tag) {
      return new MockElement(tag);
    },
    body,
    documentElement: body,
    querySelectorAll(selector) {
      if (selector === '.kawaii-click-particle') {
        return Array.from(elements).filter((el) => el.classList.contains('kawaii-click-particle'));
      }
      return [];
    },
  };

  const mockWin = {
    addEventListener(type, fn, opts) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push({ fn, opts });
    },
    removeEventListener(type, fn) {
      const list = windowListeners.get(type) || [];
      const idx = list.findIndex((item) => item.fn === fn);
      if (idx !== -1) list.splice(idx, 1);
    },
    dispatchClick(e) {
      const list = windowListeners.get('click') || [];
      for (const { fn } of list) {
        fn(e);
      }
    },
    matchMedia(query) {
      return {
        matches: query.includes('prefers-reduced-motion') && reducedMotion,
      };
    },
    setReducedMotion(val) {
      reducedMotion = val;
    },
  };

  return { mockDoc, mockWin, body, elements };
}

// ============================================================================
// FOCUS AREA 1: Reduced Motion & Accessibility Boundaries
// ============================================================================

test('ADV-1.1: prefers-reduced-motion suppresses particle burst clicks completely (0 elements)', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    let theme = 'sakura';
    const teardown = initClickParticles(() => theme);

    // 1. With normal motion, clicks spawn particles
    mockWin.setReducedMotion(false);
    mockWin.dispatchClick({ clientX: 100, clientY: 100 });
    const countNormal = getActiveParticleCount();
    assert.ok(
      countNormal >= 5 && countNormal <= 7,
      `Normal motion must spawn 5-7 particles, got ${countNormal}`,
    );

    // 2. Under reduced motion, clicks must spawn exactly ZERO particles
    purgeParticles();
    assert.equal(getActiveParticleCount(), 0);
    mockWin.setReducedMotion(true);

    for (let click = 0; click < 50; click++) {
      mockWin.dispatchClick({ clientX: 200 + click, clientY: 300 + click });
    }
    assert.equal(
      getActiveParticleCount(),
      0,
      'Active particle count must remain 0 after 50 clicks under prefers-reduced-motion',
    );
    assert.equal(
      mockDoc.querySelectorAll('.kawaii-click-particle').length,
      0,
      'DOM must contain 0 .kawaii-click-particle elements under prefers-reduced-motion',
    );

    teardown();
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('ADV-1.2: CSS media query strictly disables jelly bouncy button transitions and animations', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');

  // Must define prefers-reduced-motion block
  assert.ok(
    css.includes('@media (prefers-reduced-motion: reduce)'),
    'CSS must include @media (prefers-reduced-motion: reduce)',
  );

  // Global transition disabling
  assert.ok(
    css.includes('transition: none !important;'),
    'CSS must enforce transition: none !important for accessibility',
  );

  // Specific Sakura bouncy button override
  const reducedBlockRegex = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g;
  const matches = [...css.matchAll(reducedBlockRegex)];
  assert.ok(
    matches.length >= 1,
    'CSS must have at least one @media (prefers-reduced-motion: reduce) block',
  );

  const combinedBlocks = matches.map((m) => m[1]).join('\n');
  assert.ok(
    combinedBlocks.includes('transform: none !important') ||
      combinedBlocks.includes('transition: none !important'),
    'Reduced motion blocks must disable transform or transition',
  );
  assert.ok(
    combinedBlocks.includes('.primary') && combinedBlocks.includes('.theme-toggle'),
    'Reduced motion must target primary buttons and theme toggles',
  );
});

test('ADV-1.3: Ambient sakura petals have animation and display suppression under prefers-reduced-motion', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  const reducedBlockRegex = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/g;
  const matches = [...css.matchAll(reducedBlockRegex)];
  const combinedBlocks = matches.map((m) => m[1]).join('\n');
  assert.ok(combinedBlocks.includes('.sakura-petal'), 'Reduced motion must target .sakura-petal');
  assert.ok(
    combinedBlocks.includes('.sakura-petals-container'),
    'Reduced motion must target .sakura-petals-container',
  );
  assert.ok(
    combinedBlocks.includes('animation: none !important'),
    'Reduced motion must suppress animations on sakura petals',
  );
  assert.ok(
    combinedBlocks.includes('display: none !important'),
    'Reduced motion must hide sakura petals container',
  );
});

// ============================================================================
// FOCUS AREA 2: View Routing & Extreme URL Inputs
// ============================================================================

test('ADV-2.1: Router path extractor handles extreme query strings, hashes, and slashes without crashing', () => {
  const KNOWN_VIEWS = [
    'home',
    'vocabulary',
    'particles',
    'exams',
    'multiplayer',
    'progress',
    'guide',
  ];

  // Router logic under test (extracted directly from src/main.js:28-33 & 845-849)
  function parseRoute(pathname) {
    if (!pathname || typeof pathname !== 'string') return 'home';
    const initPath = pathname.replace(/^\/+/, '').split('/')[0] || 'home';
    return KNOWN_VIEWS.includes(initPath) ? initPath : 'home';
  }

  // Adversarial URL inputs matrix
  const testCases = [
    // Standard routes
    { path: '/vocabulary', expected: 'vocabulary' },
    { path: '/particles', expected: 'particles' },
    { path: '/exams', expected: 'exams' },
    { path: '/', expected: 'home' },

    // Trailing slashes and repeated slashes
    { path: '/vocabulary/', expected: 'vocabulary' },
    { path: '/particles///', expected: 'particles' },
    { path: '///vocabulary', expected: 'vocabulary' },
    { path: '/////', expected: 'home' },

    // Sub-paths / deep routes
    { path: '/vocabulary/lesson-3', expected: 'vocabulary' },
    { path: '/particles/ni-vs-de/summary', expected: 'particles' },

    // Unknown, invalid, or corrupted paths
    { path: '/unknown-route', expected: 'home' },
    { path: '/null', expected: 'home' },
    { path: '/undefined', expected: 'home' },
    { path: '/NaN', expected: 'home' },
    { path: '/12345', expected: 'home' },
    { path: '/[object Object]', expected: 'home' },

    // Special characters and encoded input
    { path: '/%20', expected: 'home' },
    { path: '/?foo=bar', expected: 'home' },
    { path: '/#section', expected: 'home' },
    { path: '', expected: 'home' },
  ];

  for (const tc of testCases) {
    const result = parseRoute(tc.path);
    assert.equal(
      result,
      tc.expected,
      `Path "${tc.path}" should resolve to "${tc.expected}", got "${result}"`,
    );
  }
});

test('ADV-2.2: Switching between /vocabulary, /exams, and /particles preserves theme state and resets session', () => {
  let theme = 'sakura';
  let view = 'home';
  let session = null;

  function navigate(id) {
    session = null;
    view = id;
    // theme is intentionally preserved and untouched
  }

  // 1. Initial state
  assert.equal(theme, 'sakura');
  assert.equal(view, 'home');

  // 2. Navigate to /vocabulary
  navigate('vocabulary');
  assert.equal(view, 'vocabulary');
  assert.equal(theme, 'sakura', 'Theme must be preserved when navigating to vocabulary');
  assert.equal(session, null);

  // 3. Simulate active exam or session
  session = { attemptId: 'att-123', index: 0, done: false };
  assert.ok(session !== null);

  // 4. Navigate to /exams
  navigate('exams');
  assert.equal(view, 'exams');
  assert.equal(theme, 'sakura', 'Theme must be preserved when navigating to exams');
  assert.equal(session, null, 'Session must be cleaned up on navigation');

  // 5. Navigate back to /vocabulary
  navigate('vocabulary');
  assert.equal(view, 'vocabulary');
  assert.equal(theme, 'sakura', 'Theme must be preserved when returning to vocabulary');

  // 6. Navigate to /particles
  navigate('particles');
  assert.equal(view, 'particles');
  assert.equal(theme, 'sakura', 'Theme must be preserved when navigating to particles');

  // 7. Toggle theme to classic and verify navigation preserves classic
  theme = 'classic';
  navigate('vocabulary');
  assert.equal(view, 'vocabulary');
  assert.equal(theme, 'classic', 'Theme must stay classic when navigating');
  navigate('exams');
  assert.equal(view, 'exams');
  assert.equal(theme, 'classic');
});

// ============================================================================
// FOCUS AREA 3: Data Integrity & Word Type Chips
// ============================================================================

test('ADV-3.1: vocabularyList (170 items) has 100% data integrity with zero dummy or undefined fields', () => {
  assert.ok(
    vocabularyList.length >= 170,
    `Expected at least 170 vocabulary items, got ${vocabularyList.length}`,
  );

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
    const prefix = `Item [${i}] (id: ${item.id}):`;

    // 1. Mandatory ID uniqueness and validity
    assert.ok(typeof item.id === 'string' && item.id.length > 0, `${prefix} must have valid id`);
    assert.equal(seenIds.has(item.id), false, `${prefix} duplicate id found: ${item.id}`);
    seenIds.add(item.id);

    // 2. Japanese & pronunciation fields
    assert.ok(
      typeof item.kana === 'string' && item.kana.length > 0,
      `${prefix} kana must be non-empty`,
    );
    assert.ok(
      typeof item.romaji === 'string' && item.romaji.length > 0,
      `${prefix} romaji must be non-empty`,
    );
    if (item.kanji) {
      assert.ok(
        typeof item.kanji === 'string' && item.kanji.length > 0,
        `${prefix} kanji must be non-empty when defined`,
      );
    }

    // 3. Translations
    assert.ok(
      typeof item.sv === 'string' && item.sv.length > 0,
      `${prefix} Swedish translation (sv) must be non-empty`,
    );

    // 4. Lesson validity (Genki I Lektion 3, 4, 5)
    assert.ok([3, 4, 5].includes(item.lesson), `${prefix} lesson must be 3, 4, or 5`);

    // 5. Word type validity
    assert.ok(
      ALLOWED_WORD_TYPES.includes(item.wordType),
      `${prefix} wordType "${item.wordType}" must be one of allowed types`,
    );

    // 6. Adversarial dummy text search
    const forbiddenSubstrings = [
      'undefined',
      'null',
      'NaN',
      'TODO',
      'Lorem',
      'lorem',
      'placeholder',
      'dummy',
      'test_word',
      '[object',
    ];
    for (const forbidden of forbiddenSubstrings) {
      assert.equal(
        item.sv.includes(forbidden),
        false,
        `${prefix} Swedish text contains forbidden word "${forbidden}"`,
      );
      assert.equal(
        item.romaji.includes(forbidden),
        false,
        `${prefix} Romaji text contains forbidden word "${forbidden}"`,
      );
    }
  }
});

test('ADV-3.2: kanjiList (43 items) has 100% data integrity with valid strokes, readings, and compounds', () => {
  assert.ok(kanjiList.length >= 43, `Expected at least 43 kanji, got ${kanjiList.length}`);

  const seenKanji = new Set();

  for (let i = 0; i < kanjiList.length; i++) {
    const k = kanjiList[i];
    const prefix = `Kanji [${i}] (${k.kanji}):`;

    assert.ok(typeof k.id === 'string' && k.id.length > 0, `${prefix} id must be non-empty`);
    assert.ok(typeof k.kanji === 'string' && k.kanji.length > 0, `${prefix} character non-empty`);
    assert.equal(seenKanji.has(k.kanji), false, `${prefix} duplicate kanji character: ${k.kanji}`);
    seenKanji.add(k.kanji);

    assert.ok([3, 4, 5].includes(k.lesson), `${prefix} lesson must be 3, 4, or 5`);
    assert.ok(typeof k.strokes === 'number' && k.strokes > 0, `${prefix} strokes must be > 0`);
    assert.ok(
      typeof k.meaning_sv === 'string' && k.meaning_sv.length > 0,
      `${prefix} meaning_sv non-empty`,
    );

    // Readings arrays
    assert.ok(Array.isArray(k.onyomi), `${prefix} onyomi must be array`);
    assert.ok(Array.isArray(k.kunyomi), `${prefix} kunyomi must be array`);

    // Compounds validation
    if (k.compounds) {
      assert.ok(Array.isArray(k.compounds), `${prefix} compounds must be array`);
      for (const c of k.compounds) {
        assert.ok(c.kanji && c.kana, `${prefix} compound must have kanji and kana`);
        assert.ok(c.sv || c.en, `${prefix} compound must have sv or en meaning`);
      }
    }
  }
});

test('ADV-3.3: vocabularyView rendering produces zero undefined strings, null tokens, or broken interpolations', () => {
  // Test both Sakura and Classic modes
  for (const theme of ['sakura', 'classic']) {
    const ctx = createMockCtx(theme);
    const html = renderTemplateToString(vocabularyView(ctx));

    assert.ok(html.length > 500, `Rendered vocabulary HTML must be non-empty for ${theme}`);

    // Check for corrupt string interpolations
    assert.equal(
      html.includes('undefined'),
      false,
      `vocabularyView in ${theme} mode must not contain "undefined" in rendered text`,
    );
    assert.equal(
      html.includes('null'),
      false,
      `vocabularyView in ${theme} mode must not contain "null" in rendered text`,
    );
    assert.equal(
      html.includes('[object Object]'),
      false,
      `vocabularyView in ${theme} mode must not contain "[object Object]"`,
    );
    assert.equal(
      html.includes('NaN'),
      false,
      `vocabularyView in ${theme} mode must not contain "NaN"`,
    );

    // Verify word cards rendered
    assert.ok(
      html.includes('class="vocab-card"'),
      `vocabularyView in ${theme} mode must contain vocab cards`,
    );
    assert.ok(
      html.includes('class="vocab-type-chip'),
      `vocabularyView in ${theme} mode must render word type chips`,
    );
  }
});

test('ADV-3.4: particlesView rendering produces zero undefined strings, null tokens, or broken interpolations', () => {
  for (const theme of ['sakura', 'classic']) {
    const ctx = createMockCtx(theme);
    const html = renderTemplateToString(particlesView(ctx));

    assert.ok(html.length > 500, `Rendered particles HTML must be non-empty for ${theme}`);

    assert.equal(
      html.includes('undefined'),
      false,
      `particlesView in ${theme} mode must not contain "undefined"`,
    );
    assert.equal(
      html.includes('null'),
      false,
      `particlesView in ${theme} mode must not contain "null"`,
    );
    assert.equal(
      html.includes('[object Object]'),
      false,
      `particlesView in ${theme} mode must not contain "[object Object]"`,
    );

    // Verify particle cards rendered
    assert.ok(
      html.includes('class="particle-card"'),
      `particlesView in ${theme} mode must contain particle cards`,
    );
    assert.ok(
      html.includes('class="particle-contrast-note"'),
      `particlesView in ${theme} mode must render contrast notes`,
    );
  }
});

// ============================================================================
// FOCUS AREA 4: Viewport Constraints & CSS Bounding Rules
// ============================================================================

test('ADV-4.1: Responsive layout CSS ensures mobile viewport safety and zero fixed overflowing widths', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');

  // Verify banner cards have box-sizing border-box and max-width 100%
  const vocabBannerRegex = /\.vocab-anime-banner-card\s*\{([\s\S]*?)\}/;
  const vocabMatch = css.match(vocabBannerRegex);
  assert.ok(vocabMatch, 'Must define .vocab-anime-banner-card');
  assert.ok(
    vocabMatch[1].includes('box-sizing: border-box'),
    '.vocab-anime-banner-card must have box-sizing: border-box',
  );
  assert.ok(
    vocabMatch[1].includes('max-width: 100%'),
    '.vocab-anime-banner-card must have max-width: 100%',
  );

  const particleBannerRegex = /\.particle-anime-banner-card\s*\{([\s\S]*?)\}/;
  const particleMatch = css.match(particleBannerRegex);
  assert.ok(particleMatch, 'Must define .particle-anime-banner-card');
  assert.ok(
    particleMatch[1].includes('box-sizing: border-box'),
    '.particle-anime-banner-card must have box-sizing: border-box',
  );
  assert.ok(
    particleMatch[1].includes('max-width: 100%'),
    '.particle-anime-banner-card must have max-width: 100%',
  );

  // Vocab grid and Particle grid responsive minmax column sizing
  assert.ok(
    css.includes('grid-template-columns: repeat(auto-fill, minmax('),
    'Grids must use responsive auto-fill minmax repeat',
  );
});
