import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  initClickParticles,
  purgeParticles,
  spawnParticleBurst,
  getActiveParticleCount,
  PARTICLE_GLYPHS,
  MAX_CONCURRENT_PARTICLES,
} from '../src/particles-fx.js';
import {
  formatRatingLabel,
  RATING_KAOMOJI,
  RATING_LABELS,
  sessionView,
} from '../src/views/session.js';

// ============================================================================
// Test DOM Environment Mock Setup
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
// Particle Engine Tests (R2)
// ============================================================================

test('R2: Particle engine exports contract and constants', () => {
  assert.equal(typeof initClickParticles, 'function');
  assert.equal(typeof purgeParticles, 'function');
  assert.equal(typeof spawnParticleBurst, 'function');
  assert.equal(typeof getActiveParticleCount, 'function');
  assert.equal(MAX_CONCURRENT_PARTICLES, 40);
  assert.ok(Array.isArray(PARTICLE_GLYPHS));
  assert.ok(PARTICLE_GLYPHS.includes('✨'));
  assert.ok(PARTICLE_GLYPHS.includes('💖'));
  assert.ok(PARTICLE_GLYPHS.includes('🌸'));
});

test('R2: Particle burst creates elements with classes, styles, and glyphs', () => {
  const { mockDoc, mockWin, body } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const particles = spawnParticleBurst(250, 400, { count: 6 });
    assert.equal(particles.length, 6);
    assert.equal(getActiveParticleCount(), 6);

    for (const p of particles) {
      assert.ok(p.classList.contains('anime-figure'), 'Must have anime-figure class');
      assert.ok(
        p.classList.contains('kawaii-click-particle'),
        'Must have kawaii-click-particle class',
      );
      assert.equal(p.getAttribute('aria-hidden'), 'true');
      assert.equal(p.style.left, '250px');
      assert.equal(p.style.top, '400px');
      assert.ok(PARTICLE_GLYPHS.includes(p.textContent));

      const dx = parseFloat(p.style.getPropertyValue('--dx'));
      const dy = parseFloat(p.style.getPropertyValue('--dy'));
      const rot = parseFloat(p.style.getPropertyValue('--rot'));
      assert.ok(!isNaN(dx), '--dx must be numeric');
      assert.ok(!isNaN(dy), '--dy must be numeric');
      assert.ok(!isNaN(rot), '--rot must be numeric');
    }
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('R2: Capacity ceiling strictly limits concurrent particles to 40', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    // Rapidly trigger 20 bursts of 5 particles (100 total)
    for (let i = 0; i < 20; i++) {
      spawnParticleBurst(100, 100, { count: 5 });
    }

    assert.ok(
      getActiveParticleCount() <= MAX_CONCURRENT_PARTICLES,
      `Active count (${getActiveParticleCount()}) must not exceed ${MAX_CONCURRENT_PARTICLES}`,
    );
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('R2: Dual cleanup removes element on animationend event', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    const burst = spawnParticleBurst(150, 200, { count: 2 });
    assert.equal(getActiveParticleCount(), 2);

    const first = burst[0];
    assert.equal(first.parentNode, mockDoc.body);

    // Dispatch animationend event
    first.dispatchEvent({ type: 'animationend' });
    assert.equal(first.parentNode, null, 'Element must be removed on animationend');
    assert.equal(getActiveParticleCount(), 1, 'Active particle count must decrement');
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('R2: purgeParticles immediately removes all active particle elements', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    spawnParticleBurst(100, 100, { count: 10 });
    assert.ok(getActiveParticleCount() > 0);

    purgeParticles();
    assert.equal(getActiveParticleCount(), 0);
    assert.equal(mockDoc.querySelectorAll('.kawaii-click-particle').length, 0);
  } finally {
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('R2: Click listener gating by theme and reduced motion', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    let currentTheme = 'classic';
    const teardown = initClickParticles(() => currentTheme);

    // 1. In Classic mode, click fires but NO particles spawn
    mockWin.dispatchClick({ clientX: 200, clientY: 300 });
    assert.equal(getActiveParticleCount(), 0, 'No particles in Classic mode');

    // 2. Switch to Sakura mode -> click spawns particles
    currentTheme = 'sakura';
    mockWin.dispatchClick({ clientX: 200, clientY: 300 });
    assert.ok(getActiveParticleCount() >= 5, 'Particles spawned in Sakura mode');

    // 3. Under reduced motion -> click suppresses particles
    purgeParticles();
    mockWin.setReducedMotion(true);
    mockWin.dispatchClick({ clientX: 200, clientY: 300 });
    assert.equal(getActiveParticleCount(), 0, 'No particles under reduced motion');

    // 4. Restore normal motion
    mockWin.setReducedMotion(false);
    mockWin.dispatchClick({ clientX: 200, clientY: 300 });
    assert.ok(getActiveParticleCount() >= 5);

    teardown();
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

test('R2: Direct spawnParticleBurst honors prefers-reduced-motion', () => {
  const { mockDoc, mockWin } = createMockDomEnvironment();
  const origDoc = globalThis.document;
  const origWin = globalThis.window;
  globalThis.document = mockDoc;
  globalThis.window = mockWin;

  try {
    purgeParticles();
    mockWin.setReducedMotion(true);
    const spawned = spawnParticleBurst(100, 100);
    assert.deepEqual(spawned, []);
    assert.equal(getActiveParticleCount(), 0);
  } finally {
    purgeParticles();
    globalThis.document = origDoc;
    globalThis.window = origWin;
  }
});

// ============================================================================
// Jelly Bouncy & Kaomoji Micro-copy Tests (R4)
// ============================================================================

test('R4: formatRatingLabel outputs joyful kaomojis in Sakura and clean Swedish in Classic', () => {
  // Sakura mode format
  assert.equal(formatRatingLabel('again', 'sakura'), 'Igen (｡•́︿•̀｡)');
  assert.equal(formatRatingLabel('hard', 'sakura'), 'Svårt (´-﹏-`；)');
  assert.equal(formatRatingLabel('good', 'sakura'), 'Bra (o^▽^o)');
  assert.equal(formatRatingLabel('easy', 'sakura'), 'Lätt (★ω★)');

  // Classic mode format
  assert.equal(formatRatingLabel('again', 'classic'), 'Igen');
  assert.equal(formatRatingLabel('hard', 'classic'), 'Svårt');
  assert.equal(formatRatingLabel('good', 'classic'), 'Bra');
  assert.equal(formatRatingLabel('easy', 'classic'), 'Lätt');
});

test('R4: CSS contract defines elastic spring curves and keyframe animations', () => {
  const css = fs.readFileSync(path.resolve('src/style.css'), 'utf8');

  // 1. Particle keyframe and style
  assert.ok(css.includes('@keyframes kawaii-burst-fly'), 'Must define @keyframes kawaii-burst-fly');
  assert.ok(css.includes('.kawaii-click-particle'), 'Must style .kawaii-click-particle');
  assert.ok(css.includes('z-index: 9999'), 'Particle must float on z-index 9999');

  // 2. Elastic spring cubic-bezier curve in Sakura mode
  assert.ok(
    css.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'),
    'Must define elastic spring cubic-bezier(0.34, 1.56, 0.64, 1)',
  );
  assert.ok(
    css.includes('transform: translateY(-3px) scale(1.03)'),
    'Must define bouncy hover transform',
  );
  assert.ok(
    css.includes('transform: translateY(1px) scale(0.96)'),
    'Must define bouncy active transform',
  );

  // 3. Hard-hiding invariant strictly preserved
  assert.ok(
    css.includes(":root:not([data-theme='sakura']) .anime-figure") ||
      css.includes(':root:not([data-theme="sakura"]) .anime-figure'),
    'Hard-hiding rule for .anime-figure outside Sakura must exist',
  );
  assert.ok(css.includes('display: none !important;'), 'display: none !important must be enforced');
});
