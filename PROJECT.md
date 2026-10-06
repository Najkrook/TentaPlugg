# Project: TentaPlugg Ultra Kawaii Upgrade

## Architecture

- **Framework & State**: Vanilla JS + Lit-HTML templates (`renderTemplate`), reactive state store (`src/main.js`).
- **Theme System**: Persisted via `tentaplugg-theme` in `localStorage`, applied as `dataset.theme = 'sakura' | 'classic'` on `<html>` and mirrored in `state.theme`.
- **Hard-Hiding Invariant**: Dual-layer defense: Lit-HTML conditional omission (`state.theme === 'sakura' ? html`...` : ''`) and CSS hard-hiding rule (`:root:not([data-theme='sakura']) .anime-figure { display: none !important; }` in `src/style.css:2498-2516`).
- **Mascot & Dialogue Engine**: `src/views/home.js` (study panel mascot), `src/main.js` (sidebar peeking mascot), and `src/audio.js` (dialogue sounds).
- **Particle Engine**: Transient particle overlay spawning floating sparkles, hearts, and sakura petals at click coordinates with dual cleanup (`animationend` + timeout), 40 concurrent element ceiling, and reduced-motion suppression.
- **Views**: Dedicated views for `/vocabulary` (`src/views/vocabulary.js`) and `/particles` (`src/views/particles.js`) integrated into router in `src/main.js`.

## Feature Inventory

| #   | Feature                                | Description                                                                         | Milestone  | Source           |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------- | ---------- | ---------------- |
| 1   | R1: Sidebar Peeking Mascot             | Interactive peeking chibi card in sidebar with avatar, speech bubble, hard-hiding   | M1         | ORIGINAL_REQUEST |
| 2   | R2: Sparkle & Heart Click Bursts       | Transient floating particles on click/tap, auto DOM cleanup, reduced-motion         | M2         | ORIGINAL_REQUEST |
| 3   | R3: Interactive Mascot Dialogue        | "Poke-and-talk" dialogue cycling with Japanese lines, kaomojis, Swedish text, audio | M1         | ORIGINAL_REQUEST |
| 4   | R4: Jelly Bouncy & Kaomoji Micro-copy  | Bouncy spring interactions, kaomoji-enhanced ratings and actions                    | M2         | ORIGINAL_REQUEST |
| 5   | R5: Theming for Vocab & Particle Views | Top-level routes, kawaii cards, omamori badges, tip callouts                        | M3         | ORIGINAL_REQUEST |
| 6   | Verification: Classic Hard-Hiding      | Zero anime figures, mascot cards, sound controls in Classic DOM/viewport            | M1, M2, M3 | ORIGINAL_REQUEST |
| 7   | Verification: Test Suite & Build       | 109+ tests pass, Vite build exit 0, format:check pass                               | M4         | ORIGINAL_REQUEST |

## Milestones

| #   | Name                                | Scope                                                             | Dependencies | Status |
| --- | ----------------------------------- | ----------------------------------------------------------------- | ------------ | ------ |
| 1   | M1: Mascot & Dialogue System        | R1, R3, audio sound mapping, sidebar card                         | none         | DONE   |
| 2   | M2: Particles & Jelly Interactions  | R2, R4, click burst engine, jelly CSS, kaomoji                    | M1           | DONE   |
| 3   | M3: Vocabulary & Particle Views     | R5, routes /vocabulary & /particles, banner cards                 | M1           | DONE   |
| 4   | M4: E2E Testing, Formatting & Audit | 179 tests pass, Prettier clean, build clean, Forensic Audit CLEAN | M1, M2, M3   | DONE   |

## Interface Contracts

### Mascot Dialogue Contract (`src/views/home.js`, `src/main.js`, `src/audio.js`)

- Dialogue state: `MASCOT_QUOTES = [...]` containing 8 unique entries with `{ jp, kaomoji, sv, sound }`.
- Exported from `src/mascot-dialogue.js`. Sequential index rotation with modulo 8 wrap-around.
- Audio trigger: `playAnimeSound(sound, theme)` where `theme === 'sakura'`.
- Sound mapping in `src/audio.js`: Maps `ara_ara` to `/anime/sounds/ara_ara.mp3`.

### Click Particle Engine Contract (`src/particles-fx.js`)

- Export `initClickParticles(getTheme)` and `spawnParticleBurst(x, y, options)`.
- Particle elements carry classes `.anime-figure.kawaii-click-particle`.
- Cleanup: element removes itself on `animationend`, with a 1,000ms safety `setTimeout` fallback.
- Sanitized count: clamped to `[0, 100]` with `Number.isFinite`, concurrent cap of 40 active elements.
- Gating: strictly does NOT fire when `getTheme() !== 'sakura'` or `prefers-reduced-motion` is active.

### Views Theming Contract (`src/views/vocabulary.js`, `src/views/particles.js`, `src/main.js`)

- `vocabularyView(ctx)` renders vocabulary list with `.anime-figure.vocab-anime-banner-card` in Sakura mode.
- `particlesView(ctx)` renders particles list/guide with `.anime-figure.particle-anime-banner-card` in Sakura mode.
- `main.js`: Recognizes `/vocabulary` and `/particles` in URL path, synchronization on `navigate(id)`.

## Code Layout

- `src/main.js`: App shell, sidebar, route dispatch, theme state, particle fx init.
- `src/audio.js`: Sound effects and audio cache.
- `src/style.css`: Stylesheet, hard-hiding rules, jelly animations, chibi & banner cards.
- `src/views/home.js`: Study room view and interactive mascot.
- `src/views/vocabulary.js`: Vocabulary view with kawaii hero card.
- `src/views/particles.js`: Particle view with kawaii hero card.
- `tests/`: Automated unit, integration, and stress tests (179 tests).
