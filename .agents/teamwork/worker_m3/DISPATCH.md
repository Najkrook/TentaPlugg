# DISPATCH: Worker M3 (Theming for Vocabulary and Particle Views)

## Objective
Implement Milestone 3:
- R5: Theming for Vocabulary view (`/vocabulary`) and Particle view (`/particles`) with cute pastel banner cards, kawaii tip callouts, and badge styling consistent with study, exam, and guide views.
- Ensure strict Classic mode hard-hiding invariant (zero anime figures or banners visible in DOM/viewport).

## Context & Inputs
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Explorer 3 Report: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\report.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m3`

## Detailed Implementation Tasks

### 1. Route & View Wiring in `src/main.js`
- Update view routing logic:
  - Add support for `view === 'vocabulary'` and `view === 'particles'`.
  - Check `window.location.pathname` on boot/navigation so accessing `/vocabulary` or `/particles` renders the respective view.
  - Wire navigation helper: `navigate('vocabulary')`, `navigate('particles')`.
  - Render `vocabularyView(ctx)` from `src/views/vocabulary.js` and `particlesView(ctx)` from `src/views/particles.js`.

### 2. Create `src/views/vocabulary.js`
- Export `vocabularyView(ctx)`.
- Use Genki I vocabulary and kanji data from `src/vocabulary-data.js` (`vocabularyList`, `kanjiList`).
- In Sakura mode (`ctx.theme === 'sakura'`):
  - Render dedicated kawaii banner card with class `.anime-figure.vocab-anime-banner-card`.
  - Include anime mascot image `/anime/encourage.jpg`, omamori pill badge (e.g. `単語のお守り 🌸`), cheerful Japanese bubble (`言葉を覚えると世界が広がるよ！✨`), Swedish translation (`Varje nytt ord öppnar en ny dörr! 💕`), and kawaii study tip callout.
- In Classic mode:
  - Completely omit `.anime-figure` banner cards from the template.
  - Render clean, accessible vocabulary reference/browser.

### 3. Update `src/views/particles.js`
- Export a top-level `particlesView(ctx)` (preserving the existing `particleSessionView`).
- In Sakura mode (`ctx.theme === 'sakura'`):
  - Render dedicated kawaii banner card with class `.anime-figure.particle-anime-banner-card`.
  - Include anime mascot image `/anime/mascot_peek.jpg` (or `study.jpg`), omamori pill badge (e.g. `助詞マスター ✨`), cheerful Japanese bubble (`助詞のニュアンス、いっしょにマスターしようね！🎀`), Swedish translation (`Bemästra partiklarnas magiska nyanser! 💕`), and kawaii grammar tip callout.
- In Classic mode:
  - Completely omit `.anime-figure` banner cards from the template.
  - Render clean, accessible particle overview/guide.

### 4. Styles in `src/style.css`
- Style `.vocab-anime-banner-card` and `.particle-anime-banner-card` following the established pattern from `src/views/exams.js` (`.exam-anime-banner-card`) and `src/views/guide.js` (`.guide-anime-hero-card`).
- Use pastel gradient backgrounds, `2px dashed #f472b6` border, `border-radius: 20px`, pill badges, and playful typography.
- Strictly include `.anime-figure` class on all banner cards so that `:root:not([data-theme='sakura']) .anime-figure { display: none !important; }` (lines 2495–2508) inherently guarantees hard-hiding in Classic mode. DO NOT modify lines 2495–2508.

### 5. Automated Tests
- Add unit tests (e.g. in `tests/views_theming.test.js`) testing:
  - Vocabulary view renders kawaii banner in Sakura mode and omits it in Classic mode.
  - Particle view renders kawaii banner in Sakura mode and omits it in Classic mode.
  - Navigation/routing works for `/vocabulary` and `/particles`.

### 6. Verification
- Run `npm test` and `npm run build` to verify all tests pass with 0 regressions.
- Format touched files cleanly with Prettier.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your full implementation report to:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m3\report.md`
and write your `handoff.md` with verification results.
