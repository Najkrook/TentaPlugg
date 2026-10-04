## 2026-10-04T16:54:54Z
You are a Test Writer subagent for the E2E Testing Track in TentaPlugg.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\test_writer_e2e
Project root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
The authoritative user request is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
TEST_INFRA.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\TEST_INFRA.md
PROJECT.md is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\PROJECT.md

MANDATORY: Read c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and TEST_INFRA.md first.

Your mission:
Implement a comprehensive, requirement-driven test suite in `test/requirements.test.js` using Node.js native test runner (`node:test` and `node:assert/strict`) that exercises the acceptance criteria across R1, R2, and R3:
- Tier 1 (Feature Coverage):
  * Contrastive distractor feedback for particle errors (`getContrastiveFeedback` returns non-null explanation & guideId for に vs で, は vs が, etc., and null for correct answers).
  * SRS Leitner calculation (`nextStat` correctly computes intervals for 'again', 'hard', 'good', 'easy').
  * Session size selection logic (selectPractice honors 5, 10, 20, and all due questions).
  * Theme switching logic and persistence keys (`tentaplugg-theme`).
  * Backwards compatibility for legacy review entries lacking `rating`.
- Tier 2 (Boundary & Corner Cases):
  * Extreme intervals, box 0 to box 4 boundaries, questions with multiple correct answers (array vs string).
  * Missing or malformed stored states handled gracefully.
- Tier 3 (Cross-feature Combinations):
  * Answering with self-rating, updating SRS, and verifying subsequent due calculations.
- Tier 4 (Real-World Scenarios):
  * End-to-end simulated student workflows.

Execute `npm test` after writing `test/requirements.test.js` to verify test execution. Note: Tests for UI-dependent features that are not yet implemented in M1/M2/M3 may initially test pure logic/contracts or be structured so that once code is integrated, they validate full behavior. Ensure all 24 existing tests continue to pass!

Output:
- Create `test/requirements.test.js`.
- Write your handoff to: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\test_writer_e2e\handoff.md
- When finished, send a message to orchestrator with summary and test results.
