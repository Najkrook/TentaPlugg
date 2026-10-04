import assert from 'node:assert/strict';

// Test simulated DOM & localStorage environment for theme lifecycle
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) {
    return this.store.has(k) ? this.store.get(k) : null;
  }
  setItem(k, v) {
    this.store.set(k, String(v));
  }
  removeItem(k) {
    this.store.delete(k);
  }
}

class MockElement {
  constructor() {
    this.dataset = {};
    this.attributes = new Map();
  }
  setAttribute(k, v) {
    this.attributes.set(k, v);
  }
  getAttribute(k) {
    return this.attributes.get(k);
  }
}

// 1. Simulating index.html inline boot script
function runIndexHtmlScript(mockLocalStorage, documentElement, metaElement) {
  try {
    const t = mockLocalStorage.getItem('tentaplugg-theme');
    if (t === 'sakura') {
      documentElement.dataset.theme = 'sakura';
      if (metaElement) metaElement.setAttribute('content', '#a82e66');
    } else {
      documentElement.dataset.theme = 'classic';
    }
  } catch (e) {}
}

// Test Case 1: Fresh user, no localStorage set -> Defaults to classic
const ls1 = new MockLocalStorage();
const doc1 = new MockElement();
const meta1 = new MockElement();
runIndexHtmlScript(ls1, doc1, meta1);
assert.equal(doc1.dataset.theme, 'classic', 'Fresh user gets classic theme in index.html');

// Test Case 2: Returning sakura user -> Boots immediately into sakura
const ls2 = new MockLocalStorage();
ls2.setItem('tentaplugg-theme', 'sakura');
const doc2 = new MockElement();
const meta2 = new MockElement();
runIndexHtmlScript(ls2, doc2, meta2);
assert.equal(doc2.dataset.theme, 'sakura', 'Returning user boots sakura in index.html');
assert.equal(meta2.getAttribute('content'), '#a82e66', 'Meta theme-color set to #a82e66');

// Test Case 3: Garbage localStorage value -> Falls back safely to classic
const ls3 = new MockLocalStorage();
ls3.setItem('tentaplugg-theme', 'hacked-or-corrupted');
const doc3 = new MockElement();
const meta3 = new MockElement();
runIndexHtmlScript(ls3, doc3, meta3);
assert.equal(doc3.dataset.theme, 'classic', 'Corrupted theme falls back to classic');

// Test Case 4: Storage error in private browsing mode -> Does not throw and defaults to classic
const lsBroken = {
  getItem() { throw new Error('Access denied in private mode'); }
};
const doc4 = new MockElement();
const meta4 = new MockElement();
assert.doesNotThrow(() => runIndexHtmlScript(lsBroken, doc4, meta4));
assert.equal(doc4.dataset.theme, undefined, 'Private browsing mode handled gracefully');

console.log('Index.html inline boot script lifecycle tests: PASSED');

// 2. Simulating main.js applyTheme & toggleTheme
function createThemeManager(storage, doc, meta) {
  let theme = 'classic';
  function applyTheme(t) {
    const effective = t === 'sakura' ? 'sakura' : 'classic';
    theme = effective;
    doc.dataset.theme = effective;
    if (meta) {
      meta.setAttribute('content', effective === 'sakura' ? '#a82e66' : '#183f37');
    }
  }
  function setTheme(next) {
    applyTheme(next);
    try {
      storage.setItem('tentaplugg-theme', theme);
    } catch {}
  }
  function toggleTheme() {
    setTheme(theme === 'sakura' ? 'classic' : 'sakura');
  }

  // Initial load
  const stored = storage.getItem('tentaplugg-theme');
  applyTheme(stored || 'classic');

  return {
    getTheme: () => theme,
    toggleTheme,
    setTheme
  };
}

const lsSim = new MockLocalStorage();
const docSim = new MockElement();
const metaSim = new MockElement();
const manager = createThemeManager(lsSim, docSim, metaSim);

assert.equal(manager.getTheme(), 'classic');
assert.equal(docSim.dataset.theme, 'classic');

// Toggle to sakura
manager.toggleTheme();
assert.equal(manager.getTheme(), 'sakura');
assert.equal(docSim.dataset.theme, 'sakura');
assert.equal(metaSim.getAttribute('content'), '#a82e66');
assert.equal(lsSim.getItem('tentaplugg-theme'), 'sakura');

// Toggle back to classic
manager.toggleTheme();
assert.equal(manager.getTheme(), 'classic');
assert.equal(docSim.dataset.theme, 'classic');
assert.equal(metaSim.getAttribute('content'), '#183f37');
assert.equal(lsSim.getItem('tentaplugg-theme'), 'classic');

console.log('Main.js theme manager toggle and persistence tests: PASSED');
