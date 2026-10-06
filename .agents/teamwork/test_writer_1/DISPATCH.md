# DISPATCH: Test Writer (E2E & Test Suite Track)

## Objective
Establish `TEST_INFRA.md`, develop comprehensive tests for requirements R1–R5 (Tiers 1–4), publish `TEST_READY.md`, and verify test execution via `npm test`.

## Inputs & Paths
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Project Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\test_writer_1`

## Tasks
1. Read `ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. Create `TEST_INFRA.md` at project root following the Project Pattern template:
   - Category-Partition, BVA, Pairwise, and Real-World Application methodology.
   - Feature coverage table across R1 to R5.
3. Author a new test suite file, e.g. `tests/ultra_kawaii.test.js`, using Node native `node:test` (`import test from 'node:test'`, `import assert from 'node:assert/strict'`):
   - Tier 1 (Feature Coverage): Tests for sidebar mascot rendering in Sakura, click particle helper/logic, mascot dialogue quote cycling, kaomoji rating labels, vocabulary & particle views.
   - Tier 2 (Boundary & Corner Cases): Classic mode hard-hiding (DOM omission and CSS display:none !important), rapid dialogue clicks, reduced-motion preferences, empty/missing state resilience.
   - Tier 3 (Cross-Feature Combinations): Switching themes back and forth preserves clean Classic mode; audio muted vs unmuted behavior during dialogue clicks.
   - Tier 4 (Real-World Scenarios): User studying in Sakura mode interacts with sidebar and study mascots, views vocabulary/particles, and toggles theme.
4. Run `npm test` to verify all baseline 109 tests + new tests execute cleanly.
5. Create `TEST_READY.md` at project root with runner command, tier breakdown, and feature checklist.
6. Write your completion report in `report.md` and `handoff.md`.


## 2026-10-06T08:43:46Z
You are Test Writer on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\test_writer_1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\test_writer_1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Develop TEST_INFRA.md at project root, author test cases for R1–R5 (Tiers 1–4) in tests/, verify with npm test, publish TEST_READY.md, and write your handoff report.
Send a message when complete.
