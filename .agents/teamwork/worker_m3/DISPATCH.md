## 2026-10-04T17:53:49Z
You are a Worker subagent for Milestone M3 (R3: Sakura Anime Vibes-tema & figurer) in TentaPlugg.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m3
Project root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
The authoritative user request is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
PROJECT.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md
TEST_READY.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md first.

You are assigned exclusive write ownership of the following files:
- src/style.css
- src/main.js
- src/views/home.js
- src/views/session.js
- index.html

Read the detailed survey report and architecture in:
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\handoff.md and analysis.md

Your implementation tasks for Milestone M3:
1. In `src/style.css`:
   - Implement the complete Sakura Anime Vibes theme under `[data-theme="sakura"]`:
     * Backgrounds: soft sakura pastels (`#fff5f8`, `#fce7f3`, lavender `#ede9fe`).
     * Text: deep plum/wine `#3b1d28` exceeding WCAG AA (>14:1 contrast ratio against light backgrounds).
     * Primary accents / buttons: `#b82763` (>5.8:1 contrast).
     * Border, cards, and subtle manga/sakura styling accents.
   - Address focus outline accessibility: ensure `:focus-visible` outlines meet WCAG 1.4.11 (>=3:1 non-text contrast) on all interactive buttons in both themes.
   - Enforce hard hiding rule:
     `:root:not([data-theme="sakura"]) .anime-figure, html:not([data-theme="sakura"]) .anime-figure { display: none !important; }`
   - Style `.anime-figure` tastefully: responsive cards, max-width, rounded borders, soft shadow, smooth transitions.
2. In `src/main.js`:
   - Initialize theme from `localStorage.getItem('tentaplugg-theme') || 'classic'` and set `document.documentElement.dataset.theme`.
   - Add theme switcher button (🌸 Sakura Anime vs 🎓 Klassisk) in header/topbar and sidebar.
   - Implement `toggleTheme()` (or `setTheme(theme)`), updating `state.theme`, `document.documentElement.dataset.theme`, and saving to `localStorage.setItem('tentaplugg-theme', theme)`.
   - Expose `toggleTheme` / `theme` on `ctx`.
3. In `src/views/home.js`:
   - In Sakura mode, display `study.jpg` from `/anime/study.jpg` in `.focus-panel` with `.anime-figure` class.
4. In `src/views/session.js`:
   - In Sakura mode, display `cheer.jpg` from `/anime/cheer.jpg` upon correct answer (`feedback.good`) and in the final results panel.
   - In Sakura mode, display `encourage.jpg` from `/anime/encourage.jpg` upon incorrect answer / `again` feedback.
   - In Classic mode, ensure anime figures are cleanly omitted / hidden.
5. In `index.html` (optional inline script if needed to prevent flash of wrong theme on page load).

Verification requirements:
- Run `npm test` and ensure all unit and requirement tests pass cleanly.
- Run `npm run build` and ensure clean Vite build with exit code 0.
- Record command outputs and verification evidence in your handoff report.

Write your handoff report to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m3\handoff.md.
When finished, send a message to orchestrator with summary and verification evidence.
