# BRIEFING — 2026-10-04T17:45:00Z

## Mission
Implement Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) in TentaPlugg: session size selector (5, 10, 20, due) and 4-tier self-rating review buttons (again, hard, good, easy) with interval previews, keyboard shortcuts, accessible styles, and test coverage.

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

## Current Parent
- Conversation ID: caec6291-b7f4-4115-a415-2741cb85c00d
- Updated: 2026-10-04T17:45:00Z

## Task Summary
- **What to build**:
  1. Home view session size selector (5, 10, 20, Alla förfallna) persisted to localStorage and wired to session start.
  2. Main app state and session initiation handling preferredCount and dueOnly.
  3. Session view 4 self-rating review buttons for practice mode feedback, with live intervals, shortcuts (1-4), while keeping exam mode buttons and auto-graded flow intact.
  4. CSS styles for session size pills and rating buttons (>4.5:1 contrast, responsive).
  5. Unit tests in `tests/engine.test.js` for 4 ratings across boxes 0-4, schema version 2 preservation, and boolean `ok` backward compatibility.
- **Success criteria**:
  - All existing and new tests pass (`npm test`).
  - Vite build succeeds (`npm run build`).
  - Strict preservation of exam mode and auto-graded tests.
- **Interface contracts**: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md
- **Code layout**: src/views/home.js, src/main.js, src/views/session.js, src/style.css, tests/engine.test.js

## Key Decisions Made
- Starting box for live interval preview is captured in `s.startBox[q.id]` before initial review/check to prevent preview shifts.
- Retained "Nästa fråga" / "Visa resultat" in `.question-actions` for auto-graded practice questions to maintain 100% backward compatibility with automated test suites.
- Retained "Jag kunde detta" and "Behöver öva mer" strictly in exam mode (`s.mode === 'exam'`) and as companion self-grading actions in practice `q.self`.
- Keyboard shortcuts 1-4 guarded with `!isEditable`, `!composing`, `!modal`, and `!session.done`.

## Artifact Index
- .agents/teamwork/worker_m2/DISPATCH.md — Dispatch instructions
- .agents/teamwork/worker_m2/BRIEFING.md — Situational awareness
- .agents/teamwork/worker_m2/progress.md — Progress log & heartbeat
- .agents/teamwork/worker_m2/handoff.md — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/views/home.js`: Session length pill radiogroup (5, 10, 20, Alla förfallna) and dynamic session hint.
  - `src/main.js`: `setPreferredCount`, `getCtx` binding, `start` count/dueOnly handling, `grade` string ratings, keyboard shortcuts 1-4.
  - `src/views/session.js`: 4 self-rating buttons (Igen, Svårt, Bra, Lätt), live interval previews, startBox tracking, exam mode compatibility.
  - `src/style.css`: Session size pills and self-rating button styling with WCAG AA compliant contrast (>4.5:1) and responsive breakpoints.
  - `tests/engine.test.js`: 4 new unit test suites for Leitner 4-rating matrix, box clamping, backwards compatibility, and schema version 2.
- **Build status**: PASS (npm run build exit 0)
- **Pending issues**: none

## Quality Status
- **Build/test result**: PASS (48/48 tests passing in 118ms)
- **Lint status**: 0 violations (Prettier formatted)
- **Tests added/modified**: 4 new comprehensive unit tests in `tests/engine.test.js`

## Loaded Skills
- None
