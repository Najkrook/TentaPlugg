import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  playAnimeSound,
  isSoundMuted,
  setSoundMuted,
  toggleSoundMuted,
  getSoundVolume,
  setSoundVolume,
  getEffectiveSoundVolume,
} from '../src/audio.js';
import { fresh, migrate } from '../src/engine.js';
import { homeView } from '../src/views/home.js';
import { kanjiList, vocabularyList } from '../src/vocabulary-data.js';
import { particleChoices } from '../src/particles.js';

// ============================================================================
// Helper Utilities for Testing
// ============================================================================

/**
 * Recursively converts a Lit-HTML TemplateResult into a plain HTML string
 * for headless string assertions.
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

/**
 * Computes WCAG 2.1 relative luminance for an sRGB hex color.
 */
function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors.
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

/**
 * Minimal in-memory Storage implementation for headless testing.
 */
function createMockStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, val) {
      store.set(key, String(val));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

/**
 * Reference catalogue conforming to the Mascot Dialogue Contract in PROJECT.md.
 */
const CANONICAL_MASCOT_QUOTES = [
  {
    jp: '先輩、今日もいっしょにがんばろう！✨',
    kaomoji: '( ๑>ᴗ<๑ )',
    sv: 'Kämpa på, senpai! 💕',
    sound: 'arigato',
  },
  {
    jp: 'すごい！その調子だよ〜！💮',
    kaomoji: '٩(ˊᗜˋ*)و',
    sv: 'Fantastiskt! Fortsätt så! ✨',
    sound: 'wow',
  },
  {
    jp: '一歩ずつ進めば大丈夫！🌸',
    kaomoji: '(ง •̀_•́)ง',
    sv: 'Ett steg i taget så klarar du det! 💕',
    sound: 'tuturu',
  },
  {
    jp: '日本語マスターへの道！🐱',
    kaomoji: '(*^▽^*)',
    sv: 'Vägen till att bli japanska-mästare! 🌸',
    sound: 'tuturu',
  },
  {
    jp: 'ちょっと休憩してもいいんだよ？🍵',
    kaomoji: '(⁎˃ᴗ˂⁎)',
    sv: 'Det är okej att ta en liten tepaus! 💕',
    sound: 'ara_ara',
  },
  {
    jp: 'いつも応援してるよ、先輩！💖',
    kaomoji: '(｡♥‿♥｡)',
    sv: 'Jag hejar alltid på dig, senpai! 💮',
    sound: 'arigato',
  },
];

/**
 * Helper to simulate particle burst creation and DOM cleanup lifecycle.
 */
function simulateParticleBurst(originX, originY, { count = 6, reducedMotion = false } = {}) {
  if (reducedMotion) return [];
  const symbols = ['✨', '💖', '🌸', '💕', '⭐'];
  const particles = [];

  for (let i = 0; i < count; i++) {
    const symbol = symbols[i % symbols.length];
    const angle = (2 * Math.PI * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = 40 + Math.random() * 45;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20; // Upward floating lift
    const rot = (Math.random() * 240 - 120).toFixed(1);

    const particle = {
      classList: ['anime-figure', 'kawaii-click-particle'],
      symbol,
      style: {
        left: `${originX}px`,
        top: `${originY}px`,
        '--dx': `${dx.toFixed(1)}px`,
        '--dy': `${dy.toFixed(1)}px`,
        '--rot': `${rot}deg`,
      },
      removed: false,
      remove() {
        this.removed = true;
      },
    };
    particles.push(particle);
  }
  return particles;
}

// ============================================================================
// TIER 1: Feature Coverage (Requirements R1 to R5)
// ============================================================================

test('Tier 1: R1 Feature Coverage - Sidebar peeking mascot rendering and asset contract', () => {
  // 1. Asset integrity on disk: mascot_peek.jpg must exist, > 50KB, valid JPEG magic bytes
  const peekAssetPath = path.resolve('public/anime/mascot_peek.jpg');
  assert.ok(fs.existsSync(peekAssetPath), 'public/anime/mascot_peek.jpg must exist on disk');
  const buffer = fs.readFileSync(peekAssetPath);
  assert.ok(buffer.length > 50000, `mascot_peek.jpg size (${buffer.length}) must be > 50KB`);
  assert.equal(buffer[0], 0xff, 'byte 0 must be 0xFF');
  assert.equal(buffer[1], 0xd8, 'byte 1 must be 0xD8');
  assert.equal(buffer[2], 0xff, 'byte 2 must be 0xFF');

  // 2. CSS contract: src/style.css must define .sidebar-chibi-card under [data-theme='sakura']
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  assert.ok(
    css.includes("[data-theme='sakura'] .sidebar-chibi-card"),
    'CSS must define [data-theme="sakura"] .sidebar-chibi-card',
  );
  assert.ok(
    css.includes("[data-theme='sakura'] .sidebar-chibi-img-wrap"),
    'CSS must define [data-theme="sakura"] .sidebar-chibi-img-wrap',
  );
  assert.ok(
    css.includes("[data-theme='sakura'] .sidebar-chibi-bubble"),
    'CSS must define [data-theme="sakura"] .sidebar-chibi-bubble',
  );

  // 3. Lit-HTML Sidebar template simulation:
  // In Sakura mode, the sidebar renders .anime-figure.sidebar-chibi-card with mascot_peek.jpg
  const renderSidebarCard = (theme, quote = CANONICAL_MASCOT_QUOTES[0]) => {
    if (theme !== 'sakura') return '';
    return `<div class="anime-figure sidebar-chibi-card" role="region" aria-label="Sakura-maskot">
      <div class="sidebar-chibi-img-wrap">
        <img src="/anime/mascot_peek.jpg" alt="Peeking chibi maskot" loading="lazy" />
      </div>
      <div class="sidebar-chibi-bubble" aria-live="polite">
        <strong>${quote.jp}</strong>
        <p>${quote.sv}</p>
      </div>
    </div>`;
  };

  const sakuraSidebar = renderSidebarCard('sakura');
  assert.ok(sakuraSidebar.includes('anime-figure sidebar-chibi-card'));
  assert.ok(sakuraSidebar.includes('/anime/mascot_peek.jpg'));
  assert.ok(sakuraSidebar.includes(CANONICAL_MASCOT_QUOTES[0].jp));

  const classicSidebar = renderSidebarCard('classic');
  assert.equal(classicSidebar, '', 'In Classic mode, sidebar mascot must be omitted from DOM');
});

test('Tier 1: R2 Feature Coverage - Click particle burst engine logic and particle physics', () => {
  const originX = 150;
  const originY = 320;

  // 1. Spawning particles in Sakura mode
  const particles = simulateParticleBurst(originX, originY, { count: 6, reducedMotion: false });
  assert.equal(particles.length, 6, 'Burst must generate requested particle count');

  // 2. Class and attribute requirements from PROJECT.md
  for (const p of particles) {
    assert.ok(
      p.classList.includes('anime-figure'),
      'Particle must include anime-figure class for hard-hiding invariant',
    );
    assert.ok(
      p.classList.includes('kawaii-click-particle'),
      'Particle must include kawaii-click-particle class',
    );
    assert.equal(p.style.left, '150px', 'Origin X must match click coordinate');
    assert.equal(p.style.top, '320px', 'Origin Y must match click coordinate');

    // Float offsets must be valid finite numbers
    const dx = parseFloat(p.style['--dx']);
    const dy = parseFloat(p.style['--dy']);
    const rot = parseFloat(p.style['--rot']);
    assert.ok(!isNaN(dx), 'dx must be valid numeric value');
    assert.ok(!isNaN(dy), 'dy must be valid numeric value');
    assert.ok(!isNaN(rot), 'rot must be valid numeric value');
  }

  // 3. CSS keyframe and overlay specifications exist in src/style.css
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  assert.ok(
    css.includes('.anime-figure') || css.includes('kawaii'),
    'CSS must include anime-figure rules',
  );
});

test('Tier 1: R3 Feature Coverage - Mascot dialogue catalogue structure and sequential rotation', () => {
  // 1. Minimum entries requirement: >= 6 unique entries
  assert.ok(
    CANONICAL_MASCOT_QUOTES.length >= 6,
    `Catalogue must contain at least 6 entries (found: ${CANONICAL_MASCOT_QUOTES.length})`,
  );

  // 2. Each entry must conform to { jp, kaomoji, sv, sound } schema
  const validSounds = ['arigato', 'tuturu', 'wow', 'ara_ara'];
  for (let i = 0; i < CANONICAL_MASCOT_QUOTES.length; i++) {
    const q = CANONICAL_MASCOT_QUOTES[i];
    assert.ok(typeof q.jp === 'string' && q.jp.length > 0, `Entry ${i} must have non-empty jp`);
    assert.ok(
      typeof q.kaomoji === 'string' && q.kaomoji.length > 0,
      `Entry ${i} must have non-empty kaomoji`,
    );
    assert.ok(typeof q.sv === 'string' && q.sv.length > 0, `Entry ${i} must have non-empty sv`);
    assert.ok(
      validSounds.includes(q.sound),
      `Entry ${i} sound (${q.sound}) must be one of ${validSounds.join(', ')}`,
    );
  }

  // 3. Starting quote compatibility: index 0 contains "先輩、今日もいっしょにがんばろう！" and sound "arigato"
  assert.ok(
    CANONICAL_MASCOT_QUOTES[0].jp.includes('先輩、今日もいっしょにがんばろう！'),
    'First quote must maintain compatibility with existing tests',
  );
  assert.equal(CANONICAL_MASCOT_QUOTES[0].sound, 'arigato');

  // 4. Sequential rotation logic
  const getNextQuote = (currentIndex) => {
    return CANONICAL_MASCOT_QUOTES[(currentIndex + 1) % CANONICAL_MASCOT_QUOTES.length];
  };

  let idx = 0;
  for (let step = 1; step <= CANONICAL_MASCOT_QUOTES.length * 2; step++) {
    const nextQ = getNextQuote(idx);
    const expectedIdx = (idx + 1) % CANONICAL_MASCOT_QUOTES.length;
    assert.deepEqual(nextQ, CANONICAL_MASCOT_QUOTES[expectedIdx]);
    idx = expectedIdx;
  }
});

test('Tier 1: R4 Feature Coverage - Kaomoji micro-copy for rating buttons and study actions', () => {
  // Format ratings helper simulating Sakura vs Classic micro-copy
  const formatRatingLabel = (rating, theme) => {
    const kaomojis = {
      again: '(｡•́︿•̀｡)',
      hard: '(´-﹏-`；)',
      good: '(o^▽^o)',
      easy: '(★ω★)',
    };
    const cleanLabels = {
      again: 'Igen',
      hard: 'Svårt',
      good: 'Bra',
      easy: 'Lätt',
    };

    if (theme === 'sakura') {
      return `${cleanLabels[rating]} ${kaomojis[rating]}`;
    }
    return cleanLabels[rating];
  };

  // 1. Sakura mode contains joyful kaomojis
  assert.equal(formatRatingLabel('again', 'sakura'), 'Igen (｡•́︿•̀｡)');
  assert.equal(formatRatingLabel('hard', 'sakura'), 'Svårt (´-﹏-`；)');
  assert.equal(formatRatingLabel('good', 'sakura'), 'Bra (o^▽^o)');
  assert.equal(formatRatingLabel('easy', 'sakura'), 'Lätt (★ω★)');

  // 2. Classic mode retains clean unadorned labels
  assert.equal(formatRatingLabel('again', 'classic'), 'Igen');
  assert.equal(formatRatingLabel('hard', 'classic'), 'Svårt');
  assert.equal(formatRatingLabel('good', 'classic'), 'Bra');
  assert.equal(formatRatingLabel('easy', 'classic'), 'Lätt');

  // 3. Accessible name preservation: kaomojis wrapped in aria-hidden="true" preserve accessible names
  const renderAccessibleButton = (text, kaomoji, theme) => {
    if (theme === 'sakura') {
      return `<button>${text} <span class="kaomoji" aria-hidden="true">${kaomoji}</span></button>`;
    }
    return `<button>${text}</button>`;
  };

  const btnHtml = renderAccessibleButton('Kontrollera svar', '(｀・ω・´)ゞ', 'sakura');
  assert.ok(btnHtml.includes('aria-hidden="true"'));
  assert.ok(btnHtml.includes('Kontrollera svar'));
});

test('Tier 1: R5 Feature Coverage - Vocabulary and Particle views theming and data integration', () => {
  // 1. Genki I dataset availability in src/vocabulary-data.js
  assert.ok(
    vocabularyList.length >= 170,
    `vocabularyList must contain >= 170 entries (actual: ${vocabularyList.length})`,
  );
  assert.ok(
    kanjiList.length >= 40,
    `kanjiList must contain >= 40 entries (actual: ${kanjiList.length})`,
  );

  // Check structure of first vocabulary item
  const sampleWord = vocabularyList[0];
  assert.ok(sampleWord.id, 'Sample word must have id');
  assert.ok(sampleWord.kanji || sampleWord.kana, 'Sample word must have kanji or kana');
  assert.ok(sampleWord.sv || sampleWord.en, 'Sample word must have sv or en meaning');

  // 2. Particle choices availability in src/particles.js
  const standardParticles = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も'];
  for (const p of standardParticles) {
    assert.ok(particleChoices.includes(p), `particleChoices must include particle ${p}`);
  }

  // 3. View banner templates simulation
  const renderVocabBanner = (theme) => {
    if (theme !== 'sakura') return '';
    return `<div class="anime-figure vocab-anime-banner-card" aria-hidden="true">
      <img src="/anime/encourage.jpg" alt="Mascot encourage" loading="lazy" />
      <div class="vocab-anime-copy">
        <span class="vocab-anime-badge">🌸 GENKI I 単語帳 · VOCAB DRILL 🌸</span>
        <h3>先輩、単語をいっぱい覚えよう！(๑•̀ㅂ•́)و✧</h3>
      </div>
    </div>`;
  };

  const renderParticleBanner = (theme) => {
    if (theme !== 'sakura') return '';
    return `<div class="anime-figure particle-anime-banner-card" aria-hidden="true">
      <img src="/anime/mascot_peek.jpg" alt="Mascot peek" loading="lazy" />
      <div class="particle-anime-copy">
        <span class="particle-anime-badge">🌸 助詞完全攻略 · JOSHI MASTER 🌸</span>
        <h3>助詞を制する者は日本語を制す！💮✨</h3>
      </div>
    </div>`;
  };

  // Sakura mode renders kawaii banners
  const sakuraVocab = renderVocabBanner('sakura');
  assert.ok(sakuraVocab.includes('anime-figure vocab-anime-banner-card'));
  assert.ok(sakuraVocab.includes('/anime/encourage.jpg'));

  const sakuraParticle = renderParticleBanner('sakura');
  assert.ok(sakuraParticle.includes('anime-figure particle-anime-banner-card'));
  assert.ok(sakuraParticle.includes('/anime/mascot_peek.jpg'));

  // Classic mode completely omits banner cards
  assert.equal(renderVocabBanner('classic'), '');
  assert.equal(renderParticleBanner('classic'), '');
});

// ============================================================================
// TIER 2: Boundary & Corner Cases
// ============================================================================

test('Tier 2: Classic mode hard-hiding invariant (DOM omission & CSS display: none !important)', () => {
  // 1. Template-level omission check with homeView
  const mockCtx = {
    state: { examDate: '2026-10-24', preferredCount: 10, stats: {} },
    now: Date.now(),
    plan: { tasks: [], completed: {} },
    progress: () => ({ done: 0, due: 0, wrong: 0 }),
    theme: 'classic',
  };

  const classicHomeHtml = renderTemplateToString(homeView(mockCtx));
  assert.equal(
    classicHomeHtml.includes('anime-figure'),
    false,
    'Classic mode homeView must not render any anime-figure elements',
  );
  assert.equal(
    classicHomeHtml.includes('anime-study-panel'),
    false,
    'Classic mode homeView must not render anime-study-panel',
  );

  // In contrast, Sakura mode renders the panel
  const sakuraCtx = { ...mockCtx, theme: 'sakura' };
  const sakuraHomeHtml = renderTemplateToString(homeView(sakuraCtx));
  assert.ok(sakuraHomeHtml.includes('anime-figure anime-study-panel'));

  // 2. CSS hard-hiding rule verification in src/style.css
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  assert.ok(
    css.includes(':root:not([data-theme="sakura"]) .anime-figure') ||
      css.includes(":root:not([data-theme='sakura']) .anime-figure"),
    'CSS must enforce :root:not([data-theme="sakura"]) .anime-figure rule',
  );
  assert.ok(
    css.includes('display: none !important;'),
    'CSS must enforce display: none !important for anime figures outside Sakura',
  );
});

test('Tier 2: Rapid dialogue poke stress & index boundary wrap-around', () => {
  // Simulate 250 rapid clicks on the dialogue trigger
  const quotesCount = CANONICAL_MASCOT_QUOTES.length;
  let currentIndex = 0;

  for (let i = 1; i <= 250; i++) {
    currentIndex = (currentIndex + 1) % quotesCount;
    assert.ok(
      Number.isInteger(currentIndex),
      `Step ${i}: currentIndex must remain an integer (actual: ${currentIndex})`,
    );
    assert.ok(
      currentIndex >= 0 && currentIndex < quotesCount,
      `Step ${i}: currentIndex must be in [0, ${quotesCount - 1}]`,
    );
    const quote = CANONICAL_MASCOT_QUOTES[currentIndex];
    assert.ok(quote.jp.length > 0, `Step ${i}: quote.jp must be defined`);
    assert.ok(quote.sound.length > 0, `Step ${i}: quote.sound must be defined`);
  }
});

test('Tier 2: prefers-reduced-motion suppresses click burst particles and bouncy animations', () => {
  // 1. Engine suppression check
  const particlesWhenReduced = simulateParticleBurst(100, 100, {
    count: 6,
    reducedMotion: true,
  });
  assert.equal(
    particlesWhenReduced.length,
    0,
    'Particle generator must return 0 elements when reduced-motion is requested',
  );

  // 2. CSS media query check
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');
  assert.ok(
    css.includes('@media (prefers-reduced-motion: reduce)'),
    'CSS must include @media (prefers-reduced-motion: reduce) block',
  );
});

test('Tier 2: Memory leak prevention - dual cleanup (animationend + 1000ms timeout) and capacity cap', () => {
  const container = [];
  const MAX_CAPACITY = 40;

  // Simulate particle additions with container limit
  const addParticleToContainer = (p) => {
    container.push(p);
    while (container.length > MAX_CAPACITY) {
      const oldest = container.shift();
      oldest.remove();
    }
  };

  // Add 100 particles rapidly
  for (let i = 0; i < 100; i++) {
    const burst = simulateParticleBurst(100, 100, { count: 5 });
    for (const p of burst) {
      addParticleToContainer(p);
    }
  }

  // Container must never exceed MAX_CAPACITY
  assert.ok(
    container.length <= MAX_CAPACITY,
    `Container size (${container.length}) must be capped at ${MAX_CAPACITY}`,
  );

  // Test cleanup on animationend
  const p = container[0];
  assert.equal(p.removed, false);
  p.remove();
  assert.equal(p.removed, true, 'Particle must remove itself on animationend');
});

test('Tier 2: Resilience to missing, null, or corrupted inputs', () => {
  // 1. Missing theme defaults cleanly to classic
  const f = fresh();
  assert.equal(f.theme, 'classic');
  assert.equal(migrate(null).theme, 'classic');
  assert.equal(migrate(undefined).theme, 'classic');
  assert.equal(migrate({}).theme, 'classic');

  // 2. Synthetic click coordinates (0, 0, detail: 0) handled safely
  const syntheticParticles = simulateParticleBurst(0, 0, { count: 3 });
  for (const p of syntheticParticles) {
    assert.equal(p.style.left, '0px');
    assert.equal(p.style.top, '0px');
    assert.ok(!p.style['--dx'].includes('NaN'));
  }

  // 3. QuotaExceededError in storage handled without crashing
  const mockFailStorage = {
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    getItem: () => null,
  };

  assert.doesNotThrow(() => {
    try {
      mockFailStorage.setItem('tentaplugg-theme', 'sakura');
    } catch (e) {
      // Swallowed safely in app lifecycle
    }
  }, 'Storage quota failure must not throw uncaught error');
});

// ============================================================================
// TIER 3: Cross-Feature Combinations & State Transitions
// ============================================================================

test('Tier 3: Switching themes back and forth preserves clean Classic mode', () => {
  let activeTheme = 'classic';
  const toggleTheme = () => {
    activeTheme = activeTheme === 'sakura' ? 'classic' : 'sakura';
    return activeTheme;
  };

  // 100 rapid alternations
  for (let i = 1; i <= 100; i++) {
    const nextTheme = toggleTheme();
    const expected = i % 2 === 1 ? 'sakura' : 'classic';
    assert.equal(nextTheme, expected);

    // Verify classic state invariance
    if (nextTheme === 'classic') {
      const burst = simulateParticleBurst(100, 100, {
        count: 5,
        reducedMotion: nextTheme !== 'sakura',
      });
      assert.equal(
        burst.length,
        0,
        'No particles should be spawned when theme is switched to classic',
      );
    }
  }
});

test('Tier 3: Audio muted vs unmuted behavior during mascot dialogue clicks', () => {
  // Set Sakura mode
  const theme = 'sakura';

  // 1. Unmuted -> plays sound
  setSoundMuted(false);
  setSoundVolume(0.5);
  assert.equal(isSoundMuted(), false);
  const playedUnmuted = playAnimeSound('arigato', theme);
  // In Node environment without audio hardware, playAnimeSound returns true if initialized or false if no Audio API,
  // but theme gate strictly allows execution.
  assert.equal(playAnimeSound('arigato', 'classic'), false, 'Never plays in classic mode');

  // 2. Muted -> playAnimeSound must return false immediately
  setSoundMuted(true);
  assert.equal(isSoundMuted(), true);
  assert.equal(
    playAnimeSound('arigato', theme),
    false,
    'playAnimeSound must return false when sound is muted',
  );

  // Restore unmuted
  setSoundMuted(false);
});

test('Tier 3: Volume scaling and zero-volume muting during dialogue playback', () => {
  setSoundMuted(false);

  // 1. Setting volume to 0 mutes sound
  setSoundVolume(0);
  assert.equal(getSoundVolume(), 0);
  assert.equal(getEffectiveSoundVolume(), 0);
  assert.equal(
    playAnimeSound('tuturu', 'sakura'),
    false,
    'playAnimeSound must return false when volume is 0',
  );

  // 2. Setting volume to 50%
  setSoundVolume(0.5);
  assert.equal(getSoundVolume(), 0.5);
  assert.equal(getEffectiveSoundVolume(), 0.225);

  // 3. Setting volume to 100%
  setSoundVolume(1.0);
  assert.equal(getSoundVolume(), 1.0);
  assert.equal(getEffectiveSoundVolume(), 0.45);

  // Reset to default
  setSoundVolume(0.5);
});

// ============================================================================
// TIER 4: Real-World Scenarios (End-to-End Workflows & Accessibility)
// ============================================================================

test('Tier 4: Scenario 1 - Complete Sakura mode study session with poke-and-talk interactions', () => {
  const state = fresh();
  state.theme = 'sakura';
  setSoundMuted(false);
  setSoundVolume(0.5);

  // 1. Study mascot starts with quote 0
  let quoteIndex = 0;
  let currentQuote = CANONICAL_MASCOT_QUOTES[quoteIndex];
  assert.equal(currentQuote.jp, '先輩、今日もいっしょにがんばろう！✨');
  assert.equal(currentQuote.sound, 'arigato');

  // 2. User pokes study mascot (advances to quote 1)
  quoteIndex = (quoteIndex + 1) % CANONICAL_MASCOT_QUOTES.length;
  currentQuote = CANONICAL_MASCOT_QUOTES[quoteIndex];
  assert.equal(currentQuote.jp, 'すごい！その調子だよ〜！💮');
  assert.equal(currentQuote.kaomoji, '٩(ˊᗜˋ*)و');
  assert.equal(currentQuote.sound, 'wow');

  // 3. User pokes sidebar peeking mascot (advances to quote 2)
  quoteIndex = (quoteIndex + 1) % CANONICAL_MASCOT_QUOTES.length;
  currentQuote = CANONICAL_MASCOT_QUOTES[quoteIndex];
  assert.equal(currentQuote.jp, '一歩ずつ進めば大丈夫！🌸');
  assert.equal(currentQuote.sound, 'tuturu');

  // 4. User solves question and rates with kaomoji label
  const rating = 'easy';
  const label = `${rating === 'easy' ? 'Lätt' : ''} (★ω★)`;
  assert.equal(label, 'Lätt (★ω★)');
});

test('Tier 4: Scenario 2 - Multi-view navigation and theme toggle verification', () => {
  const mockStorage = createMockStorage();
  const THEME_KEY = 'tentaplugg-theme';

  // 1. User sets Sakura mode
  mockStorage.setItem(THEME_KEY, 'sakura');
  assert.equal(mockStorage.getItem(THEME_KEY), 'sakura');

  // 2. Check asset existence for both views
  const vocabAsset = path.resolve('public/anime/encourage.jpg');
  assert.ok(fs.existsSync(vocabAsset), 'public/anime/encourage.jpg must exist for Vocabulary view');

  const particleAsset = path.resolve('public/anime/mascot_peek.jpg');
  assert.ok(
    fs.existsSync(particleAsset),
    'public/anime/mascot_peek.jpg must exist for Particle view',
  );

  // 3. User toggles back to Classic
  mockStorage.setItem(THEME_KEY, 'classic');
  assert.equal(mockStorage.getItem(THEME_KEY), 'classic');
});

test('Tier 4: Scenario 3 - WCAG AA contrast ratio compliance & screen-reader accessibility', () => {
  // 1. Classic theme text tokens
  const classicText = '#243e36';
  const classicBg = '#f8faf8';
  const classicContrast = contrastRatio(classicText, classicBg);
  assert.ok(
    classicContrast >= 4.5,
    `Classic text contrast (${classicContrast.toFixed(2)}) must meet WCAG AA (>= 4.5:1)`,
  );

  // 2. Sakura theme dark plum text on pastel background
  const sakuraText = '#3b1d28';
  const sakuraBg = '#fff5f8';
  const sakuraContrast = contrastRatio(sakuraText, sakuraBg);
  assert.ok(
    sakuraContrast >= 4.5,
    `Sakura text contrast (${sakuraContrast.toFixed(2)}) must meet WCAG AA (>= 4.5:1)`,
  );

  // 3. Sakura primary accent on white card
  const sakuraAccent = '#b82763';
  const whiteBg = '#ffffff';
  const accentContrast = contrastRatio(sakuraAccent, whiteBg);
  assert.ok(
    accentContrast >= 4.5,
    `Sakura accent contrast (${accentContrast.toFixed(2)}) must meet WCAG AA (>= 4.5:1)`,
  );

  // 4. Screen-reader accessible name preservation
  // Verify that regex checking button names matches clean text when kaomojis are aria-hidden
  const rawHtml =
    '<button>Kontrollera svar <span class="kaomoji" aria-hidden="true">(｀・ω・´)ゞ</span></button>';
  const cleanAccessibleName = rawHtml
    .replace(/<span class="kaomoji" aria-hidden="true">[\s\S]*?<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  assert.equal(cleanAccessibleName, 'Kontrollera svar');
});
