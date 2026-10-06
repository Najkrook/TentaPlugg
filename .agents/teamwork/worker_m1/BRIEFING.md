# BRIEFING — 2026-10-06T09:00:00Z

## Mission
Implement Milestone 1: R1 Sidebar Peeking Mascot and R3 Interactive Mascot Dialogue ("Poke-and-Talk"), fix ara_ara audio mapping, and ensure strict hard-hiding compliance.

## 🔒 My Identity
- Archetype: worker_m1
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1
- Original parent: 11adfdec-5f2b-4034-94ef-516c769b159f
- Milestone: M1 (R1: Sidebar Mascot and R3: Interactive Mascot Dialogue)

## 🔒 Key Constraints
- MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine.
- DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task.
- Dual-layer hard-hiding: conditional Lit-HTML omission in Classic mode AND CSS `.anime-figure { display: none !important; }`.
- Do NOT modify lines 2495–2508 in `src/style.css` (hard-hiding rules tested by stress test M3-6).
- Starting mascot quote must preserve backwards compatibility with tests (`先輩、今日もいっしょにがんばろう！✨` / `arigato`).
- 0 test failures, 0 regressions on existing tests, clean Vite build.

## Current Parent
- Conversation ID: 11adfdec-5f2b-4034-94ef-516c769b159f
- Updated: 2026-10-06T09:00:00Z

## Task Summary
- **What to build**:
  1. Fix `ara_ara` sound mapping in `src/audio.js` to `/anime/sounds/ara_ara.mp3`.
  2. Mascot dialogue catalogue module (`src/mascot-dialogue.js`) with 8 joyful quotes (Japanese, kaomojis, Swedish translations, audio cues).
  3. Interactive poke-and-talk in Study Room Mascot (`src/views/home.js`).
  4. Sidebar peeking chibi mascot card in `src/main.js` and `src/style.css` using `/anime/mascot_peek.jpg`.
  5. Add `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` in `src/style.css`.
  6. Unit and E2E tests verifying dialogue rotation, sound triggering, sidebar presence in Sakura and complete absence in Classic.
- **Success criteria**:
  - `npm test` passes with 0 failures (133/133 passing).
  - `npm run build` succeeds with exit 0.
  - All requirements R1 & R3 satisfied.
- **Interface contracts**: PROJECT.md § Mascot Dialogue Contract
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Updated `src/audio.js` mapping `ara_ara: '/anime/sounds/ara_ara.mp3'` and exported `SOUND_FILES`.
- Created `src/mascot-dialogue.js` containing 8 comprehensive quotes with kaomojis, Swedish translations, and cheerful sound cues (`arigato`, `tuturu`, `wow`, `ara_ara`).
- Preserved starting quote compatibility at index 0 (`先輩、今日もいっしょにがんばろう！✨` / `arigato`).
- Wired study room mascot (`src/views/home.js`) and sidebar mascot (`src/main.js`) with interactive poke functions (`pokeStudyMascot`, `pokeSidebarMascot`) that sequentially advance quotes, play cheerful sounds, and update speech bubbles in Lit-HTML.
- Maintained dual-layer hard-hiding invariant: Lit-HTML conditional omission (`state.theme === 'sakura' ? html`...` : ''`) and CSS `.anime-figure { display: none !important; }`. Left lines 2495–2508 in `src/style.css` untouched.
- Added `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` in `src/style.css` to prevent clipping on short desktop viewports.

## Change Tracker
- **Files modified**:
  - `src/audio.js`: Mapped `ara_ara` to `/anime/sounds/ara_ara.mp3`, exported `SOUND_FILES`.
  - `src/mascot-dialogue.js`: Created dialogue catalogue (8 quotes), state management, and rotation/poke methods.
  - `src/views/home.js`: Rendered dynamic study quote with kaomoji and wired click handler on avatar and speech bubble.
  - `src/main.js`: Rendered peeking chibi mascot in sidebar under Sakura mode, wired `pokeSidebarMascot`, added methods to `getCtx()`.
  - `src/style.css`: Added scroll properties to `.sidebar`, added interactive cursor and focus styling to `.sidebar-chibi-card`.
  - `tests/audio.test.js`: Added unit test for `SOUND_FILES` mapping including `ara_ara`.
  - `tests/mascot_dialogue.test.js`: Added comprehensive unit test suite (7 tests) for dialogue catalogue, rotation, poking, sidebar classes, and hard-hiding.
  - `tests/e2e/mascot_dialogue.spec.js`: Added Playwright E2E test verifying sidebar and study mascot presence in Sakura, absence in Classic, quote rotation, and 0 page errors.
- **Build status**: Pass (`npm test` 133/133 passing; `npm run build` exit code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: 133 passing unit/stress tests, 2 passing E2E tests, clean Vite production build.
- **Lint status**: Clean (Prettier executed on all modified files)
- **Tests added/modified**: `tests/mascot_dialogue.test.js` (7 new tests), `tests/audio.test.js` (1 new test), `tests/e2e/mascot_dialogue.spec.js` (E2E test suite).

## Loaded Skills
None

## Artifact Index
- `DISPATCH.md` — Assignment instructions
- `BRIEFING.md` — Situational awareness
- `progress.md` — Liveness heartbeat
- `report.md` — Comprehensive implementation report for Milestone 1
- `handoff.md` — Final 5-component handoff report
