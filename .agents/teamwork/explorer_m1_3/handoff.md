# Handoff Report: Quick Guide Modal Dialog & Styling Design (Milestone M1)

**Agent**: `explorer_m1_3`  
**Date**: 2026-10-04  
**Handoff Type**: Hard (Task Complete)  
**Target Files**: `src/main.js`, `src/views/guide.js`, and `src/style.css`  

---

## 1. Observation

1. **Destructive Navigation in `src/main.js`**:
   - Location: `src/main.js` lines 252–257:
     ```javascript
     function navigate(id) {
       flush();
       session = null;
       view = id;
       render(true);
     }
     ```
   - When a student clicks "Snabbguide" in the sidebar navigation or mobile navigation menu (`src/main.js:48`), `navigate('guide')` runs, setting `session = null`. This destroys the active practice or exam session in memory.

2. **Existing Native `<dialog>` Pattern in `src/main.js`**:
   - Location: `src/main.js` lines 226–251:
     ```javascript
     function ask(text, confirmLabel = 'Fortsätt') {
       return new Promise((resolve) => {
         const dialog = document.createElement('dialog');
         dialog.className = 'confirm-dialog';
         const done = (value) => {
           dialog.close();
           dialog.remove();
           resolve(value);
         };
         renderTemplate(
           html`<h2>Innan du fortsätter</h2>...`,
           dialog,
         );
         document.body.append(dialog);
         dialog.addEventListener('cancel', (e) => {
           e.preventDefault();
           done(false);
         });
         dialog.showModal();
       });
     }
     ```
   - Shows that modal interactions using native HTML5 `<dialog>` and `lit-html`'s `renderTemplate` are standard and well-supported in this codebase.

3. **Rigid Full-Page Guide Layout in `src/views/guide.js`**:
   - Location: `src/views/guide.js` lines 5–17:
     ```javascript
     export const guideView = (ctx) =>
       html`${heading('NÄR DU BEHÖVER EN LEDTRÅD', 'Snabbguide', 'Reglerna du oftast behöver på tentorna.')}
         <div class="guide-grid">
           ${guides.map(
             (g, i) =>
               html`<article class="guide">
                 <span class="guide-index">0${i + 1}</span>
                 <h2>${g.title}</h2>
                 <p>${languageText(g.text)}</p>
                 ${speechButton(ctx, japaneseText(g.text), 'Lyssna på exemplen')}
               </article>`,
           )}
         </div>
     ```
   - Articles in `.guide-grid` lack `id` and `data-guide-id`. They cannot be targeted for scrolling or highlighted programmatically.
   - The view is coupled to full-page headings and the additional `<section class="section-block">`.

4. **Missing Modal and Contrastive Box Styles in `src/style.css`**:
   - `grep_search` across `src/style.css` reveals 0 occurrences of `.guide-modal`, `.guide-highlight`, or `.contrastive-box`.
   - `.confirm-dialog` is defined at line 1531 of `src/style.css`, but has fixed dimensions (`max-width: min(430px, calc(100% - 32px))`) unsuitable for a multi-card reference guide.

5. **Engine Output Alignment**:
   - Location: `src/engine.js` lines 227–325:
     `getContrastiveFeedback` returns `{ text, guideId }` where `guideId` values include `'ni-de'`, `'wa-ga'`, `'wo-to-no-mo'`, `'no-particle'`, `'adjectives'`, `'moras'`.
     These correspond 1-to-1 with the `id` values of `guides` in `src/data.js` (lines 745–776).

---

## 2. Logic Chain

1. **From Observation 1**: To preserve `session` during an active practice or exam, accessing the Quick Guide must **never** invoke `navigate()`. Instead, it must be presented in a top-layer overlay (`<dialog class="guide-modal">`).
2. **From Observation 2**: Building upon the native `<dialog>` pattern established by `ask()` allows clean modal lifecycle management (`dialog.showModal()`, `dialog.close()`, `dialog.remove()`), native focus trapping, and zero interference with the main app render loop.
3. **From Observation 3 & 5**: Refactoring `src/views/guide.js` into modular renderers (`guideCards`, `guideModalTemplate`, and `guideView`) and adding `id="guide-${g.id}"`, `data-guide-id="${g.id}"`, and `.guide-highlight` ensures both the full view and the modal share identical data, while enabling direct scroll-to-rule behavior when invoked from contrastive feedback.
4. **From Observation 4**: Adding responsive CSS for `.guide-modal` (with backdrop blur, sticky header/footer, and mobile-friendly touch scrolling) and `.contrastive-box` (amber indicator, high contrast text) completes the visual and pedagogical bridge between session errors and reference rules.
5. **From Logic 1–4**: Exposing `openGuideModal(guideId)` on `ctx` allows `src/views/session.js` to trigger the modal without prop-drilling or breaking encapsulation, and restoring focus to `document.activeElement` preserves keyboard accessibility.

---

## 3. Caveats

- **Speech audio termination**: If a student starts audio playback via `speechButton` inside the modal, closing the modal should call `stopSpeech()` so speech does not continue playing over subsequent question audio. This is accounted for in the design.
- **Backdrop click on padding**: When `<dialog>` has default user-agent margins or padding, click coordinates must be tested against `dialog.getBoundingClientRect()` to prevent unintended closures when clicking inside the content area. This is solved with exact coordinate checking.
- **Reduced motion**: In environments with `prefers-reduced-motion: reduce`, `scrollIntoView` behavior must degrade gracefully to `'auto'` / instant scroll.

---

## 4. Conclusion

A non-destructive Quick Guide modal dialog and contrastive feedback styling architecture has been designed with precision:
1. `src/views/guide.js` provides `resolveGuideId()`, `guideCards()`, and `guideModalTemplate()` with element IDs and highlight styling.
2. `src/main.js` provides `openGuideModal(guideId)` exposed via `ctx.openGuideModal` and `window.openGuideModal`, handling backdrop click, ESC key, and focus restoration without touching `state.session`.
3. `src/style.css` provides complete CSS rules for `dialog.guide-modal`, `.guide-highlight`, `.guide-badge`, `.contrastive-box`, and mobile media queries exceeding WCAG AA (>7:1 contrast).

---

## 5. Verification Method

1. **Unit Test Suite**:
   Execute Node test runner:
   ```powershell
   npm test
   ```
   *Expected outcome*: All 24 existing unit tests pass with zero regressions.
2. **Build Verification**:
   Execute Vite production build:
   ```powershell
   npm run build
   ```
   *Expected outcome*: Clean build with exit code 0, bundling all templates and styles.
3. **Interactive & E2E Verification**:
   - In a practice session on particle questions (`p-0` or `l5-1`), submit an incorrect answer (`に` instead of `で`).
   - Verify `.contrastive-box` renders explaining why `に` was incorrect and displaying button `Läs om regeln i Snabbguiden`.
   - Click the button; verify `<dialog class="guide-modal">` opens with `document.querySelector('dialog.guide-modal').open === true`.
   - Verify card `#guide-ni-de` has class `.guide-highlight` and is centered in the scroll view.
   - Press ESC or click backdrop; verify modal closes and question input and session track remain on the exact same question index (`s.index`).
