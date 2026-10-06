# Implementation Report: Milestone 1 (Mascot & Interactive Dialogue System)

**Worker**: Worker M1  
**Milestone**: Milestone 1 (R1: Sidebar Peeking Mascot & R3: Interactive Mascot Dialogue / Poke-and-Talk)  
**Date**: 2026-10-06  
**Status**: Completed  

---

## 1. Executive Summary

Milestone 1 implements the complete Mascot and Interactive Dialogue System for TentaPlugg's Sakura Anime Vibes mode:
1. **Audio Sound Mapping (`src/audio.js`)**: Fixed `ara_ara` sound mapping to point to `/anime/sounds/ara_ara.mp3` (previously mapped to `wow.mp3`) and exported `SOUND_FILES`.
2. **Mascot Dialogue Catalogue (`src/mascot-dialogue.js`)**: Created a dedicated dialogue engine containing 8 rich, cheerful Japanese study lines with kaomojis, Swedish translations, and associated sound cues (`arigato`, `tuturu`, `wow`, `ara_ara`). Starting quote (`先輩、今日もいっしょにがんばろう！✨` / `arigato`) strictly preserves backwards compatibility with existing tests.
3. **Interactive Study Room Mascot (`src/views/home.js`)**: Wired the study room focus panel mascot and speech bubble with interactive "poke-and-talk" capability, cycling through the catalogue, updating text, and playing cheerful audio cues on interaction.
4. **Sidebar Peeking Mascot (`src/main.js` and `src/style.css`)**: Rendered the peeking chibi mascot card (`/anime/mascot_peek.jpg`) between `<nav>` and `.side-bottom` with classes `.anime-figure.sidebar-chibi-card`, `.sidebar-chibi-img-wrap`, and `.sidebar-chibi-bubble`. Conditioned strictly on `state.theme === 'sakura'`. Wired interactive poke handler to rotate quotes and trigger sound feedback. Added `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` in `src/style.css`.
5. **Dual-Layer Hard-Hiding Compliance**: Enforced zero mascot markup or audio leakage in Classic mode. Retained lines 2495–2508 in `src/style.css` untouched.
6. **Verification**: 133/133 unit and stress tests pass (`npm test`), production build succeeds (`npm run build` exit code 0), and Playwright E2E tests pass cleanly.

---

## 2. File-by-File Detailed Changes

### 2.1 `src/audio.js`
- Exported `SOUND_FILES` constant mapping audio cue names to physical paths:
  ```javascript
  export const SOUND_FILES = {
    tuturu: '/anime/sounds/tuturu.mp3',
    nani: '/anime/sounds/nani.mp3',
    ara_ara: '/anime/sounds/ara_ara.mp3', // Updated from /anime/sounds/wow.mp3
    wow: '/anime/sounds/wow.mp3',
    arigato: '/anime/sounds/arigato.mp3',
  };
  ```
- Refactored `getAudio(type)` to look up from `SOUND_FILES`.

### 2.2 `src/mascot-dialogue.js` (New Module)
- Defined `MASCOT_QUOTES` catalogue with 8 quotes:
  1. `先輩、今日もいっしょにがんばろう！✨` / `( ๑>ᴗ<๑ )` / `Kämpa på, senpai! 💕` (`arigato`)
  2. `すごい！その調子だよ〜！💮` / `٩(ˊᗜˋ*)و` / `Fantastiskt! Fortsätt så! ✨` (`wow`)
  3. `一歩ずつ進めば大丈夫！🌸` / `(ง •̀_•́)ง` / `Ett steg i taget så klarar du det! 💕` (`tuturu`)
  4. `日本語マスターへの道！🐱` / `(*^▽^*)` / `Vägen till att bli japanska-mästare! 🌸` (`tuturu`)
  5. `ちょっと休憩してもいいんだよ？🍵` / `(⁎˃ᴗ˂⁎)` / `Det är okej att ta en liten tepaus! 💕` (`ara_ara`)
  6. `いつも応援してるよ、先輩！💖` / `(｡♥‿♥｡)` / `Jag hejar alltid på dig, senpai! 💮` (`arigato`)
  7. `合格祈願！絶対できるよ！💮` / `٩(◕‿◕｡)۶` / `Bästa tentapeppen! Du fixar det! 🌸` (`wow`)
  8. `えへへ、つんつんしたね？💕` / `(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)` / `Hehe, petade du på mig? ✨` (`ara_ara`)
- Exported helper methods:
  - `getStudyMascotQuote()` / `getSidebarMascotQuote()`
  - `cycleStudyMascotQuote()` / `cycleSidebarMascotQuote()`
  - `pokeStudyMascot(theme, playSoundFn)` / `pokeSidebarMascot(theme, playSoundFn)` / `pokeMascot(type, theme, playSoundFn)`
  - `resetMascotDialogue()`

### 2.3 `src/views/home.js`
- Imported `getStudyMascotQuote` and `pokeStudyMascot`.
- Bound `.kawaii-speech-bubble.focus-bubble` and `.anime-study-avatar-btn` to dynamic `studyQuote` and click handler `onPokeStudy`.
- Displayed Japanese text, kaomoji (`<span class="kaomoji" aria-hidden="true">`), and Swedish translation.
- Maintained exact Lit-HTML conditional omission when `ctx.theme !== 'sakura'`.

### 2.4 `src/main.js`
- Imported `getStudyMascotQuote`, `getSidebarMascotQuote`, `pokeStudyMascot`, and `pokeSidebarMascot`.
- Added dialogue getters and poke handlers to `getCtx()`.
- Inserted `.anime-figure.sidebar-chibi-card` inside `<aside class="sidebar">` between `<nav>` and `<div class="side-bottom">` using `/anime/mascot_peek.jpg`.
- Made `.sidebar-chibi-card` fully accessible with `role="button"`, `tabindex="0"`, `@click`, and `@keydown` (Enter/Space).
- Conditioned strictly on `state.theme === 'sakura'`, leaving Classic mode completely untouched.

### 2.5 `src/style.css`
- Added `overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;` to `.sidebar` rule (lines 199–216).
- Enhanced `[data-theme='sakura'] .sidebar-chibi-card` with `cursor: pointer;`, `user-select: none;`, focus-visible outline (`outline: 3px solid #ffcfe0`), and active press feedback (`transform: translateY(1px) scale(0.98)`).
- Strictly preserved lines 2495–2508 without modification.

### 2.6 `tests/audio.test.js`
- Added unit test verifying `SOUND_FILES` dictionary integrity, confirming `SOUND_FILES.ara_ara === '/anime/sounds/ara_ara.mp3'`.

### 2.7 `tests/mascot_dialogue.test.js` (New Test Suite)
- 7 comprehensive unit test suites covering:
  - Audio Sound Mapping for `ara_ara.mp3` and file presence (>10KB).
  - Catalogue schema validation for all 8 entries across all 4 sound types.
  - Starting quote compatibility.
  - Sequential rotation and wrap-around behavior for both mascots.
  - Poke-and-talk interaction and theme gating.
  - Sidebar chibi mascot asset, classes, and scrollbar properties.
  - Dual-layer hard-hiding verification in Lit-HTML source code.

### 2.8 `tests/e2e/mascot_dialogue.spec.js` (New E2E Test Suite)
- Playwright E2E test verifying:
  - Classic mode has zero sidebar mascots and zero study panel mascots (`toHaveCount(0)`).
  - Toggling to Sakura mode renders sidebar mascot with `/anime/mascot_peek.jpg` and speech bubble.
  - Clicking sidebar mascot advances dialogue to next quotes.
  - Clicking study mascot advances dialogue to next quotes.
  - Toggling back to Classic mode completely removes all mascots from DOM.
  - Zero browser console errors / page errors.

---

## 3. Verification Commands & Results

1. **Unit & Stress Tests**:
   - Command: `npm test`
   - Result: 133 passed, 0 failed, duration ~290ms.
2. **Production Build**:
   - Command: `npm run build`
   - Result: Vite build clean, exit code 0.
3. **Playwright E2E Tests**:
   - Command: `npx playwright test tests/e2e/mascot_dialogue.spec.js`
   - Result: 2 passed (Desktop Chrome & WebKit mobile).
   - Command: `npx playwright test tests/e2e/anime_sound.spec.js`
   - Result: 6 passed, 0 errors.
   - Command: `npx playwright test tests/e2e/theme_stress.spec.js`
   - Result: 14 passed, 0 errors.
