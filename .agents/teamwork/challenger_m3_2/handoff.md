# Challenger Handoff Report: Milestone M3 (R3: Sakura Anime Vibes-tema & figurer)

- **Agent:** `challenger_m3_2`
- **Role:** critic, specialist
- **Date:** 2026-10-04
- **Working Directory:** `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\challenger_m3_2`
- **Milestone:** M3 (R3: Sakura Anime Vibes-tema & figurer)
- **Verdict:** **REQUEST_CHANGES**

---

## 1. Observation

### A. Unit & Requirements Tests (`npm test`)
- Command: `npm test` (`node --test --test-isolation=none tests/*.test.js`)
- Result: **61 passed, 0 failed, 0 skipped** (150ms). Zero regressions in unit/SRS/contrastive suites.

### B. Anime Figure Asset Verification
Direct HTTP inspection and image decoding in browser:
- `/anime/study.jpg`: HTTP 200, `content-type: image/jpeg`, size: 524,717 bytes. Decoded: `complete=true`, `naturalWidth > 0`.
- `/anime/cheer.jpg`: HTTP 200, `content-type: image/jpeg`, size: 638,920 bytes. Decoded: `complete=true`, `naturalWidth > 0`.
- `/anime/encourage.jpg`: HTTP 200, `content-type: image/jpeg`, size: 552,198 bytes. Decoded: `complete=true`, `naturalWidth > 0`.

### C. Visual Integration & Classic Mode Hiding Verification
- **Sakura Mode (`ctx.theme === 'sakura'`):**
  - Home dashboard: `.anime-figure.anime-study-panel` renders `/anime/study.jpg`, visible and correctly sized.
  - Feedback on mistake (`again`): `.anime-figure.anime-feedback-mascot.again` renders `/anime/encourage.jpg` ("がんばって！").
  - Feedback on success (`good`): `.anime-figure.anime-feedback-mascot.good` renders `/anime/cheer.jpg` ("やった！").
  - Session results panel: `.anime-figure.anime-result-mascot` renders `/anime/cheer.jpg`, visible and properly contained.
- **Classic Mode (`ctx.theme === 'classic'`):**
  - DOM omission: Zero `.anime-figure` nodes exist in the Lit DOM in home, session feedback, or results view.
  - Hard CSS suppression: Manually injected `.anime-figure` into DOM in Classic mode is evaluated with `display: none !important` via `:root:not([data-theme="sakura"]) .anime-figure, html:not([data-theme="sakura"]) .anime-figure, [data-theme="classic"] .anime-figure`.
- **Theme Persistence:**
  - `localStorage.getItem('tentaplugg-theme')` correctly stores `'sakura'` or `'classic'`.
  - Inline head script in `index.html` sets `dataset.theme` before first paint, preventing FOUT.
  - `<meta name="theme-color">` properly updates between `#183f37` (classic) and `#a82e66` (sakura).

### D. Playwright E2E Regression Failure
- Command: `npx playwright test`
- Results: **35 passed, 1 failed**:
  ```
  x [webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow (863ms)

    Error: expect(received).toBeTruthy()
    Received: false

      142 |   expect(
      143 |     await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    > 144 |   ).toBeTruthy();
  ```

### E. Root Cause Isolation of Mobile Overflow
Evaluating DOM geometry under WebKit mobile (iPhone 13 viewport: 390px width):
- `window.innerWidth`: **390px**
- `document.documentElement.scrollWidth` in Classic mode: **391px** (`overflows: true`)
- `document.documentElement.scrollWidth` in Sakura mode: **397px** (`overflows: true`)

Isolating elements exceeding `window.innerWidth`:
- `.topbar`: `padding: 0 20px;` (uses 40px horizontal margin/padding).
- Inside `.topbar`:
  - `.mobile-brand` (`学 TentaPlugg`): width ~136px.
  - `.topbar-actions` (added in M3): contains `.theme-toggle.topbar-theme-toggle` and `.account` ("Logga in med Google").
  - In Classic mode: `.theme-toggle` displays `🌸 Sakura` (width ~83px). Along with `.account` (~154px) and 8px gap, `.topbar-actions` width is ~245px.
    `136px + 245px + 40px (padding) = 421px > 390px`.
  - In Sakura mode: `.theme-toggle` displays `🎓 Klassisk` (width ~89px). Along with `.account` (~154px) and 8px gap, `.topbar-actions` width is ~251px.
    `scrollWidth` reaches **397px**, overflowing by 7px.

---

## 2. Logic Chain

1. In `src/main.js` (lines 267–282), `worker_m3` added `<div class="topbar-actions">` to header containing the theme toggle button next to the account button.
2. In `src/style.css` (lines 2275–2288), `.theme-toggle` has `white-space: nowrap`.
3. In `src/style.css` (line 1105), `.topbar` has `padding: 0 20px;` at `max-width: 760px`.
4. On standard mobile viewports (e.g., iPhone 13 at 390px width or iPhone SE at 375px width), `.mobile-brand` + `.topbar-actions` cannot shrink, forcing `.topbar-actions` beyond the viewport bounds.
5. In Classic mode, `document.documentElement.scrollWidth` is 391px (overflows by 1px). In Sakura mode, due to the longer label "Klassisk", `scrollWidth` is 397px (overflows by 7px).
6. This causes the pre-existing Playwright test `tests/e2e/app.spec.js:138:1` (`broken original image has a useful fallback and mobile page does not overflow`) to fail on `webkit-mobile`.
7. Requirement R3 explicitly states: *"Säkerställ att appen behåller hög läsbarhet, responsivitet och god kontrast i båda temana."* Horizontal scrolling on mobile violates responsiveness.

---

## 3. Caveats

- All unit tests (`npm test`, 61/61) and Desktop Chromium Playwright tests (18/18) pass cleanly.
- The failure is isolated specifically to mobile viewports (WebKit mobile / iPhone 13 and smaller screens) due to `.topbar-actions` header sizing.
- In desktop view (`shell` margin-left 234px, topbar padding 48px), there is no overflow.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone M3 cannot be approved until the mobile viewport horizontal overflow regression is resolved.

### Required Changes for Implementer (`worker_m3`):
Add responsive styling rules for `.topbar`, `.topbar-actions`, and `.topbar-theme-toggle` under mobile media queries (e.g. `@media (max-width: 760px)` in `src/style.css`):
1. In `.topbar-theme-toggle`: hide the text label on mobile screens (displaying only the emoji `🌸` / `🎓`), e.g.:
   ```css
   @media (max-width: 760px) {
     .topbar-theme-toggle .theme-label {
       display: none;
     }
     .topbar-theme-toggle {
       padding: 6px 9px;
       gap: 0;
     }
     .topbar {
       padding: 0 16px;
     }
     .topbar-actions {
       gap: 8px;
     }
     .account span {
       max-width: 110px;
     }
   }
   ```
2. Verify that `document.documentElement.scrollWidth <= window.innerWidth` holds on both iPhone 13 (390px) and iPhone SE (375px) in **both** Classic and Sakura modes.

---

## 5. Verification Method

To reproduce and verify the failure:

1. **Run Playwright E2E test:**
   ```bash
   npx playwright test tests/e2e/app.spec.js -g "broken original image"
   ```
   *Expected Current Output:* Fails on `webkit-mobile` with `expect(received).toBeTruthy()`, Received: `false` at line 144.

2. **Run Full Playwright Suite:**
   ```bash
   npx playwright test
   ```
   *Expected Current Output:* 35 passed, 1 failed.

3. **Verify Fixed Behavior (post-mitigation):**
   Run `npx playwright test`. All 36 tests must pass across `chromium` and `webkit-mobile`.
