import { test, expect } from '@playwright/test';
import { questions } from '../../src/data.js';
import { fresh, nextStat } from '../../src/engine.js';

const storageKey = 'tentaplugg-v1-guest';

async function fillAnyAnswer(page) {
  const choices = page.locator('.choice');
  if (await choices.count()) {
    await choices.first().click();
  } else {
    const area = page.locator('#answer');
    if (await area.count()) {
      await area.fill('test');
    }
  }
}

test.describe('Session Sizing & Practice Flow Empirical Stress Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Session size picker: selection, keyboard arrows, hint texts, and reload persistence', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('.focus-panel')).toBeVisible();

    const pill5 = page.getByRole('radio', { name: '5', exact: true });
    const pill10 = page.getByRole('radio', { name: '10', exact: true });
    const pill20 = page.getByRole('radio', { name: '20', exact: true });
    const pillAll = page.locator('.pill-btn', { hasText: 'Alla förfallna' });
    const hint = page.locator('.session-hint');

    // 1. Defaults
    await expect(pill10).toHaveAttribute('aria-checked', 'true');
    await expect(pill10).toHaveClass(/active/);
    await expect(pill5).toHaveAttribute('aria-checked', 'false');
    await expect(pill20).toHaveAttribute('aria-checked', 'false');
    await expect(pillAll).toHaveAttribute('aria-disabled', 'true');
    await expect(hint).toContainText('10 frågor · cirka 5 minuter');

    // 2. Select 5
    await pill5.click();
    await expect(pill5).toHaveAttribute('aria-checked', 'true');
    await expect(pill5).toHaveClass(/active/);
    await expect(pill10).toHaveAttribute('aria-checked', 'false');
    await expect(hint).toContainText('5 frågor · cirka 3 minuter');

    // 3. Select 20
    await pill20.click();
    await expect(pill20).toHaveAttribute('aria-checked', 'true');
    await expect(pill20).toHaveClass(/active/);
    await expect(pill5).toHaveAttribute('aria-checked', 'false');
    await expect(hint).toContainText('20 frågor · cirka 10 minuter');

    // 4. Keyboard navigation within pill group
    await pill20.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(pill10).toHaveAttribute('aria-checked', 'true');
    await expect(hint).toContainText('10 frågor · cirka 5 minuter');

    await page.keyboard.press('ArrowLeft');
    await expect(pill5).toHaveAttribute('aria-checked', 'true');
    await expect(hint).toContainText('5 frågor · cirka 3 minuter');

    await page.keyboard.press('ArrowRight');
    await expect(pill10).toHaveAttribute('aria-checked', 'true');

    // 5. Persistence across page reload
    await pill5.click();
    await expect(pill5).toHaveAttribute('aria-checked', 'true');
    await page.reload();

    const reloadedPill5 = page.getByRole('radio', { name: '5', exact: true });
    await expect(reloadedPill5).toHaveAttribute('aria-checked', 'true');
    await expect(reloadedPill5).toHaveClass(/active/);
    await expect(page.locator('.session-hint')).toContainText('5 frågor · cirka 3 minuter');
  });

  test('Session size 5 practice flow: answers with diverse ratings (again, hard, good, easy) and verifies results panel', async ({
    page,
  }) => {
    await page.goto('/');

    // Choose 5
    await page.getByRole('radio', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: 'Träna partiklar' }).click();

    // Verify session initialized with length 5
    await expect(page.locator('.session-top')).toContainText('1 / 5');

    // Define ratings for questions 1 to 5: again, hard, good, easy, good
    const ratings = ['again', 'hard', 'good', 'easy', 'good'];

    for (let i = 0; i < 5; i++) {
      const qNum = i + 1;
      await expect(page.locator('.session-top')).toContainText(`${qNum} / 5`);

      // Answer current question
      await fillAnyAnswer(page);

      // Check answer
      await page.getByRole('button', { name: /^(Kontrollera svar|Visa modellösning)$/ }).click();

      // Rating buttons must appear
      const ratingGroup = page.locator('.rating-group');
      await expect(ratingGroup).toBeVisible();

      const rating = ratings[i];
      if (i === 4) {
        // Test keyboard shortcut '3' for good on the last question
        await page.keyboard.press('3');
      } else {
        const btn = page.locator(`.rating-btn[data-rating="${rating}"]`);
        await expect(btn).toBeVisible();
        await btn.click();
      }
    }

    // After answering all 5 questions, results panel must appear
    const resultPanel = page.locator('.result-panel');
    await expect(resultPanel).toBeVisible();

    // Out of 5 ratings, 1 was 'again' and 4 were ok ('hard', 'good', 'easy', 'good') -> 4 / 5
    const resultNumber = page.locator('.result-number');
    await expect(resultNumber).toContainText('4');
    await expect(resultNumber).toContainText('/ 5');

    // Summary list should contain exactly 5 entries
    const summaryItems = page.locator('.result-summary button');
    await expect(summaryItems).toHaveCount(5);

    // 1 failure marker (↻) and 4 success markers (✓)
    const successMarkers = page.locator('.result-summary .result-marker.ok');
    await expect(successMarkers).toHaveCount(4);

    const retryMarkers = page.locator('.result-summary .result-marker:not(.ok)');
    await expect(retryMarkers).toHaveCount(1);
  });

  test('Session size 20 practice flow: initializes strictly with 20 questions', async ({
    page,
  }) => {
    await page.goto('/');

    // Select 20
    await page.getByRole('radio', { name: '20', exact: true }).click();
    await page.getByRole('button', { name: 'Träna partiklar' }).click();

    // Verify session initialized with length 20
    await expect(page.locator('.session-top')).toContainText('1 / 20');

    // Progress bar width is 5%
    const trackBar = page.locator('.session-track span');
    await expect(trackBar).toHaveAttribute('style', /width:\s*5%/);

    // Save and exit back to home
    await page.getByRole('button', { name: /Spara & lämna/ }).click();
    await expect(page.locator('.focus-panel')).toBeVisible();
  });

  test('All due questions ("all") practice flow: enables pill, starts session strictly with due count', async ({
    page,
  }) => {
    const now = Date.now();
    const particleQs = questions.filter((q) => q.topic === 'Partiklar');
    expect(particleQs.length).toBeGreaterThanOrEqual(10);

    // Seed state baselineStats with exactly 6 due particle questions and 4 future questions
    const seededState = fresh();
    const dueIds = particleQs.slice(0, 6).map((q) => q.id);
    const futureIds = particleQs.slice(6, 10).map((q) => q.id);

    dueIds.forEach((id, i) => {
      seededState.baselineStats[id] = {
        box: 1,
        ok: true,
        rating: 'good',
        dueAt: now - (60000 * (i + 1)), // In the past -> due
        at: now - 86400000,
        attempts: 1,
      };
    });

    futureIds.forEach((id, i) => {
      seededState.baselineStats[id] = {
        box: 2,
        ok: true,
        rating: 'good',
        dueAt: now + (86400000 * (i + 1)), // In the future -> not due
        at: now - 10000,
        attempts: 1,
      };
    });

    await page.addInitScript(
      ({ seededState, storageKey }) => {
        localStorage.setItem(storageKey, JSON.stringify(seededState));
      },
      { seededState, storageKey },
    );

    await page.goto('/');

    // Check stats strip displays 6 due
    await expect(page.locator('.stats-strip')).toContainText('6 att repetera nu');

    // "Alla förfallna (6)" pill is enabled
    const pillAll = page.getByRole('radio', { name: 'Alla förfallna (6)', exact: true });
    await expect(pillAll).toBeVisible();
    await expect(pillAll).not.toBeDisabled();
    await expect(pillAll).toHaveAttribute('aria-disabled', 'false');

    // Click "Alla förfallna (6)"
    await pillAll.click();
    await expect(pillAll).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.session-hint')).toContainText('6 frågor · repetera allt förfallet');

    // Start practice session
    await page.getByRole('button', { name: 'Träna partiklar' }).click();

    // Verify session starts strictly with 6 questions
    await expect(page.locator('.session-top')).toContainText('1 / 6');
  });

  test('Keyboard shortcuts 1, 2, 3, 4 during review feedback correctly record rating and advance', async ({
    page,
  }) => {
    await page.goto('/');

    // Start 5-question session
    await page.getByRole('radio', { name: '5', exact: true }).click();
    await page.getByRole('button', { name: 'Träna partiklar' }).click();

    // Question 1: Check answer and press shortcut '1' (again)
    await fillAnyAnswer(page);
    await page.getByRole('button', { name: /^(Kontrollera svar|Visa modellösning)$/ }).click();
    await expect(page.locator('.rating-group')).toBeVisible();
    await page.keyboard.press('1');

    // Must have advanced to question 2
    await expect(page.locator('.session-top')).toContainText('2 / 5');

    // Question 2: Check answer and press shortcut '2' (hard)
    await fillAnyAnswer(page);
    await page.getByRole('button', { name: /^(Kontrollera svar|Visa modellösning)$/ }).click();
    await expect(page.locator('.rating-group')).toBeVisible();
    await page.keyboard.press('2');

    // Must have advanced to question 3
    await expect(page.locator('.session-top')).toContainText('3 / 5');

    // Question 3: Check answer and press shortcut '4' (easy)
    await fillAnyAnswer(page);
    await page.getByRole('button', { name: /^(Kontrollera svar|Visa modellösning)$/ }).click();
    await expect(page.locator('.rating-group')).toBeVisible();
    await page.keyboard.press('4');

    // Must have advanced to question 4
    await expect(page.locator('.session-top')).toContainText('4 / 5');
  });
});
