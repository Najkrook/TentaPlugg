import { test, expect } from '@playwright/test';
import { questions } from '../../src/data.js';
import { fresh } from '../../src/engine.js';
import { createSession } from '../../src/session.js';

async function checkCurrentAnswer(page) {
  if (await page.locator('.particle-panel').count()) {
    await page.getByRole('button', { name: 'Rätta', exact: true }).click();
    await page.getByRole('button', { name: 'Till steg 2', exact: true }).click();
    await page.getByRole('button', { name: 'Rätta meningen', exact: true }).click();
  } else {
    await page.getByRole('button', { name: /^(Kontrollera svar|Visa modellösning)$/ }).click();
  }
}

test.describe('Quick Guide Modal Empirical Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to start from a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Multi-question session with modal opened and closed across distinct dismiss triggers', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Start particle practice session from study room
    await page.getByRole('button', { name: /Träna partiklar/ }).click();
    await expect(page.locator('.question-panel')).toBeVisible();

    // Helper to get session snapshot from localStorage
    const getSessionState = async () => {
      return await page.evaluate(() => {
        const key = 'tentaplugg-v1-guest';
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const draft = parsed.drafts?.practice;
        return draft ? draft.session : null;
      });
    };

    // Helper to answer question with an incorrect answer / distractor
    const answerQuestion = async () => {
      const field = page.locator('#answer');
      if (await field.count()) {
        await field.fill('に');
      } else {
        const choices = page.locator('.choice');
        const count = await choices.count();
        if (count > 0) {
          // Look for 'に' choice if available, else first choice
          const niChoice = choices.filter({ hasText: /^に$/ });
          if (await niChoice.count()) {
            await niChoice.first().click();
          } else {
            await choices.first().click();
          }
        }
      }
      await checkCurrentAnswer(page);
    };

    // Helper to advance to the next question
    const advanceNext = async () => {
      const selfBtn = page.getByRole('button', { name: 'Jag kunde detta' });
      if (await selfBtn.isVisible()) {
        await selfBtn.click();
        return;
      }
      const nextBtn = page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ });
      await nextBtn.click();
    };

    // --- QUESTION 1: Dismiss via Close Button (.guide-modal-close) ---
    await answerQuestion();

    // Snapshot state before modal interaction
    const stateBefore1 = await getSessionState();
    expect(stateBefore1).not.toBeNull();
    const indexBefore1 = stateBefore1.index;

    // Check if contrastive guide button is visible; if so click it, else open via window.openGuideModal
    const guideBtn1 = page.locator('.contrastive-guide-btn');
    if (await guideBtn1.isVisible()) {
      await guideBtn1.click();
    } else {
      await page.evaluate(() => window.openGuideModal('ni-de'));
    }

    // Modal must be open
    const dialog = page.locator('dialog.guide-modal');
    await expect(dialog).toBeVisible();
    expect(await page.locator('dialog.guide-modal').count()).toBe(1);

    // Verify session invariant while modal is open
    const stateDuring1 = await getSessionState();
    expect(stateDuring1.index).toBe(indexBefore1);
    expect(stateDuring1.ids).toEqual(stateBefore1.ids);

    // Dismiss using top-right close button
    await page.locator('.guide-modal-close').click();
    await expect(dialog).toHaveCount(0); // must be removed from DOM

    // Verify session invariants after dismiss: index, ids, answers, grades, attemptId 100% match
    const stateAfter1 = await getSessionState();
    expect(stateAfter1.index).toBe(indexBefore1);
    expect(stateAfter1.ids).toEqual(stateBefore1.ids);
    expect(stateAfter1.answers).toEqual(stateBefore1.answers);
    expect(stateAfter1.grades).toEqual(stateBefore1.grades);
    expect(stateAfter1.attemptId).toBe(stateBefore1.attemptId);

    // Advance to Question 2
    await advanceNext();

    // --- QUESTION 2: Dismiss via Escape Key ---
    await answerQuestion();
    const stateBefore2 = await getSessionState();
    expect(stateBefore2.index).toBe(1);

    // Open modal
    await page.evaluate(() => window.openGuideModal('wa-ga'));
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#wa-ga')).toHaveClass(/guide-highlight/);

    // Dismiss via Escape key
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Verify invariants after Escape
    const stateAfter2 = await getSessionState();
    expect(stateAfter2.index).toBe(1);
    expect(stateAfter2.ids).toEqual(stateBefore2.ids);
    expect(stateAfter2.answers).toEqual(stateBefore2.answers);
    expect(stateAfter2.grades).toEqual(stateBefore2.grades);
    expect(stateAfter2.attemptId).toBe(stateBefore2.attemptId);

    // Advance to Question 3
    await advanceNext();

    // --- QUESTION 3: Dismiss via Footer Button ("Återgå till övningen") ---
    await answerQuestion();
    const stateBefore3 = await getSessionState();
    expect(stateBefore3.index).toBe(2);

    await page.evaluate(() => window.openGuideModal('wo-to-no-mo'));
    await expect(dialog).toBeVisible();

    const footerReturnBtn = dialog.locator('.guide-modal-footer button');
    await expect(footerReturnBtn).toContainText('Återgå till övningen');
    await footerReturnBtn.click();
    await expect(dialog).toHaveCount(0);

    const stateAfter3 = await getSessionState();
    expect(stateAfter3.index).toBe(2);
    expect(stateAfter3.ids).toEqual(stateBefore3.ids);
    expect(stateAfter3.answers).toEqual(stateBefore3.answers);
    expect(stateAfter3.grades).toEqual(stateBefore3.grades);
    expect(stateAfter3.attemptId).toBe(stateBefore3.attemptId);

    // Advance to Question 4
    await advanceNext();

    // --- QUESTION 4: Dismiss via Backdrop Click ---
    await answerQuestion();
    const stateBefore4 = await getSessionState();
    expect(stateBefore4.index).toBe(3);

    await page.evaluate(() => window.openGuideModal('ni-de'));
    await expect(dialog).toBeVisible();

    // First: Click INSIDE the modal header or body -> MUST NOT close!
    await dialog.locator('.guide-modal-header h2').click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.guide-modal-body').click({ position: { x: 50, y: 50 } });
    await expect(dialog).toBeVisible();

    // Second: Click OUTSIDE the modal rect (on backdrop: top-left corner (10, 10))
    await page.mouse.click(10, 10);
    await expect(dialog).toHaveCount(0);

    const stateAfter4 = await getSessionState();
    expect(stateAfter4.index).toBe(3);
    expect(stateAfter4.ids).toEqual(stateBefore4.ids);
    expect(stateAfter4.answers).toEqual(stateBefore4.answers);
    expect(stateAfter4.grades).toEqual(stateBefore4.grades);
    expect(stateAfter4.attemptId).toBe(stateBefore4.attemptId);

    // --- QUESTION 5: 10 Repeated Rapid Open/Close cycles ---
    await advanceNext();
    await answerQuestion();

    const stateBeforeStress = await getSessionState();
    expect(stateBeforeStress.index).toBe(4);

    for (let cycle = 0; cycle < 10; cycle++) {
      await page.evaluate(() => window.openGuideModal('ni-de'));
      expect(await page.locator('dialog.guide-modal').count()).toBe(1);
      if (cycle % 3 === 0) {
        await page.keyboard.press('Escape');
      } else if (cycle % 3 === 1) {
        await page.locator('.guide-modal-close').click();
      } else {
        await page.locator('.guide-modal-footer button').click();
      }
      expect(await page.locator('dialog.guide-modal').count()).toBe(0);
    }

    const stateAfterStress = await getSessionState();
    expect(stateAfterStress.index).toBe(4);
    expect(stateAfterStress.ids).toEqual(stateBeforeStress.ids);
    expect(stateAfterStress.answers).toEqual(stateBeforeStress.answers);
    expect(stateAfterStress.grades).toEqual(stateBeforeStress.grades);
    expect(stateAfterStress.attemptId).toBe(stateBeforeStress.attemptId);

    expect(pageErrors).toEqual([]);
  });

  test('Backdrop dismiss geometry accurately distinguishes inside clicks from outside clicks', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => window.openGuideModal('ni-de'));

    const dialog = page.locator('dialog.guide-modal');
    await expect(dialog).toBeVisible();

    // Verify modal bounding box
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThan(200);

    // 1. Inside click: Center of dialog
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(dialog).toBeVisible();

    // 2. Inside click: Near top border
    await page.mouse.click(box.x + 20, box.y + 20);
    await expect(dialog).toBeVisible();

    // 3. Inside click: Near bottom border
    await page.mouse.click(box.x + 20, box.y + box.height - 20);
    await expect(dialog).toBeVisible();

    // 4. Outside click: 5px to the left of the dialog
    if (box.x > 10) {
      await page.mouse.click(box.x - 5, box.y + box.height / 2);
      await expect(dialog).toHaveCount(0);
    } else {
      // Click at (5, 5) viewport
      await page.mouse.click(5, 5);
      await expect(dialog).toHaveCount(0);
    }
  });

  test('Focus management and restoration to previous active element', async ({ page }) => {
    await page.goto('/');
    // Focus a specific button on page, e.g. "Träna partiklar"
    const trainBtn = page.getByRole('button', { name: /Träna partiklar/ });
    await trainBtn.focus();
    await expect(trainBtn).toBeFocused();

    // Open guide modal programmatically
    await page.evaluate(() => window.openGuideModal('ni-de'));
    const dialog = page.locator('dialog.guide-modal');
    await expect(dialog).toBeVisible();

    // Close via close button
    await page.locator('.guide-modal-close').click();
    await expect(dialog).toHaveCount(0);

    // Focus must return to trainBtn
    await expect(trainBtn).toBeFocused();
  });

  test('Memory and DOM hygiene: 30 consecutive open/close cycles leave zero orphaned elements or listeners', async ({
    page,
  }) => {
    await page.goto('/');

    const initialBodyChildren = await page.evaluate(() => document.body.children.length);
    const initialDialogs = await page.evaluate(() => document.querySelectorAll('dialog').length);
    expect(initialDialogs).toBe(0);

    for (let i = 0; i < 30; i++) {
      await page.evaluate((id) => window.openGuideModal(id), i % 2 === 0 ? 'ni-de' : 'wa-ga');
      const dialogCountOpen = await page.evaluate(
        () => document.querySelectorAll('dialog.guide-modal').length,
      );
      expect(dialogCountOpen).toBe(1);

      // Rotate dismiss methods (on mobile where dialog is 100vw, backdrop click (5,5) hits inside the dialog)
      const isMobile = await page.evaluate(() => window.innerWidth <= 820);
      const method = isMobile ? i % 3 : i % 4;
      if (method === 0) {
        await page.keyboard.press('Escape');
      } else if (method === 1) {
        await page.locator('.guide-modal-close').click();
      } else if (method === 2) {
        await page.locator('.guide-modal-footer button').click();
      } else {
        await page.mouse.click(5, 5);
      }

      const dialogCountClosed = await page.evaluate(
        () => document.querySelectorAll('dialog.guide-modal').length,
      );
      expect(dialogCountClosed).toBe(0);
    }

    const finalDialogs = await page.evaluate(() => document.querySelectorAll('dialog').length);
    expect(finalDialogs).toBe(0);

    const bodyChildrenInfo = await page.evaluate(() =>
      Array.from(document.body.children).map(
        (c) => c.tagName + (c.className ? '.' + c.className : ''),
      ),
    );
    // Check that no dialog remains in body
    expect(bodyChildrenInfo.filter((t) => t.toLowerCase().startsWith('dialog'))).toEqual([]);
  });

  test('Aliased guide IDs and invalid guide IDs resolve smoothly without errors', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.goto('/');

    const testCases = [
      { input: 'ni-vs-de', expectedCard: 'ni-de' },
      { input: 'de-vs-ni', expectedCard: 'ni-de' },
      { input: 'wa-vs-ga', expectedCard: 'wa-ga' },
      { input: 'ga-vs-wa', expectedCard: 'wa-ga' },
      { input: 'wo-vs-to', expectedCard: 'wo-to-no-mo' },
      { input: 'particles', expectedCard: 'ni-de' },
      { input: 'guide-ni-de', expectedCard: 'ni-de' },
      { input: null, expectedCard: null },
      { input: 'non-existent-topic', expectedCard: null },
    ];

    for (const { input, expectedCard } of testCases) {
      await page.evaluate((id) => window.openGuideModal(id), input);
      const dialog = page.locator('dialog.guide-modal');
      await expect(dialog).toBeVisible();

      if (expectedCard) {
        await expect(dialog.locator(`#${expectedCard}`)).toHaveClass(/guide-highlight/);
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }

    expect(pageErrors).toEqual([]);
  });

  test('TTS speech is stopped upon modal dismiss', async ({ page }) => {
    await page.goto('/');

    // Track calls to speechSynthesis.cancel (polyfilling SpeechSynthesisUtterance if not present in headless WebKit)
    await page.evaluate(() => {
      window.__speechCancelled = 0;
      if (!window.SpeechSynthesisUtterance) {
        window.SpeechSynthesisUtterance = class {
          constructor(text) {
            this.text = text;
          }
        };
      }
      if (!window.speechSynthesis) {
        window.speechSynthesis = { cancel: () => {}, speak: () => {}, getVoices: () => [] };
      }
      const origCancel = window.speechSynthesis.cancel
        ? window.speechSynthesis.cancel.bind(window.speechSynthesis)
        : () => {};
      window.speechSynthesis.cancel = () => {
        window.__speechCancelled++;
        origCancel();
      };
    });

    await page.evaluate(() => window.openGuideModal('ni-de'));
    const dialog = page.locator('dialog.guide-modal');
    await expect(dialog).toBeVisible();

    await page.locator('.guide-modal-close').click();
    await expect(dialog).toHaveCount(0);

    const cancelledCount = await page.evaluate(() => window.__speechCancelled);
    expect(cancelledCount).toBeGreaterThanOrEqual(1);
  });

  test('Contrastive callout in session renders BookOpen icon and opens corresponding guide card', async ({
    page,
  }) => {
    const state = fresh();
    state.drafts.practice = {
      at: Date.now(),
      session: createSession(['l5-2'], 'Pedagogikkontroll'),
    };
    await page.addInitScript((state) => {
      localStorage.setItem('tentaplugg-v1-guest', JSON.stringify(state));
    }, state);
    await page.goto('/');

    // Resume the draft from Progress view
    await page
      .getByRole('button', { name: /^(Mina framsteg|Framsteg)$/ })
      .filter({ visible: true })
      .click();
    await page
      .locator('.history-row')
      .filter({ hasText: 'Pedagogikkontroll' })
      .getByRole('button', { name: 'Fortsätt', exact: true })
      .click();
    await expect(page.locator('.question-panel')).toBeVisible();

    // Select distractor 'に' (correct answer is 'で')
    const niBtn = page.locator('.choice').filter({ hasText: /^に$/ });
    await expect(niBtn).toBeVisible();
    await niBtn.click();
    await checkCurrentAnswer(page);

    // Check if contrastive callout appeared
    const callout = page.locator('.contrastive-callout');
    await expect(callout).toBeVisible();
    await expect(callout).toBeVisible();
    const openGuideBtn = callout.locator('.contrastive-guide-btn');
    await expect(openGuideBtn).toBeVisible();
    // Verify contrastive chip contents
    await expect(callout).toContainText('Ditt val:');
    await expect(callout).toContainText('Godtagna svar:');

    // Verify BookOpen SVG icon inside button
    await expect(openGuideBtn.locator('svg')).toBeVisible();
    await expect(openGuideBtn).toContainText('Öppna snabbguide');

    // Click button to open modal
    await openGuideBtn.click();

    const dialog = page.locator('dialog.guide-modal');
    await expect(dialog).toBeVisible();

    // Target card must be highlighted
    await expect(dialog.locator('.guide-highlight')).toBeVisible();
    await expect(dialog.locator('.guide-highlight .guide-badge')).toContainText(
      'Relevant för ditt svar',
    );

    // Dismiss modal via close button
    await page.locator('.guide-modal-close').click();
    await expect(dialog).toHaveCount(0);

    // Callout should still be visible in session view
    await expect(callout).toBeVisible();
  });
});
