# Handoff Report: Topbar Theme Toggle Mobile Viewport Overflow Regression

## 1. Observation
- **Reproducible Failure**: Running `npx playwright test tests/e2e/app.spec.js -g "broken original image" --project=webkit-mobile --workers=1` fails on line 144:
  `expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()` received `false`.
- **Root Element Rendering (`src/main.js:268–276`)**:
  ```javascript
  <button
    type="button"
    class="theme-toggle topbar-theme-toggle"
    @click=${toggleTheme}
    aria-label=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Växla till Sakura Anime-tema'}
    title=${state.theme === 'sakura' ? 'Växla till klassiskt tema' : 'Växla till Sakura Anime-tema'}
  >
    ${state.theme === 'sakura' ? html`🎓 <span class="theme-label">Klassisk</span>` : html`🌸 <span class="theme-label">Sakura</span>`}
  </button>
  ```
  - Emojis `🎓` and `🌸` are un-isolated text nodes with trailing spaces, lacking `<span class="theme-icon">`.
- **CSS Styling (`src/style.css:2275, 2822`)**:
  - Class `.theme-label` is not referenced anywhere in `src/style.css`.
  - Class `.theme-icon` does not exist in `src/style.css`.
  - In `@media (max-width: 760px)`, `.theme-toggle` maintains text labels, keeping `.topbar-theme-toggle` width at ~95–101px.
- **Header Geometry**:
  - Combined required width in mobile header:
    - `.mobile-brand`: ~135px
    - `.topbar-theme-toggle`: ~101px
    - Gap in `.topbar-actions`: 8px
    - `.account`: ~157px
    - `.topbar` padding: 40px (20px left + 20px right)
    - Total: 441px.
  - iPhone 13 viewport width: 390px. 441px > 390px, causing horizontal page overflow.

## 2. Logic Chain
1. *Observation*: `document.documentElement.scrollWidth <= innerWidth` fails on `webkit-mobile` (iPhone 13 viewport width: 390px).
2. *Observation*: The total minimum width of `.topbar` is 441px due to children `.mobile-brand` (135px) and `.topbar-actions` (266px), plus 40px padding.
3. *Observation*: Inside `.topbar-actions`, `.topbar-theme-toggle` has width ~101px because it renders both emoji and text label ("Sakura" / "Klassisk") due to the lack of a responsive hiding rule for `.theme-label`.
4. *Inference*: If `.topbar-theme-toggle .theme-label` is hidden on mobile screens (`display: none;`) and the button is sized to an icon-only button (~36px width), `.topbar-actions` width drops from 266px to 201px.
5. *Inference*: With topbar padding adjusted to `0 16px` on mobile, total topbar width becomes `135px + 201px + 32px = 368px`, which fits comfortably inside 390px and 375px viewports without horizontal overflow.
6. *Inference*: Wrapping the emoji in `<span class="theme-icon" aria-hidden="true">` cleanly separates visual icon presentation from the text label, prevents screen readers from duplicating emoji speech, and preserves full button clickability and accessibility via `aria-label="Växla tema"` and `title`.

## 3. Caveats
- Only read-only investigation was conducted per explorer archetype constraints. No source files were modified.
- Desktop and tablet viewports (>760px) are unaffected by this regression; sidebar and desktop topbar remain visually unchanged.
- Ensure that when `.theme-label` is hidden, the button maintains a minimum touch target (e.g. 36x36px or 40x40px) to comply with mobile touch guidelines.

## 4. Conclusion
The mobile horizontal overflow regression is resolved by:
1. **In `src/main.js`**: Wrap the toggle emoji in `<span class="theme-icon" aria-hidden="true">`, retain `<span class="theme-label">` for the text, and set accessible attributes:
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
2. **In `src/style.css`**:
   - Add `.theme-icon` helper styles (`display: inline-flex; align-items: center; justify-content: center; font-size: 14px;`).
   - Under `@media (max-width: 760px)`, add:
     ```css
     .topbar-theme-toggle .theme-label {
       display: none;
     }
     .topbar-theme-toggle {
       padding: 6px 10px;
       min-width: 36px;
       min-height: 36px;
       justify-content: center;
       gap: 0;
     }
     ```
   - In `@media (max-width: 760px)`, set `.topbar { padding: 0 16px; }` to provide safe margin for 360–375px viewports.

## 5. Verification Method
After implementation, independently verify with:
1. `npx playwright test tests/e2e/app.spec.js -g "broken original image" --project=webkit-mobile --workers=1`
   - Invalidation condition: `document.documentElement.scrollWidth <= innerWidth` evaluates to `false`.
2. `npx playwright test tests/e2e/theme_stress.spec.js --project=webkit-mobile --workers=1`
   - Invalidation condition: Theme toggle fails to click or switch theme attributes in DOM / localStorage on mobile viewport.
3. `npm test`
   - All 67 node unit/empirical stress tests pass.
4. `npm run build`
   - Production Vite build completes with exit code 0.
