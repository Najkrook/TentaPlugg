# BRIEFING — 2026-10-06T09:12:00Z

## Mission
Implement Milestone 2 on the Ultra Kawaii upgrade project:
- R2: Sparkle & Heart Click Burst Effects (`✨`, `💖`, `🌸`, `💕`, `⭐` transient particles, dual-cleanup, reduced-motion gating, Sakura mode only).
- R4: Jelly Bouncy Micro-interactions (`cubic-bezier(0.34, 1.56, 0.64, 1)`) & Joyful Kaomoji Micro-copy (`again`, `hard`, `good`, `easy`) with screen-reader accessibility preservation.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2
- Original parent: caec6291-b7f4-4115-a415-2741cb85c00d
- Milestone: M2

## 🔒 Key Constraints
- DO NOT CHEAT: Genuine implementations only, real state and real behavior.
- Assigned exclusive write ownership of:
  - src/views/home.js
  - src/main.js
  - src/views/session.js
  - src/style.css
  - tests/engine.test.js
- In practice mode (`s.mode !== 'exam'`), render 4 self-rating buttons (Igen, Svårt, Bra, Lätt) with live Leitner interval preview.
- For auto-graded questions, keep "Nästa fråga" / "Visa resultat" so automated tests and default flows continue working seamlessly.
- In exam mode (`s.mode === 'exam'`), STRICTLY keep buttons "Jag kunde detta" and "Behöver öva mer" so Playwright tests pass!
- Add accessible keyboard shortcuts (1, 2, 3, 4) with guards against typing in text inputs or IME composition.
- All styles must exceed WCAG AA contrast (>4.5:1).
- `npm test` and `npm run build` must pass cleanly.
- [2026-10-06 M2 Constraints]:
  - Sparkle & Heart Click Bursts (R2): strictly active only in Sakura mode and suppressed under `prefers-reduced-motion`.
  - Max concurrent particles <= 40 ceiling to prevent DOM buildup or memory leaks.
  - Dual-cleanup lifecycle: element removes on `animationend` plus 1,000ms safety timeout fallback.
  - Hard-hiding invariant: particles carry `.anime-figure.kawaii-click-particle` and are purged on switch to Classic.
  - Lines 2495-2508 in `src/style.css` must remain intact.
  - Jelly transitions on interactive elements in Sakura mode: `transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease;`.
  - Kaomoji micro-copy in Sakura mode: Igen (｡•́︿•̀｡), Svårt (´-﹏-`；), Bra (o^▽^o), Lätt (★ω★). Classic mode strictly clean. Accessible names preserved with `aria-hidden="true"`.

## Current Parent
- Conversation ID: 11adfdec-5f2b-4034-94ef-516c769b159f
- Updated: 2026-10-06T09:12:00Z

## Task Summary
- **What to build**:
  1. `src/particles-fx.js`: Click/tap particle engine with radial burst trajectory, upward lift, dual-cleanup, theme gating, reduced-motion suppression, max 40 capacity limit, and `purgeParticles` export.
  2. `src/style.css`: `@keyframes kawaii-burst-fly`, `.kawaii-click-particle`, `.kaomoji`, and bouncy jelly spring styling for `.primary`, `.secondary`, `.theme-toggle`, `.rating-btn`, `.topic-card`, `.sidebar-chibi-card` under `[data-theme='sakura']`, suppressed in reduced-motion.
  3. `src/main.js`: Initialization of `initClickParticles(() => state.theme)` on window and `purgeParticles()` in `applyTheme` on switch away from Sakura.
  4. `src/views/session.js`: Joyful kaomoji micro-copy for rating buttons in Sakura mode, clean Swedish in Classic mode, accessible text preservation via `aria-hidden="true"` on action buttons and rating labels, exported `formatRatingLabel`.
  5. `tests/particles_interactive.test.js`: 8 unit test suites verifying full particle physics, DOM lifecycle, capacity capping, reduced-motion gating, and kaomoji micro-copy.
- **Success criteria**:
  - All unit tests pass cleanly (141 tests total, 0 failures, 0 regressions).
  - Vite production build exits 0.
  - Prettier formatting check passes on all modified files.
- **Interface contracts**: `PROJECT.md` § Click Particle Engine Contract, `TEST_INFRA.md` § R2 & R4.
- **Code layout**: `src/particles-fx.js`, `src/style.css`, `src/main.js`, `src/views/session.js`, `tests/particles_interactive.test.js`.

## Key Decisions Made
- Used event capture phase for `window.addEventListener('click', ...)` so particle bursts trigger consistently across interactive elements without interfering with event handling.
- Exported `formatRatingLabel(rating, theme)` and dictionaries `RATING_KAOMOJI`, `RATING_LABELS` from `src/views/session.js` to ensure clear separation and testability.
- Embedded kaomojis inside `<span class="kaomoji" aria-hidden="true">` to preserve clean accessible names for screen readers and Playwright test assertions (`Kontrollera svar`).
- Maintained capacity ceiling of 40 concurrent particles by discarding oldest particle elements upon new burst additions.

## Artifact Index
- `.agents/teamwork/worker_m2/DISPATCH.md` — Dispatch requirements
- `.agents/teamwork/worker_m2/BRIEFING.md` — Situational awareness
- `.agents/teamwork/worker_m2/progress.md` — Progress log & heartbeat
- `.agents/teamwork/worker_m2/report.md` — Full milestone implementation report
- `.agents/teamwork/worker_m2/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/particles-fx.js`: New particle burst engine exporting `initClickParticles`, `purgeParticles`, `spawnParticleBurst`.
  - `src/style.css`: Added `@keyframes kawaii-burst-fly`, `.kawaii-click-particle`, `.kaomoji`, and jelly bouncy micro-interactions (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - `src/main.js`: Wired `initClickParticles` on window and `purgeParticles` in `applyTheme`.
  - `src/views/session.js`: Implemented kaomoji micro-copy for rating and action buttons in Sakura mode.
  - `tests/particles_interactive.test.js`: Added 8 unit tests covering R2 particles and R4 jelly micro-copy.
- **Build status**: PASS (Vite build exited with code 0).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: PASS (141/141 tests passing in ~1.2s).
- **Lint status**: PASS (Prettier formatting check passed).
- **Tests added/modified**: 8 new unit tests in `tests/particles_interactive.test.js`.

## Loaded Skills
- None
