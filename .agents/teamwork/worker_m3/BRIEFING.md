# BRIEFING — 2026-10-06T09:28:00Z

## Mission
Implement Milestone 3 (R5: Theming for Vocabulary and Particle Views) with cute pastel banner cards, kawaii tip callouts, badge styling consistent with study, exam, and guide views, route handling for /vocabulary and /particles, and strict Classic mode hard-hiding invariant.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m3
- Original parent: 11adfdec-5f2b-4034-94ef-516c769b159f
- Milestone: M3 (R5: Theming for Vocabulary and Particle Views)

## 🔒 Key Constraints
- Exclusive write ownership of: src/views/vocabulary.js, src/views/particles.js, src/main.js, src/style.css, tests/views_theming.test.js.
- Ensure strict Classic mode hard-hiding invariant (zero anime figures or banners visible in DOM/viewport).
- In Sakura mode: dedicated kawaii banner cards with class .anime-figure.vocab-anime-banner-card and .anime-figure.particle-anime-banner-card.
- DO NOT modify lines 2495–2508 in src/style.css (hard-hiding CSS rule).
- All 149+ tests must pass with 0 regressions, build must succeed, and prettier formatting check must pass.
- Genuine implementation only: DO NOT cheat, no hardcoded test results or dummy facades.

## Current Parent
- Conversation ID: 11adfdec-5f2b-4034-94ef-516c769b159f
- Updated: 2026-10-06T09:28:00Z

## Task Summary
- **What to build**:
  1. Route & view wiring in `src/main.js` for `/vocabulary` and `/particles` and views `vocabularyView(ctx)`, `particlesView(ctx)`.
  2. Create `src/views/vocabulary.js` with Genki I vocabulary & kanji data browser, search, filters, and kawaii banner card + tip callout in Sakura mode.
  3. Update `src/views/particles.js` to export top-level `particlesView(ctx)` with particle guide & drill launcher, kawaii banner card + tip callout in Sakura mode.
  4. Styles in `src/style.css` for `.vocab-anime-banner-card`, `.particle-anime-banner-card`, tip callouts, and word-type chips.
  5. Automated tests in `tests/views_theming.test.js`.
  6. Verify build, all tests, and Prettier formatting.
- **Success criteria**:
  - Sakura mode renders dedicated kawaii banner cards and tip callouts.
  - Classic mode completely omits all anime figures and cards (0 DOM nodes, CSS hidden).
  - Browser paths `/vocabulary` and `/particles` display the views.
  - All unit tests pass (149/149), build passes, prettier format check passes.
- **Interface contracts**: PROJECT.md & DISPATCH.md.
- **Code layout**: `src/views/vocabulary.js`, `src/views/particles.js`, `src/main.js`, `src/style.css`, `tests/views_theming.test.js`.

## Key Decisions Made
- Used `renderTemplateToString` pattern in tests to verify both HTML structure and omission in Classic mode.
- In `main.js`, check `window.location.pathname` on boot and handle `popstate` for clean history integration.
- Strictly applied `.anime-figure` class to all banner cards so CSS hard-hiding guarantees protection even if template logic fails.
- Provided comprehensive Genki I vocabulary filtering and particle reference cards in the respective views.

## Change Tracker
- **Files modified**:
  - `src/main.js`: Wired `/vocabulary` and `/particles` routes, views, pushState, and popstate listener.
  - `src/views/vocabulary.js`: Created vocabulary and kanji browser with Sakura kawaii banner and tip callout.
  - `src/views/particles.js`: Added `particlesView(ctx)` with Sakura kawaii banner, tip callout, and 10 canonical particles.
  - `src/style.css`: Added banner cards, badges, tip callouts, and card styles; kept lines 2495-2511 untouched.
  - `tests/views_theming.test.js`: Created 8 comprehensive automated unit tests.
- **Build status**: Passing (`npm test` 149 pass in ~1.25s, `npm run build` exit code 0, `npm run format:check` exit code 0).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Passing (149 pass, 0 fail).
- **Lint status**: Clean (all files formatted with Prettier).
- **Tests added/modified**: `tests/views_theming.test.js` added.

## Loaded Skills
- None specified.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat & task progress
- report.md — Full implementation report
- handoff.md — Final handoff report
