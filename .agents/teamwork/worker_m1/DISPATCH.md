## 2026-10-04T17:04:37Z
You are a Worker subagent for Milestone M1 (R1: Kontrastiv felåterkoppling & Snabbguide) in TentaPlugg.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1
Project root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
The authoritative user request is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
PROJECT.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md
TEST_READY.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md first.

You are assigned exclusive write ownership of the following files:
- src/engine.js
- src/views/session.js
- src/views/guide.js
- src/main.js
- src/style.css
- tests/engine.test.js

Read the detailed exploration reports and designs before modifying:
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m1_1\handoff.md and analysis.md
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m1_2\handoff.md and analysis.md
- c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m1_3\handoff.md and analysis.md

Your implementation tasks for Milestone M1:
1. In `src/engine.js`:
   - Enhance `getContrastiveFeedback(q, userAnswer)`:
     - Add `if (correct(q, userAnswer)) return null;` so valid answers (including alternative answers like `['に', 'へ']`) never trigger error feedback.
     - Ensure particle distractor coverage for all common pairs (e.g. `に` vs `で`, `は` vs `が`, `を` vs `が`, `で` vs `を`, `は` vs `も`, `は` vs `の`, `×`) mapping to relevant guideId (`ni-de`, `wa-ga`, `wo-to-no-mo`, `no-particle`).
2. In `src/views/session.js`:
   - Import `getContrastiveFeedback`.
   - On incorrect answers (`s.grades[q.id] === false`), render `contrastiveCallout` showing student's chosen particle vs correct particle, formatted explanation with `<span lang="ja">`, and an `"Öppna snabbguide"` button.
   - Wire the button to call `ctx.openGuideModal(contrastive.guideId)`.
3. In `src/views/guide.js`:
   - Modularize guide card rendering to support embedding inside a modal dialog.
   - Add id/data-guide-id anchoring and automatic scrolling/highlighting for `guideId`.
4. In `src/main.js`:
   - Implement `openGuideModal(guideId)` that opens `<dialog class="guide-modal">` non-destructively without calling `navigate('guide')` or resetting `state.session`.
   - Ensure closing the modal (via ESC, close button, or backdrop click) keeps active session progress 100% intact.
5. In `src/style.css`:
   - Add responsive styles for `dialog.guide-modal`, backdrop blur, `.contrastive-box`, chips, and buttons meeting WCAG AA contrast.
6. In `tests/engine.test.js`:
   - Add unit tests for `getContrastiveFeedback` testing distractor pairs, null on correct answers, and null on alternative answers.

Verification requirements:
- Run `npm test` and ensure all tests pass (existing tests + new engine tests + requirement tests).
- Run `npm run build` and ensure clean Vite build.
- Record command outputs and results in your handoff report.

Write your handoff report to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_m1\handoff.md.
When finished, send a message to orchestrator with summary and verification evidence.
