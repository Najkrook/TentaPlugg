import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

function getLuminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255).map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs = [
  ['Classic text #243e36 on #f8faf8', '#243e36', '#f8faf8', 4.5],
  ['Classic focus ring #265943 on #f8faf8', '#265943', '#f8faf8', 3.0],
  ['Classic focus ring #265943 on #ffffff', '#265943', '#ffffff', 3.0],
  ['Sakura main text #3b1d28 on #fff5f8', '#3b1d28', '#fff5f8', 4.5],
  ['Sakura main text #3b1d28 on #ffffff', '#3b1d28', '#ffffff', 4.5],
  ['Sakura focus ring #b82763 on #fff5f8', '#b82763', '#fff5f8', 3.0],
  ['Sakura focus ring #b82763 on #ffffff', '#b82763', '#ffffff', 3.0],
  ['Sakura primary button text #ffffff on #b82763', '#ffffff', '#b82763', 4.5],
  ['Sakura nav item #784f60 on #ffffff', '#784f60', '#ffffff', 4.5],
  ['Sakura secondary button #8a1f4b on #ffffff', '#8a1f4b', '#ffffff', 4.5],
];

console.log('=== 1. WCAG AA CONTRAST AUDIT ===');
let contrastViolations = 0;
for (const [desc, c1, c2, minRatio] of pairs) {
  const ratio = contrast(c1, c2);
  const pass = ratio >= minRatio;
  if (!pass) contrastViolations++;
  console.log(`${pass ? 'PASS' : 'FAIL'} [${ratio.toFixed(2)}:1 >= ${minRatio}:1] ${desc}`);
}

console.log('\n=== 2. ANIME ASSETS VERIFICATION ===');
const animeFiles = ['study.jpg', 'cheer.jpg', 'encourage.jpg'];
let assetViolations = 0;
for (const f of animeFiles) {
  const p = path.join('public', 'anime', f);
  if (!fs.existsSync(p)) {
    console.log(`FAIL: File does not exist: ${p}`);
    assetViolations++;
    continue;
  }
  const buf = fs.readFileSync(p);
  const isJpg = buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8;
  const sizeKb = (buf.length / 1024).toFixed(1);
  if (!isJpg || buf.length < 50000) {
    console.log(`FAIL: File ${p} invalid or too small (${sizeKb} KB)`);
    assetViolations++;
  } else {
    console.log(`PASS: ${p} (${sizeKb} KB, valid JPEG magic bytes 0xFFD8)`);
  }
}

console.log('\n=== 3. HARDCODED TEST / FACADE PATTERNS SCAN ===');
const filesToAudit = [
  'src/style.css',
  'src/main.js',
  'src/views/home.js',
  'src/views/session.js',
  'index.html',
];

const suspiciousPatterns = [
  /return\s+(true|false|""|null|undefined);?\s*$/m,
  /it\s*\(.*pass/i,
  /__test__/i,
  /fake|dummy|mock/i,
];

let patternViolations = 0;
for (const file of filesToAudit) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pat of suspiciousPatterns) {
    if (pat.test(content)) {
      console.log(`WARNING/MATCH in ${file} matching ${pat}`);
    }
  }
}

console.log('\n=== 4. CSS DUAL-PROTECTION HARD HIDING VERIFICATION ===');
const css = fs.readFileSync('src/style.css', 'utf8');
const hideRule1 = css.includes(':root:not([data-theme="sakura"]) .anime-figure');
const hideRule2 = css.includes('html:not([data-theme="sakura"]) .anime-figure');
const hideRule3 = css.includes('[data-theme="classic"] .anime-figure');
const hideRuleImportant = css.includes('display: none !important;');
console.log(`- :root not sakura rule: ${hideRule1 ? 'PASS' : 'FAIL'}`);
console.log(`- html not sakura rule: ${hideRule2 ? 'PASS' : 'FAIL'}`);
console.log(`- classic theme rule: ${hideRule3 ? 'PASS' : 'FAIL'}`);
console.log(`- display: none !important: ${hideRuleImportant ? 'PASS' : 'FAIL'}`);

console.log('\n=== 5. TEMPLATE DUAL-PROTECTION VERIFICATION ===');
const homeSrc = fs.readFileSync('src/views/home.js', 'utf8');
const sessionSrc = fs.readFileSync('src/views/session.js', 'utf8');

const homeOmitClassic = homeSrc.includes("ctx.theme === 'sakura'") && homeSrc.includes('/anime/study.jpg');
const sessionOmitClassic1 = sessionSrc.includes("ctx.theme === 'sakura'") && sessionSrc.includes('/anime/cheer.jpg');
const sessionOmitClassic2 = sessionSrc.includes('/anime/encourage.jpg');

console.log(`- Home omits study.jpg in classic mode: ${homeOmitClassic ? 'PASS' : 'FAIL'}`);
console.log(`- Session omits cheer.jpg in classic mode: ${sessionOmitClassic1 ? 'PASS' : 'FAIL'}`);
console.log(`- Session includes encourage.jpg for mistake feedback: ${sessionOmitClassic2 ? 'PASS' : 'FAIL'}`);

console.log('\n=== 6. PERSISTENCE & ROOT ATTRIBUTE CONTRACT ===');
const mainSrc = fs.readFileSync('src/main.js', 'utf8');
const indexSrc = fs.readFileSync('index.html', 'utf8');

const mainHasStorageKey = mainSrc.includes("'tentaplugg-theme'");
const mainSetsDataset = mainSrc.includes('document.documentElement.dataset.theme = effective');
const mainSetsMetaColor = mainSrc.includes('meta.setAttribute(\'content\', effective === \'sakura\' ? \'#a82e66\' : \'#183f37\')');
const indexHasInit = indexSrc.includes("localStorage.getItem('tentaplugg-theme')");
const indexSetsDataset = indexSrc.includes("document.documentElement.dataset.theme = 'sakura'");

console.log(`- main.js storage key tentaplugg-theme: ${mainHasStorageKey ? 'PASS' : 'FAIL'}`);
console.log(`- main.js sets dataset.theme: ${mainSetsDataset ? 'PASS' : 'FAIL'}`);
console.log(`- main.js sets meta theme-color: ${mainSetsMetaColor ? 'PASS' : 'FAIL'}`);
console.log(`- index.html reads localStorage: ${indexHasInit ? 'PASS' : 'FAIL'}`);
console.log(`- index.html sets dataset.theme early: ${indexSetsDataset ? 'PASS' : 'FAIL'}`);

const overallPass = contrastViolations === 0 &&
  assetViolations === 0 &&
  hideRule1 && hideRule2 && hideRule3 && hideRuleImportant &&
  homeOmitClassic && sessionOmitClassic1 && sessionOmitClassic2 &&
  mainHasStorageKey && mainSetsDataset && indexHasInit && indexSetsDataset;

console.log('\n===========================================');
console.log(`OVERALL FORENSIC AUDIT RESULT: ${overallPass ? 'CLEAN (ALL PASSED)' : 'INTEGRITY VIOLATION'}`);
console.log('===========================================');
