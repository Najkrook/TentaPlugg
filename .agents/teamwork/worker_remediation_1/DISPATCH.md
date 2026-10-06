# DISPATCH: Worker Remediation (Challenger Feedback Remediation)

## Objective
Remediate the specific robustness and accessibility issues identified by Challenger 2:
1. Defensive parameter hardening in `src/particles-fx.js` (prevent infinite loop when `options.count = Infinity` or `options = null`).
2. Add function-level `prefers-reduced-motion` check to `spawnParticleBurst`.
3. Add animation suppression for ambient `.sakura-petal` and `.sakura-petals-container` in `src/style.css` under `@media (prefers-reduced-motion: reduce)`.
4. Run `npx prettier --write .` and verify `npm run format:check`, `npm test`, and `npm run build` pass cleanly.

## Inputs & Paths
- Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Challenger 2 Report: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2\handoff.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_remediation_1`

## Specific Implementation Steps
1. **`src/particles-fx.js`**:
   - In `spawnParticleBurst(x, y, options = {})`:
     - Safely handle null/undefined: `const opts = options || {};`
     - Add direct reduced-motion check:
       ```javascript
       if (
         typeof window !== 'undefined' &&
         typeof window.matchMedia === 'function' &&
         window.matchMedia('(prefers-reduced-motion: reduce)').matches
       ) {
         return [];
       }
       ```
     - Sanitize `opts.count`:
       ```javascript
       const rawCount = opts.count;
       const count = Number.isFinite(rawCount)
         ? Math.min(20, Math.max(1, Math.floor(rawCount)))
         : Math.floor(Math.random() * 3) + 5;
       ```
2. **`src/style.css`**:
   - In `@media (prefers-reduced-motion: reduce)`:
     Add:
     ```css
     .sakura-petal,
     .sakura-petals-container {
       animation: none !important;
       display: none !important;
     }
     ```
   - Ensure lines 2498–2511 (`:root:not([data-theme='sakura']) .anime-figure { display: none !important; }`) remain 100% intact!
3. **Prettier Formatting & Execution**:
   - Run `npx prettier --write .`
   - Run `npm run format:check` to confirm 0 code style warnings.
   - Run `npm test` to confirm all 177+ unit and stress tests pass with 0 failures.
   - Run `npm run build` to confirm Vite build exits code 0.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write your report to:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_remediation_1\report.md`
and write your `handoff.md`.


## 2026-10-06T09:49:31Z
Sender: 11adfdec-5f2b-4034-94ef-516c769b159f
You are Worker Remediation on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_remediation_1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\worker_remediation_1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_2\handoff.md
Remediate the parameter sanitization in src/particles-fx.js, reduced-motion check in spawnParticleBurst, reduced-motion style in src/style.css, and format with prettier. Run tests and build.
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Report back when complete.
