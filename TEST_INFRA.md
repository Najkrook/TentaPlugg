# Test Infrastructure: Ultra Kawaii Upgrade

## 1. Overview & Objectives

This document establishes the test infrastructure, testing methodology, and feature coverage matrix for the **Ultra Kawaii Upgrade** in TentaPlugg (GEMA70 / JAPC11 Japanese study app).

The test suite validates requirements **R1 to R5** across four rigorous quality tiers, ensuring that interactive anime features, sparkle click bursts, poke-and-talk dialogue quotes, bouncy jelly micro-interactions, and kawaii views execute smoothly in Sakura mode while strictly adhering to the **Classic Mode Hard-Hiding Invariant** (zero visual or audio leaks in Classic mode).

---

## 2. Testing Methodology

The test suite employs a multi-layered verification strategy combining formal software engineering test design methods:

### 2.1 Category-Partition Method

Functional inputs, system configurations, and environmental states are partitioned into discrete equivalence classes:

- **Theme State**: `classic` (clean flat academic mode) vs `sakura` (anime pastels, mascots, particles).
- **Audio State**: `muted: true` vs `muted: false`, volume clamped `[0.0, 1.0]`, and sound cue types (`arigato`, `tuturu`, `wow`, `ara_ara`, `nani`).
- **Motion Preference**: `prefers-reduced-motion: reduce` vs standard animation.
- **Interaction Target**: Study room focus mascot (`/anime/study.jpg`) vs Sidebar peeking mascot (`/anime/mascot_peek.jpg`).
- **Route Views**: `/`, `/exams`, `/multiplayer`, `/progress`, `/guide`, `/vocabulary`, `/particles`.

### 2.2 Boundary Value Analysis (BVA)

Tests probe extreme limits, off-by-one conditions, and boundary clamping:

- **Quote Rotation Index**: Beginning of catalogue (index 0), end of catalogue (index $N-1$), wrap-around boundary ($N \to 0$), and negative/out-of-bounds indices.
- **Particle Coordinates**: Viewport origin `(0, 0)`, viewport edges, rapid high-frequency click bursts, and synthetic events (`detail === 0`).
- **Particle Cleanup Lifecycles**: Standard `animationend` dispatch, 1,000ms safety timeout fallback, and container capacity ceiling (maximum active particle limit).
- **Hard-Hiding Bounds**: Omission in Lit-HTML templates (`expect 0 DOM nodes`), and CSS `display: none !important` rule stringency.

### 2.3 Pairwise & Combinatorial Testing

Interaction combinations are tested across orthogonal dimensions:

- `Theme` $\times$ `Audio State` $\times$ `Poke Interaction`: Clicking mascots in Sakura mode plays sound if unmuted; returns `false` if muted; never plays or instantiates in Classic mode.
- `Theme` $\times$ `Particle Spawning`: Clicking spawns floating particles only when `theme === 'sakura'` AND `reducedMotion === false`. Switching theme immediately purges active particles.
- `Theme` $\times$ `Kaomoji Micro-copy` $\times$ `Accessibility`: Sakura mode renders playful kaomojis; Classic mode renders clean text; accessible names are preserved using `aria-hidden="true"`.

### 2.4 Real-World Application Scenarios

End-to-end simulated user journeys exercising realistic multi-step workflows:

- A student logs in with Sakura theme active, interacts with the study mascot to receive study tips, explores the sidebar peeking mascot, studies vocabulary cards and particle guides, triggers click sparkle bursts, and toggles theme back to Classic without state corruption or DOM remnants.

---

## 3. Feature Coverage Matrix (R1 to R5)

| Req ID  | Feature / Component                 | Description                                                                                                                       | Test Tiers                     | Verification Method                                                      |
| ------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| **R1**  | Sidebar Peeking Mascot              | Peeking chibi card (`.sidebar-chibi-card.anime-figure`) with `/anime/mascot_peek.jpg`, speech bubble, and hard-hiding             | Tier 1, Tier 2, Tier 4         | Lit-HTML template inspection, CSS selector check, asset verification     |
| **R2**  | Sparkle & Heart Click Bursts        | Transient floating particles (`✨`, `💖`, `🌸`), auto-removal on `animationend`, 1000ms safety fallback, `prefers-reduced-motion` | Tier 1, Tier 2, Tier 3         | Click engine logic test, DOM cleanup simulation, media query gating      |
| **R3**  | Interactive Mascot Dialogue         | "Poke-and-talk" quote rotation ($\ge 6$ entries with `{ jp, kaomoji, sv, sound }`), sound trigger via `playAnimeSound`            | Tier 1, Tier 2, Tier 3, Tier 4 | Quote catalogue cycling, audio dispatch check, rapid poke idempotence    |
| **R4**  | Jelly Bouncy & Kaomoji Micro-copy   | Elastic spring transitions (`cubic-bezier(0.34, 1.56, 0.64, 1)`), kaomoji rating labels, accessible text preservation             | Tier 1, Tier 2, Tier 4         | CSS curve analysis, accessible name calculation, rating label format     |
| **R5**  | Vocabulary & Particle Views Theming | Kawaii hero cards for `/vocabulary` and `/particles`, Genki I dataset integration, hard-hiding in Classic                         | Tier 1, Tier 2, Tier 4         | View template rendering, data schema check, Classic DOM omission         |
| **INV** | Classic Hard-Hiding Defense         | Dual-layer protection: Lit-HTML omission + CSS `:root:not([data-theme='sakura']) .anime-figure { display: none !important; }`     | Tier 1, Tier 2, Tier 3         | Static CSS inspection, template stringification, storage synchronization |

---

## 4. Test Tier Architecture

### Tier 1: Feature Coverage (Happy Path & Core Contracts)

- **T1.1**: Sidebar peeking mascot renders with avatar and speech bubble in Sakura mode.
- **T1.2**: Click particle engine correctly generates particle elements with required classes (`anime-figure`, `kawaii-click-particle` / `kawaii-burst-particle`).
- **T1.3**: Mascot dialogue catalogue contains $\ge 6$ unique entries with Japanese text, kaomoji, Swedish translation, and sound trigger.
- **T1.4**: Consecutive mascot pokes advance quote index sequentially and wrap cleanly around catalogue length.
- **T1.5**: Kaomoji-enhanced rating button labels match expected joyful expressions (`again`, `hard`, `good`, `easy`).
- **T1.6**: Vocabulary and Particle view banner cards render with kawaii omamori badges in Sakura mode.

### Tier 2: Boundary & Corner Cases

- **T2.1**: Classic mode hard-hiding: Zero anime figures or mascot cards rendered in Lit-HTML templates when `theme === 'classic'`.
- **T2.2**: CSS hard-hiding rules in `src/style.css` strictly contain `:root:not([data-theme="sakura"]) .anime-figure` and `display: none !important`.
- **T2.3**: Particle click engine ignores clicks when `prefers-reduced-motion: reduce` is active.
- **T2.4**: Particle cleanup safely executes via `animationend` and guarantees removal via 1,000ms safety timeout fallback.
- **T2.5**: Rapid consecutive dialogue clicks cycle safely without NaN indices, runtime errors, or audio overlap conflicts.
- **T2.6**: Resilient error handling when theme state or stored preferences are missing, empty, or corrupted.

### Tier 3: Cross-Feature Combinations & State Transitions

- **T3.1**: Rapid theme switching (`classic` $\leftrightarrow$ `sakura`) preserves 100% clean Classic mode without residual DOM elements.
- **T3.2**: Audio playback during mascot pokes honors mute state: triggers sound when unmuted, silently skips when muted.
- **T3.3**: Audio playback during mascot pokes strictly gates by theme: never plays or instantiates when `theme === 'classic'`.
- **T3.4**: Volume scaling: Changing volume updates dialogue playback volume proportionally.

### Tier 4: Real-World Application Scenarios & Workflows

- **T4.1 Scenario 1**: Full study session workflow in Sakura mode — student reviews questions, interacts with study and sidebar mascots, observes updated speech bubbles and sound cues.
- **T4.2 Scenario 2**: Navigation workflow — student visits vocabulary and particle drill views, verifies kawaii banner presentation in Sakura and academic appearance in Classic.
- **T4.3 Scenario 3**: Accessibility & Contrast Compliance — WCAG 2.1 AA relative luminance contrast ratios for all Sakura and Classic text tokens, and screen-reader accessibility for kaomoji buttons (`aria-hidden="true"`).

---

## 5. Execution & Verification

### Running the Test Suite

```bash
npm test
```

The project executes all tests via Node's native runner:
`node --test --test-isolation=none tests/*.test.js`

### Verification Invariants

1. All baseline tests (109 tests) continue to pass with 0 failures and 0 regressions.
2. All new Ultra Kawaii test cases pass with exit code 0.
3. Build command `npm run build` succeeds cleanly.
4. Total execution duration remains fast (< 2 seconds) for rapid developer feedback.
