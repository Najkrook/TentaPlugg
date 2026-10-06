# Survey Report: UI & Theme Architecture (Ultra Kawaii Upgrade)

**Explorer**: Explorer Survey 1  
**Milestone**: Survey Phase — Ultra Kawaii Upgrade  
**Working Directory**: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1`  
**Date**: 2026-10-06  

---

## Executive Summary

This survey maps the current UI architecture, theme switching mechanics, CSS hierarchy, hard-hiding rules for Classic mode, button styling, and sidebar structure in TentaPlugg. The project currently features two selectable themes: **Classic** (`classic`) and **Sakura Anime Vibes** (`sakura`), with 109 unit and stress tests passing at 100%.

Key findings for upcoming requirements:
1. **R1 (Sidebar Peeking Mascot)**: CSS styles for `[data-theme='sakura'] .sidebar-chibi-card` already partially exist in `src/style.css` (lines 2886–2947), and an asset `public/anime/mascot_peek.jpg` (chibi catgirl peeking over a card) is already present in `public/anime/`. However, the HTML markup in `src/main.js` (lines 278–313) is currently absent.
2. **R4 (Jelly Bouncy Micro-interactions & Kaomoji)**: All styles are pure custom CSS with CSS variables in `src/style.css` (no Tailwind). Button styling currently has simple hover transitions. Jelly bouncy physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) can be seamlessly applied to Sakura mode while preserving the clean flat design of Classic mode.
3. **Hard-Hiding Rules**: Hard-hiding is enforced across two complementary layers: Lit-HTML conditional omission (`state.theme === 'sakura' ? html`...` : ''`) and CSS `:root:not([data-theme='sakura']) .anime-figure, [data-theme='classic'] .anime-figure { display: none !important; }`. Test `Empirical Stress M3-6` in `tests/stress_m3.test.js` strictly verifies these exact selectors as text strings.
4. **Test Safety for Button Micro-copy**: E2E tests (`app.spec.js`, `pedagogy.spec.js`, `session_flow_stress.spec.js`) rely on exact or regex matching for button names in Classic mode. Kaomoji micro-copy must be strictly confined to Sakura mode and should use `<span class="kaomoji" aria-hidden="true">` to preserve accessible names.

---

## 1. Sidebar Architecture & Component Breakdown

### Current Structure (`src/main.js`, lines 278–313)
The desktop sidebar is rendered inline inside `render()` in `src/main.js` using Lit-HTML:

```javascript
html`<aside class="sidebar">
  <a
    href="#"
    class="brand"
    @click=${(e) => {
      e.preventDefault();
      navigate('home');
    }}
  >
    <span class="brand-symbol" lang="ja">学</span>
    <span>TentaPlugg<small>JAPANSKA</small></span>
  </a>
  <nav>
    ${navs.map(([id, i, label]) => html`
      <button class="nav-item ${view === id ? 'active' : ''}" @click=${() => navigate(id)}>
        ${icon(i)}<span>${label}</span>
      </button>
    `)}
  </nav>
  <div class="side-bottom">
    <button
      type="button"
      class="theme-toggle sidebar-theme-toggle"
      @click=${toggleTheme}
      title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
      aria-label=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Kawaii-ify'}
    >
      <span class="theme-icon" aria-hidden="true">
        ${state.theme === 'sakura' ? '🎓' : '🌸'}
      </span>
      <span class="theme-label">
        ${state.theme === 'sakura' ? 'Klassisk' : 'Kawaii-ify'}
      </span>
    </button>
    <div class="exam-note">
      ${icon('CalendarDays')}<span>Tentadatum<strong>${dateText(state.examDate)}</strong></span>
    </div>
    <p>Lite varje dag.<br />En partikel i taget.</p>
    <span lang="ja" class="side-japanese">がんばって！</span>
  </div>
</aside>`
```

### Pre-Existing Chibi CSS in `src/style.css` (lines 2886–2947)
The stylesheet already contains dedicated rules for the sidebar chibi card under the Sakura theme:
- `[data-theme='sakura'] .sidebar-chibi-card`: Card wrapper (dashed border `#f472b6`, pastel gradient, rounded 16px, `transform: rotate(-1deg)`).
- `[data-theme='sakura'] .sidebar-chibi-card:hover`: Hover lift (`transform: translateY(-2px) rotate(0deg)`).
- `[data-theme='sakura'] .sidebar-chibi-img-wrap`: Circular 82x82px image container with white border and shadow.
- `[data-theme='sakura'] .sidebar-chibi-img-wrap img`: 100% object-fit cover.
- `[data-theme='sakura'] .sidebar-chibi-bubble`: Speech bubble with white background, border `#ffcfe0`, rounded 12px.
- `[data-theme='sakura'] .sidebar-chibi-bubble strong`: Japanese speech line (font `Noto Sans JP`, color `#b82763`, 11px).
- `[data-theme='sakura'] .sidebar-chibi-bubble p`: Swedish translation/kaomoji line (10px, color `#784f60`).

### Asset Availability in `public/anime/`
| Asset Path | Dimensions | File Size | Description | Intended Role |
|---|---|---|---|---|
| `public/anime/mascot_peek.jpg` | 1024x1024 | 149 KB | Chibi pink-haired catgirl peeking over sign | **Sidebar Peeking Mascot** (R1) |
| `public/anime/study.jpg` | 1024x1024 | 185 KB | Anime student at desk with study materials | Study Room Focus Panel (existing) |
| `public/anime/cheer.jpg` | 1024x1024 | 157 KB | Cheerful mascot holding Genki notebook | Correct Feedback & Result (existing) |
| `public/anime/encourage.jpg` | 1024x1024 | 162 KB | Compassionate encouragement mascot | "Again" / Mistake Feedback (existing) |
| `public/anime/mascot_cheer.jpg` | 1024x1024 | 225 KB | Full-body kawaii cheerleader mascot | Vocab / Exam Views / Dialogue |
| `public/anime/mascot_cry.jpg` | 1024x1024 | 185 KB | Crying chibi mascot with broken heart | Mistake Callout / Particle Views |
| `public/anime/stamp_sakura.jpg` | 1024x1024 | 240 KB | Sakura achievement stamp | Badges & Milestones |

### Recommended DOM Placement
The ideal placement in `src/main.js` is between `<nav>` and `<div class="side-bottom">`:
```javascript
${state.theme === 'sakura'
  ? html`<div class="anime-figure sidebar-chibi-card" role="region" aria-label="Sakura-maskot">
      <button
        type="button"
        class="sidebar-chibi-avatar-btn"
        @click=${pokeSidebarMascot}
        aria-label="Prata med maskoten"
        title="Klicka på mig! ✨"
      >
        <div class="sidebar-chibi-img-wrap">
          <img src="/anime/mascot_peek.jpg" alt="Peeking chibi maskot" loading="lazy" />
        </div>
      </button>
      <div class="sidebar-chibi-bubble" aria-live="polite">
        <strong>${currentSidebarQuote.ja}</strong>
        <p>${currentSidebarQuote.sv}</p>
      </div>
    </div>`
  : ''}
```
**Why this position?** In Classic mode, `side-bottom` has `margin-top: auto;` which automatically pushes the theme switcher and exam date to the bottom. In Sakura mode, the peeking chibi card elegantly fills the vertical flex space!

---

## 2. Theme System Architecture & Mechanics

### FOUT Prevention via Early Head Script (`index.html`, lines 12–25)
Before any CSS or Lit-HTML runs, an inline synchronous IIFE in `<head>` inspects `localStorage`:
```javascript
(function () {
  try {
    const t = localStorage.getItem('tentaplugg-theme');
    if (t === 'sakura') {
      document.documentElement.dataset.theme = 'sakura';
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', '#a82e66');
    } else {
      document.documentElement.dataset.theme = 'classic';
    }
  } catch (e) {}
})();
```
This guarantees `document.documentElement.dataset.theme` is populated before the first paint, preventing any Flash of Unstyled Theme (FOUT).

### Runtime State Lifecycle (`src/main.js`)
1. **Boot**:
   - `fresh()` in `src/engine.js` sets initial default: `state.theme = 'classic'`.
   - `setupLocal()` in `src/main.js` reads `localStorage.getItem('tentaplugg-theme')` and sanitizes to either `'sakura'` or `'classic'`.
   - Calls `applyTheme(state.theme)`.
2. **`applyTheme(t)` (lines 76–86)**:
   ```javascript
   function applyTheme(t) {
     const effective = t === 'sakura' ? 'sakura' : 'classic';
     state.theme = effective;
     if (typeof document !== 'undefined') {
       document.documentElement.dataset.theme = effective;
       const meta = document.querySelector('meta[name="theme-color"]');
       if (meta) {
         meta.setAttribute('content', effective === 'sakura' ? '#a82e66' : '#183f37');
       }
     }
   }
   ```
3. **`setTheme(next)` (lines 111–120)**:
   - Calls `applyTheme(next)`.
   - Writes `localStorage.setItem('tentaplugg-theme', state.theme)`.
   - Calls `persist(false)` to save inside user storage (`tentaplugg-v1-${uid}`).
   - Triggers `render()`.
4. **`toggleTheme()` (lines 87–93)**:
   - Inverts: `state.theme === 'sakura' ? 'classic' : 'sakura'`.
   - Calls `setTheme(next)`.
   - If switching to Sakura: plays audio `playAnimeSound('tuturu', 'sakura')`.
5. **View Context Distribution (`getCtx()`, line 217)**:
   - Supplies `theme: state.theme`, `toggleTheme`, `setTheme` to all views.
6. **Hard Audio Gate (`src/audio.js`, line 112)**:
   - `if (theme !== 'sakura' || muted || volume <= 0) return false;`
   - Anime audio sounds (`arigato`, `tuturu`, `wow`, `nani`, `ara_ara`) cannot play when `theme !== 'sakura'`.

---

## 3. Hard-Hiding Rules for Classic Mode

The hard-hiding contract guarantees that in Classic mode (`data-theme='classic'`), no anime figures, mascot cards, sound controls, or kawaii particles can ever appear. This is enforced by a **two-tier defense-in-depth model**:

### Tier 1: DOM Omission (JS Lit-HTML Conditional Rendering)
Every anime element is conditionally rendered in Lit-HTML:
```javascript
${ctx.theme === 'sakura' ? html`<div class="anime-figure ...">...</div>` : ''}
```
In Classic mode, the element is **never created or inserted into the DOM** (`expect(locator).toHaveCount(0)`).

### Tier 2: CSS Safety Net (`src/style.css`, lines 2495–2508)
```css
/* Hard hiding rule: Anime figures and sound toggle must NEVER be shown outside Sakura mode */
:root:not([data-theme='sakura']) .anime-figure,
html:not([data-theme='sakura']) .anime-figure,
[data-theme='classic'] .anime-figure,
:root:not([data-theme='sakura']) .sound-toggle,
html:not([data-theme='sakura']) .sound-toggle,
[data-theme='classic'] .sound-toggle,
:root:not([data-theme='sakura']) .sound-slider-wrapper,
html:not([data-theme='sakura']) .sound-slider-wrapper,
[data-theme='classic'] .sound-slider-wrapper,
:root:not([data-theme='sakura']) .sound-slider,
html:not([data-theme='sakura']) .sound-slider,
[data-theme='classic'] .sound-slider {
  display: none !important;
}
```

### Critical Test Invariant: `tests/stress_m3.test.js` (Empirical Stress M3-6)
Test M3-6 parses `src/style.css` as a text file and string-asserts:
- `css.includes(':root:not([data-theme="sakura"]) .anime-figure')`
- `css.includes('html:not([data-theme="sakura"]) .anime-figure')`
- `css.includes('[data-theme="classic"] .anime-figure')`
- `css.includes('display: none !important;')`

**Rule for all new Kawaii elements (R1, R2, R4, R5)**:
1. Always include class `.anime-figure` on container elements (e.g., `<div class="anime-figure sidebar-chibi-card">`).
2. Never delete or reword lines 2495–2508 in `src/style.css`.
3. If new specific classes are added to the hard-hiding list, append them to the existing rules without modifying the existing string tokens.

---

## 4. Button & Interactive Element Styles

### Current CSS Architecture
TentaPlugg uses pure custom CSS with CSS Custom Properties defined on `:root` and `[data-theme='sakura']`.

| Element Selector | Classic Mode Style | Current Sakura Mode Style (`src/style.css`) |
|---|---|---|
| `.primary` | Solid `#183f37`, white text, radius 7px | Gradient `#b82763` to `#d946ef`, radius 9999px, shadow `0 4px 14px rgba(184,39,99,0.3)` |
| `.secondary` | White background, border `#d4ded5`, color `#183f37` | White background, border `#f472b6`, color `#9d174d`, radius 9999px |
| `.nav-item` | Transparent background, text `#79837c`, radius 8px | Text `#784f60`, radius 14px; on active: gradient `#ffe5f0` to `#ffd1e3` |
| `.theme-toggle` | White pill, border `#dfe6e0`, height 40px | Gradient `#fff0f5` to `#ffd6e7`, border `#f472b6`, color `#9c1f52` |
| `.rating-btn` | Colored background and borders | Radius 14px, border `#ffd6e7`, hover scale 1.03 |
| `.topic-card` | White card, border `#dfe6e0`, radius 10px | Border `#ffd6e7`, radius 18px, decorative washi-tape accent (`::after`) |
| `.plan-task` | White background, border `#dfe6e0`, radius 8px | Border `#ffd6e7`, radius 16px, hover scale 1.01 |

### Jelly Bouncy Micro-Interaction Specification (R4)
To introduce the "Ultra Kawaii Jelly Bouncy" feel in Sakura mode while keeping Classic mode completely untouched:

1. **Timing & Physics Curve**:
   Use an elastic spring cubic-bezier curve: `cubic-bezier(0.34, 1.56, 0.64, 1)` (or `cubic-bezier(0.68, -0.6, 0.32, 1.6)`).
2. **Hover State (Bouncy Pop)**:
   ```css
   [data-theme='sakura'] .primary:hover,
   [data-theme='sakura'] .secondary:hover,
   [data-theme='sakura'] .theme-toggle:hover,
   [data-theme='sakura'] .nav-item:hover,
   [data-theme='sakura'] .topic-card:hover,
   [data-theme='sakura'] .plan-task:hover,
   [data-theme='sakura'] .rating-btn:hover {
     transform: translateY(-3px) scale(1.03);
     box-shadow: 0 8px 24px rgba(244, 114, 182, 0.35);
     transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
   }
   ```
3. **Active State (Tap / Press Jelly Squish)**:
   ```css
   [data-theme='sakura'] .primary:active,
   [data-theme='sakura'] .secondary:active,
   [data-theme='sakura'] .theme-toggle:active,
   [data-theme='sakura'] .nav-item:active,
   [data-theme='sakura'] .topic-card:active,
   [data-theme='sakura'] .plan-task:active,
   [data-theme='sakura'] .rating-btn:active {
     transform: translateY(1px) scale(0.96, 0.93);
     transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   ```
4. **Keyframe Jelly Animation (Optional on click/burst)**:
   ```css
   @keyframes kawaii-jelly {
     0% { transform: scale(1, 1); }
     30% { transform: scale(1.12, 0.88); }
     50% { transform: scale(0.92, 1.08); }
     70% { transform: scale(1.04, 0.96); }
     100% { transform: scale(1, 1); }
   }
   ```
5. **Motion Reduction Safety**:
   ```css
   @media (prefers-reduced-motion: reduce) {
     [data-theme='sakura'] .primary,
     [data-theme='sakura'] .secondary,
     [data-theme='sakura'] .nav-item,
     [data-theme='sakura'] .theme-toggle,
     [data-theme='sakura'] .topic-card,
     [data-theme='sakura'] .rating-btn,
     [data-theme='sakura'] .pill-btn,
     [data-theme='sakura'] .sidebar-chibi-card {
       transform: none !important;
       transition: background 0.15s ease, border-color 0.15s ease !important;
       animation: none !important;
     }
   }
   ```

### Kaomoji Micro-Copy Test Safety Matrix
E2E Playwright tests verify button texts and accessible names:
- `tests/e2e/app.spec.js` (line 37): `getByRole('button', { name: q.self ? 'Visa modellösning' : 'Kontrollera svar', exact: true })` runs in **Classic mode**.
- `tests/e2e/pedagogy.spec.js` (line 49): `getByRole('button', { name: 'Kontrollera svar', exact: true })` runs in **Classic mode**.
- `tests/e2e/session_flow_stress.spec.js` (line 114): `getByRole('button', { name: /^(Kontrollera svar|Visa modellösning|Rätta meningen)$/ })` runs in **Classic mode**.
- `tests/e2e/theme_stress.spec.js` (line 206): `page.getByRole('button', { name: 'Kontrollera svar' }).click()` runs in **Sakura mode** (non-exact substring match).
- `tests/e2e/session_flow_stress.spec.js` (line 126): `page.locator('.rating-btn[data-rating="${rating}"]')` selects by `data-rating` attribute, completely independent of text.

**Safe Kaomoji Implementation Strategy**:
1. **Never alter Classic mode text**: Always render clean, unadorned strings ("Kontrollera svar", "Nästa fråga", "Visa resultat") when `theme === 'classic'`.
2. **In Sakura mode**:
   - For buttons with strict name matching: Wrap decorative kaomojis in `<span class="kaomoji" aria-hidden="true"> (｀・ω・´)ゞ</span>` or render via CSS pseudo-elements (`::after`). Because `aria-hidden="true"` is excluded from the Accessible Name calculation, the accessible name remains `"Kontrollera svar"`, satisfying both exact and substring matchers!
   - For rating buttons: `Igen (｡•́︿•̀｡)`, `Svårt (´-﹏-`；)`, `Bra (o^▽^o)`, `Lätt (★ω★)`. Since tests select by `[data-rating]`, text labels have 0 test collision.
   - For mascot speech bubbles: Feature joyful kaomojis prominently (e.g., `(≧◡≦)`, `٩(◕‿◕)۶`, `(｡•̀ᴗ-)✧`, `(๑•̀ㅂ•́)و✧`).

---

## 5. Responsive Layout & Viewport Edge Cases

### Desktop Sidebar Dimensions
- Fixed position: `top: 0; left: 0; height: 100dvh; display: flex; flex-direction: column;`
- Width: `234px` (viewport > 1100px); `205px` (viewport between 760px and 1100px).
- Main shell offset: `margin-left: 234px` / `margin-left: 205px`.

### Potential Edge Case 1: Short Desktop Viewports (< 700px height)
- Sum of heights in sidebar:
  - `.brand`: ~100px
  - `<nav>` (5 items): ~225px
  - `.sidebar-chibi-card`: ~130px
  - `.side-bottom` (toggle + note + copy + pill): ~185px
  - **Total height**: ~640px.
- If a user opens the app on a 1366x768 screen with browser toolbars (effective height ~600px), the bottom elements could be clipped.
- **Recommended Fix**: Add `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` in `src/style.css` so that short screens cleanly scroll without overflowing.

### Potential Edge Case 2: Mobile Viewports (<= 760px)
- At `@media (max-width: 760px)`, `src/style.css` line 1244 sets `.sidebar { display: none; }` and `.shell { margin-left: 0; }`.
- Navigation shifts to `.mobile-nav` at the bottom of the viewport.
- The sidebar peeking mascot is correctly and automatically hidden on mobile viewports, satisfying R1 without needing additional mobile hides.

### Potential Edge Case 3: Zero Horizontal Overflow Compliance
- `tests/e2e/viewport_overflow_stress.spec.js` executes strict empirical assertions across 7 viewports:
  `320px`, `360px`, `375px`, `390px`, `414px`, `768px`, `1024px`.
- It asserts `overflow === 0` down to the pixel (`metrics.overflow === 0`).
- **Rule for Click Particles (R2) & Jelly Bouncy Transforms (R4)**:
  - Click burst particles must be contained within a container with `overflow: hidden; pointer-events: none; contain: strict;`.
  - Button bouncy hover transforms must be predominantly vertical (`translateY(-3px)`) with modest horizontal scale (`scale(1.02)`), avoiding horizontal expansion that could exceed viewport bounds on narrow screens (e.g. 320px).

---

## 6. Synthesis & Implementation Checklist

| Requirement | Target File(s) | Key Implementation Steps | Test Risk / Safety Measures |
|---|---|---|---|
| **R1: Sidebar Mascot** | `src/main.js`, `src/style.css` | Insert `.anime-figure.sidebar-chibi-card` inside `.sidebar` conditionally when `state.theme === 'sakura'`. Use `/anime/mascot_peek.jpg`. Add `overflow-y: auto` to `.sidebar`. | Retain verbatim `:root:not([data-theme='sakura']) .anime-figure` CSS selector for test M3-6. |
| **R2: Click Particles** | `src/particles.js` (or new click-fx helper), `src/main.js` | Add click listener in Sakura mode spawning transient floating `✨`, `💖`, `🌸` spans. Auto-remove on `animationend`. | Gate by `theme === 'sakura'` and `!window.matchMedia('(prefers-reduced-motion: reduce)').matches`. Container must have `overflow: hidden; pointer-events: none;`. |
| **R3: Poke-and-Talk** | `src/main.js`, `src/views/home.js`, `src/audio.js` | Create array of dialogue quotes (`ja`, `sv`, `sound`). Poking study mascot or sidebar mascot advances index and triggers `playAnimeSound`. | Maintain hard theme gate `theme === 'sakura'`. Ensure test `theme_stress.spec.js` line 134 still succeeds when clicking avatar. |
| **R4: Jelly Bouncy & Kaomoji** | `src/style.css`, `src/views/session.js`, `src/views/home.js` | Add `cubic-bezier(0.34, 1.56, 0.64, 1)` hover & active transforms in `[data-theme='sakura']`. Add kaomoji micro-copy to rating buttons and with `aria-hidden="true"` to action buttons. | Do NOT alter Classic mode button texts (protects `exact: true` Playwright checks). |
| **R5: Kawaii Views** | `src/views/particles.js`, `src/views/vocabulary.js` (if created) | Add kawaii pastel headers, tip callouts, and badge styling in Sakura mode. | Must strictly adhere to hard-hiding rules in Classic mode. |
