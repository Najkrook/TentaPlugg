# DISPATCH: Challenger 2 (Empirical Boundary & Adversarial Test Harness)

## Objective
Adversarially challenge edge cases, routing boundaries, reduced-motion preferences, viewport constraints, and extreme inputs across R1–R5.

## Inputs & Paths
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2`

## Challenger Focus Areas
1. **Reduced Motion & Accessibility Boundaries**:
   - Verify particle generator produces 0 elements when `prefers-reduced-motion` is active.
   - Verify `@media (prefers-reduced-motion: reduce)` disables jelly bouncy button transitions.
2. **View Routing & Extreme URL Inputs**:
   - Test `/vocabulary` and `/particles` with arbitrary query parameters or hash fragments. Verify router gracefully handles transitions without crashing.
   - Verify that switching from `/vocabulary` to `/exams` and back preserves theme and view state.
3. **Data Integrity & Word Type Chips**:
   - Validate that `vocabularyView` and `particlesView` render valid real data from `src/vocabulary-data.js` and `src/particles.js`, with 0 dummy text or undefined strings.
4. **Execution**:
   - Run adversarial checks via `node --test` or custom runner script.
   - Run `npm test` and `npm run build`.

## Output & Verdict
Provide a clear verdict at the top of your `handoff.md`:
`Verdict: APPROVE` or `Verdict: REQUEST_CHANGES`
Document all empirical results in:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2\report.md` and `handoff.md`.


## 2026-10-06T09:30:54Z
You are Challenger 2 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Adversarially challenge edge cases, routing boundaries (/vocabulary, /particles), reduced-motion preferences, viewport constraints, and data integrity.
State your verdict (APPROVE or REQUEST_CHANGES) in handoff.md. Send a message when complete.
