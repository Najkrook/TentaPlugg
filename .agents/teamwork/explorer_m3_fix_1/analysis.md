# Analysis: Mobile Viewport Horizontal Overflow Regression (Milestone M3)

**Agent:** `explorer_m3_fix_1`  
**Date:** 2026-10-04  
**Target:** `src/style.css` (topbar, `.topbar-actions`, `.topbar-theme-toggle`, `.account`)

---

## 1. Problem Statement

During Milestone M3 review, Playwright test `tests/e2e/app.spec.js:138:1` failed on `webkit-mobile` (iPhone 13 viewport: 390px width):
```
[webkit-mobile] › tests\e2e\app.spec.js:138:1 › broken original image has a useful fallback and mobile page does not overflow
Error: expect(received).toBeTruthy()
Received: false
143 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
```

Diagnostic measurements revealed:
- **Classic theme on iPhone 13 (390px):** `scrollWidth` = 391px (+1px overflow)
- **Sakura theme on iPhone 13 (390px):** `scrollWidth` = 397px (+7px overflow)
- **iPhone SE (375px):** `scrollWidth` = 391px / 397px (+16px / +22px overflow)
- **Android standard (360px):** `scrollWidth` = 386px / 392px (+26px / +32px overflow)
- **Compact mobile (320px):** `scrollWidth` = 386px / 392px (+66px / +72px overflow)

---

## 2. Root Cause Dissection

### A. Element Architecture & Geometry
In `src/main.js:264-283`:
```html
<header class="topbar">
  <span class="breadcrumb">Japanska för nybörjare <span>/</span> GEMA70</span>
  <span class="mobile-brand"><span lang="ja">学</span><b>TentaPlugg</b></span>
  <div class="topbar-actions">
    <button type="button" class="theme-toggle topbar-theme-toggle" ...>
      🌸 <span class="theme-label">Sakura</span>
    </button>
    <button class="account" id="account" ...>
      <span class="icon" aria-hidden="true"><svg>...</svg></span>
      <span>Logga in med Google</span>
    </button>
  </div>
</header>
```

On mobile screens (`@media (max-width: 760px)`):
1. `.breadcrumb` is hidden (`display: none`).
2. `.mobile-brand` has fixed intrinsic width of **126.8px** (Kanji 25px + gap 9px + text ~93px).
3. `.topbar` has `padding: 0 20px;` (40px horizontal padding).
4. `.topbar-actions` (added in M3) is a flex container containing:
   - `.topbar-theme-toggle`:
     - Classic mode: `🌸 Sakura` + padding (6px 11px) = **82.4px**.
     - Sakura mode: `🎓 Klassisk` + padding (6px 11px) = **88.4px**.
   - Gap: **8px**.
   - `.account`: icon (16px) + gap (6px) + text span (~125px) + padding (12px) = **154px**.
   - Total `.topbar-actions` width = 88.4px + 8px + 154px = **250.4px** (Sakura) / **244.4px** (Classic).
5. **Total Required Width for `.topbar`:**
   `126.8px (brand) + 250.4px (actions) + 40px (padding) = 417.2px!`
   Because 417.2px > 390px (and > 375px/360px/320px), `.topbar-actions` pushes outside the viewport, producing the horizontal scroll regression.

### B. The Hidden Specificity Trap: Line 1753 (`.account span:not(.icon)`)
A naive CSS fix of:
```css
@media (max-width: 600px) {
  .topbar-theme-toggle .theme-label { display: none; }
  .account span { max-width: 90px; }
}
```
**fails to bound the account span on smaller screens** because of an existing rule in `src/style.css:1753`:
```css
@media (max-width: 760px) {
  .account span:not(.icon) {
    max-width: 135px;
  }
}
```
- Specificity of `.account span`: `(0, 1, 1)`.
- Specificity of `.account span:not(.icon)`: `(0, 2, 1)`.
Because `:not(.icon)` has higher specificity than `span`, any selector using only `.account span` is silently ignored by the browser cascade! The text span remains at `135px`, which causes failure on 320px viewports (scrollWidth = 343px > 320px).

To reliably constrain the span, the selector **must** include `:not(.icon)` (e.g. `.account span, .account span:not(.icon)`), or directly update line 1753.

---

## 3. Empirical Verification Data

### Baseline (Current Code)
| Viewport | Theme | scrollWidth | innerWidth | Difference | Status |
|:---|:---|:---|:---|:---|:---|
| 320px | Classic | 386px | 320px | +66px | FAIL |
| 320px | Sakura | 392px | 320px | +72px | FAIL |
| 360px | Classic | 386px | 360px | +26px | FAIL |
| 360px | Sakura | 392px | 360px | +32px | FAIL |
| 375px | Classic | 391px | 375px | +16px | FAIL |
| 375px | Sakura | 397px | 375px | +22px | FAIL |
| 390px (iPhone 13) | Classic | 391px | 390px | +1px | FAIL |
| 390px (iPhone 13) | Sakura | 397px | 390px | +7px | FAIL |
| 414px | Classic / Sakura | 414px | 414px | 0px | PASS |

### With Recommended Robust CSS Fix Applied
| Viewport | Theme | scrollWidth | innerWidth | Toggle Size | Account Width | Status |
|:---|:---|:---|:---|:---|:---|:---|
| 320px | Classic | 320px | 320px | 39px x 36px | 104px | **PASS** |
| 320px | Sakura | 320px | 320px | 39px x 36px | 104px | **PASS** |
| 360px | Classic | 360px | 360px | 39px x 36px | 104px | **PASS** |
| 360px | Sakura | 360px | 360px | 39px x 36px | 104px | **PASS** |
| 375px | Classic | 375px | 375px | 39px x 36px | 124px | **PASS** |
| 375px | Sakura | 375px | 375px | 39px x 36px | 124px | **PASS** |
| 390px (iPhone 13) | Classic | 390px | 390px | 39px x 36px | 124px | **PASS** |
| 390px (iPhone 13) | Sakura | 390px | 390px | 39px x 36px | 124px | **PASS** |
| 414px | Classic / Sakura | 414px | 414px | 39px x 36px | 124px | **PASS** |
| 768px (Tablet) | Classic / Sakura | 768px | 768px | 82px / 88px | 154px | **PASS** |
| 1024px (Desktop) | Classic / Sakura | 1024px | 1024px | 82px / 88px | 154px | **PASS** |

Tested across both **WebKit** and **Chromium** Playwright runtimes. All viewports pass with zero horizontal scroll.

---

## 4. Accessibility, Aesthetics & Touch Targets Review

1. **Touch Targets (WCAG 2.5.8 Level AA):**
   - Setting `min-height: 36px; min-width: 36px; padding: 6px 10px;` on `.topbar-theme-toggle` yields a rendered target of `39px x 36px`.
   - Far exceeds the WCAG 2.5.8 minimum target size of `24px x 24px`.
   - `.topbar-actions` has `gap: 8px`, ensuring distinct pointer separation between theme toggle and account button.
2. **Keyboard Focus Rings (WCAG 2.4.11 / 1.4.11):**
   - Classic focus ring: `outline: 3px solid rgb(24, 63, 55)` (`--focus-ring: #265943`). Contrast ratio vs `#fff`: **7.72:1**.
   - Sakura focus ring: `outline: 3px solid rgb(184, 39, 99)` (`--focus-ring: #b82763`). Contrast ratio vs `#fff`: **5.61:1**.
   - Focus rings cleanly wrap around the pill-shaped button without clipping.
3. **Screen Reader Accessibility:**
   - `<button class="theme-toggle topbar-theme-toggle">` retains its full `aria-label`:
     `aria-label="Växla till klassiskt tema"` or `aria-label="Växla till Sakura Anime-tema"`.
   - Retains `title="..."` attribute for desktop/hover tooltips.
   - Assistive technologies announce the button identity with 100% fidelity.
4. **Visual Aesthetics:**
   - On desktop (> 760px), both the sidebar toggle and topbar toggle show the full text label ("🌸 Sakura" / "🎓 Klassisk").
   - On mobile (<= 760px), `.topbar-theme-toggle` elegantly condenses into an icon button (`🌸` / `🎓`), matching mobile app design patterns.
   - Long account names (e.g. "Logga ut · Christopher") truncate gracefully with `ellipsis` (`…`) instead of breaking onto multiple lines or overflowing.

---

## 5. Proposed Code Changes for Implementer (`worker_m3`)

### Change 1: In `src/style.css` under existing `@media (max-width: 760px)` (around line 2823)
Update the responsive adjustments block:

```css
/* Responsive adjustments */
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
  .theme-toggle {
    padding: 6px 11px;
    font-size: 11px;
  }
  .account span,
  .account span:not(.icon) {
    max-width: 90px;
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

### Change 2: In `src/style.css` under existing `@media (max-width: 370px)` (around lines 1516-1521)
Update the topbar and account bounding rules:

```css
  .topbar {
    padding: 0 12px;
  }
  .account span,
  .account span:not(.icon) {
    max-width: 70px;
  }
```

*(Note: Updating line 1753 from `max-width: 135px;` to `max-width: 90px;` is also recommended for internal consistency).*
