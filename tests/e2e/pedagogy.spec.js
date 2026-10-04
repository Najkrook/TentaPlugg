import { test, expect } from '@playwright/test';
import { fresh } from '../../src/engine.js';
import { createSession } from '../../src/session.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function openSession(page, ids, options = {}) {
  const state = fresh();
  state.drafts.practice = {
    at: Date.now(),
    session: createSession(ids, 'Pedagogikkontroll', options),
  };
  await page.addInitScript((state) => {
    localStorage.setItem('tentaplugg-v1-guest', JSON.stringify(state));
  }, state);
  await page.goto('/');
  await expect(page).toHaveTitle(/TentaPlugg/);
  await expect(page.locator('main')).not.toBeEmpty();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page
    .getByRole('button', { name: /^(Mina framsteg|Framsteg)$/ })
    .filter({ visible: true })
    .click();
  await page
    .locator('.history-row')
    .filter({ hasText: 'Pedagogikkontroll' })
    .getByRole('button', { name: 'Fortsätt', exact: true })
    .click();
}

test('wrong verb and mora answers explain the relevant form and retain what was right', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    // Expected on the local Vite server; neither warning concerns the guest study flow.
    if (
      msg.type() === 'warning' &&
      (msg.text().startsWith('Lit is in dev mode.') ||
        msg.text().startsWith('Info: The current domain is not authorized for OAuth operations.'))
    )
      return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  await openSession(page, ['b-10', 'japc11-5.1-2']);
  await page.getByLabel('Ditt svar', { exact: true }).fill('いきました');
  await page.getByRole('button', { name: 'Kontrollera svar', exact: true }).click();
  await expect(page.locator('.feedback h3')).toHaveText('Ditt svar matchar inte de sparade svaren');
  await expect(page.locator('.contrastive-text')).toContainText('ませんでした');
  await expect(page.locator('.contrastive-text')).not.toContainText('かった');
  await page.getByRole('button', { name: 'Öppna snabbguide', exact: true }).click();
  await expect(page.locator('dialog[open] #verbs')).toHaveClass(/guide-highlight/);
  await page.getByRole('button', { name: 'Stäng snabbguide', exact: true }).click();
  await page.getByRole('button', { name: 'Nästa fråga', exact: true }).click();
  await page.getByLabel('Ditt svar', { exact: true }).fill('2, 3');
  await page.getByRole('button', { name: 'Kontrollera svar', exact: true }).click();
  await expect(page.locator('.contrastive-text')).toContainText('Antalet stavelser stämmer');
  await expect(page.locator('.contrastive-text')).toContainText('が・っ・こ・う');
  await expect(page.locator('.learning-tip')).toContainText('Räkna först mororna');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.feedback').scrollIntoViewIfNeeded();
  await expect(page.locator('#toast')).toHaveCount(0, { timeout: 10000 });
  const directory = process.env.PEDAGOGY_SCREENSHOTS || join(tmpdir(), 'tentaplugg-pedagogy');
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `feedback-${testInfo.project.name}.png`),
    fullPage: true,
  });
  await page
    .locator('.contrastive-callout')
    .screenshot({ path: join(directory, `explanation-${testInfo.project.name}.png`) });
  expect(errors).toEqual([]);
});

test('a selected function gets a contextual contrast without an unrelated guide', async ({
  page,
}) => {
  await openSession(page, ['gema70-3-7']);
  await page.getByRole('button', { name: 'Location of action', exact: true }).click();
  await page.getByRole('button', { name: 'Kontrollera svar', exact: true }).click();
  await expect(page.locator('.contrastive-text')).toContainText('Handlingsplats');
  await expect(page.locator('.contrastive-text')).toContainText('transportmedel');
  await expect(page.getByRole('button', { name: 'Öppna snabbguide', exact: true })).toHaveCount(0);
  await expect(page.locator('.rating-help')).toContainText('innan du såg facit');
});

test('longer answers stay self-assessed with concrete language and content criteria', async ({
  page,
}) => {
  await openSession(page, ['japc11-1.1']);
  await page.getByLabel('Ditt svar', { exact: true }).fill('On-yomi and kun-yomi.');
  await page.getByRole('button', { name: 'Visa modellösning', exact: true }).click();
  await expect(page.locator('.self-checklist')).toContainText('4–5 meningar på engelska');
  await expect(page.locator('.self-checklist')).toContainText('förklara ursprunget');
  await expect(page.locator('.feedback h3')).toHaveText('Jämför med modellösningen');
  await page.getByRole('button', { name: 'Behöver öva mer', exact: true }).click();
  await expect(page.locator('.result-number')).toHaveText('0 / 1');
});

test('an unanswered exam item is explained without inventing a mistake', async ({ page }) => {
  await openSession(page, ['gema70-3-7'], { mode: 'exam', exam: 'gema70' });
  await page.getByRole('button', { name: 'Lämna in tentan', exact: true }).click();
  await page.getByRole('button', { name: 'Lämna in', exact: true }).click();
  await page.getByRole('button', { name: 'Gå igenom svaren', exact: true }).click();
  await expect(page.locator('.feedback h3')).toHaveText('Inget svar lämnat');
  await expect(page.locator('.feedback')).toContainText('transportmedel');
  await expect(page.locator('.contrastive-callout')).toHaveCount(0);
});
