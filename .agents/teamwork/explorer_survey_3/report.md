# Ultra Kawaii Investigation Report: Views Theming & Verification Infrastructure

## Executive Summary
This report presents a thorough architectural investigation for the Ultra Kawaii upgrade in TentaPlugg (GEMA70 / JAPC11), specifically focusing on **Requirement R5 (Theming for Vocabulary and Particle Views)** and the **Acceptance Criteria for Testing and Verification** (`npm test` 109+ tests, `npm run build`, `npm run format:check`).

Key findings:
1. **Views & Routing**: Currently, `src/main.js` manages views via an internal state variable (`let view = 'home';`) without browser URL synchronization. Route paths `/vocabulary` and `/particles` do not yet exist as top-level views. A rich Genki I vocabulary dataset is available in `src/vocabulary-data.js` (170+ vocabulary items, 43 kanji, 180 compounds), and particle practice logic is implemented in `src/particles.js` and `src/views/particles.js` (`particleSessionView`). To satisfy R5, dedicated views `vocabularyView` and `particlesView` along with lightweight path routing in `main.js` must be established.
2. **Styling & Kawaii Elements**: Across existing views (`home.js`, `exams.js`, `guide.js`, `progress.js`, `session.js`), a clear, consistent visual design pattern for Sakura mode cards has been established: 2px dashed pink borders (`#f472b6`), pastel gradients (`#fff0f5` to `#ffe5f0`), 85x85px rounded mascot imagery, speech bubbles with Japanese encouragement and Swedish subtitles, and pill-shaped omamori/tag badges (`border-radius: 9999px`).
3. **Hard-Hiding Contract**: Sakura mode elements are conditioned in Lit-html templates (`${ctx.theme === 'sakura' ? ... : ''}`) and backed by CSS hard-hiding rules (`:root:not([data-theme='sakura']) .anime-figure, [data-theme='classic'] .anime-figure { display: none !important; }`). All new banner and mascot elements must inherit `.anime-figure` to guarantee zero visibility in Classic mode.
4. **Test Infrastructure**: Tests run on Node.js built-in `node:test` (`node --test --test-isolation=none tests/*.test.js`), currently executing **109 passing unit tests in ~1.1s**. No Vitest or Jest is used. Theme tests in `tests/stress_m3.test.js` and `test/requirements.test.js` verify state invariants, storage persistence, CSS hard-hiding rules via filesystem inspection, and WCAG AA contrast.
5. **Toolchain Verification**:
   - `npm run build` (`vite build`) succeeds with exit code 0 (~3.9s).
   - `npm run format:check` (`prettier --check .`) currently **fails with exit code 1** on 6 pre-existing files (`src/main.js`, `src/multiplayer.js`, `src/style.css`, `src/views/multiplayer.js`, `tests/audio.test.js`, `tests/multiplayer.test.js`). Running Prettier will be required to meet acceptance criteria.

---

## 1. Views & Routing Architecture (`/vocabulary` and `/particles`)

### 1.1 Current Application Routing & View Switcher
In `src/main.js`, navigation is handled strictly in-memory:
- **State**: `let view = 'home';` (line 48)
- **Navigation Function**:
  ```javascript
  function navigate(id) {
    flush();
    if (view === 'multiplayer' && id !== 'multiplayer') {
      resetMultiplayerView(user?.uid);
    }
    session = null;
    view = id;
    render(true);
  }
  ```
- **Navigation Bar Items** (`src/main.js:60-66`):
  ```javascript
  const navs = [
    ['home', 'BookOpen', 'Plugga'],
    ['exams', 'GraduationCap', 'Gamla tentor'],
    ['multiplayer', 'Swords', '1v1 Duell'],
    ['progress', 'ChartNoAxesCombined', 'Mina framsteg'],
    ['guide', 'Library', 'Snabbguide'],
  ];
  ```
- **View Dispatcher** (`src/main.js:266-276`):
  ```javascript
  const body = session
    ? sessionView(ctx)
    : view === 'home'
      ? homeView(ctx)
      : view === 'exams'
        ? examsView(ctx)
        : view === 'multiplayer'
          ? multiplayerView(ctx)
          : view === 'progress'
            ? progressView(ctx)
            : guideView(ctx);
  ```

### 1.2 Status of `/vocabulary` and `/particles`
- Currently, neither `/vocabulary` nor `/particles` is handled in `main.js`. If a user enters `http://localhost:5173/vocabulary` in their browser, Vite serves `index.html`, but `main.js` ignores the path and renders `homeView` by default.
- **Existing Particle Code**:
  - `src/particles.js`: Implements particle tokenization (`particleCharacters`), sentence definitions (`definitions`), and exercise reduction logic (`reduceParticle`, `initialParticleState`).
  - `src/views/particles.js`: Implements `particleSessionView(ctx, q, ratings)`. This is invoked exclusively within an active study session when a question has `q.type === 'particle-edit'` (via `src/views/session.js:39-40`). There is no standalone particle hub or reference view.
- **Existing Vocabulary Code**:
  - `src/vocabulary-data.js`: A 4,423-line dataset generated from `Material/vocabulary.pdf` (Genki I 3rd edition Lessons 3, 4, 5). It exports:
    - `kanjiList`: 43 kanji entries with stroke counts, onyomi, kunyomi, English/Swedish meanings, and 180 compound words.
    - `vocabularyList`: 170+ vocabulary items structured with `id`, `lesson`, `japanese`, `kana`, `romaji`, `meaning_en`, `meaning_sv`, `word_type`, and `section` (e.g. `verbs-u`, `verbs-ru`, `nouns`, `adjectives-i`, `adjectives-na`, `adverbs`, `time`, `location`).
  - Currently, this vocabulary data is only consumed by `src/multiplayer.js` for quiz question generation during 1v1 duels. There is no dedicated UI view to browse, drill, or study vocabulary.

### 1.3 Recommended Routing & Architecture for R5
To fulfill the acceptance criteria ("The Vocabulary view (`/vocabulary`) and Particle view (`/particles`) render dedicated kawaii banner/encouragement cards when Sakura mode is active"):
1. **Lightweight Path Router in `src/main.js`**:
   - On initialization:
     ```javascript
     const path = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : '';
     if (['vocabulary', 'particles', 'exams', 'progress', 'guide', 'multiplayer'].includes(path)) {
       view = path;
     }
     ```
   - On `navigate(id)`:
     ```javascript
     if (typeof window !== 'undefined' && window.history?.pushState) {
       const nextPath = id === 'home' ? '/' : `/${id}`;
       if (window.location.pathname !== nextPath) {
         window.history.pushState({ view: id }, '', nextPath);
       }
     }
     ```
   - Listen to `popstate` to support browser back/forward buttons:
     ```javascript
     window.addEventListener('popstate', (e) => {
       const path = window.location.pathname.replace(/^\//, '') || 'home';
       navigate(path, false); // skip pushing state again
     });
     ```
2. **Dedicated View Modules**:
   - `src/views/vocabulary.js`: Export `vocabularyView(ctx)` which renders the Genki I Lessons 3–5 vocabulary list with search/filter by lesson/type, and an anime encouragement banner card.
   - `src/views/particles.js`: Export `particlesView(ctx)` as a standalone particle reference/drill launchpad with an anime encouragement banner card, alongside the existing `particleSessionView(ctx, q, ratings)`.

---

## 2. Visual & Kawaii Styling Inventory Across Existing Views

The Sakura theme implements a distinct, cohesive visual language. Below is the complete catalog of banner cards, badges, callouts, and speech bubbles currently in production.

### 2.1 Exam View Anime Banner Card (`src/views/exams.js:8-18` & `src/style.css:3653-3705`)
- **HTML Pattern**:
  ```html
  <div class="anime-figure exam-anime-banner-card" aria-hidden="true">
    <img src="/anime/mascot_cheer.jpg" alt="Mascot cheer" loading="lazy" />
    <div class="exam-anime-copy">
      <span class="exam-anime-omamori">🌸 絶対合格祈願 · ZETTAI GOUKAKU 🌸</span>
      <h3>Senpai krossar tentan! (ง •̀_•́)ง✨</h3>
      <p>Alla gamla tentor på ett ställe. Ta en tenta i taget så sitter allt! 💮💕</p>
    </div>
  </div>
  ```
- **Styling Specs**:
  - Background: `linear-gradient(135deg, #fff0f5 0%, #ffe5f0 50%, #fed7aa 100%)`
  - Border: `2px dashed #f472b6`
  - Border Radius: `20px`
  - Padding: `16px 20px`
  - Mascot Image: 85x85px, `object-fit: cover`, `border-radius: 16px`, `border: 3px solid #ffffff`, shadow `0 4px 12px rgba(184, 39, 99, 0.2)`
  - Omamori Badge (`.exam-anime-omamori`): font-size 11px, font-weight 800, pill `border-radius: 9999px`, color `#9f1239`, background `#ffffff`, border `1.5px solid #f43f5e`, box-shadow `0 2px 6px rgba(244, 63, 94, 0.2)`
  - Header: `h3` in `#881337` (font-size 16px)
  - Copy: `p` in `#784f60` (font-size 12px)

### 2.2 Quick Guide Hero Card (`src/views/guide.js:101-114` & `src/style.css:3761-3829`)
- **HTML Pattern**:
  ```html
  <div class="anime-figure guide-anime-hero-card" aria-hidden="true">
    <div class="guide-anime-peek-wrap">
      <img src="/anime/mascot_peek.jpg" alt="Chibi catgirl maskot" loading="lazy" />
    </div>
    <div class="guide-anime-content">
      <div class="guide-anime-bubble">
        <strong>先輩、困ったらここを見てね！♡</strong>
        <p>Ta det lugnt, senpai! Grammatiken sitter snart! ( ๑>ᴗ<๑ )و ✨</p>
      </div>
      <span class="guide-anime-tag">🌸 KAWAII SENSEI HINTS 🌸</span>
    </div>
  </div>
  ```
- **Styling Specs**:
  - Background: `linear-gradient(135deg, #fff0f5 0%, #ffe5f0 50%, #fdf4ff 100%)`
  - Border: `2px dashed #f472b6`, `border-radius: 22px`
  - Peek Wrap (`.guide-anime-peek-wrap`): circular 85x85px (`border-radius: 50%`), `border: 3px solid #ffffff`
  - Speech Bubble (`.guide-anime-bubble`): background `#ffffff`, border `1.5px solid #ffcfe0`, rounded `14px`, `strong` in `#b82763`, `p` in `#784f60`
  - Tag Badge (`.guide-anime-tag`): gradient `linear-gradient(135deg, #ec4899, #be185d)`, color `#ffffff`, font-size 11px, pill `border-radius: 9999px`

### 2.3 Progress View Hero Card (`src/views/progress.js:21-34` & `src/style.css:3707-3759`)
- **HTML Pattern**:
  ```html
  <div class="anime-figure progress-anime-hero-card" aria-hidden="true">
    <img src="/anime/mascot_cheer.jpg" alt="Mascot cheer" loading="lazy" />
    <div class="progress-anime-copy">
      <span class="progress-rank-badge">✨ KAWAII ANIME RANK: S-RANK MÄSTARE ✨</span>
      <h3>Varje partikel räknas! ٩(ˊᗜˋ*)و</h3>
      <p>努力は裏切らないよ！ Dina framsteg blommar som vackra körsbärsblommor! 🌸💕</p>
    </div>
  </div>
  ```
- **Styling Specs**:
  - Background: `linear-gradient(135deg, #fff0f5 0%, #fce7f3 50%, #ede9fe 100%)` (subtle lavender tint)
  - Border: `2px solid #f472b6`, `border-radius: 20px`
  - Rank Badge (`.progress-rank-badge`): pill `border-radius: 9999px`, color `#6b21a8`, border `1.5px solid #a855f7`, background `#ffffff`

### 2.4 Study Room Mascot & Speech Bubble (`src/views/home.js:103-125` & `src/style.css:2532-2575, 3178-3242`)
- **HTML Pattern**:
  ```html
  <div class="anime-figure anime-study-panel">
    <div class="anime-mascot-wrapper">
      <div class="kawaii-speech-bubble focus-bubble">
        <span>先輩、今日もいっしょにがんばろう！✨</span>
        <small>Kämpa på, senpai! 💕</small>
      </div>
      <button type="button" class="anime-study-avatar-btn">
        <img src="/anime/study.jpg" alt="Sakura-maskot" loading="lazy" />
        <span class="anime-badge-stamp">💮 合格祈願</span>
      </button>
    </div>
  </div>
  ```
- **Styling Specs**:
  - Speech Bubble (`.kawaii-speech-bubble`): white `#ffffff`, border `2px solid #ffcfe0`, rounded `16px`, downward speech triangle (`::after`), text `#b82763` and `#784f60`.
  - Mascot Image: 165x165px (110x110px on mobile), border `3px solid rgba(255, 255, 255, 0.85)`, rounded `18px`.
  - Badge Stamp (`.anime-badge-stamp`): slanted `-5deg` red badge (`linear-gradient(135deg, #e11d48, #be123c)`), text `#ffffff`, border `1.5px solid #ffffff`.

### 2.5 Contrastive Feedback Callout (`src/views/session.js:259-309` & `src/style.css:3859-3885`)
- **HTML Pattern**:
  ```html
  <div class="contrastive-box contrastive-callout" role="region" aria-label="Förstå svaret">
    <div class="contrastive-header">
      <div class="contrastive-comparison">
        <span class="contrastive-chip wrong"><small>Ditt val:</small><strong>に</strong></span>
        <span class="contrastive-vs">vs</span>
        <span class="contrastive-chip correct"><small>Godtagna svar:</small><strong>で</strong></span>
      </div>
    </div>
    <h4>Så hänger det ihop</h4>
    <p class="contrastive-text">...</p>
    <div class="contrastive-actions">
      <button type="button" class="contrastive-guide-btn ...">Öppna snabbguide</button>
    </div>
  </div>
  ```
- **Styling Specs**:
  - Contrastive Box: background `#fff8fb`, border `1.5px solid #f7cadb`, rounded `16px`
  - Wrong Chip: background `#ffe4e6`, border `#fecdd3`, color `#9f1239`
  - Correct Chip: background `#ecfdf5`, border `#a7f3d0`, color `#065f46`

---

## 3. Styling Design Proposal for Vocabulary & Particle Views (R5)

To ensure seamless consistency with the existing views, the new views should incorporate the following components:

### 3.1 Vocabulary View (`/vocabulary`) Components
1. **Vocabulary Anime Banner Card (`.vocab-anime-banner-card`)**:
   - **Container**: `<div class="anime-figure vocab-anime-banner-card" aria-hidden="true">`
   - **Image**: `/anime/encourage.jpg` (ideal encouraging student motif, currently unused in banners).
   - **Badge**: `<span class="vocab-anime-badge">🌸 GENKI I 単語帳 · VOCAB DRILL 🌸</span>`
     - Background: `#ffffff`, border `1.5px solid #ec4899`, color `#be185d`, rounded `9999px`.
   - **Speech Bubble / Copy**:
     - Japanese: `先輩、単語をいっぱい覚えよう！(๑•̀ㅂ•́)و✧`
     - Swedish: `Bygg ditt ordförråd för Genki lektion 3–5! Varje nytt ord gör texten lättare! 💮💕`
   - **Background Gradient**: `linear-gradient(135deg, #fff0f5 0%, #fdf2f8 50%, #fae8ff 100%)` (subtle blush/lavender).
   - **Border**: `2px dashed #f472b6`, `border-radius: 20px`.
2. **Word Class Badges (Part of Speech)**:
   - Verbs (`U-verb` / `Ru-verb`): lavender chip (`background: #f5f3ff; border: 1.5px solid #ddd6fe; color: #6d28d9;`)
   - Nouns (`名詞`): soft rose chip (`background: #fdf2f8; border: 1.5px solid #fbcfe8; color: #9d174d;`)
   - い-adjectives (`い-形容詞`): peach chip (`background: #fff7ed; border: 1.5px solid #fed7aa; color: #c2410c;`)
   - な-adjectives (`な-形容詞`): mint chip (`background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #15803d;`)
3. **Kawaii Vocab Tip Callout (`.kawaii-vocab-tip`)**:
   - Visual container styled similarly to `.rule-tip` / `.contrastive-box`:
     - Background `#fff8fb`, border `1.5px solid #f7cadb`, border-radius `16px`.
     - Icon: `💡` or Lucide `Sparkles`.
     - Content highlighting common conjugation patterns (e.g. `飲む → 飲みます` vs `食べる → 食べます`).

### 3.2 Particle View (`/particles`) Components
1. **Particle Anime Banner Card (`.particle-anime-banner-card`)**:
   - **Container**: `<div class="anime-figure particle-anime-banner-card" aria-hidden="true">`
   - **Image**: `/anime/mascot_peek.jpg` (peeking mascot) or `/anime/study.jpg`.
   - **Badge**: `<span class="particle-anime-badge">🌸 助詞完全攻略 · JOSHI MASTER 🌸</span>`
     - Background: `#ffffff`, border `1.5px solid #f43f5e`, color `#9f1239`, rounded `9999px`.
   - **Speech Bubble / Copy**:
     - Japanese: `助詞を制する者は日本語を制す！💮✨`
     - Swedish: `Kämpa med partiklarna, senpai! Små tecken som gör hela skillnaden! (ง •̀_•́)ง`
   - **Background Gradient**: `linear-gradient(135deg, #fff0f5 0%, #ffe5f0 50%, #fef3c7 100%)` (warm sakura amber).
   - **Border**: `2px dashed #f472b6`, `border-radius: 20px`.
2. **Particle Tip Callout (`.kawaii-particle-tip`)**:
   - Pill chips displaying high-frequency distinction pairings:
     - `に` vs `で` (Tid / destination vs handling)
     - `は` vs `が` (Tema vs fokus / grammatiskt subjekt)
     - `を` vs `に` (Direkt objekt vs möta/åka med)
3. **Interactive Particle Token Styling in Sakura Mode**:
   - The selectable particle boxes (`.particle-char`, `.particle-token` in `src/style.css:30-65`):
     - In Sakura mode: `border-color: #f472b6`, selected state `background: #ffe5f0; border-color: #b82763; color: #8a1746;`.
     - Right/correct state: soft pastel green (`#ecfdf5`, `#86efac`, `#15803d`).

---

## 4. Classic vs Sakura Mode Behavior & Hard-Hiding Rules

### 4.1 Strict Mode Separation Matrix

| Element | Classic Mode (`data-theme='classic'`) | Sakura Mode (`data-theme='sakura'`) |
|---|---|---|
| Palette | Forest green (`#183f37`, `#243e36`, `#f8faf8`) | Sakura pink/plum (`#3b1d28`, `#fff5f8`, `#b82763`) |
| Anime Banners | **Strictly Omitted** (0 DOM nodes, `display: none !important`) | Visible with pastel gradient & anime character |
| Mascot Avatars | **Strictly Omitted** | Visible with interactive speech bubbles |
| Sound Controls | **Strictly Omitted** | Visible volume slider and mute toggle in topbar |
| Micro-copy | Clean academic Swedish ("Plugga", "Kontrollera svar") | Joyful kaomoji micro-copy ("Plugga ✨", "Rätta (ง •̀_•́)ง") |
| Button Interactivity| Standard hover/active transition | Jelly spring bounce & sparkle burst clicks |

### 4.2 CSS Hard-Hiding Verification Rule
In `src/style.css:2494-2508`:
```css
:root:not([data-theme='sakura']) .anime-figure,
html:not([data-theme='sakura']) .anime-figure,
[data-theme='classic'] .anime-figure,
:root:not([data-theme='sakura']) .sound-toggle,
html:not([data-theme='sakura']) .sound-toggle,
[data-theme='classic'] .sound-toggle,
:root:not([data-theme='sakura']) .sound-slider-wrapper,
html:not([data-theme='sakura']) .sound-slider-wrapper,
[data-theme='classic'] .sound-slider-wrapper,
:root:not([data-theme='sakura']) .sound-slider,
html:not([data-theme='sakura']) .sound-slider,
[data-theme='classic'] .sound-slider {
  display: none !important;
}
```
**Invariant**: Any new banner, mascot, or anime component added in `/vocabulary` or `/particles` **MUST** include the `.anime-figure` CSS class on its outer container so that CSS guarantees it will never be displayed in Classic mode even if a template bug occurs.
Furthermore, in the Lit-html templates:
```javascript
${ctx.theme === 'sakura' ? html`<div class="anime-figure vocab-anime-banner-card">...</div>` : ''}
```
ensures that the element is not rendered into the DOM at all in Classic mode.

---

## 5. Test Suite Structure & Verification Toolchain

### 5.1 Test Framework Analysis
- **Test Runner**: Node.js built-in test runner (`node:test` and `node:assert/strict`).
  - Command: `node --test --test-isolation=none tests/*.test.js`
  - **No Vitest or Jest**: Although commonly used in Vite projects, TentaPlugg uses pure `node:test` with `--test-isolation=none` for sub-second execution speeds.
  - Test count: **109 unit tests**, 0 failures, running in ~1.1 seconds.
- **Directory Layout**:
  - `tests/`: 16 test files covering audio, engine, follow-up, learning, multiplayer, particles, pedagogy, requirements, speech, storage, stress_m2, stress_m3.
  - `test/`: Contains `test/requirements.test.js` (766 lines) which is imported by `tests/requirements.test.js`.
  - `tests/emulator/`: Firebase rules tests executed via `npm run test:rules`.
  - `tests/e2e/`: Playwright end-to-end tests executed via `npm run test:e2e`.

### 5.2 How Theme Tests Are Currently Implemented
In `tests/stress_m3.test.js` and `test/requirements.test.js`:
1. **In-Memory State & Migration Invariants**:
   - Verifies `fresh()` initializes with `'classic'` theme.
   - Verifies `migrate(null)` and `migrate({})` preserve or default theme safely.
2. **Static Source Code Contract Checks**:
   - Reads `index.html` via `readFileSync` and asserts inline `<script>` in `<head>` contains FOUT prevention logic reading `localStorage.getItem('tentaplugg-theme')`.
   - Reads `src/style.css` via `readFileSync` and asserts presence of:
     - `:root:not([data-theme="sakura"]) .anime-figure`
     - `html:not([data-theme="sakura"]) .anime-figure`
     - `[data-theme="classic"] .anime-figure`
     - `display: none !important;`
     - Focus ring definitions and `[data-theme="sakura"]` color declarations.
3. **Theme Transition & Sanitizer Simulation**:
   - Executes 1,000 rapid toggle transitions to ensure 100% sync between memory state, DOM dataset, and storage.
   - Tests `QuotaExceededError` resilience when setting theme.
4. **Binary Asset Integrity on Disk**:
   - Inspects `public/anime/study.jpg`, `cheer.jpg`, `encourage.jpg` on disk: verifies buffer length > 50KB and JPEG magic bytes `[0xFF, 0xD8, 0xFF]`.
5. **WCAG AA Relative Luminance & Contrast Calculation**:
   - Computes sRGB relative luminance and verifies contrast ratios >= 4.5:1 for all text colors against theme backgrounds (`#3b1d28` vs `#fff5f8`, `#b82763` vs `#ffffff`, etc.).

### 5.3 Build Toolchain (`npm run build`)
- Command: `vite build`
- Configuration: `vite.config.js` with manual chunks for `firebase`.
- Build verification:
  - 1,601 modules transformed.
  - Bundles generated: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`, `dist/assets/firebase-*.js`.
  - Static assets copied: `public/anime/` is copied directly to `dist/anime/`.
  - **Status: PASSES with exit code 0** in ~3.9s.

### 5.4 Formatting Toolchain (`npm run format:check`)
- Command: `prettier --check .`
- Configuration: Uses Prettier default options (no custom `.prettierrc`).
- **Current Status: FAILS with exit code 1**.
  Output:
  ```
  Checking formatting...
  [warn] src/main.js
  [warn] src/multiplayer.js
  [warn] src/style.css
  [warn] src/views/multiplayer.js
  [warn] tests/audio.test.js
  [warn] tests/multiplayer.test.js
  Code style issues found in 6 files. Run Prettier with --write to fix.
  ```
- **Actionable Requirement for Implementation**:
  Before the final handoff or verification gate, the implementer must run `npm run format` (or run prettier on modified files) so that `npm run format:check` exits with code 0 as required by the Acceptance Criteria:
  `[ ] npm run format:check passes without prettier formatting violations.`

---

## 6. Synthesis & Recommended Implementation Roadmap

1. **Routing Setup**:
   - In `src/main.js`, enhance `navigate(id)` and initial load to check `window.location.pathname`, allowing `/vocabulary` and `/particles` URLs to activate their respective views.
2. **Create `src/views/vocabulary.js`**:
   - Render page heading "Genki I Ordförråd (Lektion 3–5)".
   - Render `.anime-figure.vocab-anime-banner-card` with `/anime/encourage.jpg`, speech bubble, and `🌸 GENKI I 単語帳 🌸` badge when `ctx.theme === 'sakura'`.
   - Render category tabs (Verbs, Nouns, Adjectives, Adverbs, Time) and list of vocabulary items from `src/vocabulary-data.js` with Japanese, kana, romaji, and Swedish definitions.
3. **Enhance `src/views/particles.js`**:
   - Add a top-level `particlesView(ctx)` that acts as the particle study hub when navigated to `/particles`.
   - Render `.anime-figure.particle-anime-banner-card` with `/anime/mascot_peek.jpg`, speech bubble, and `🌸 助詞完全攻略 🌸` badge when `ctx.theme === 'sakura'`.
   - Provide direct buttons to launch particle practice sessions.
4. **Add CSS Rules in `src/style.css`**:
   - Add styles for `.vocab-anime-banner-card`, `.particle-anime-banner-card`, and their respective speech bubbles, omamori badges, and word-type chips under `[data-theme='sakura']`.
   - Verify that `:root:not([data-theme='sakura']) .anime-figure` automatically hides them in Classic mode.
5. **Add Verification Tests in `tests/`**:
   - Add unit tests verifying that `/vocabulary` and `/particles` banner cards render in Sakura mode, remain omitted in Classic mode, and that CSS selectors exist in `src/style.css`.
   - Run `npm test` ensuring all 109+ tests pass.
6. **Formatting Clean-up**:
   - Run `npx prettier --write` to resolve the 6 existing formatting warnings and any newly added files so that `npm run format:check` passes with 0 violations.
