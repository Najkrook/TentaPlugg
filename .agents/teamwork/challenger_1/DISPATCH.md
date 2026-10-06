# DISPATCH: Challenger 1 (Empirical Correctness & Stress Verification)

## Objective
Empirically challenge and stress-test the Ultra Kawaii upgrade. Write and execute stress tests, property checks, and oracles to challenge the implementation.

## Inputs & Paths
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_1`

## Challenger Tasks
1. **Dialogue Stress Testing**:
   - Rapid clicking (1,000+ pokes) on `pokeStudyMascot` and `pokeSidebarMascot`. Verify modulo indexing never throws NaN or out-of-bounds, always returns valid quote objects with non-empty `jp`, `kaomoji`, `sv`, and valid audio keys.
2. **Particle Physics & Memory Leak Oracle**:
   - Rapid particle generation stress: simulate 500 clicks in quick succession.
   - Assert that active particle count in DOM strictly never exceeds the capacity cap (`<= 40`).
   - Assert that `purgeParticles()` cleans up 100% of particles immediately upon theme change.
3. **Hard-Hiding Stress**:
   - Rapid theme toggling (Sakura <-> Classic 100 times). Verify no orphaned DOM elements, no leaked anime classes in Classic mode.
4. **Execution**:
   - Execute test scripts using node/npm, capture command outputs.

## Output & Verdict
Provide a clear verdict at the top of your `handoff.md`:
`Verdict: APPROVE` or `Verdict: REQUEST_CHANGES`
Document all empirical results in:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_1\report.md` and `handoff.md`.

## 2026-10-06T09:30:54Z
You are Challenger 1 on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Empirically stress-test dialogue cycling (1,000+ rapid pokes), particle capacity ceiling (<= 40), memory leaks, and rapid theme toggling.
State your verdict (APPROVE or REQUEST_CHANGES) in handoff.md. Send a message when complete.
