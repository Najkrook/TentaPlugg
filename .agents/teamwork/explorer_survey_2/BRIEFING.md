# BRIEFING — 2026-10-04T18:53:00Z

## Mission
Investigate R2 (Flexibel Spaced Repetition & anpassad sessionsstorlek med självskattad svårighet) in TentaPlugg codebase: Leitner/SRS scheduling, study room UI session lengths, question grading, self-rated difficulty, backward compatibility, data models, and edge cases.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigator, synthesizer
- Working directory: c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_survey_2
- Original parent: caec6291-b7f4-4115-a415-2741cb85c00d
- Milestone: Survey Phase (R2 Investigation)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only on project source code
- Write outputs only in own working folder (`.agents/teamwork/explorer_survey_2/`)

## Current Parent
- Conversation ID: caec6291-b7f4-4115-a415-2741cb85c00d
- Updated: 2026-10-04T16:45:00Z

## Investigation State
- **Explored paths**: `src/config.js`, `src/engine.js`, `src/session.js`, `src/storage.js`, `src/sync.js`, `src/cloud.js`, `src/main.js`, `src/views/home.js`, `src/views/session.js`, `src/views/progress.js`, `src/style.css`, `tests/learning.test.js`, `tests/engine.test.js`, `tests/e2e/app.spec.js`, `firestore.rules`.
- **Key findings**:
  1. `nextStat` in `engine.js` already supports `again`, `hard`, `good`, `easy` proportional intervals.
  2. `preferredCount: 10` is already in state `fresh()`.
  3. `selectPractice` and `start` currently hardcode `10`; modifying `start` to read `options.count ?? state.preferredCount ?? 10` and adding `dueOnly` enables 5, 10, 20, and all due questions.
  4. Session length selector (5, 10, 20, Alla förfallna) fits cleanly in `home.js`.
  5. In `session.js` feedback view, 4 difficulty buttons (Igen, Svårt, Bra, Lätt) with interval previews can be offered during practice. Exam mode must keep "Jag kunde detta" / "Behöver öva mer" for Playwright test compatibility.
  6. Keeping `SCHEMA_VERSION = 2` guarantees 100% backward compatibility for all saved stats, drafts, and reviews.
- **Unexplored areas**: None for R2 survey scope.

## Key Decisions Made
- Confirmed `SCHEMA_VERSION = 2` must not be changed to avoid wiping reviews.
- Confirmed exam mode self-assessment buttons must remain intact for E2E tests.
- Produced detailed `analysis.md` and `handoff.md`.

## Artifact Index
- DISPATCH.md — Dispatch log
- BRIEFING.md — Situational awareness and working memory
- progress.md — Liveness heartbeat and milestone tracking
- analysis.md — Full comprehensive analysis of R2
- handoff.md — 5-component handoff report
