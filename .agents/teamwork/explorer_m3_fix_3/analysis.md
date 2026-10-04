# Analysis: Mobile Viewport Horizontal Overflow in Topbar Theme Toggle

## 1. Executive Summary

Milestone M3 introduced `.topbar-theme-toggle` in `src/main.js` and corresponding CSS in `src/style.css`.
In mobile viewports (e.g. `iPhone 13` at 390px, `iPhone SE` at 375px), this button causes the header `.topbar` to horizontally overflow (`document.documentElement.scrollWidth > window.innerWidth`).
This triggers a failure in the regression test `tests/e2e/app.spec.js:138` (`broken original image has a useful fallback and mobile page does not overflow`).

Investigation identified two interrelated causes:
1. **DOM Structure**: In `src/main.js:275`, the emoji icons (`🌸` / `🎓`) are bare text nodes rather than isolated span elements (`<span class="theme-icon">`), while the accompanying text is in `<span class="theme-label">`.
2. **Missing Responsive Rules**: In `src/style.css`, there are no responsive rules hiding `.theme-label` on mobile screens (`max-width: 760px`). Because the text "Sakura" / "Klassisk" remains visible alongside the icon, the button width (~95–101px) combined with `.mobile-brand` (~135px) and `.account` (~157px) exceeds mobile viewport widths (375–390px), resulting in horizontal overflow.

---

## 2. Evidence Chain & Observations

### Observation 1: Regression Test Failure
- **Location**: `tests/e2e/app.spec.js:143–144`
- **Command**: `npx playwright test tests/e2e/app.spec.js -g "broken original image" --project=webkit-mobile --workers=1`
- **Output**:
  ```text
  1) [webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow
    Error: expect(received).toBeTruthy()
    Received: false
      142 |   expect(
      143 |     await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    > 144 |   ).toBeTruthy();
  ```
- **Finding**: On mobile viewport (`iPhone 13`, width 390px), `scrollWidth` exceeds `innerWidth`.

### Observation 2: Current Template in `src/main.js`
- **Location**: `src/main.js:268–282`
- **Code**:
  ```javascript
  <div class="topbar-actions">
    <button
      type="button"
      class="theme-toggle topbar-theme-toggle"
      @click=${toggleTheme}
      aria-label=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Växla till Sakura Anime-tema'}
      title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Växla till Sakura Anime-tema'}
    >
      ${state.theme === 'sakura' ? html`🎓 <span class="theme-label">Klassisk</span>` : html`🌸 <span class="theme-label">Sakura</span>`}
    </button>
    <button class="account" id="account" ?disabled=${authBusy} @click=${account}>
      ${icon(user ? 'LogOut' : 'LogIn')}<span>...</span>
    </button>
  </div>
  ```
- **Deficiencies**:
  - The emojis `🎓 ` and `🌸 ` are untagged text nodes with trailing whitespace.
  - No `<span class="theme-icon">` element wraps the icon.
  - The text label is in `<span class="theme-label">`.

### Observation 3: Topbar Layout Geometry & Math
- **Container**: `header.topbar` with `display: flex; justify-content: space-between; align-items: center; padding: 0 20px;` (at `<=760px`).
- **Child 1**: `.mobile-brand` (`学 TentaPlugg`)
  - Width: ~135px.
- **Child 2**: `.topbar-actions` (`display: flex; gap: 8px;`)
  - `.topbar-theme-toggle`:
    - padding: `6px 11px` (22px)
    - border: `1px solid` (2px)
    - emoji: ~16px
    - gap: `7px`
    - label (`Klassisk` / `Sakura`): ~45–54px
    - Total button width: ~95–101px
  - `.account`:
    - svg: 16px
    - gap: 6px
    - span: max-width 135px
    - Total account width: ~157px
  - Total `.topbar-actions` width: 101px + 8px + 157px = 266px.
- **Total required width**:
  `135px (.mobile-brand) + 266px (.topbar-actions) + 40px (padding) = 441px`.
- **Viewport comparison**:
  - At iPhone 13 (390px): 441px > 390px (overflows by 51px).
  - At iPhone SE (375px): 441px > 375px (overflows by 66px).

### Observation 4: Style Sheet Lacks `.theme-label` Rules
- **Location**: `src/style.css`
- **Search**: `grep_search` across `src/style.css` confirms `.theme-label` appears 0 times.
- **Media Query**: Under `@media (max-width: 760px)` (line 2823), only padding and font-size were reduced:
  ```css
  @media (max-width: 760px) {
    .topbar-actions {
      gap: 8px;
    }
    .theme-toggle {
      padding: 6px 11px;
      font-size: 11px;
    }
  ...
  ```
- **Finding**: `.theme-label` is never hidden on mobile screens.

---

## 3. Recommended Remediation Plan

### Change 1: Update `src/main.js`
1. Structure `.topbar-theme-toggle` with discrete `<span class="theme-icon">` and `<span class="theme-label">` elements.
2. Add `aria-hidden="true"` to `.theme-icon` to prevent emoji speech duplication.
3. Provide an explicit, accessible label `aria-label="Växla tema"` (or retain descriptive dynamic label, or use both via `aria-label="Växla tema"` with dynamic `title`).
4. (Optional consistency): Update `.sidebar-theme-toggle` to use `<span class="theme-icon">` and `<span class="theme-label">` as well.

Proposed diff snippet for `src/main.js`:
```html
<button
  type="button"
  class="theme-toggle topbar-theme-toggle"
  @click=${toggleTheme}
  aria-label="Växla tema"
  title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Växla till Sakura Anime-tema'}
>
  ${state.theme === 'sakura'
    ? html`<span class="theme-icon" aria-hidden="true">🎓</span><span class="theme-label">Klassisk</span>`
    : html`<span class="theme-icon" aria-hidden="true">🌸</span><span class="theme-label">Sakura</span>`}
</button>
```

### Change 2: Update `src/style.css`
1. Define base styling for `.theme-icon`:
   ```css
   .theme-icon {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     line-height: 1;
     font-size: 14px;
   }
   ```
2. Under `@media (max-width: 760px)`:
   - Hide `.topbar-theme-toggle .theme-label`:
     ```css
     .topbar-theme-toggle .theme-label {
       display: none;
     }
     ```
   - Compact `.topbar-theme-toggle` into an icon-only button:
     ```css
     .topbar-theme-toggle {
       padding: 6px 10px;
       min-width: 36px;
       min-height: 36px;
       justify-content: center;
       gap: 0;
     }
     ```
   - Adjust `.topbar` padding in `@media (max-width: 760px)` to `0 16px;` (from `0 20px;`) for safe breathing room on narrow 360–375px screens.

---

## 4. Verification Impact Analysis

With these adjustments:
- Button width becomes: `14px (icon) + 20px (padding) + 2px (border) = 36px`.
- `.topbar-actions` width becomes: `36px + 8px + 157px = 201px`.
- Total topbar width: `135px + 201px + 32px (padding 16px*2) = 368px`.
- At iPhone 13 (390px): 368px <= 390px (passes with 22px margin).
- At iPhone SE (375px): 368px <= 375px (passes with 7px margin).
- `tests/e2e/app.spec.js:138` will pass cleanly.
- `tests/e2e/theme_stress.spec.js:234` continues to pass because the button remains interactive with a valid click target.
- Accessibility is enhanced: screen readers read the explicit `aria-label="Växla tema"`, and visual users see tooltips via `title`.
