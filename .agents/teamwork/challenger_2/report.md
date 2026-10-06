# Empirical Adversarial Challenge Report: Challenger 2

**Date**: 2026-10-06  
**Agent**: Challenger 2 (Empirical Challenger, critic & specialist)  
**Target Scope**: R1–R5, Focus on Reduced Motion, URL Routing, Viewport Boundaries, Data Integrity  
**Overall Risk Assessment**: HIGH  
**Verdict**: **REQUEST_CHANGES**

---

## Executive Summary

Challenger 2 executed empirical stress tests, parameter fuzzing, accessibility inspections, and data integrity audits against the Ultra Kawaii upgrade. 

While core routing logic, viewport responsiveness (52/52 Playwright tests passing with 0px overflow), and vocabulary/particle data integrity (170/170 vocab items and 43/43 kanji valid) are well-crafted, **two critical/high defects and one test failure block approval**:
1. **Critical Denial of Service (V8 Heap Out of Memory)**: `spawnParticleBurst(x, y, { count: Infinity })` accepts `Infinity` as a number, entering an unbounded loop that exhausts V8 memory (4 GB heap) and causes `npm test` to exit with code 1.
2. **Accessibility Failure**: `spawnParticleBurst` does not inspect `prefers-reduced-motion` at the function level, and background floating sakura petals (`.sakura-petals-container`) continue to play infinite keyframe animations under `prefers-reduced-motion: reduce`.
3. **Test Suite & Formatter Regressions**: `npm test` and `npm run format:check` currently fail.

---

## Empirical Verification Matrix

| Area | Test Suite / Command | Outcome | Observation |
|---|---|---|---|
| **Adversarial Suite (Challenger 2)** | `node --test tests/challenger_2_adversarial.test.js` | **9/9 PASS** | URL boundaries, data integrity, DOM rendering, reduced motion click gating verified. |
| **Full Unit Test Suite** | `npm test` | **FAIL (Exit 1)** | Fatal V8 Heap Out of Memory crash in `spawnParticleBurst` during `tests/challenger_stress.test.js`. |
| **Filtered Test Suite (excl. crash test)** | `node --test tests/*.test.js` (19 files) | **158/158 PASS** | All base features and regression tests pass when infinite loop is avoided. |
| **Multi-Viewport E2E** | `npx playwright test tests/e2e/viewport_overflow_stress.spec.js` | **52/52 PASS** | 0px horizontal overflow across 320px–1024px in Classic and Sakura modes. |
| **Production Build** | `npm run build` | **PASS (Exit 0)** | Vite v7.3.6 builds dist cleanly in 1.59s. |
| **Code Formatting** | `npm run format:check` | **FAIL (Exit 1)** | Prettier formatting issues in `tests/challenger_stress.test.js`. |

---

## Detailed Findings & Challenges

### 1. [CRITICAL] Denial of Service / Infinite Loop via `options.count: Infinity` in `spawnParticleBurst`
- **Location**: `src/particles-fx.js:63-70`
- **Challenged Assumption**: That `options.count` is always an integer or bounded number.
- **Empirical Evidence**:
  In `src/particles-fx.js`:
  ```javascript
  const count =
    typeof options.count === 'number' ? options.count : Math.floor(Math.random() * 3) + 5;
  ```
  In JavaScript, `typeof Infinity === 'number'` evaluates to `true`.
  When `{ count: Infinity }` is passed (e.g., during adversarial fuzzing in `tests/challenger_stress.test.js:737`):
  ```javascript
  for (let i = 0; i < count; i++) {
    // Unbounded allocation of DOM nodes, event listeners, and setTimeout timers
  }
  ```
  The loop runs forever, allocating millions of DOM spans and `setTimeout` closures until V8 hits the heap limit:
  `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
- **Blast Radius**: Freezes the browser UI thread completely, crashes worker processes, and causes `npm test` to fail in CI.
- **Recommended Mitigation**:
  Sanitize and clamp `count` to a safe integer bounded by `MAX_CONCURRENT_PARTICLES`:
  ```javascript
  const opts = options || {};
  const requestedCount = Number.isFinite(opts.count)
    ? Math.max(0, Math.min(Math.floor(opts.count), MAX_CONCURRENT_PARTICLES))
    : Math.floor(Math.random() * 3) + 5;
  ```

---

### 2. [MEDIUM] Accessibility Gating: `spawnParticleBurst` Bypasses `prefers-reduced-motion`
- **Location**: `src/particles-fx.js:60-65`
- **Challenged Assumption**: That particle generation is suppressed under `prefers-reduced-motion`.
- **Empirical Evidence**:
  - `initClickParticles` checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and ignores clicks.
  - However, `spawnParticleBurst` does NOT check `window.matchMedia`. Any direct invocation (or future UI trigger like game-completion fireworks) will spawn 5–7 floating particles even when reduced motion is requested.
  - Requirement: *"Verify particle generator produces 0 elements when prefers-reduced-motion is active."*
- **Recommended Mitigation**:
  Add direct media query gating inside `spawnParticleBurst`:
  ```javascript
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return [];
  }
  ```

---

### 3. [MEDIUM] Accessibility Gating: Screen Atmosphere Sakura Petals Lack Animation Suppression
- **Location**: `src/style.css:1677-1682` & `src/style.css:4795-4850`
- **Challenged Assumption**: That `@media (prefers-reduced-motion: reduce)` suppresses all non-essential animations.
- **Empirical Evidence**:
  `index.html:29-38` declares 8 ambient floating petals:
  ```html
  <div class="anime-figure sakura-petals-container" aria-hidden="true">
    <span class="sakura-petal p1">🌸</span>...
  </div>
  ```
  These run continuous infinite keyframes (`sakura-fall 10s linear infinite`, `sakura-sway 3s ease-in-out infinite`).
  In `src/style.css`, the reduced-motion block only sets:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  It does NOT set `animation: none !important;` or hide `.sakura-petals-container`.
  Therefore, in Sakura mode, users with vestibular disorders or reduced-motion OS preferences still experience constant drifting/swaying animations across the screen.
- **Recommended Mitigation**:
  Add suppression rules in `src/style.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .sakura-petals-container,
    .kawaii-click-particle {
      display: none !important;
      animation: none !important;
    }
  }
  ```

---

### 4. [LOW] Null Argument Vulnerability in `spawnParticleBurst`
- **Location**: `src/particles-fx.js:60`
- **Observation**: Default argument `options = {}` only catches `undefined`. Passing `null` (`spawnParticleBurst(0, 0, null)`) throws unhandled `TypeError: Cannot read properties of null (reading 'count')`.
- **Recommended Mitigation**: Default to `const opts = options || {};`.

---

## Areas Verified Robust

### 1. View Routing Boundaries & URL Normalization
- Tested `/vocabulary` and `/particles` with arbitrary query parameters (`?filter=adjectives&sort=asc`), hash fragments (`#kanji-section`), trailing slashes (`/vocabulary/`), and multiple leading slashes (`///vocabulary`).
- Tested invalid routes (`/null`, `/undefined`, `/%20`, `/unknown-route`). Router safely defaults to `'home'` without crashing.
- Verified route switching (`/vocabulary` -> `/exams` -> `/vocabulary` -> `/particles`):
  - `state.theme` remains strictly preserved in both Sakura and Classic modes.
  - Active `session` is properly reset (`session = null`), preventing stale exam or duel state from leaking into vocabulary/particles views.

### 2. Data Integrity across Vocabulary, Kanji, and Particles
- **Vocabulary Data (`src/vocabulary-data.js`)**: All 170 items validated. 100% have unique non-empty `id`, valid `lesson` (3, 4, 5), valid `kana`, `romaji`, and Swedish translation `sv`. Zero dummy or placeholder strings.
- **Word Type Chips (`src/views/vocabulary.js`)**: All 12 word types (`u-verb`, `ru-verb`, `irregular-verb`, `noun`, `i-adj`, `na-adj`, `adverb`, `time`, `expression`, `pronoun`, `particle`, `counter`) correctly map to Swedish category labels (`u-verb`, `substantiv`, etc.) and CSS classes (`chip-verb`, `chip-noun`, etc.).
- **Kanji Data (`src/vocabulary-data.js`)**: All 43 kanji validated with positive strokes, Swedish meanings, and valid readings/compounds.
- **Particle Guide Data (`src/views/particles.js`)**: All 10 canonical particles have rich, authentic Japanese examples and contrastive grammar notes.
- **View Render String Integrity**: Lit-HTML serialized output in both Classic and Sakura modes contains **zero** instances of `undefined`, `null`, `[object Object]`, or `NaN`.

### 3. Viewport Constraints & Mobile Containment
- Playwright stress suite tested 52 configurations across 320px, 360px, 375px, 390px, 414px, 768px, and 1024px.
- 0px horizontal overflow across all views, including 10 rapid mobile theme toggles and Quick Guide modal dialogs.
- `.vocab-anime-banner-card` and `.particle-anime-banner-card` define `box-sizing: border-box` and `max-width: 100%`, fitting cleanly within narrow 320px mobile viewports.

---

## Conclusion & Verdict

**Verdict: REQUEST_CHANGES**

Before this release can be approved, the following items must be resolved:
1. Fix the infinite loop in `src/particles-fx.js` by clamping `count` to `[0, MAX_CONCURRENT_PARTICLES]` using `Number.isFinite`.
2. Add defense-in-depth reduced-motion checks to `spawnParticleBurst()` and suppress `.sakura-petals-container` in CSS.
3. Ensure `npm test` and `npm run format:check` pass cleanly with exit code 0.
