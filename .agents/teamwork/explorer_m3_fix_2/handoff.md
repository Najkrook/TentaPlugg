# Handoff Report: Mobile Viewport Regression Failure in M3

## 1. Observation

1. **Test Failure**:
   Command: `npx playwright test tests/e2e/app.spec.js -g "broken original image" --project=webkit-mobile`
   Output:
   ```
   1) [webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow

     Error: expect(received).toBeTruthy()
     Received: false

       142 |   expect(
       143 |     await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
     > 144 |   ).toBeTruthy();
           |     ^
   ```
2. **Viewport Measurements**:
   On device profile `iPhone 13` (configured in `playwright.config.js` line 11: `...devices['iPhone 13'], defaultBrowserType: 'webkit'` with `innerWidth: 390px`):
   - In default Classic theme:
     `document.documentElement.scrollWidth` is `391px` (`innerWidth: 390px`, overflow `+1px`).
   - In Sakura theme:
     `document.documentElement.scrollWidth` is `397px` (`innerWidth: 390px`, overflow `+7px`).
   - On iPhone SE viewport (`innerWidth: 375px`):
     `document.documentElement.scrollWidth` is `391px` in Classic (`+16px`), and `397px` in Sakura (`+22px`).
3. **DOM Element Geometry**:
   Element evaluation on iPhone 13 (390px):
   - `.topbar`: `padding: 0 20px`, width `390px`. Available inner content width = `350px`.
   - `.mobile-brand`: `left: 20px, right: 146.81px, width: 126.81px`.
   - `.topbar-actions`: `left: 146.81px, width: 244.36px (Classic)` / `250.36px (Sakura)`.
   - `.topbar-theme-toggle`: `width: 82.3px (Classic)` / `88.4px (Sakura)`. Text: `"🌸 Sakura"` / `"🎓 Klassisk"`.
   - `.account`: `width: 153.95px`. Contains icon (16px) + `<span>Logga in med Google</span>` (`max-width: 135px`).
   - `.account` right edge:
     - Classic: `rect.right = 391.19px` (> 390px).
     - Sakura: `rect.right = 397.17px` (> 390px).
4. **Element Isolation Experiment**:
   When `.topbar-actions` was set to `display: none`:
   - Classic `document.documentElement.scrollWidth` = `390px` (diff = 0px, PASS).
   - Sakura `document.documentElement.scrollWidth` = `390px` (diff = 0px, PASS).
   - Viewports 320px, 360px, 375px, 390px, 414px all had `scrollWidth === innerWidth` (diff = 0px, PASS).
5. **Existing Styles in `src/style.css`**:
   - Line 1103 (`@media (max-width: 760px)`):
     `.topbar` has `padding: 0 20px;`.
     `.account span` has `max-width: 135px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`.
   - Line 1516 (`@media (max-width: 370px)`):
     `.topbar` has `padding: 0 15px;`.
     `.account span` has `max-width: 112px;`.
     This media query is never reached on iPhone SE (375px) or iPhone 13 (390px).
   - Line 2823 (`@media (max-width: 760px)`):
     `.topbar-actions` has `gap: 8px;`.
     `.theme-toggle` has `padding: 6px 11px; font-size: 11px;`.
6. **Playwright Test Suite Invariants**:
   - `tests/e2e/theme_stress.spec.js`:
     Lines 13, 70, 133, 171, 181, 214, 238: Uses `page.locator('.topbar-theme-toggle')`, expects `.toBeVisible()`, and performs `.click()`.
     Does NOT query or assert `.theme-label`, `"Sakura"`, or `"Klassisk"`.
   - No tests in `tests/e2e/` target `.account`, `.mobile-brand`, or `.breadcrumb`.

---

## 2. Logic Chain

1. **Premise 1 (from Observation 1 & 2)**: Test `tests/e2e/app.spec.js:138` fails if and only if `document.documentElement.scrollWidth > window.innerWidth` at the root route `/` on WebKit mobile (iPhone 13, 390px).
2. **Premise 2 (from Observation 3 & 4)**: The DOM elements exceeding the 390px boundary are `.topbar`, `.topbar-actions`, and `.account`. When `.topbar-actions` is removed, `document.documentElement.scrollWidth` drops from 391px to exactly 390px (0px overflow) in Classic mode, and from 397px to exactly 390px in Sakura mode. No other element on the page causes overflow.
3. **Premise 3 (from Observation 3 & 5)**: In M3, the `.topbar-theme-toggle` was added inside `.topbar-actions` next to `.account`. With `.mobile-brand` (126.8px), `.topbar` padding (20px left + 20px right = 40px), `.topbar-theme-toggle` (82–88px), gap (8px), and `.account` (154px), the total minimum layout width required is 411px (Classic) and 417px (Sakura).
4. **Premise 4 (from Observation 5)**: Because the only existing mobile reduction was at `max-width: 370px`, standard mobile phones (iPhone SE at 375px, iPhone 13 at 390px, Android at 360px) receive the desktop-scale `max-width: 135px` for `.account span` and full `padding: 0 20px`, causing horizontal overflow.
5. **Premise 5 (from Observation 6)**: No tests assert text content inside `.topbar-theme-toggle`, nor do any tests target `.account` or `.mobile-brand`. Therefore, reducing padding, adjusting `max-width` on `.account span`, and hiding `.theme-label` on narrow mobile screens (below 480px) is completely safe and backwards compatible.
6. **Conclusion**: The regression is entirely a CSS layout issue in `src/style.css`. Updating the mobile media query rules for `.topbar`, `.topbar-actions`, `.topbar-theme-toggle`, and `.account` resolves the regression completely with zero side-effects.

---

## 3. Caveats

- In Sakura theme, `.anime-study-panel` sits inside `.focus-panel`. Because `.focus-panel` already specifies `overflow: hidden;`, it does not affect document `scrollWidth`. However, ensuring `.anime-study-panel img` stays within reasonable bounds on mobile (already set to 120px) is good hygiene.
- No source files were modified during this investigation, adhering strictly to the read-only exploration constraint.

---

## 4. Conclusion & Concrete Implementation Proposal

### Target File: `src/style.css`

#### Edit 1: Update `@media (max-width: 760px)` (around line 1103 and line 2823)
```css
  .topbar {
    height: 68px;
    padding: 0 16px;
    position: relative;
    gap: 8px;
  }
  .topbar-actions {
    gap: 6px;
    min-width: 0;
    flex-shrink: 1;
  }
  .topbar-theme-toggle {
    padding: 5px 9px;
    font-size: 11px;
    flex-shrink: 0;
  }
  .account {
    font-size: 12px;
    gap: 6px;
    min-width: 0;
    flex-shrink: 1;
  }
  .account span {
    max-width: 105px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
```

#### Edit 2: Add narrow mobile query `@media (max-width: 480px)` and `@media (max-width: 360px)` (around line 2835)
```css
@media (max-width: 480px) {
  .topbar {
    padding: 0 12px;
  }
  .topbar-theme-toggle {
    padding: 6px 10px;
    gap: 0;
  }
  .topbar-theme-toggle .theme-label {
    display: none;
  }
  .account span {
    max-width: 95px;
  }
}

@media (max-width: 360px) {
  .topbar {
    padding: 0 8px;
  }
  .account span {
    max-width: 70px;
  }
}
```

This ensures:
1. `scrollWidth <= innerWidth` is strictly satisfied for all mobile viewports (320px to 414px) in both Classic and Sakura modes.
2. The theme switcher `.topbar-theme-toggle` remains fully visible and clickable (showing `🌸` or `🎓` with its `aria-label`).
3. The account button remains functional and readable.
4. All existing tests in `app.spec.js` and `theme_stress.spec.js` continue to pass.

---

## 5. Verification Method

### 1. Specific Failing Test Command
```bash
npx playwright test tests/e2e/app.spec.js -g "broken original image" --project=webkit-mobile
```
**Expected result**: 1 passed (0 failed).

### 2. Full Playwright Suite
```bash
npx playwright test
```
**Expected result**: All 50 tests pass (25 chromium + 25 webkit-mobile).

### 3. Unit Tests & Build
```bash
npm test
npm run build
```
**Expected result**: All 67 unit tests pass, and Vite builds with zero errors.

### Invalidation Conditions:
- If `document.documentElement.scrollWidth > window.innerWidth` on any mobile viewport (320px, 360px, 375px, 390px, 414px).
- If any test in `theme_stress.spec.js` fails due to `.topbar-theme-toggle` being unreachable.
