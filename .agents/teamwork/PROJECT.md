# Project: TentaPlugg Pedagogiska & Visuella Förbättringar

## Architecture
- **Framework & Libraries**: Vanilla JS / Lit-html templates, Vite bundler, CSS variables in `src/style.css`, Node.js native test runner (`node:test`).
- **Core Engine (`src/engine.js`)**: Spaced Repetition (SRS/Leitner) calculation (`nextStat`), question filtering and scheduling, answer grading, and contrastive feedback (`getContrastiveFeedback`).
- **State & Storage (`src/main.js`, `src/storage.js`)**: Reactive state object (`state`), localStorage persistence (`tentaplugg-state-v2`, `tentaplugg-theme`), cross-device sync.
- **Views**:
  - `src/views/home.js`: Study room dashboard, session length selector, due stats, anime study figure.
  - `src/views/session.js`: Active practice & exam sessions, distractor callouts, Snabbguide modal integration, self-rated difficulty buttons (Igen, Svårt, Bra, Lätt), cheer/encourage anime figures.
  - `src/views/guide.js`: Grammar and particle reference guide, rendered both as main view and embedded in non-destructive modal dialog.
- **Assets (`public/anime/`)**: `study.jpg`, `cheer.jpg`, `encourage.jpg`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Contrastive distractor feedback | Show explanation of why distractor is incorrect (e.g. に vs で) on particle errors | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Non-destructive Snabbguide modal | Access relevant grammar rules directly during active session without losing state | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Session size selector | Choose 5, 10, 20 or all due questions from home view | M2 | ORIGINAL_REQUEST §R2 |
| 4 | Self-rated difficulty SRS | Rating buttons (Igen, Svårt, Bra, Lätt) updating Leitner intervals proportionally | M2 | ORIGINAL_REQUEST §R2 |
| 5 | SRS backwards compatibility | Preserve existing history/sync, schema version 2 compatibility | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Sakura Anime Vibes theme | Pastel pink, lavender, sakura accents with semantic CSS variables | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Theme switcher & persistence | 🌸 Sakura Anime vs 🎓 Klassisk toggle saved to localStorage | M3 | ORIGINAL_REQUEST §R3 |
| 8 | Strategic anime figures | Display `study.jpg`, `cheer.jpg`, `encourage.jpg` in Anime mode, hidden in Classic mode | M3 | ORIGINAL_REQUEST §R3 |
| 9 | WCAG AA contrast & accessibility | Strict contrast ratio (>4.5:1 text, focus indicators) in both themes | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Comprehensive E2E Requirements Tests | 4-tier opaque-box test suite for R1, R2, R3 passing alongside existing 24 tests | M_TEST / M4 | ORIGINAL_REQUEST Acceptance Criteria |
| 11 | Clean Vite Build | Production build passes without error and bundles all anime assets | M4 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Pedagogik & Snabbguide | Contrastive feedback in session, guideId linking, non-destructive modal guide | none | DONE |
| M2 | Spaced Repetition & Session Size | Session size selector (5, 10, 20, all due), 4 self-rating buttons, Leitner intervals | M1 | DONE |
| M3 | Sakura Anime Vibes & Figurer | Theme styling, theme toggle, localStorage persistence, anime figures in Anime mode | M2 | DONE |
| M_TEST | E2E Requirements Testing Track | 4-tier requirement test suite (Tiers 1-4) published via TEST_READY.md | none | DONE |
| M4 | Final Milestone & Verification | 100% test pass (existing + new), adversarial hardening (Tier 5), clean Vite build | M1, M2, M3, M_TEST | IN_PROGRESS |

## Code Layout
- `src/engine.js`: Pure logic for SRS intervals, grading, and distractor contrastive feedback. Owned by M1 & M2.
- `src/views/session.js`: Session view. Owned by M1 (feedback/modal), M2 (rating buttons), M3 (anime figures).
- `src/views/guide.js`: Snabbguide view & modal dialog rendering. Owned by M1.
- `src/views/home.js`: Home view / study room. Owned by M2 (session selector) & M3 (anime figure).
- `src/style.css`: All styling, semantic color tokens, Sakura theme definitions. Owned by M1 (modal) & M3 (theming).
- `src/main.js`: App lifecycle, state coordination, theme initialization, modal triggers. Owned by M1, M2, M3.
- `tests/engine.test.js`: Engine unit tests. Owned by M1 & M2.
- `test/requirements.test.js`: E2E requirement-driven test suite. Owned by M_TEST.

## Interface Contracts
### Session ↔ Snabbguide Modal
- Event/callback `openGuideModal(guideId)` opens `<dialog class="guide-modal">` populated with Snabbguide content scrolled/focused to `guideId`.
- Active `session` object in `state` remains intact; closing dialog returns student to exact question state.

### SRS Rating Contract
- Ratings: `'again' | 'hard' | 'good' | 'easy'`.
- Interval progression:
  - `again`: Box 0, next review ~10 minutes
  - `hard`: current box, next review <= 1 day
  - `good`: box + 1, standard exponential intervals (1d, 3d, 7d, 14d, 30d)
  - `easy`: box + 2 (capped at box 4), accelerated interval

### Theme Contract
- Root attribute: `document.documentElement.dataset.theme = 'sakura' | 'classic'`.
- LocalStorage key: `'tentaplugg-theme'`.
- Anime figures selector: `.anime-figure` only rendered and visible in Sakura mode; completely hidden in Classic mode.
