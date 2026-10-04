# Investigation Analysis: Mobile Viewport Regression Failure

## Problem Summary
During Milestone M3 (R3: Sakura Anime Vibes-tema & figurer), a regression occurred in Playwright test:
`[webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow`

Failure:
`expect(received).toBeTruthy()` at line 144 (`await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)`).
On WebKit mobile (iPhone 13 viewport, width 390px):
- In Classic mode: `document.documentElement.scrollWidth` = `391px` (overflow +1px)
- In Sakura mode: `document.documentElement.scrollWidth` = `397px` (overflow +7px)
- On iPhone SE (375px): `scrollWidth` = `391px` (overflow +16px in Classic) / `397px` (overflow +22px in Sakura)

---

## 1. Inspection of `tests/e2e/app.spec.js` (lines 138–163)

```javascript
test('broken original image has a useful fallback and mobile page does not overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  const folder = process.env.QA_SCREENSHOT_DIR || join(tmpdir(), 'tentaplugg-qa');
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: join(folder, `${testInfo.project.name}.png`), fullPage: true });
  await page.route('**/material/reading-03.jpg', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' }),
  );
  await openExams(page);
  await page
    .locator('[data-exam-card="reading"]')
    .getByRole('button', { name: 'Börja tentan' })
    .click();
  await page.getByRole('button', { name: 'Fråga 11', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Bilden kunde inte laddas');
  await expect(page.getByRole('alert').getByRole('link')).toHaveAttribute(
    'href',
    '/material/reading.pdf',
  );
});
```

### Key Observations from the Test:
- The check runs immediately after navigating to `/`:
  `await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)`
- It asserts that the document root does not have any horizontal scroll overflow on the initial home/study room view.
- Under `playwright.config.js`, the `webkit-mobile` project uses:
  `...devices['iPhone 13'], defaultBrowserType: 'webkit'` (viewport: 390 x 844 px).

---

## 2. Root Cause Analysis

### Empirical DOM & Geometry Diagnostics
Using Playwright WebKit under the iPhone 13 device profile (390px viewport), we isolated every element on the home page:

| Element | Selector | Width / Bounding Box | Why it Overflows |
|---|---|---|---|
| Header container | `.topbar` | `padding: 0 20px;` (40px total padding) | Consumes 40px of the 390px viewport, leaving only 350px for content |
| Brand element | `.mobile-brand` | `left: 20px, right: 146.8px, width: 126.8px` | Static brand logo (`学 TentaPlugg`) |
| Topbar actions container | `.topbar-actions` | `left: 146.8px, right: 391.2px (Classic)` / `397.2px (Sakura)` | Contains both the new theme toggle and the account button |
| Theme toggle button | `.topbar-theme-toggle` | `width: 82.3px (Classic)` / `width: 88.4px (Sakura)` | Emoji + text label (`🌸 Sakura` / `🎓 Klassisk`) with `white-space: nowrap` |
| Account button | `.account` | `left: 237px, right: 391.2px, width: 154px` | SVG icon + `<span>Logga in med Google</span>` |
| Account span | `.account span` | `max-width: 135px;` | Styled in CSS line 1131; too wide when paired with theme toggle |

### Mathematical Breakdown
At 390px viewport width:
- Content space available inside `.topbar` (with 20px padding on each side): **350px**.
- Width required by `.mobile-brand`: **126.8px**.
- Space left for `.topbar-actions`: 350px - 126.8px = **223.2px**.
- Width required by `.topbar-actions`:
  - In Classic mode: `.topbar-theme-toggle` (82.3px) + gap (8px) + `.account` (154px) = **244.3px**.
  - In Sakura mode: `.topbar-theme-toggle` (88.4px) + gap (8px) + `.account` (154px) = **250.4px**.
- **Deficit**:
  - Classic: 244.3px - 223.2px = **21.1px surplus over available space**.
  - Sakura: 250.4px - 223.2px = **27.2px surplus over available space**.
- Elements push past the right padding; `.account` overflows the document body:
  - Classic: right edge reaches **391.19px** -> `scrollWidth` = **391px** (+1px).
  - Sakura: right edge reaches **397.17px** -> `scrollWidth` = **397px** (+7px).

### Why the existing `@media (max-width: 370px)` query did not prevent this:
1. In `src/style.css` lines 1498–1525:
   ```css
   @media (max-width: 370px) {
     .topbar { padding: 0 15px; }
     .account span { max-width: 112px; }
   }
   ```
   iPhone 13 (390px) and iPhone SE (375px) are both **above 370px**, so this query is never activated.
2. Even on a 370px screen, `112px + 16px (icon) + 6px (gap) + 88px (toggle) + 8px (actions gap) + 127px (brand) + 30px (padding) = 387px`, which still exceeds 370px!

### Isolation Test Proof
When `.topbar-actions` was temporarily hidden (`display: none`), `document.documentElement.scrollWidth` dropped to **exactly 390px** (0px overflow) on iPhone 13, and **exactly 375px, 360px, 320px** across all mobile sizes in both Classic and Sakura modes.

---

## 3. Playwright Test Suite Dependency Analysis

We systematically audited all Playwright test files in `tests/e2e/`:
- `tests/e2e/app.spec.js`
- `tests/e2e/quickguide_modal_stress.spec.js`
- `tests/e2e/session_flow_stress.spec.js`
- `tests/e2e/theme_stress.spec.js`

### Findings:
1. **`.topbar-theme-toggle`**:
   - `theme_stress.spec.js` locates it using `page.locator('.topbar-theme-toggle')`.
   - Tests assert `toBeVisible()` and execute `.click()`.
   - **NO test asserts the text content or child structure of `.topbar-theme-toggle`**. There are no assertions on `.theme-label`, `"Sakura"`, or `"Klassisk"`.
2. **`.account`**:
   - Not targeted or asserted by any E2E test in `tests/e2e/`.
3. **`.mobile-brand`**:
   - Not targeted or asserted by any E2E test in `tests/e2e/`.
4. **`.breadcrumb`**:
   - Not targeted or asserted by any E2E test in `tests/e2e/`.

### Conclusion on test compatibility:
Responsive styling changes that hide `.theme-label` on narrow mobile screens (showing the emoji `🌸` / `🎓`) or adjust padding and `.account span` max-width **will not affect or break any existing test**.

---

## 4. Proposed Solution & Concrete CSS Changes

In `src/style.css`:

### 1. In `@media (max-width: 760px)`:
Update `.topbar`, `.topbar-actions`, and `.account span`:
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

### 2. At `@media (max-width: 480px)` (or inside `@media (max-width: 600px)`):
Collapse `.theme-label` and reduce button padding on mobile phones:
```css
@media (max-width: 480px) {
  .topbar {
    padding: 0 12px;
  }
  .topbar-theme-toggle {
    padding: 6px 10px;
    gap: 0;
    flex-shrink: 0;
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

### Empirical Validation:
We verified this exact CSS modification against WebKit across viewports:
- 320px: Classic 320px (PASS), Sakura 320px (PASS)
- 360px: Classic 360px (PASS), Sakura 360px (PASS)
- 375px: Classic 375px (PASS), Sakura 375px (PASS)
- 390px: Classic 390px (PASS), Sakura 390px (PASS)
- 414px: Classic 414px (PASS), Sakura 414px (PASS)
- 760px: Classic 760px (PASS), Sakura 760px (PASS)
