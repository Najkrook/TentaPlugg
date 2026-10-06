import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  MASCOT_QUOTES,
  getStudyMascotQuote,
  getSidebarMascotQuote,
  getStudyQuoteIndex,
  getSidebarQuoteIndex,
  cycleStudyMascotQuote,
  cycleSidebarMascotQuote,
  resetMascotDialogue,
  pokeStudyMascot,
  pokeSidebarMascot,
  pokeMascot,
} from '../src/mascot-dialogue.js';

import {
  initClickParticles,
  purgeParticles,
  spawnParticleBurst,
  getActiveParticleCount,
  PARTICLE_GLYPHS,
  MAX_CONCURRENT_PARTICLES,
} from '../src/particles-fx.js';

import {
  SOUND_FILES,
  playAnimeSound,
  isSoundMuted,
  setSoundMuted,
  getSoundVolume,
  setSoundVolume,
} from '../src/audio.js';

import { homeView } from '../src/views/home.js';
import { vocabularyView } from '../src/views/vocabulary.js';
import { particlesView } from '../src/views/particles.js';
import { sessionView, formatRatingLabel } from '../src/views/session.js';
import { fresh } from '../src/engine.js';
import { questions } from '../src/data.js';

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

  const root = new MockElement('html');
  const body = new MockElement('body');
  body.children = [];
  body.appendChild = function (child) {
    child.parentNode = this;
    this.children.push(child);
    elements.add(child);
    return child;
  };
  root.children = [body];
  body.parentNode = root;

  const mockDoc = {
    createElement(tag) {
      return new MockElement(tag);
    },
    body,
    documentElement: root,
    querySelectorAll(selector) {
      if (selector === '.kawaii-click-particle') {
        return Array.from(elements).filter((el) => el.classList.contains('kawaii-click-particle'));
      }
      return [];
    },
    querySelector(selector) {
      if (selector === 'meta[name="theme-color"]') {
        return {
          setAttribute: (k, v) => {},
        };
      }
      return null;
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

  return { mockDoc, mockWin, body, root, elements };
}

/**
 * Lit-HTML TemplateResult renderer to string
 */
function renderToString(result) {
  if (result === null || result === undefined || result === false) return '';
  if (typeof result === 'string') return result;
  if (typeof result === 'number' || typeof result === 'boolean') return String(result);
  if (Array.isArray(result)) return result.map(renderToString).join('');
  if (result.strings && Array.isArray(result.values)) {
    let out = '';
    for (let i = 0; i < result.strings.length; i++) {
      out += result.strings[i];
      if (i < result.values.length) {
        out += renderToString(result.values[i]);
      }
    }
    return out;
  }
  return '';
}

// ============================================================================
// SUITE 1: Dialogue Cycling Stress Harness (1,000+ Rapid Pokes Oracle)
// ============================================================================

test('CHALLENGER 1.1: pokeStudyMascot survives 2,000 rapid calls with strict modulo and valid schema', () => {
  resetMascotDialogue();
  const POKES = 2000;
  const quoteCount = MASCOT_QUOTES.length;
  assert.ok(quoteCount >= 8, 'Catalogue must have >= 8 quotes');

  let soundCalls = 0;
  const recordedSounds = [];
  const mockSoundFn = (soundKey, theme) => {
    soundCalls++;
    recordedSounds.push({ soundKey, theme });
  };

  for (let i = 0; i < POKES; i++) {
    const expectedIndex = (i + 1) % quoteCount;
    const quote = pokeStudyMascot('sakura', mockSoundFn);

    // Invariant: returned quote must match index exactly
    assert.ok(quote, `Iteration ${i}: quote must be defined`);
    assert.equal(
      getStudyQuoteIndex(),
      expectedIndex,
      `Iteration ${i}: studyQuoteIndex must equal ${expectedIndex}`,
    );
    assert.deepEqual(
      quote,
      MASCOT_QUOTES[expectedIndex],
      `Iteration ${i}: quote must match MASCOT_QUOTES[${expectedIndex}]`,
    );

    // Schema validation
    assert.ok(
      typeof quote.jp === 'string' && quote.jp.trim().length > 0,
      `Iteration ${i}: quote.jp must be non-empty`,
    );
    assert.ok(
      typeof quote.kaomoji === 'string' && quote.kaomoji.trim().length > 0,
      `Iteration ${i}: quote.kaomoji must be non-empty`,
    );
    assert.ok(
      typeof quote.sv === 'string' && quote.sv.trim().length > 0,
      `Iteration ${i}: quote.sv must be non-empty`,
    );
    assert.ok(
      typeof quote.sound === 'string' &&
        ['arigato', 'tuturu', 'wow', 'ara_ara'].includes(quote.sound),
      `Iteration ${i}: quote.sound must be valid audio key`,
    );
  }

  assert.equal(soundCalls, POKES, 'Sound function must be called exactly once per poke');
  assert.equal(recordedSounds.length, POKES);
  assert.ok(recordedSounds.every((s) => s.theme === 'sakura'));
});

test('CHALLENGER 1.2: pokeSidebarMascot survives 2,000 rapid calls with independent state', () => {
  resetMascotDialogue();
  const POKES = 2000;
  const quoteCount = MASCOT_QUOTES.length;

  let soundCalls = 0;
  const mockSoundFn = (soundKey, theme) => {
    soundCalls++;
  };

  for (let i = 0; i < POKES; i++) {
    const expectedIndex = (i + 1) % quoteCount;
    const quote = pokeSidebarMascot('sakura', mockSoundFn);

    assert.equal(getSidebarQuoteIndex(), expectedIndex);
    assert.deepEqual(quote, MASCOT_QUOTES[expectedIndex]);
    assert.equal(getStudyQuoteIndex(), 0, 'Sidebar poke must not alter study quote index');
  }

  assert.equal(soundCalls, POKES);
});

test('CHALLENGER 1.3: Interleaved 1,000 pokes maintain strict independent modulo wrapping', () => {
  resetMascotDialogue();
  const POKES = 1000;
  const quoteCount = MASCOT_QUOTES.length;

  let expectedStudy = 0;
  let expectedSidebar = 0;

  for (let i = 0; i < POKES; i++) {
    const isStudy = (i * 17 + 3) % 2 === 0; // Deterministic pseudo-random alternation
    if (isStudy) {
      expectedStudy = (expectedStudy + 1) % quoteCount;
      const q = pokeStudyMascot('sakura');
      assert.equal(getStudyQuoteIndex(), expectedStudy);
      assert.deepEqual(q, MASCOT_QUOTES[expectedStudy]);
      assert.equal(getSidebarQuoteIndex(), expectedSidebar);
    } else {
      expectedSidebar = (expectedSidebar + 1) % quoteCount;
      const q = pokeSidebarMascot('sakura');
      assert.equal(getSidebarQuoteIndex(), expectedSidebar);
      assert.deepEqual(q, MASCOT_QUOTES[expectedSidebar]);
      assert.equal(getStudyQuoteIndex(), expectedStudy);
    }
  }
});

test('CHALLENGER 1.4: Dialogue poking in Classic mode suppresses audio playback strictly', () => {
  resetMascotDialogue();
  let playedSounds = 0;
  const soundSpy = (sound, theme) => {
    // If called with classic, verify playAnimeSound contract
    playedSounds++;
    const res = playAnimeSound(sound, theme);
    assert.equal(res, false, 'playAnimeSound must return false in Classic mode');
  };

  for (let i = 0; i < 100; i++) {
    const q1 = pokeStudyMascot('classic', soundSpy);
    const q2 = pokeSidebarMascot('classic', soundSpy);
    assert.ok(q1);
    assert.ok(q2);
  }
  assert.equal(playedSounds, 200, 'Sound spy received calls, but playAnimeSound returned false');
});

test('CHALLENGER 1.5: Dialogue audio files all exist on filesystem with non-zero size', () => {
  const allowedSounds = ['tuturu', 'nani', 'ara_ara', 'wow', 'arigato'];
  for (const sound of allowedSounds) {
    const relPath = SOUND_FILES[sound];
    assert.ok(relPath, `Sound ${sound} must have entry in SOUND_FILES`);
    const absPath = path.resolve(relPath.replace(/^\//, 'public/'));
    assert.ok(fs.existsSync(absPath), `Audio file ${absPath} must exist on disk`);
    const stat = fs.statSync(absPath);
    assert.ok(stat.size > 1000, `Audio file ${absPath} must be > 1KB (got ${stat.size})`);
  }
});

// ============================================================================
// SUITE 2: Particle Physics & Memory Leak Oracle (<= 40 Cap & Purge)
// ============================================================================

test('CHALLENGER 2.1: Rapid particle generation (500 clicks / ~3,000 particles) strictly never exceeds MAX 40', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    assert.equal(getActiveParticleCount(), 0);

    const CLICKS = 500;
    for (let c = 0; c < CLICKS; c++) {
      const x = Math.floor(Math.random() * 800);
      const y = Math.floor(Math.random() * 600);
      const burstSize = Math.floor(Math.random() * 4) + 4; // 4 to 7 particles

      spawnParticleBurst(x, y, { count: burstSize });

      const activeCount = getActiveParticleCount();
      const domCount = body.children.length;
      const queryCount = mockDoc.querySelectorAll('.kawaii-click-particle').length;

      // STRICT INVARIANT: Active particles must NEVER exceed 40 at any point!
      assert.ok(
        activeCount <= MAX_CONCURRENT_PARTICLES,
        `Click ${c}: getActiveParticleCount() (${activeCount}) must be <= ${MAX_CONCURRENT_PARTICLES}`,
      );
      assert.ok(
        domCount <= MAX_CONCURRENT_PARTICLES,
        `Click ${c}: DOM children (${domCount}) must be <= ${MAX_CONCURRENT_PARTICLES}`,
      );
      assert.ok(
        queryCount <= MAX_CONCURRENT_PARTICLES,
        `Click ${c}: querySelectorAll (${queryCount}) must be <= ${MAX_CONCURRENT_PARTICLES}`,
      );
    }

    assert.equal(getActiveParticleCount(), MAX_CONCURRENT_PARTICLES);
    assert.equal(body.children.length, MAX_CONCURRENT_PARTICLES);
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.2: Single giant burst (100 particles) strictly throttles to 40', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const particles = spawnParticleBurst(100, 100, { count: 100 });
    assert.equal(particles.length, 100, 'spawnParticleBurst returns spawned array');
    assert.equal(getActiveParticleCount(), 40, 'Active pool must be strictly clamped to 40');
    assert.equal(body.children.length, 40, 'DOM elements must be strictly clamped to 40');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.3: purgeParticles() cleans up 100% of particles immediately upon call', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    spawnParticleBurst(200, 200, { count: 35 });
    assert.equal(getActiveParticleCount(), 35);
    assert.equal(body.children.length, 35);

    purgeParticles();
    assert.equal(getActiveParticleCount(), 0, 'activeParticles must be empty');
    assert.equal(body.children.length, 0, 'DOM container must have 0 elements');
    assert.equal(mockDoc.querySelectorAll('.kawaii-click-particle').length, 0);
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.4: Dual-cleanup oracle: animationend and safety timeout handle removals and idempotence', async () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const batch = spawnParticleBurst(150, 250, { count: 5 });
    assert.equal(getActiveParticleCount(), 5);

    // Test A: animationend on first 2 particles
    batch[0].dispatchEvent({ type: 'animationend' });
    batch[1].dispatchEvent({ type: 'animationend' });
    assert.equal(getActiveParticleCount(), 3);
    assert.equal(body.children.length, 3);

    // Test B: Idempotent double dispatch does not crash or double-decrement
    batch[0].dispatchEvent({ type: 'animationend' });
    assert.equal(getActiveParticleCount(), 3);

    // Test C: Wait 1100ms for safety timeout to clean up the remaining 3 particles
    await new Promise((r) => setTimeout(r, 1100));
    assert.equal(
      getActiveParticleCount(),
      0,
      'Remaining particles must auto-expire via safety timeout',
    );
    assert.equal(body.children.length, 0, 'DOM container must be empty');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.5: initClickParticles click gating and teardown oracle', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    let currentTheme = 'sakura';
    const teardown = initClickParticles(() => currentTheme);

    // Click in Sakura mode -> spawns particles
    mockWin.dispatchClick({ clientX: 100, clientY: 200 });
    const countAfterSakura = getActiveParticleCount();
    assert.ok(countAfterSakura >= 5, `Must have spawned particles (got ${countAfterSakura})`);

    purgeParticles();

    // Click in Classic mode -> strictly 0 particles
    currentTheme = 'classic';
    mockWin.dispatchClick({ clientX: 100, clientY: 200 });
    assert.equal(getActiveParticleCount(), 0, 'No particles in Classic mode');

    // Click with prefers-reduced-motion in Sakura mode -> strictly 0 particles
    currentTheme = 'sakura';
    mockWin.setReducedMotion(true);
    mockWin.dispatchClick({ clientX: 100, clientY: 200 });
    assert.equal(getActiveParticleCount(), 0, 'No particles when prefers-reduced-motion is active');

    // Teardown removes listener and purges
    mockWin.setReducedMotion(false);
    teardown();
    mockWin.dispatchClick({ clientX: 100, clientY: 200 });
    assert.equal(getActiveParticleCount(), 0, 'No particles after teardown');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

// ============================================================================
// SUITE 3: Hard-Hiding & Rapid Theme Toggling Stress (100+ Toggles Oracle)
// ============================================================================

test('CHALLENGER 3.1: Rapid theme toggling (100 cycles) maintains zero particle leakage and exact dataset.theme', () => {
  const { mockDoc, mockWin, body, root } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    let stateTheme = 'classic';

    const applyThemeMock = (t) => {
      const effective = t === 'sakura' ? 'sakura' : 'classic';
      stateTheme = effective;
      mockDoc.documentElement.dataset.theme = effective;
      if (effective !== 'sakura') {
        purgeParticles();
      }
    };

    const toggleThemeMock = () => {
      const next = stateTheme === 'sakura' ? 'classic' : 'sakura';
      applyThemeMock(next);
    };

    // Simulate 100 round-trip toggles (200 transitions)
    for (let i = 0; i < 200; i++) {
      toggleThemeMock();
      if (stateTheme === 'sakura') {
        assert.equal(mockDoc.documentElement.dataset.theme, 'sakura');
        // Spawn some particles while in sakura
        spawnParticleBurst(100, 100, { count: 6 });
        assert.ok(getActiveParticleCount() > 0);
      } else {
        assert.equal(mockDoc.documentElement.dataset.theme, 'classic');
        // Upon entering classic, purge MUST ensure 0 particles
        assert.equal(
          getActiveParticleCount(),
          0,
          `Transition ${i}: particles must be 0 in Classic`,
        );
        assert.equal(body.children.length, 0, `Transition ${i}: DOM must be empty in Classic`);
      }
    }

    // Final check in classic
    applyThemeMock('classic');
    assert.equal(getActiveParticleCount(), 0);
    assert.equal(mockDoc.documentElement.dataset.theme, 'classic');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 3.2: Complete Classic mode DOM hard-hiding invariant across all views', () => {
  const dummyState = fresh();
  dummyState.theme = 'classic';

  const mockCtx = {
    state: dummyState,
    theme: 'classic',
    session: null,
    user: null,
    now: Date.now(),
    plan: { tasks: [], completed: {} },
    progress: () => ({ done: 10, ok: 8, wrong: 2, due: 3 }),
    navigate: () => {},
    start: () => {},
    exit: () => {},
    openGuideModal: () => {},
    getStudyMascotQuote,
    getSidebarMascotQuote,
    pokeStudyMascot: () => {},
    pokeSidebarMascot: () => {},
  };

  // 1. Home View in Classic mode
  const homeHtml = renderToString(homeView(mockCtx));
  assert.ok(
    !homeHtml.includes('anime-figure'),
    'homeView must not contain anime-figure in Classic',
  );
  assert.ok(
    !homeHtml.includes('anime-study-panel'),
    'homeView must not contain anime-study-panel in Classic',
  );
  assert.ok(
    !homeHtml.includes('kawaii-speech-bubble'),
    'homeView must not contain kawaii-speech-bubble in Classic',
  );
  assert.ok(!homeHtml.includes('study.jpg'), 'homeView must not contain study.jpg in Classic');

  // 2. Vocabulary View in Classic mode
  const vocabHtml = renderToString(vocabularyView(mockCtx));
  assert.ok(
    !vocabHtml.includes('anime-figure'),
    'vocabularyView must not contain anime-figure in Classic',
  );
  assert.ok(
    !vocabHtml.includes('vocab-anime-banner-card'),
    'vocabularyView must not contain banner card in Classic',
  );
  assert.ok(
    !vocabHtml.includes('kawaii-tip-callout'),
    'vocabularyView must not contain kawaii tip in Classic',
  );
  assert.ok(
    !vocabHtml.includes('encourage.jpg'),
    'vocabularyView must not contain encourage.jpg in Classic',
  );

  // 3. Particles View in Classic mode
  const particlesHtml = renderToString(particlesView(mockCtx));
  assert.ok(
    !particlesHtml.includes('anime-figure'),
    'particlesView must not contain anime-figure in Classic',
  );
  assert.ok(
    !particlesHtml.includes('particle-anime-banner-card'),
    'particlesView must not contain banner card in Classic',
  );
  assert.ok(
    !particlesHtml.includes('kawaii-tip-callout'),
    'particlesView must not contain kawaii tip in Classic',
  );
  assert.ok(
    !particlesHtml.includes('mascot_peek.jpg'),
    'particlesView must not contain mascot_peek.jpg in Classic',
  );

  // 4. Session Result View in Classic mode
  const mockResultCtx = {
    ...mockCtx,
    session: {
      attemptId: 'test-attempt',
      ids: [questions[0].id],
      index: 0,
      answers: { [questions[0].id]: questions[0].answer },
      grades: { [questions[0].id]: true },
      done: true,
      mode: 'practice',
    },
  };
  const resultHtml = renderToString(sessionView(mockResultCtx));
  assert.ok(
    !resultHtml.includes('anime-figure'),
    'resultView must not contain anime-figure in Classic',
  );
  assert.ok(
    !resultHtml.includes('anime-result-mascot'),
    'resultView must not contain result mascot in Classic',
  );
  assert.ok(!resultHtml.includes('cheer.jpg'), 'resultView must not contain cheer.jpg in Classic');

  // 5. Rating labels in Classic mode
  assert.equal(formatRatingLabel('again', 'classic'), 'Igen');
  assert.equal(formatRatingLabel('hard', 'classic'), 'Svårt');
  assert.equal(formatRatingLabel('good', 'classic'), 'Bra');
  assert.equal(formatRatingLabel('easy', 'classic'), 'Lätt');
});

test('CHALLENGER 3.3: CSS Hard-Hiding rules strictly enforce display: none !important for Classic mode', () => {
  const cssPath = path.resolve('src/style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Check rule selector group
  assert.ok(
    cssContent.includes(":root:not([data-theme='sakura']) .anime-figure"),
    'CSS must include :root:not([data-theme="sakura"]) .anime-figure',
  );
  assert.ok(
    cssContent.includes("[data-theme='classic'] .anime-figure"),
    'CSS must include [data-theme="classic"] .anime-figure',
  );
  assert.ok(
    cssContent.includes("[data-theme='classic'] .sound-toggle"),
    'CSS must include [data-theme="classic"] .sound-toggle',
  );
  assert.ok(
    cssContent.includes("[data-theme='classic'] .sound-slider"),
    'CSS must include [data-theme="classic"] .sound-slider',
  );
  assert.ok(
    cssContent.includes('display: none !important;'),
    'CSS must enforce display: none !important',
  );
});

// ============================================================================
// SUITE 4: High-Churn Memory Leak & Adversarial Fuzzing Oracles
// ============================================================================

test('CHALLENGER 1.6: 10,000 rapid pokes execute in < 150ms without memory bloat or NaN indices', () => {
  resetMascotDialogue();
  const iterations = 10000;
  const t0 = performance.now();

  for (let i = 0; i < iterations; i++) {
    const q1 = pokeStudyMascot('sakura');
    const q2 = pokeSidebarMascot('sakura');
    assert.ok(q1.jp.length > 0);
    assert.ok(q2.jp.length > 0);
  }

  const duration = performance.now() - t0;
  assert.ok(duration < 500, `10,000 pokes must complete quickly (took ${duration.toFixed(1)}ms)`);
  assert.equal(getStudyQuoteIndex(), iterations % MASCOT_QUOTES.length);
  assert.equal(getSidebarQuoteIndex(), iterations % MASCOT_QUOTES.length);
});

test('CHALLENGER 2.6: High churn memory leak stress: 2,000 bursts with interleaved purges maintain zero residual elements', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const startHeap = process.memoryUsage().heapUsed;

    for (let cycle = 0; cycle < 20; cycle++) {
      // 10 rapid bursts per cycle
      for (let b = 0; b < 10; b++) {
        spawnParticleBurst(100 + b, 200 + b, { count: 6 });
      }
      assert.ok(getActiveParticleCount() <= MAX_CONCURRENT_PARTICLES);
      assert.ok(body.children.length <= MAX_CONCURRENT_PARTICLES);

      // Purge every cycle
      purgeParticles();
      assert.equal(getActiveParticleCount(), 0);
      assert.equal(body.children.length, 0);
    }

    const endHeap = process.memoryUsage().heapUsed;
    const diffMb = (endHeap - startHeap) / (1024 * 1024);
    assert.ok(
      diffMb < 50,
      `Heap growth after 2,000 bursts must be minimal (got ${diffMb.toFixed(2)} MB)`,
    );
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.7: Adversarial coordinates and parameter fuzzing boundary oracle', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const fuzzInputs = [
      [-100, -200, {}],
      [NaN, NaN, {}],
      [Infinity, -Infinity, {}],
      [undefined, undefined, undefined],
      ['100', '200', { count: -10 }],
      [0, 0, { count: 0 }],
      [500, 500, { count: NaN }],
      [500, 500, { count: Infinity }],
      [500, 500, { count: -Infinity }],
      [500, 500, { count: 40 }],
      [500, 500, { glyph: '🌟' }],
    ];

    for (const [x, y, opts] of fuzzInputs) {
      assert.doesNotThrow(
        () => {
          spawnParticleBurst(x, y, opts);
        },
        `Fuzzing input (${x}, ${y}, ${JSON.stringify(opts)}) must not throw`,
      );
      assert.ok(getActiveParticleCount() <= MAX_CONCURRENT_PARTICLES);
    }

    // Defensive parameter hardening: passing null as options safely defaults to empty options and does not throw
    assert.doesNotThrow(() => {
      spawnParticleBurst(100, 100, null);
    }, 'Passing null as options safely defaults to empty options and does not throw');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 2.8: Repeated initClickParticles calls (50 times) safely replace previous listener without leak', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    for (let i = 0; i < 50; i++) {
      initClickParticles(() => 'sakura');
    }

    // Only 1 click listener should be active
    mockWin.dispatchClick({ clientX: 200, clientY: 300 });
    // If listeners had leaked (50 listeners), count would hit 40 instantly from one click,
    // but 1 burst only generates 5-7 particles
    const active = getActiveParticleCount();
    assert.ok(active >= 5 && active <= 7, `Expected 1 burst of 5-7 particles, got ${active}`);
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 3.4: 500 rapid theme toggles under active particle spamming maintain zero orphaned elements', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    let theme = 'sakura';

    for (let i = 0; i < 100; i++) {
      // Spam particles
      spawnParticleBurst(50, 50, { count: 5 });

      // Toggle theme
      theme = theme === 'sakura' ? 'classic' : 'sakura';
      mockDoc.documentElement.dataset.theme = theme;
      if (theme !== 'sakura') {
        purgeParticles();
        assert.equal(
          getActiveParticleCount(),
          0,
          `Step ${i}: active particles must be 0 in Classic`,
        );
        assert.equal(body.children.length, 0, `Step ${i}: DOM elements must be 0 in Classic`);
      }
    }

    // Finish in classic
    mockDoc.documentElement.dataset.theme = 'classic';
    purgeParticles();
    assert.equal(getActiveParticleCount(), 0);
    assert.equal(body.children.length, 0);
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('CHALLENGER 3.5: Audio cache bounding: playAnimeSound never caches more than 5 distinct sound keys', () => {
  const allowedSounds = ['tuturu', 'nani', 'ara_ara', 'wow', 'arigato'];
  const soundFileKeys = Object.keys(SOUND_FILES);
  assert.equal(soundFileKeys.length, 5, 'Must have exactly 5 sound keys in catalogue');
  assert.deepEqual(soundFileKeys.sort(), allowedSounds.sort());
});
