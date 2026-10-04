# Handoff Report: Investigation and Robust Solution for Mobile Topbar Overflow Regression (M3)

- **Agent:** `explorer_m3_fix_1`
- **Archetype:** explorer
- **Roles:** read-only investigation, problem analysis, synthesis
- **Date:** 2026-10-04T18:25:00Z
- **Working Directory:** `c:\Users\Najk\Documents\ChatGPT\TentaPlugg\.agents\teamwork\explorer_m3_fix_1`
- **Milestone:** M3 Regression Fix (Mobile Viewport Overflow)

---

## 1. Observation

1. **Reproduction of Test Failure:**
   - Command: `npx playwright test tests/e2e/app.spec.js -g "broken original image has a useful fallback and mobile page does not overflow"`
   - Result:
     ```
     x 2 [webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow (946ms)
     Error: expect(received).toBeTruthy()
     Received: false
     143 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
     ```
   - Observed across mobile viewports:
     - 390px (iPhone 13 WebKit): `scrollWidth = 391px` in Classic mode, `scrollWidth = 397px` in Sakura mode.
     - 375px (iPhone SE): `scrollWidth = 391px` in Classic, `397px` in Sakura.
     - 360px (Standard Android): `scrollWidth = 386px` in Classic, `392px` in Sakura.
     - 320px (Compact Mobile): `scrollWidth = 386px` in Classic, `392px` in Sakura.

2. **DOM Geometry Breakdown:**
   - In `src/main.js:264-283`:
     Inside `<header class="topbar">`:
     - `<span class="mobile-brand">`: width **126.8px**.
     - `<div class="topbar-actions">`:
       - `<button class="theme-toggle topbar-theme-toggle">`: width **82.4px** (`🌸 Sakura`) / **88.4px** (`🎓 Klassisk`).
       - Gap: **8px**.
       - `<button class="account" id="account">`: width **154px** (`Logga in med Google`).
       - Total `.topbar-actions` width = **250.4px** (Sakura) / **244.4px** (Classic).
     - Topbar horizontal padding: `padding: 0 20px;` (40px) at `max-width: 760px`.
     - Total content width = `126.8px + 250.4px + 40px = 417.2px > 390px`.

3. **Specificity Collision on `.account span`:**
   - Line 1130 of `src/style.css`: `.account span { max-width: 135px; ... }` (specificity `0,1,1`).
   - Line 1519 of `src/style.css`: `.account span { max-width: 112px; }` (specificity `0,1,1`).
   - Line 1753 of `src/style.css`: `.account span:not(.icon) { max-width: 135px; }` (specificity `0,2,1`).
   - When a naive rule `.account span { max-width: 90px; }` is added, line 1753's higher specificity `(0,2,1)` completely overrides it for the text span. The text span remains at `135px`, which causes failure on 320px screens (`scrollWidth` = 343px > 320px).
   - Only by targeting `.account span, .account span:not(.icon)` or modifying line 1753 directly does the rule take effect on all mobile screen widths.

4. **Multi-Viewport & Cross-Browser Validation:**
   - Evaluated proposed candidate rules via Playwright across both Chromium and WebKit on 320px, 360px, 375px, 390px, 414px, 768px, 1024px in both Classic and Sakura themes.
   - Result: All viewports pass with `document.documentElement.scrollWidth <= innerWidth === true`.

5. **Accessibility & Focus Verification:**
   - Touch target: `.topbar-theme-toggle` rendered at `39px x 36px` (exceeds WCAG 2.5.8 AA minimum 24x24px).
   - Focus ring: `outline: 3px solid rgb(24, 63, 55)` (Classic, 7.72:1 contrast) and `outline: 3px solid rgb(184, 39, 99)` (Sakura, 5.61:1 contrast) — both exceed WCAG 2.4.11 / 1.4.11 requirement of 3.0:1.
   - Accessible name: `<button class="theme-toggle topbar-theme-toggle">` retains `aria-label="Växla till klassiskt tema"` / `aria-label="Växla till Sakura Anime-tema"` and `title="..."`. Screen readers have full descriptive labels.

---

## 2. Logic Chain

1. From Observation 1 & 2, `.topbar-actions` was introduced in M3 containing both `.theme-toggle` and `.account`. Together with `.mobile-brand` and `.topbar` padding, the required width is 417.2px, exceeding standard mobile viewports (390px, 375px, 360px, 320px).
2. The extra width in `.topbar-actions` comes from two sources:
   a. `.theme-label` inside `.topbar-theme-toggle` displaying "Sakura" (~36px) or "Klassisk" (~42px).
   b. Unbounded text span inside `.account` allowing up to 135px.
3. Hiding `.topbar-theme-toggle .theme-label` (`display: none;`) on mobile collapses the theme toggle to ~39px (emoji only), saving ~50px.
4. From Observation 3, setting `max-width: 90px;` on `.account span` alone fails due to line 1753's higher specificity selector `.account span:not(.icon)`. The selector must be `.account span, .account span:not(.icon)`.
5. With `max-width: 90px;` on `.account span, .account span:not(.icon)`:
   - On 375px & 390px: `.topbar-actions` width drops from 250px to 171px. Total width + padding is 338px, fitting with >37px margin.
   - On <= 370px: setting `.topbar { padding: 0 12px; }` and `.account span, .account span:not(.icon) { max-width: 70px; }` reduces `.topbar-actions` to 156px. Total width is 307px < 320px, fitting even the smallest 320px viewport.
6. From Observation 5, all focus rings, touch targets, accessible names, and visual aesthetics remain fully compliant and visually harmonious.

---

## 3. Caveats

- Playwright tests in `tests/e2e/quickguide_modal_stress.spec.js` may occasionally experience Windows file locks if run with high concurrency (`workers > 1`). Running Playwright with `--workers=1` or targeted file tests runs without interference.
- No changes to JavaScript or markup (`src/main.js`) are required; the issue is 100% addressable via CSS in `src/style.css`.

---

## 4. Conclusion

The mobile viewport overflow regression is caused by `.topbar-actions` requiring 417.2px on mobile viewports due to `.theme-label` being displayed and `.account span:not(.icon)` occupying 135px.

### Exact Actionable Fix for `worker_m3`:

Apply the changes documented in `proposed_fix.patch`:

1. **In `src/style.css` (lines 2823–2838, under `@media (max-width: 760px)`):**
   ```css
   @media (max-width: 760px) {
     .topbar-actions {
       gap: 8px;
     }
     .topbar-theme-toggle .theme-label {
       display: none;
     }
     .topbar-theme-toggle {
       padding: 6px 10px;
       gap: 0;
       min-height: 36px;
       min-width: 36px;
       justify-content: center;
     }
     .account span,
     .account span:not(.icon) {
       max-width: 90px;
     }
     .theme-toggle {
       padding: 6px 11px;
       font-size: 11px;
     }
     .anime-study-panel {
       margin: 16px auto 0;
     }
     .anime-study-panel img {
       width: 120px;
       height: 120px;
     }
   }
   ```

2. **In `src/style.css` (lines 1516–1521, under `@media (max-width: 370px)`):**
   ```css
     .topbar {
       padding: 0 12px;
     }
     .account span,
     .account span:not(.icon) {
       max-width: 70px;
     }
   ```

3. **In `src/style.css` (line 1753, under `@media (max-width: 760px)`):**
   Update `max-width: 135px;` to `max-width: 90px;`.

---

## 5. Verification Method

To independently verify the fix:

1. **Run Playwright E2E Test:**
   ```bash
   npx playwright test tests/e2e/app.spec.js -g "broken original image has a useful fallback and mobile page does not overflow"
   ```
   *Expected:* Both `chromium` and `webkit-mobile` pass with 0 failures.

2. **Run Multi-Viewport Sweep:**
   ```bash
   node -e "
   import('@playwright/test').then(async ({ webkit }) => {
     const browser = await webkit.launch();
     for (const w of [320, 360, 375, 390]) {
       for (const theme of ['classic', 'sakura']) {
         const page = await (await browser.newContext({ viewport: { width: w, height: 667 } })).newPage();
         await page.goto('http://127.0.0.1:5173/');
         if (theme === 'sakura') {
           await page.evaluate(() => { localStorage.setItem('tentaplugg-theme', 'sakura'); document.documentElement.dataset.theme = 'sakura'; });
           await page.reload();
         }
         const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
         console.log(w + 'px [' + theme + ']: ' + (fits ? 'PASS' : 'FAIL'));
         await page.close();
       }
     }
     await browser.close();
   });"
   ```
   *Expected Output:*
   ```
   320px [classic]: PASS
   320px [sakura]: PASS
   360px [classic]: PASS
   360px [sakura]: PASS
   375px [classic]: PASS
   375px [sakura]: PASS
   390px [classic]: PASS
   390px [sakura]: PASS
   ```

3. **Verify Full Unit & Build Suites:**
   ```bash
   npm test
   npm run build
   ```
   *Expected:* 61 passed, Vite build succeeds.
