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

test('self-assessment guide preserves the answer and follow-up leaves the original result intact', async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await openSession(page, ['reading-II.2-4']);
  const input = page.getByLabel('Ditt svar', { exact: true });
  await input.fill('はい、だいがくにあります。');
  await page.getByRole('button', { name: 'Visa modellösning', exact: true }).click();
  await expect(page.locator('.self-checklist')).toContainText('framför universitetet');
  const guide = page.getByRole('button', { name: 'Öppna snabbguide', exact: true });
  await guide.click();
  await expect(page.locator('dialog[open] #reading-strategy')).toHaveClass(/guide-highlight/);
  await page.getByRole('button', { name: 'Återgå till övningen', exact: true }).click();
  await expect(guide).toBeFocused();
  await expect(input).toHaveValue('はい、だいがくにあります。');
  const directory = process.env.PEDAGOGY_SCREENSHOTS || join(tmpdir(), 'tentaplugg-pedagogy');
  await mkdir(directory, { recursive: true });
  await expect(page.locator('#toast')).toHaveCount(0, { timeout: 10000 });
  await page
    .locator('.self-checklist')
    .screenshot({ path: join(directory, `criteria-${testInfo.project.name}.png`) });
  await page.getByRole('button', { name: 'Behöver öva mer', exact: true }).click();
  await expect(page.locator('.follow-up')).toContainText('1 fråga');
  await expect(page.locator('.follow-up')).toContainText('Läsförståelse');
  await page.screenshot({
    path: join(directory, `follow-up-${testInfo.project.name}.png`),
    fullPage: true,
  });
  const original = await page.evaluate(
    () => Object.values(JSON.parse(localStorage.getItem('tentaplugg-v1-guest')).attempts)[0],
  );
  await page.getByRole('button', { name: 'Starta kort övningspass', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.locator('.feedback')).toHaveCount(0);
  await input.fill('いいえ、めいじだいがくのまえにあります。');
  await page.getByRole('button', { name: 'Visa modellösning', exact: true }).click();
  await page.getByRole('button', { name: 'Jag kunde detta', exact: true }).click();
  await expect(page.locator('.result-number')).toHaveText('1 / 1');
  await expect(page.locator('.follow-up')).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tentaplugg-v1-guest')));
  expect(saved.attempts[original.attemptId]).toEqual(original);
  expect(
    Object.values(saved.attempts).find((a) => a.sourceAttemptId === original.attemptId)?.grades[
      'reading-II.2-4'
    ],
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('pending self-assessments are not included in the suggested mistake practice', async ({
  page,
}) => {
  await openSession(page, ['gema70-3-7', 'japc11-1.1'], { mode: 'exam', exam: 'gema70' });
  await page.getByRole('button', { name: 'Nästa fråga', exact: true }).click();
  await page.getByRole('button', { name: 'Lämna in tentan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lämna in', exact: true }).click();
  await expect(page.locator('.follow-up')).toContainText('1 fråga');
  await expect(page.locator('.follow-up')).toContainText('Fler svar väntar på självbedömning');
  await page.getByRole('button', { name: 'Starta kort övningspass', exact: true }).click();
  await expect(page.locator('.session-top')).toContainText('1 / 1');
  await expect(page.locator('.question-title')).toContainText('しんかんせん');
});
