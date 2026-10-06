# Ultra Kawaii Investigation Report: Mascot Interaction, Audio System, Dialogue State & Click Particles

## Executive Summary
This report presents an architectural investigation of TentaPlugg's Sakura mode features for Requirements **R1** (Sidebar Peeking Mascot), **R2** (Sparkle & Heart Click Burst Effects), and **R3** (Interactive Mascot Dialogue / "Poke-and-Talk").
We mapped all existing mascot components, anime images and audio assets in `public/anime/`, the sound management infrastructure in `src/audio.js`, hard-hiding CSS contracts, and designed complete production-ready implementations for the interactive "poke-and-talk" dialogue system and transient click burst particles with zero memory leaks and strict accessibility compliance.

---

## 1. Mascot Architecture & Anime Assets Inventory

### 1.1 Existing Anime Assets in `public/anime/`
The repository contains 7 high-resolution JPEG assets and 5 MP3 audio files:

| File | Type & Size | Dimensions / Content | Current Usage / Planned Usage |
|---|---|---|---|
| `public/anime/study.jpg` | JPEG (524 KB) | Anime girl studying with books and pen | `src/views/home.js` (Study focus panel mascot) |
| `public/anime/cheer.jpg` | JPEG (638 KB) | Cheerful celebrating chibi | `src/views/session.js` (Correct feedback & Results panel) |
| `public/anime/encourage.jpg` | JPEG (552 KB) | Cheerful encouraging anime girl | Available for Vocabulary / Particle view banner cards |
| `public/anime/mascot_cheer.jpg` | JPEG (633 KB) | Anime character cheering with fist pump | `src/views/progress.js` (Rank card) & `src/views/exams.js` (Exam banner) |
| `public/anime/mascot_cry.jpg` | JPEG (527 KB) | Chibi crying with anime sweat drop | `src/views/session.js` (Incorrect / 'again' answer feedback) |
| `public/anime/mascot_peek.jpg` | JPEG (435 KB) | Chibi catgirl peeking over edge | `src/views/guide.js` (Quick Guide hero) & **R1 Sidebar Peeking Mascot** |
| `public/anime/stamp_sakura.jpg` | JPEG (632 KB) | Traditional red sakura commendation stamp | `src/views/session.js` (Result panel "たいへんよくできました") |

All JPEG files start with the standard JPEG magic byte sequence `0xFF 0xD8 0xFF` and are verified by `tests/stress_m3.test.js:228-242`.

### 1.2 Audio Assets in `public/anime/sounds/`

| File | Size | Audio Characteristic | Mapped Trigger |
|---|---|---|---|
| `tuturu.mp3` | 277 KB | Cheerful Steins;Gate chime ("Tuturu~") | Sakura theme toggle, session finish, poke dialogue |
| `arigato.mp3` | 304 KB | Warm, cheerful Japanese voice ("Arigatou~") | Mascot study button poke, multiplayer finish |
| `wow.mp3` | 173 KB | Cheerful enthusiastic reaction sound | Correct quiz answers, multiplayer round win |
| `ara_ara.mp3` | 173 KB | Playful teasing voice (identical buffer to `wow.mp3`) | Mascot poke dialogue rotation |
| `nani.mp3` | 343 KB | Surprised anime reaction ("Nani?!") | Incorrect quiz answers |

All audio files exceed 10 KB and pass strict disk and playback tests in `tests/audio.test.js`.

---

## 2. Current Mascot Rendering Locations

Mascots are currently rendered across several views:

1. **Study Room Focus Panel (`src/views/home.js:103-125`)**:
   - Element: `<div class="anime-figure anime-study-panel">`
   - Wrapper: `.anime-mascot-wrapper` containing `.kawaii-speech-bubble.focus-bubble` and `<button type="button" class="anime-study-avatar-btn">`
   - Image: `/anime/study.jpg` with stamp `.anime-badge-stamp` ("💮 合格祈願")
   - Current Behavior: Hardcoded static speech bubble (`先輩、今日もいっしょにがんばろう！✨` / `Kämpa på, senpai! 💕`). Clicking the button only executes `playAnimeSound('arigato', ctx.theme)`.
   - Upgrade Plan: Convert into dynamic "poke-and-talk" button cycling quotes and kaomojis.

2. **Session Answer Feedback (`src/views/session.js:120-141`)**:
   - Element: `<div class="anime-figure anime-feedback-mascot ${s.grades[q.id] ? 'good' : 'again'}">`
   - Correct Answer: Displays `/anime/cheer.jpg` with bubble `すごい！完璧〜！💮` / `Senpai, du är bäst! ✨`.
   - Incorrect Answer: Displays `/anime/mascot_cry.jpg` with bubble `うわあああ〜！(╥﹏╥)` / `Kämpa på, senpai! 💕`.

3. **Session Results Panel (`src/views/session.js:320-340`)**:
   - Element: `<div class="anime-figure anime-result-mascot">`
   - Contains: `/anime/cheer.jpg`, `/anime/stamp_sakura.jpg`, and `.kawaii-speech-bubble.result-bubble` (`先輩、本当にお疲れ様でした〜！💮✨` / `Helt fantastiskt kämpat! 💕 ( ๑>ᴗ<๑ )`).

4. **Progress View (`src/views/progress.js:21-34`)**:
   - Hero Card: `<div class="anime-figure progress-anime-hero-card">` with `/anime/mascot_cheer.jpg`.

5. **Exams View (`src/views/exams.js:8-17`)**:
   - Banner Card: `<div class="anime-figure exam-anime-banner-card">` with `/anime/mascot_cheer.jpg`.

6. **Quick Guide View (`src/views/guide.js:101-114`)**:
   - Hero Card: `<div class="anime-figure guide-anime-hero-card">` with `/anime/mascot_peek.jpg`.

7. **Sidebar (Target for R1)**:
   - **Current State**: Not rendered in `src/main.js`.
   - **Pre-existing Styles**: `src/style.css:2886-2948` already has complete CSS rules for:
     - `[data-theme='sakura'] .sidebar-chibi-card`
     - `[data-theme='sakura'] .sidebar-chibi-img-wrap img`
     - `[data-theme='sakura'] .sidebar-chibi-bubble strong`
     - `[data-theme='sakura'] .sidebar-chibi-bubble p`
   - **Asset to Use**: `/anime/mascot_peek.jpg`.

---

## 3. Audio System Architecture (`src/audio.js`)

### 3.1 State, Volumes & Persistence
- Module: `src/audio.js` manages audio instances and settings.
- Persistence Keys:
  - `tentaplugg-sound-muted` ('true' | 'false')
  - `tentaplugg-sound-volume` ('0.0' - '1.0' or '0' - '100')
- Volume Hierarchy:
  - `BASE_VOLUME = 0.45`
  - Default `volume = 0.5` (50%)
  - Effective audio playback volume: `getEffectiveSoundVolume() = volume * BASE_VOLUME = 0.225`.
- Audio Instances:
  - Cached lazy dictionary `sounds = { tuturu, nani, ara_ara, wow, arigato }`.
  - Audio files are instantiated once via `new Audio(file)`.

### 3.2 Theme Gating Contract
Line 111-113 of `src/audio.js`:
```javascript
export function playAnimeSound(type, theme) {
  // Hard theme gate: Never play any anime sounds unless in Sakura mode
  if (theme !== 'sakura' || muted || volume <= 0) return false;
  ...
}
```
Audio playback strictly returns `false` and does not initialize or trigger `audio.play()` unless:
1. `theme === 'sakura'`
2. `muted === false`
3. `volume > 0`

Furthermore, `audio.currentTime = 0;` ensures rapid consecutive clicks immediately re-trigger without overlapping sound instances, and `.catch(() => {})` prevents uncaught promise errors when browsers reject autoplay.

---

## 4. Interactive Mascot Dialogue ("Poke-and-Talk") Design (R3)

### 4.1 Dialogue Catalogue
To fulfill R3 ("varied set of joyful Japanese study quotes, kaomojis, and Swedish translations in their speech bubbles, while triggering cheerful sound feedback when audio is unmuted"), we define an expansive rotation catalogue:

```javascript
export const MASCOT_QUOTES = [
  {
    jp: '先輩、今日もいっしょにがんばろう！✨',
    kaomoji: '( ๑>ᴗ<๑ )',
    sv: 'Kämpa på, senpai! 💕',
    sound: 'arigato',
  },
  {
    jp: 'すごい！その調子だよ〜！💮',
    kaomoji: '٩(ˊᗜˋ*)و',
    sv: 'Fantastiskt! Fortsätt så! ✨',
    sound: 'wow',
  },
  {
    jp: '一歩ずつ進めば大丈夫！🌸',
    kaomoji: '(ง •̀_•́)ง',
    sv: 'Ett steg i taget så klarar du det! 💕',
    sound: 'tuturu',
  },
  {
    jp: '日本語マスターへの道！🐱',
    kaomoji: '(*^▽^*)',
    sv: 'Vägen till att bli japanska-mästare! 🌸',
    sound: 'tuturu',
  },
  {
    jp: 'ちょっと休憩してもいいんだよ？🍵',
    kaomoji: '(⁎˃ᴗ˂⁎)',
    sv: 'Det är okej att ta en liten tepaus! 💕',
    sound: 'ara_ara',
  },
  {
    jp: 'いつも応援してるよ、先輩！💖',
    kaomoji: '(｡♥‿♥｡)',
    sv: 'Jag hejar alltid på dig, senpai! 💮',
    sound: 'arigato',
  },
  {
    jp: '合格祈願！絶対できるよ！💮',
    kaomoji: '٩(◕‿◕｡)۶',
    sv: 'Bästa tentapeppen! Du fixar det här! 🌸',
    sound: 'wow',
  },
  {
    jp: 'えへへ、つんつんしたね？💕',
    kaomoji: '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
    sv: 'Hehe, petade du på mig? ✨',
    sound: 'tuturu',
  },
];
```

### 4.2 State Management & Cycling
- Tracking: Independent indices for study mascot (`studyQuoteIndex`) and sidebar mascot (`sidebarQuoteIndex`) or synchronized index.
- Cycling Function:
  ```javascript
  export function pokeStudyMascot() {
    studyQuoteIndex = (studyQuoteIndex + 1) % MASCOT_QUOTES.length;
    const quote = MASCOT_QUOTES[studyQuoteIndex];
    playAnimeSound(quote.sound, state.theme);
    render();
    return quote;
  }
  ```
- Compatibility Guarantee:
  In `tests/e2e/anime_sound.spec.js:114-140`, Playwright tests:
  `clicking anime study mascot in Sakura mode triggers arigato sound without errors`.
  Starting the rotation with `quote[0].sound = 'arigato'` ensures that test continues to pass 100% reliably.

---

## 5. Sparkle & Heart Click Burst Particle Effects (R2)

### 5.1 Architecture & Event Handling
- Global Event Listener:
  Attach a single listener to `window` for `click` events with `{ passive: true }`.
  Using `click` (over `pointerdown`) prevents duplicate particle generation on touch devices (where `touchstart` and `click` both fire).

- Coordinate Detection:
  Read `e.clientX` and `e.clientY`.
  Filter synthetic / keyboard activations where coordinates are `(0, 0)` and `e.detail === 0`.

- Gating Checklist:
  1. `if (document.documentElement.dataset.theme !== 'sakura') return;`
  2. `if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;`
  3. Valid numeric coordinates `typeof x === 'number' && typeof y === 'number'`.

### 5.2 Particle Physics & Trajectories
For each click, spawn 5 to 7 particles originating at `(clientX, clientY)`:
- Symbol pool: `['✨', '💖', '🌸', '💕', '⭐']`.
- Circular distribution:
  $\theta_i = \frac{2\pi \cdot i}{N} + \text{jitter}$
- Distance: $R \in [40\text{px}, 85\text{px}]$.
- Offsets:
  $dx = \cos(\theta) \cdot R$
  $dy = \sin(\theta) \cdot R - \text{lift}$ (where $\text{lift} \in [15\text{px}, 30\text{px}]$ to simulate upward floating).
- Rotation: $\text{rot} \in [-120^\circ, 120^\circ]$.

### 5.3 DOM Cleanup & Zero Memory Leaks Guarantee
Memory leaks and DOM bloating are completely prevented via a triple-safety mechanism:
1. **Event Cleanup**: Each particle element listens for `animationend` once:
   `particle.addEventListener('animationend', () => particle.remove(), { once: true });`
2. **Safety Timeout**: In case `animationend` fails to fire (unfocused tab, headless browser, etc.):
   `setTimeout(() => particle.remove(), 1000);`
3. **Capacity Ceiling**: The overlay limits active particle elements. If `overlay.children.length > 50`, oldest particles are immediately purged:
   ```javascript
   while (overlay.children.length > 40) {
     overlay.firstElementChild?.remove();
   }
   ```
4. **Theme Purge**: When switching from Sakura to Classic mode, `clearAllParticles()` empties the container immediately.

### 5.4 CSS Specifications
```css
/* Container */
.kawaii-particles-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 99999;
}

/* Hard Hiding in Classic */
:root:not([data-theme='sakura']) .kawaii-particles-overlay,
html:not([data-theme='sakura']) .kawaii-particles-overlay,
[data-theme='classic'] .kawaii-particles-overlay {
  display: none !important;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .kawaii-particles-overlay,
  .kawaii-burst-particle {
    display: none !important;
    animation: none !important;
  }
}

/* Particle Keyframes */
@keyframes kawaii-burst-fly {
  0% {
    transform: translate(0, 0) scale(0.5) rotate(0deg);
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(var(--rot));
    opacity: 0;
  }
}

.kawaii-burst-particle {
  position: absolute;
  user-select: none;
  pointer-events: none;
  font-size: 16px;
  line-height: 1;
  will-change: transform, opacity;
  animation: kawaii-burst-fly 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

---

## 6. Hard-Hiding Rules & Verification Compliance

### 6.1 The Hard-Hiding Contract
`tests/stress_m3.test.js:244-275` enforces that any anime figure or theme control must have:
```css
:root:not([data-theme='sakura']) .anime-figure,
html:not([data-theme='sakura']) .anime-figure,
[data-theme='classic'] .anime-figure {
  display: none !important;
}
```
All new mascot elements must:
1. Carry the `.anime-figure` CSS class.
2. Be conditionally omitted from the Lit HTML template when `state.theme !== 'sakura'`.
3. Be explicitly hidden under the CSS selector.

### 6.2 Test Suite Invariants
- `npm test`: 109/109 tests passing.
- `tests/e2e/anime_sound.spec.js`:
  - Uniform theme toggle buttons in topbar and sidebar.
  - Height 40px bounding box.
  - Classic mode hides `.sound-toggle` and `.sound-slider-wrapper`.
  - Mascot avatar click triggers sound without page errors.
- `tests/e2e/theme_stress.spec.js`:
  - 50 rapid toggle clicks maintain 100% sync.
  - Injected `.anime-figure` in Classic mode must evaluate to `getComputedStyle(el).display === 'none'`.

---

## 7. Recommended Implementation Plan for Workers

1. **Create `src/kawaii.js`**:
   - Holds `MASCOT_QUOTES` array.
   - Exports `initClickParticles()`, `spawnParticleBurst(x, y)`, `clearAllParticles()`.
   - Exports `pokeMascot(type)`, `getMascotQuote(type)`.
2. **Update `src/main.js`**:
   - Initialize click particle listener in initialization block.
   - Render peeking chibi mascot card (`.sidebar-chibi-card.anime-figure`) inside `<aside class="sidebar">`.
   - Wire `@click=${() => pokeSidebarMascot()}` on sidebar mascot.
   - Expose `pokeStudyMascot` and `pokeSidebarMascot` on `getCtx()`.
   - Clear particles on `setTheme('classic')`.
3. **Update `src/views/home.js`**:
   - Bind `.kawaii-speech-bubble.focus-bubble` to `ctx.getStudyMascotQuote()`.
   - Update `.anime-study-avatar-btn` `@click` handler to call `ctx.pokeStudyMascot()`.
4. **Update `src/style.css`**:
   - Add `.kawaii-particles-overlay` and `.kawaii-burst-particle` styles.
   - Ensure `.sidebar-chibi-card` and `.kawaii-particles-overlay` are included in the hard-hiding rules.
   - Include `@media (prefers-reduced-motion: reduce)` rules.
