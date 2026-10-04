# Handoff Report: Quick Guide Modal Empirical Stress Testing (Milestone M1)

**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**

---

## 1. Observation

### Code Implementations Observed
- `src/main.js` (lines 230–297):
  - `openGuideModal(guideId = null)` creates `<dialog class="guide-modal">` if not present, renders `guideModalTemplate`, attaches `cancel` listener with `{ once: true }` calling `closeDialog()`, attaches `click` listener for backdrop dismissal (`e.target === dialog` and coordinate check), calls `dialog.showModal()`, and scrolls/focuses target guide card via `requestAnimationFrame`.
  - `closeDialog` stops speech (`stopSpeech()`), calls `dialog.close()`, calls `dialog.remove()`, and restores focus to `previousActiveElement`.
  - Lines 633–638: `window.openGuideModal = openGuideModal` is globally registered, with a global `open-guide-modal` custom event listener on `window`.
- `src/views/session.js` (lines 143–166):
  - Contrastive callout renders `Öppna snabbguide` button with `BookOpen` icon when `contrastive.guideId` exists.
  - Clicking invokes `ctx.openGuideModal(contrastive.guideId)` or dispatches `open-guide-modal`.
  - Session state (`s.index`, `s.ids`, `s.answers`, `s.grades`, `s.revealed`) is entirely decoupled from dialog DOM operations.
- `src/views/guide.js` (lines 11–34, 65–95):
  - `resolveGuideId` normalizes aliases (`ni-vs-de` -> `ni-de`, `wa-vs-ga` -> `wa-ga`, `particles` -> `ni-de`, etc.).
  - Header has `.guide-modal-close` button (`@click=${onClose}`).
  - Footer has `.guide-modal-footer button.primary` ("Återgå till övningen", `@click=${onClose}`).
- `src/style.css` (lines 1763–1860, 1993–2006):
  - Desktop: dialog styled with `margin: auto`, `padding: 0`, `overflow: hidden`, max width `min(840px, calc(100vw - 32px))`, centered with dark translucent backdrop `rgba(19, 43, 36, 0.6)`.
  - Mobile (`@media (max-width: 820px)`): dialog occupies full screen (`width: 100vw; height: 100dvh; max-height: 100dvh; border-radius: 0; margin: 0;`), with dismiss buttons placed within reach.

### Verbatim Tool Execution Commands & Outputs
1. **Unit & Requirement Suite Execution (`npm test`)**:
   ```
   > tentaplugg-japanska@1.0.0 test
   > node --test --test-isolation=none tests/*.test.js

   ✔ Japanese width and punctuation do not reject valid answers...
   ...
   ✔ Tier 4: Scenario 1 - Practice session with contrastive feedback, Quick Guide lookup...
   ...
   ℹ tests 44
   ℹ suites 0
   ℹ pass 44
   ℹ fail 0
   ℹ duration_ms 109.8557
   ```
2. **Empirical Playwright Stress Suite Execution (`npx playwright test tests/e2e/quickguide_modal_stress.spec.js`)**:
   ```
   Running 14 tests using 3 workers

   ok  1 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:249:3 › Focus management and restoration to previous active element (773ms)
   ok  2 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:211:3 › Backdrop dismiss geometry accurately distinguishes inside clicks from outside clicks (767ms)
   ok  3 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:12:3 › Multi-question session with modal opened and closed across distinct dismiss triggers (2.0s)
   ok  4 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:269:3 › Memory and DOM hygiene: 30 consecutive open/close cycles leave zero orphaned elements or listeners (2.1s)
   ok  5 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:316:3 › Aliased guide IDs and invalid guide IDs resolve smoothly without errors (890ms)
   ok  6 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:350:3 › TTS speech is stopped upon modal dismiss (619ms)
   ok  7 [chromium] › tests/e2e/quickguide_modal_stress.spec.js:386:3 › Contrastive callout in session renders BookOpen icon and opens corresponding guide card (1.5s)
   ok  8 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:12:3 › Multi-question session with modal opened and closed across distinct dismiss triggers (6.8s)
   ok  9 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:211:3 › Backdrop dismiss geometry accurately distinguishes inside clicks from outside clicks (1.6s)
   ok 10 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:249:3 › Focus management and restoration to previous active element (1.7s)
   ok 11 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:269:3 › Memory and DOM hygiene: 30 consecutive open/close cycles leave zero orphaned elements or listeners (7.6s)
   ok 12 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:316:3 › Aliased guide IDs and invalid guide IDs resolve smoothly without errors (1.7s)
   ok 13 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:350:3 › TTS speech is stopped upon modal dismiss (1.5s)
   ok 14 [webkit-mobile] › tests/e2e/quickguide_modal_stress.spec.js:386:3 › Contrastive callout in session renders BookOpen icon and opens corresponding guide card (4.6s)

   14 passed (14.9s)
   ```
3. **Full Project E2E Suite Execution (`npx playwright test`)**:
   - 26 tests across Chromium and Mobile WebKit: **26 passed (21.7s)**.
4. **Production Build (`npm run build`)**:
   - `vite v7.3.6 building client environment for production...`
   - `✓ 1592 modules transformed.`
   - `✓ built in 1.80s` (Exit code 0).

---

## 2. Logic Chain

1. **Simulated Student Session Workflow & Invariant Preservation**:
   - In `tests/e2e/quickguide_modal_stress.spec.js` (Test 1 & 8), an active student practice session was driven across 5 consecutive questions.
   - At each question, the student opened and dismissed the modal using a different dismiss trigger:
     - Question 1: Close button (`.guide-modal-close`)
     - Question 2: `Escape` keyboard key
     - Question 3: Footer button (`Återgå till övningen`)
     - Question 4: Backdrop click (viewport coordinates outside modal bounds)
     - Question 5: 10 repeated consecutive rapid open/close cycles
   - Deep equality assertions (`expect(stateAfter.index).toBe(indexBefore)`, `expect(stateAfter.ids).toEqual(stateBefore.ids)`, `expect(stateAfter.answers).toEqual(stateBefore.answers)`, `expect(stateAfter.grades).toEqual(stateBefore.grades)`, `expect(stateAfter.attemptId).toBe(stateBefore.attemptId)`) verified that `state.session` remained 100% identical before and after each modal interaction.
   - Therefore, the modal is strictly non-destructive.

2. **Modal Dismiss Triggers & Edge Case Geometry**:
   - Test 2 verifies that clicking INSIDE the modal bounding box (center, near top border, near bottom border, header text, card body) NEVER dismisses the modal (`e.target !== dialog`).
   - Clicking OUTSIDE the dialog bounding box (on the `::backdrop`) correctly triggers `isBackdrop = true` and cleanly closes the modal.
   - Keyboard `Escape` fires `<dialog>` native `cancel` event, which triggers `closeDialog()` via `{ once: true }`.

3. **Memory Leaks and Orphaned DOM Nodes**:
   - Test 4 subjects the DOM to 30 rapid, consecutive open and close cycles across rotating dismiss triggers.
   - After each cycle, `document.querySelectorAll('dialog.guide-modal').length` is asserted to be exactly 0.
   - After 30 cycles, `document.querySelectorAll('dialog').length` remains 0. Zero zombie dialogs or detached `<dialog>` nodes accumulate in `document.body`.
   - Event listeners attached in `openGuideModal` are on the local `dialog` element, which is detached via `dialog.remove()`, allowing full garbage collection. The single `open-guide-modal` window listener is registered once at application bootstrap.

4. **Focus Restoration & Speech Cleanup**:
   - Test 3 verifies that focusing a trigger button (e.g. `Träna partiklar` or `Öppna snabbguide`), opening the modal, and closing it immediately returns active focus to that exact button (`previousActiveElement.focus()`).
   - Test 6 verifies that closing the modal unconditionally triggers `stopSpeech()`, canceling any active speech synthesis utterances.

5. **Guide Aliases and Resilience**:
   - Test 5 verifies that normalized aliases (`ni-vs-de`, `de-vs-ni`, `wa-vs-ga`, `ga-vs-wa`, `wo-vs-to`, `particles`, `guide-ni-de`), as well as null or unknown guide IDs, open the modal smoothly without unhandled exceptions or broken highlights.

---

## 3. Stress Test Results Summary

| Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|:---:|
| 5-Question Session with Modal Opens | Questions progress; answers and grades stay intact | Invariants 100% preserved before and after all modal interactions | **PASS** |
| Dismiss Trigger: Escape key | Fires cancel, closes dialog, removes from DOM | Dialog closed; 0 dialogs in DOM | **PASS** |
| Dismiss Trigger: Close Button | Invokes onClose, closes and removes dialog | Dialog closed; 0 dialogs in DOM | **PASS** |
| Dismiss Trigger: Footer Button | Invokes onClose, closes and removes dialog | Dialog closed; 0 dialogs in DOM | **PASS** |
| Dismiss Trigger: Backdrop Click | Geometry check identifies outside click and closes | Outside clicks close; inside clicks do not close | **PASS** |
| 30 Rapid Open/Close Cycles | No orphaned DOM dialogs, no memory leaks | 0 dialog elements remain in `document.body` | **PASS** |
| Focus Restoration | Focus returns to trigger button after dismiss | Previous active element receives focus | **PASS** |
| TTS Audio Cancellation | Closing modal calls `stopSpeech()` | Speech synthesis cancelled on modal close | **PASS** |
| Guide ID Alias Resolution | Maps variations (`ni-vs-de`, `particles`, etc.) | All aliases scroll & highlight target card | **PASS** |
| Mobile Viewport (iPhone 13) | Full-screen responsive layout without clipping | Modal renders cleanly at 100vw x 100dvh; dismiss buttons work | **PASS** |

---

## 4. Caveats

- On mobile viewports (`max-width: 820px`), CSS sets `dialog.guide-modal` to `width: 100vw; height: 100dvh`. Because there is no visible backdrop area around a full-screen dialog, dismissing on mobile relies on the close button (`.guide-modal-close`), the footer button, or the hardware Escape key. This is standard mobile UX and functions as designed.
- No other caveats.

---

## 5. Conclusion

**Verdict**: **APPROVE**

The non-destructive Quick Guide modal integration in `src/main.js`, `src/views/session.js`, and `src/views/guide.js` satisfies all requirements of Milestone M1 (R1). The session state invariants are 100% preserved across repeated modal toggling, all dismiss triggers work reliably across desktop and mobile, focus restoration and speech cleanup are properly handled, and the DOM remains clean without leaks.

---

## 6. Verification Method

To independently verify these empirical results:

1. **Run Unit & Requirement Tests**:
   ```powershell
   npm test
   ```
   *Expected*: 44 passing tests, 0 failures.

2. **Run Empirical Playwright Stress Tests**:
   ```powershell
   npx playwright test tests/e2e/quickguide_modal_stress.spec.js
   ```
   *Expected*: 14 passing tests across desktop Chromium and mobile WebKit.

3. **Run Full E2E Suite**:
   ```powershell
   npx playwright test
   ```
   *Expected*: 26 passing tests across Chromium and WebKit.

4. **Run Production Build**:
   ```powershell
   npm run build
   ```
   *Expected*: Clean Vite build exit code 0.
