import { test, expect } from '@playwright/test';
import { fresh, recordReview } from '../../src/engine.js';
import { createSession } from '../../src/session.js';

const storageKey = 'tentaplugg-v1-guest';
const now = Date.parse('2026-10-04T10:00:00Z');

async function seed(page, state, theme = 'classic') {
  await page.clock.setFixedTime(now);
  await page.addInitScript(
    ({ state, theme, storageKey }) => {
      if (!sessionStorage.getItem('audit-seeded')) {
        localStorage.setItem(storageKey, JSON.stringify(state));
        localStorage.setItem('tentaplugg-theme', theme);
        sessionStorage.setItem('audit-seeded', 'true');
      }
    },
    { state, theme, storageKey },
  );
  await page.goto('/');
}

const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);

async function resume(page, name) {
  await page
    .getByRole('button', { name: /^(Mina framsteg|Framsteg)$/ })
    .filter({ visible: true })
    .click();
  await page
    .locator('.history-row')
    .filter({ hasText: name })
    .getByRole('button', { name: 'Fortsätt', exact: true })
    .click();
}

test('changing session length preserves the exam-date revision across reload', async ({ page }) => {
  const state = { ...fresh(), examDate: '2026-11-01', settingsAt: now - 1000 };
  await seed(page, state);
  await page.getByRole('radio', { name: '20', exact: true }).click();
  const updated = await saved(page);
  expect(updated.settingsAt).toBe(state.settingsAt);
  expect(updated.preferredCountAt).toBe(now);
  await page.reload();
  await expect(page.getByRole('radio', { name: '20', exact: true })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  expect((await saved(page)).examDate).toBe(state.examDate);
});

test('extra-practice interval stays accurate after checking and resuming a saved answer', async ({
  page,
}) => {
  const state = fresh();
  recordReview(state, createSession(['p-2'], 'earlier'), 'p-2', 'easy', now - 1000);
  const session = createSession(['p-2'], 'Extra träning');
  state.drafts.practice = { at: now, session };
  await seed(page, state);
  await resume(page, 'Extra träning');
  await page.getByRole('button', { name: 'に', exact: true }).click();
  await page.getByRole('button', { name: 'Kontrollera svar', exact: true }).click();
  await expect(page.locator('[data-rating="good"] .rating-interval')).toHaveText('3d');
  await page.reload();
  await resume(page, 'Extra träning');
  await expect(page.locator('[data-rating="good"] .rating-interval')).toHaveText('3d');
  await page.locator('[data-rating="good"]').click();
  expect((await saved(page)).stats['p-2'].dueAt).toBe(now - 1000 + 3 * 86400000);
});

for (const theme of ['classic', 'sakura']) {
  test(`guide button has readable text and preserves the session in ${theme}`, async ({ page }) => {
    const state = fresh();
    state.drafts.practice = { at: now, session: createSession(['p-2'], 'Kontrastkontroll') };
    await seed(page, state, theme);
    await resume(page, 'Kontrastkontroll');
    await page.getByRole('button', { name: 'に', exact: true }).click();
    await page.getByRole('button', { name: 'Kontrollera svar', exact: true }).click();
    await page.mouse.move(0, 0);
    const button = page.getByRole('button', { name: 'Öppna snabbguide', exact: true });
    const ratio = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      const luminance = (rgb) => {
        const values = rgb
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      };
      const a = luminance(style.color),
        b = luminance(style.backgroundColor);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator('.contrastive-text')).toContainText('Språket används som medel.');
    const before = (await saved(page)).drafts.practice.session;
    await button.click();
    await expect(page.locator('dialog[open] #ni-de')).toHaveClass(/guide-highlight/);
    await page.getByRole('button', { name: 'Stäng snabbguide', exact: true }).click();
    expect((await saved(page)).drafts.practice.session).toEqual(before);
    await expect(button).toBeFocused();
  });
}
