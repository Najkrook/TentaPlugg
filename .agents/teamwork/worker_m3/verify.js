import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('src/style.css', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const home = fs.readFileSync('src/views/home.js', 'utf8');
const session = fs.readFileSync('src/views/session.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

// 1. CSS checks
assert(css.includes(':root:not([data-theme="sakura"]) .anime-figure'), 'CSS missing hard hiding rule on :root');
assert(css.includes('html:not([data-theme="sakura"]) .anime-figure'), 'CSS missing hard hiding rule on html');
assert(css.includes('[data-theme="classic"] .anime-figure'), 'CSS missing hard hiding rule on classic');
assert(css.includes('display: none !important'), 'CSS missing display: none !important for anime figures');
assert(css.includes('[data-theme="sakura"]'), 'CSS missing [data-theme="sakura"] selector');
assert(css.includes('#fff5f8'), 'CSS missing #fff5f8 pastel background');
assert(css.includes('#3b1d28'), 'CSS missing #3b1d28 deep text');
assert(css.includes('#b82763'), 'CSS missing #b82763 primary accent');
assert(css.includes('--focus-ring: #265943'), 'CSS missing classic focus ring with >3:1 contrast');
assert(css.includes('--focus-ring: #b82763'), 'CSS missing sakura focus ring with >3:1 contrast');
assert(css.includes('.anime-figure'), 'CSS missing .anime-figure styles');
assert(css.includes('.anime-study-panel'), 'CSS missing .anime-study-panel styles');
assert(css.includes('.anime-feedback-mascot'), 'CSS missing .anime-feedback-mascot styles');
assert(css.includes('.anime-result-mascot'), 'CSS missing .anime-result-mascot styles');

// 2. Main.js checks
assert(main.includes("'tentaplugg-theme'"), 'main.js missing tentaplugg-theme storage key');
assert(main.includes('dataset.theme'), 'main.js missing dataset.theme setting');
assert(main.includes('function toggleTheme()'), 'main.js missing toggleTheme');
assert(main.includes('function setTheme('), 'main.js missing setTheme');
assert(main.includes('theme: state.theme'), 'main.js missing theme in getCtx');
assert(main.includes('sidebar-theme-toggle'), 'main.js missing sidebar theme toggle button');
assert(main.includes('topbar-theme-toggle'), 'main.js missing topbar theme toggle button');

// 3. Home.js checks
assert(home.includes('/anime/study.jpg'), 'home.js missing study.jpg');
assert(home.includes('anime-figure'), 'home.js missing anime-figure class');
assert(home.includes('anime-study-panel'), 'home.js missing anime-study-panel class');

// 4. Session.js checks
assert(session.includes('/anime/cheer.jpg'), 'session.js missing cheer.jpg');
assert(session.includes('/anime/encourage.jpg'), 'session.js missing encourage.jpg');
assert(session.includes('anime-feedback-mascot'), 'session.js missing anime-feedback-mascot');
assert(session.includes('anime-result-mascot'), 'session.js missing anime-result-mascot');

// 5. Index.html checks
assert(html.includes("localStorage.getItem('tentaplugg-theme')"), 'index.html missing theme initialization script');
assert(html.includes("document.documentElement.dataset.theme = 'sakura'"), 'index.html missing theme setting script');

// 6. Asset checks
for (const img of ['study.jpg', 'cheer.jpg', 'encourage.jpg']) {
  assert(fs.existsSync(`public/anime/${img}`), `public/anime/${img} does not exist`);
  assert(fs.statSync(`public/anime/${img}`).size > 50000, `public/anime/${img} is too small`);
}

console.log('All static and structural Milestone M3 checks PASSED perfectly!');
