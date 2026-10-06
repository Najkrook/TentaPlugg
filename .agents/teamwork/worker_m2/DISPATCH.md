# DISPATCH: Worker M2 (Particle Burst Effects & Jelly Bouncy Interactions)

## Objective
Implement Milestone 2:
- R2: Sparkle & Heart Click Burst Effects (`✨`, `💖`, `🌸`, `💕`, `⭐`)
- R4: Jelly Bouncy Micro-interactions & Kaomoji Micro-copy

## Context & Inputs
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Test Infrastructure: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\TEST_INFRA.md` & `TEST_READY.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2`

## Detailed Implementation Requirements

### 1. Click & Touch Particle Burst System (R2)
- Create `src/particles-fx.js` exporting `initClickParticles(getTheme)`:
  - Listens for clicks/taps on window.
  - Spawns 5–7 floating transient particles with varied glyphs (`✨`, `💖`, `🌸`, `💕`, `⭐`) originating at `(clientX, clientY)`.
  - Distributes particles radially with random angles, distance (30–80px), upward drift, and fade out.
  - Applies classes `.anime-figure.kawaii-click-particle` to each particle element.
  - Dual-cleanup: element removes itself on `animationend`, plus safety fallback `setTimeout(() => el.remove(), 1000)`.
  - Cap max concurrent particles ($\le 40$) to prevent any DOM buildup or memory leaks during rapid clicking.
  - Gating: strictly does NOT spawn particles if `getTheme() !== 'sakura'` or `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
  - Export a cleanup / purge function to remove any active particles when theme switches from Sakura to Classic.
- In `src/style.css`:
  - Add `@keyframes kawaii-burst-fly` and styles for `.kawaii-click-particle` (`pointer-events: none; position: fixed; z-index: 9999; ...`).
  - Ensure `:root:not([data-theme='sakura']) .anime-figure` continues to hide them with `display: none !important;` (DO NOT modify lines 2495–2508).
- Wire into `src/main.js` during initialization and on theme toggle.

### 2. Jelly Bouncy Micro-interactions & Kaomoji Micro-copy (R4)
- In `src/style.css`:
  - Add bouncy jelly transitions for interactive buttons (`.primary`, `.secondary`, `.theme-toggle`, `.rating-btn`, `.topic-card`, `.sidebar-chibi-card`) under `[data-theme='sakura']` using elastic spring curve:
    `transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;`
    Hover: `transform: translateY(-3px) scale(1.03);`
    Active: `transform: translateY(1px) scale(0.96);`
  - Suppress transforms under `@media (prefers-reduced-motion: reduce)`.
  - Keep Classic mode buttons clean/flat with standard behavior.
- In `src/views/session.js` (and study ratings):
  - When `ctx.theme === 'sakura'`, render joyful kaomojis with the rating buttons:
    - Igen: `Igen (｡•́︿•̀｡)`
    - Svårt: `Svårt (´-﹏-`；)`
    - Bra: `Bra (o^▽^o)`
    - Lätt: `Lätt (★ω★)`
  - When in Classic mode, render strictly clean Swedish: `Igen`, `Svårt`, `Bra`, `Lätt`.
  - On action buttons in Sakura mode (e.g. submit/check), keep accessible text identical to avoid breaking Playwright tests (`name: 'Kontrollera svar'`), while optionally appending `<span class="kaomoji" aria-hidden="true"> ✨</span>`.

### 3. Verification
- Run `npm test` and `npm run build` to ensure all 133+ tests pass and build exits with 0.
- Check that `tests/ultra_kawaii.test.js` passes Tier 1 (R2, R4) and Tier 2 (particle cleanup, reduced-motion).

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your full implementation report to:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2\report.md`
and write your `handoff.md` with verification results.


## 2026-10-06T09:00:17Z
You are Worker M2 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Implement Milestone 2:
- R2: Sparkle & Heart Click Burst Effects (transient particles, dual-cleanup, reduced-motion, Sakura mode only)
- R4: Jelly Bouncy Micro-interactions & Kaomoji Micro-copy
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Run tests and build, and report back when complete.
