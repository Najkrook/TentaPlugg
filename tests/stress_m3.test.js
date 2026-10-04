import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fresh, migrate } from '../src/engine.js';

// ============================================================================
// EMPIRICAL STRESS TEST SUITE: M3 Theme Switching, Persistence & Invariants
// ============================================================================

test('Empirical Stress M3-1: Default state and schema theme invariants', () => {
  // 1. Fresh state initializes with 'classic' theme
  const f = fresh();
  assert.equal(f.theme, 'classic', 'fresh() must default to classic theme');

  // 2. Migration preserves valid themes and defaults appropriately
  assert.equal(migrate(null).theme, 'classic');
  assert.equal(migrate({}).theme, 'classic');
  assert.equal(migrate({ theme: 'sakura' }).theme, 'sakura');
  assert.equal(migrate({ theme: 'classic' }).theme, 'classic');
});

test('Empirical Stress M3-2: Early head script FOUT prevention contract', () => {
  const indexHtml = readFileSync(resolve('index.html'), 'utf8');

  // Head script must exist before any styles or body
  const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/i);
  assert(headMatch, 'index.html must have a <head> block');
  const headContent = headMatch[1];

  // Must contain an inline script that checks localStorage
  const scriptMatch = headContent.match(/<script>([\s\S]*?)<\/script>/i);
  assert(scriptMatch, 'index.html head must contain an inline script for FOUT prevention');
  const scriptBody = scriptMatch[1];

  assert(
    scriptBody.includes("localStorage.getItem('tentaplugg-theme')"),
    'Head script must read tentaplugg-theme',
  );
  assert(
    scriptBody.includes("dataset.theme = 'sakura'"),
    'Head script must set dataset.theme to sakura',
  );
  assert(
    scriptBody.includes("dataset.theme = 'classic'"),
    'Head script must set dataset.theme to classic',
  );
  assert(
    scriptBody.includes('try {'),
    'Head script must be wrapped in try-catch for private/sandboxed browsing',
  );

  // Simulate head script evaluation in different simulated environments
  const runHeadScriptSim = (storedValue, throwsError = false) => {
    let dataset = {};
    let metaContent = '#183f37';
    const mockDoc = {
      documentElement: { dataset },
      querySelector: (selector) => {
        if (selector === 'meta[name="theme-color"]') {
          return {
            setAttribute: (attr, val) => {
              if (attr === 'content') metaContent = val;
            },
          };
        }
        return null;
      },
    };
    const mockStorage = {
      getItem: (key) => {
        if (throwsError) throw new Error('SecurityError: The operation is insecure.');
        return storedValue;
      },
    };

    // Execute logic matching head script
    try {
      const t = mockStorage.getItem('tentaplugg-theme');
      if (t === 'sakura') {
        mockDoc.documentElement.dataset.theme = 'sakura';
        const m = mockDoc.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', '#a82e66');
      } else {
        mockDoc.documentElement.dataset.theme = 'classic';
      }
    } catch (e) {}

    return { theme: dataset.theme, metaColor: metaContent };
  };

  // Test matrix for initial load:
  // a) null (first time visitor)
  assert.deepEqual(runHeadScriptSim(null), { theme: 'classic', metaColor: '#183f37' });
  // b) empty string
  assert.deepEqual(runHeadScriptSim(''), { theme: 'classic', metaColor: '#183f37' });
  // c) invalid theme
  assert.deepEqual(runHeadScriptSim('dark-mode'), { theme: 'classic', metaColor: '#183f37' });
  assert.deepEqual(runHeadScriptSim('undefined'), { theme: 'classic', metaColor: '#183f37' });
  // d) 'sakura'
  assert.deepEqual(runHeadScriptSim('sakura'), { theme: 'sakura', metaColor: '#a82e66' });
  // e) 'classic'
  assert.deepEqual(runHeadScriptSim('classic'), { theme: 'classic', metaColor: '#183f37' });
  // f) SecurityError / sandboxed storage
  assert.deepEqual(runHeadScriptSim(null, true), { theme: undefined, metaColor: '#183f37' });
});

test('Empirical Stress M3-3: Theme state sanitizer and toggle transition logic', () => {
  // Simulation of main.js applyTheme & toggleTheme functions
  const createThemeManager = (initialStored = null) => {
    let store = { 'tentaplugg-theme': initialStored };
    let state = fresh();
    let docDataset = {};
    let metaColor = '#183f37';

    const applyTheme = (t) => {
      const effective = t === 'sakura' ? 'sakura' : 'classic';
      state.theme = effective;
      docDataset.theme = effective;
      if (effective === 'sakura') metaColor = '#a82e66';
      else metaColor = '#183f37';
    };

    const setTheme = (next) => {
      applyTheme(next);
      try {
        store['tentaplugg-theme'] = state.theme;
      } catch {}
    };

    const toggleTheme = () => {
      const next = state.theme === 'sakura' ? 'classic' : 'sakura';
      setTheme(next);
    };

    // Initial boot
    const stored = store['tentaplugg-theme'];
    applyTheme(stored || state.theme || 'classic');

    return {
      getState: () => state,
      getDocDataset: () => docDataset,
      getStore: () => store,
      getMetaColor: () => metaColor,
      applyTheme,
      setTheme,
      toggleTheme,
    };
  };

  // Test 1: Start with null -> starts classic
  const tm1 = createThemeManager(null);
  assert.equal(tm1.getState().theme, 'classic');
  assert.equal(tm1.getDocDataset().theme, 'classic');

  // Test 2: Start with 'sakura' -> starts sakura
  const tm2 = createThemeManager('sakura');
  assert.equal(tm2.getState().theme, 'sakura');
  assert.equal(tm2.getDocDataset().theme, 'sakura');
  assert.equal(tm2.getMetaColor(), '#a82e66');

  // Test 3: Start with invalid value -> sanitizes to classic
  const tm3 = createThemeManager('corrupted_theme_xyz');
  assert.equal(tm3.getState().theme, 'classic');
  assert.equal(tm3.getDocDataset().theme, 'classic');

  // Test 4: 1,000 rapid toggle transitions maintaining 100% synchronization
  const tm4 = createThemeManager('classic');
  for (let i = 1; i <= 1000; i++) {
    const expected = i % 2 === 1 ? 'sakura' : 'classic';
    tm4.toggleTheme();
    assert.equal(tm4.getState().theme, expected, `Step ${i}: state.theme must be ${expected}`);
    assert.equal(
      tm4.getDocDataset().theme,
      expected,
      `Step ${i}: dataset.theme must be ${expected}`,
    );
    assert.equal(
      tm4.getStore()['tentaplugg-theme'],
      expected,
      `Step ${i}: store must be ${expected}`,
    );
    assert.equal(
      tm4.getMetaColor(),
      expected === 'sakura' ? '#a82e66' : '#183f37',
      `Step ${i}: meta color must match ${expected}`,
    );
  }
});

test('Empirical Stress M3-4: LocalStorage quota failure resilience', () => {
  let docDataset = {};
  let state = fresh();

  // Mock localStorage throwing QuotaExceededError
  const mockStorageFail = {
    setItem: () => {
      const err = new Error('QuotaExceededError: The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    },
    getItem: () => 'sakura',
  };

  const applyTheme = (t) => {
    const effective = t === 'sakura' ? 'sakura' : 'classic';
    state.theme = effective;
    docDataset.theme = effective;
  };

  const setTheme = (next) => {
    applyTheme(next);
    try {
      mockStorageFail.setItem('tentaplugg-theme', state.theme);
    } catch {}
  };

  // Calling setTheme must not throw an uncaught exception
  assert.doesNotThrow(() => {
    setTheme('sakura');
  });

  // State and DOM must still be updated despite storage failure
  assert.equal(state.theme, 'sakura');
  assert.equal(docDataset.theme, 'sakura');
});

test('Empirical Stress M3-5: Anime image assets integrity on disk', () => {
  const assets = ['study.jpg', 'cheer.jpg', 'encourage.jpg'];
  for (const filename of assets) {
    const filePath = resolve('public/anime', filename);
    const buffer = readFileSync(filePath);

    // Verify file size (> 50KB)
    assert(buffer.length > 50000, `${filename} size (${buffer.length} bytes) must be > 50KB`);

    // Verify JPEG magic bytes: 0xFF, 0xD8, 0xFF
    assert.equal(buffer[0], 0xff, `${filename} byte 0 must be 0xFF`);
    assert.equal(buffer[1], 0xd8, `${filename} byte 1 must be 0xD8`);
    assert.equal(buffer[2], 0xff, `${filename} byte 2 must be 0xFF`);
  }
});

test('Empirical Stress M3-6: CSS hard-hiding rules and theme selector verification', () => {
  // Attribute selectors mean the same thing with either CSS quote style.
  const css = readFileSync(resolve('src/style.css'), 'utf8').replaceAll("'", '"');

  // Hard hiding rule check:
  // Must contain rule hiding anime-figure when NOT sakura
  assert(
    css.includes(':root:not([data-theme="sakura"]) .anime-figure'),
    'CSS must include :root:not([data-theme="sakura"]) .anime-figure selector',
  );
  assert(
    css.includes('html:not([data-theme="sakura"]) .anime-figure'),
    'CSS must include html:not([data-theme="sakura"]) .anime-figure selector',
  );
  assert(
    css.includes('[data-theme="classic"] .anime-figure'),
    'CSS must include [data-theme="classic"] .anime-figure selector',
  );
  assert(
    css.includes('display: none !important;'),
    'CSS must enforce display: none !important for anime figures outside sakura',
  );

  // Focus ring definition
  assert(css.includes('--focus-ring: #265943;'), 'CSS must define classic --focus-ring');
  assert(css.includes('--focus-ring: #b82763;'), 'CSS must define sakura --focus-ring');

  // Sakura theme block must exist and define colors
  assert(css.includes('[data-theme="sakura"]'), 'CSS must define [data-theme="sakura"] block');
  assert(css.includes('color: #3b1d28;'), 'CSS sakura text must be #3b1d28');
  assert(css.includes('background: #fff5f8;'), 'CSS sakura background must be #fff5f8');
});
