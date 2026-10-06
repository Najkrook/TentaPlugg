# DISPATCH: Worker M1 (Mascot & Interactive Dialogue System)

## Objective
Implement Milestone 1 (R1: Sidebar Peeking Mascot and R3: Interactive Mascot Dialogue / Poke-and-Talk) and fix the audio mapping for `ara_ara`.

## Context & Inputs
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Explorer 1 Report: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_1\report.md`
- Explorer 2 Report: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2\report.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1`

## Specific Implementation Requirements
1. **Audio Sound Mapping (`src/audio.js`)**:
   - Update `ara_ara` sound mapping to point to `/anime/sounds/ara_ara.mp3` (currently pointing to `wow.mp3`).
2. **Mascot Dialogue Catalogue (`src/mascot-dialogue.js` or `src/views/home.js`)**:
   - Define a rich catalogue of at least 6–8 joyful Japanese study lines with kaomojis, Swedish translations, and associated sound cues (`arigato`, `tuturu`, `wow`, `ara_ara`).
   - Starting quote should preserve compatibility with existing tests (`先輩、今日もいっしょにがんばろう！✨` / `arigato`).
   - Support dynamic cycling through the quotes on interaction.
3. **Interactive Study Mascot (`src/views/home.js`)**:
   - Wire the avatar button / study mascot so clicking cycles to the next quote, updates the speech bubble text (Japanese, kaomoji, Swedish translation), and triggers the corresponding cheerful sound via `playAnimeSound`.
4. **Sidebar Peeking Mascot (`src/main.js` and `src/style.css`)**:
   - Render peeking chibi mascot card inside `aside.sidebar` (between `<nav>` and `.side-bottom`) using `/anime/mascot_peek.jpg`.
   - Apply classes `.anime-figure.sidebar-chibi-card`, `.sidebar-chibi-img-wrap`, and `.sidebar-chibi-bubble`.
   - Condition strictly on `state.theme === 'sakura'`. In Classic mode, omit completely from the DOM.
   - Wire interactive click handler so clicking the sidebar mascot also cycles quotes and triggers cheerful sound feedback.
   - Add `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` in `src/style.css` to prevent clipping on short viewports.
5. **Hard-Hiding Rules**:
   - Strictly verify that NO mascot markup, images, or audio elements leak into Classic mode.
   - Do NOT modify lines 2495–2508 in `src/style.css` (hard-hiding rules tested by stress test M3-6).
6. **Verification**:
   - Run `npm test` and `npm run build` to verify 0 errors and 0 regressions.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your full implementation report to:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1\report.md`
and write your `handoff.md` with verification results.


## 2026-10-06T08:43:46Z
You are Worker M1 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Implement Milestone 1 (R1: Sidebar Mascot and R3: Interactive Mascot Dialogue / Poke-and-Talk) per DISPATCH.md.
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Run tests and build, and report back when complete.
