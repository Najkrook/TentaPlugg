# DISPATCH: Forensic Auditor (Integrity Forensics & Anti-Cheating Verification)

## Objective
Perform independent forensic integrity verification on all work products implemented for the Ultra Kawaii upgrade (Requirements R1–R5). Detect any dummy facades, hardcoded test strings, bypassed requirements, fake metrics, or circumventions.

## Inputs & Paths
- Authoritative Requirements: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md` (mandatory read)
- Architecture & Feature Inventory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md`
- Working Directory: `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\auditor_1`

## Forensic Integrity Checks
1. **Source Authenticity & Logic Verification**:
   - Verify that `src/particles-fx.js`, `src/mascot-dialogue.js`, `src/views/vocabulary.js`, `src/views/particles.js`, `src/main.js`, and `src/audio.js` contain genuine, fully realized algorithms and logic.
   - Confirm there are NO dummy facades, mock stubs in production files, or hardcoded return values designed solely to fool tests.
2. **Hard-Hiding Integrity & Classic Mode Non-Leakage**:
   - Check `src/style.css:2495-2511`. Confirm lines were not bypassed, disabled, or conditionally weakened.
   - Confirm all new anime elements (`.sidebar-chibi-card`, `.kawaii-click-particle`, `.vocab-anime-banner-card`, `.particle-anime-banner-card`) carry class `.anime-figure` and are conditionally omitted from Lit-HTML templates when theme is Classic.
3. **Data Authenticity**:
   - Verify vocabulary and kanji data in `src/views/vocabulary.js` genuinely derives from `src/vocabulary-data.js` (Genki I data), not fake placeholder data.
   - Verify particle cards in `src/views/particles.js` contain genuine Japanese pedagogical explanations and examples.
4. **Dialogue & Audio Authenticity**:
   - Verify `src/mascot-dialogue.js` quotes are authentic Japanese text with appropriate kaomojis and Swedish translations.
   - Verify `ara_ara` sound mapping in `src/audio.js` authentically links to `/anime/sounds/ara_ara.mp3` and the audio file physically exists on disk.
5. **Execution Verification**:
   - Run `npm test`, `npm run build`, and `npm run format:check` to independently verify toolchain exit codes.

## Output & Verdict
Provide a binary verdict at the very top of your `handoff.md`:
`Verdict: CLEAN` or `Verdict: INTEGRITY VIOLATION`
Document full evidence in:
`c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\auditor_1\report.md` and `handoff.md`.


## 2026-10-06T09:30:54Z
You are Forensic Auditor on the Ultra Kawaii upgrade project.
Your working directory is: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\auditor_1
Your task assignment is in: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\auditor_1\DISPATCH.md
You MUST read: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\ORIGINAL_REQUEST.md and c:\Users\Najk\Documents\ChatGPT\TentaPlugg\PROJECT.md
Perform forensic integrity verification: check for dummy implementations, facades, hardcoded test tricks, bypassed hard-hiding rules, or fake metrics.
State your binary verdict (CLEAN or INTEGRITY VIOLATION) at top of handoff.md. Send a message when complete.
