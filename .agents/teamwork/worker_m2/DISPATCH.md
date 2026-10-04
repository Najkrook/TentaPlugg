## 2026-10-04T17:32:09Z

You are a Worker subagent for Milestone M2 (R2: Flexibel Spaced Repetition & Sessionsstorlek) in TentaPlugg.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2
Project root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
The authoritative user request is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
PROJECT.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md
TEST_READY.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md first.

You are assigned exclusive write ownership of the following files:
- src/views/home.js
- src/main.js
- src/views/session.js
- src/style.css
- tests/engine.test.js

Read the detailed exploration reports and designs before modifying:
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_1\handoff.md and analysis.md
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_2\handoff.md and analysis.md
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m2_3\handoff.md and analysis.md

Your implementation tasks for Milestone M2:
1. In `src/views/home.js`:
   - Add segmented pill selector for session length: `5`, `10`, `20`, and `Alla förfallna (${p.due})`.
   - Wire selection to call `ctx.setPreferredCount(count)` (or equivalent) and update UI.
2. In `src/main.js`:
   - Implement `setPreferredCount(count)` to update `state.preferredCount` and persist in localStorage.
   - Update `start(topic, options)` to use the selected count and handle `dueOnly` when all due questions are selected.
3. In `src/views/session.js`:
   - In practice mode (`s.mode !== 'exam'`), when feedback is shown, render the 4 self-rating buttons:
     - Igen (`again` - 10m)
     - Svårt (`hard` - 1d / <=1d)
     - Bra (`good` - standard progression, e.g. 1d/3d/7d/14d)
     - Lätt (`easy` - accelerated progression, e.g. 3d/7d/14d)
     - Display live Leitner interval preview based on current question's starting box.
   - Clicking a rating updates the stat with that rating, records review history, and advances.
   - For auto-graded questions, keep "Nästa fråga" / "Visa resultat" so automated tests and default flows continue working seamlessly.
   - In exam mode (`s.mode === 'exam'`), STRICTLY keep buttons `"Jag kunde detta"` and `"Behöver öva mer"` so Playwright tests pass!
   - Add accessible keyboard shortcuts (1, 2, 3, 4) with guards against typing in text inputs or IME composition.
4. In `src/style.css`:
   - Add responsive styles for the session selector pills and self-rating buttons exceeding WCAG AA contrast (>4.5:1).
5. In `tests/engine.test.js`:
   - Add unit test suites verifying all 4 ratings (`again`, `hard`, `good`, `easy`) across boxes 0 to 4, schema version 2 preservation, and backwards compatibility for boolean `ok`.

Verification requirements:
- Run `npm test` and ensure all tests pass cleanly.
- Run `npm run build` and ensure Vite build passes with exit code 0.
- Record command outputs and verification evidence in your handoff report.

Write your handoff report to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m2\handoff.md.
When finished, send a message to orchestrator with summary and verification evidence.
