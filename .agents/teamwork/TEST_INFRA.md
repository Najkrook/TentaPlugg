# E2E Test Infra: TentaPlugg

## Test Philosophy
- Opaque-box, requirement-driven. Derived from ORIGINAL_REQUEST.md.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Contrastive distractor feedback (particle questions) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Quick Guide modal integration during session | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Session length selector (5, 10, 20, all due) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Self-rated difficulty (again, hard, good, easy) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | SRS history & sync backwards compatibility | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Theme switcher & localStorage persistence | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 7 | Anime figures in Sakura mode & hidden in Classic mode | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 8 | WCAG AA contrast compliance | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: `node --test test/requirements.test.js` integrated into `npm test`.
- Pass/fail semantics: Process exit code 0; all assertions pass.
- Real-World Application Scenarios (Tier 4):
  1. Student starts a 5-question practice session, chooses wrong distractor に instead of で, reads contrastive explanation, opens Quick Guide to verify rule, closes modal without lost state, rates question as 'hard', and finishes session.
  2. Student toggles theme to 🌸 Sakura Anime, refreshes page, verifies theme persists and anime figures are present, then toggles back to 🎓 Klassisk and verifies anime figures are hidden.
  3. Student reviews overdue cards with diverse ratings ('again', 'hard', 'good', 'easy') verifying correct interval scheduling across Leitner boxes 0 to 4.
