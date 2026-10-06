# DISPATCH: Survey Explorer 3 (Views Theming & Verification Infrastructure)

## Objective
Map the Vocabulary (`/vocabulary`) and Particle (`/particles`) views, compare their styling against existing study/exam/guide views, and examine the test runner and build toolchain.

## Context & Inputs
- Project Root: c:\Users\Najk\Documents\ChatGPT\TentaPlugg
- Requirements: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md (under 2026-10-06T08:28:33Z)
- Focus: R5 (Theming for Vocabulary and Particle Views) and Acceptance Criteria (npm test 109+ tests, build, format:check)

## Investigation Questions
1. How are `/vocabulary` and `/particles` structured? Which source files render these views?
2. What cute pastel banner cards, kawaii tip callouts, or badge styling exist in the study, exam, and guide views that should be adapted to vocabulary and particle views?
3. How do these views behave in Classic vs Sakura mode? What classes or elements need to be conditioned?
4. What is the current test setup (`npm test`, vitest/jest, test file locations, existing test count)? How are theme-related tests currently written?
5. What are the npm scripts for `npm run build` and `npm run format:check`? Are there formatting rules (Prettier / ESLint) to be aware of?

## Output Requirements
Produce a comprehensive report in:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\report.md`
and write your `handoff.md` summarizing findings.


## 2026-10-06T08:31:25Z
You are Explorer 3 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md
Investigate Views & Routes (`/vocabulary` and `/particles`), existing study/exam/guide cards & styling, test suite structure (`npm test` 109+ tests, vitest/jest setup, test runner, format check) (for R5, testing and verification requirements).
Produce your findings report at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\report.md
and your handoff at: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_3\handoff.md
Send a message when complete.
