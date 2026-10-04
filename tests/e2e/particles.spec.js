import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fresh } from '../../src/engine.js';
import { createSession } from '../../src/session.js';
import { particleDefinition, particleCharacters } from '../../src/particles.js';

const key = 'tentaplugg-v1-guest';
async function resume(page) {
  await page
    .getByRole('button', { name: /^(Mina framsteg|Framsteg)$/ })
    .filter({ visible: true })
    .click();
  await page
    .locator('.history-row')
    .filter({ hasText: 'Partikelkontroll' })
    .getByRole('button', { name: 'Fortsätt', exact: true })
    .click();
}
async function setup(page, ids, theme, legacy = false) {
  const state = fresh();
  state.theme = theme;
  const session = createSession(ids, 'Partikelkontroll');
  if (legacy) {
    delete session.exerciseVersion;
    delete session.particles;
    session.answers[ids[0]] = 'Mitt sparade fritextsvar';
  }
  state.drafts.practice = { at: Date.now(), session };
  await page.addInitScript(
    ({ state, key, theme }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem('tentaplugg-theme', theme);
      }
    },
    { state, key, theme },
  );
  await page.goto('/');
  await expect(page).toHaveTitle(/TentaPlugg/);
  await expect(page.locator('main')).not.toBeEmpty();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await resume(page);
}
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
}
async function screenshot(page, testInfo, label) {
  const directory = process.env.PARTICLE_SCREENSHOTS || join(tmpdir(), 'tentaplugg-particles');
  await mkdir(directory, { recursive: true });
  await page
    .locator('.particle-panel')
    .screenshot({ path: join(directory, `${label}-${testInfo.project.name}.png`) });
}

for (const theme of ['classic', 'sakura']) {
  test(`${theme}: six two-step exercises, editing, persistence and one result per question`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (
        msg.type() === 'warning' &&
        !/Lit is in dev mode|current domain is not authorized/.test(msg.text())
      )
        errors.push(msg.text());
    });
    const ids = Array.from({ length: 6 }, (_, i) => `l5-review-${i + 1}`);
    await setup(page, ids, theme);
    for (let n = 1; n <= 6; n++) {
      const id = ids[n - 1];
      await expect(page.locator('.particle-panel')).toHaveAttribute('data-question-id', id);
      const chars = particleCharacters(particleDefinition(id));
      for (const c of chars.filter((c) => c.particle)) {
        const button = page.locator(`[data-char-id="${c.id}"]`);
        await button.focus();
        await page.keyboard.press('Space');
        await expect(button).toHaveAttribute('aria-pressed', 'true');
      }
      await page.getByRole('button', { name: 'Rätta', exact: true }).click();
      await expect(page.getByText('Du hittade alla partiklar!', { exact: true })).toBeVisible();
      await expect(page.locator('.feedback, .rating-group')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Lyssna på svaret', exact: true })).toHaveCount(
        0,
      );
      await page.keyboard.press('3');
      expect(Object.keys((await saved(page)).reviews)).toHaveLength(n - 1);
      if (n === 3) {
        await screenshot(page, testInfo, `${theme}-marked`);
        await page.reload();
        await resume(page);
        await expect(page.getByText('Du hittade alla partiklar!', { exact: true })).toBeVisible();
      }
      await page.getByRole('button', { name: 'Till steg 2', exact: true }).click();
      if (n === 1) {
        await page.getByRole('button', { name: 'Lägg till partikel', exact: true }).click();
        await page
          .getByRole('button', { name: 'Placera före も, position 9', exact: true })
          .click();
        await page.getByRole('button', { name: 'で', exact: true }).click();
      } else if (n === 3) {
        async function moveWo() {
          await page.locator('[data-token-id="original-4"]').click();
          await page.getByRole('button', { name: 'Flytta', exact: true }).click();
          await page
            .getByRole('button', { name: 'Placera före たくさん, position 4', exact: true })
            .click();
        }
        await moveWo();
        await page.getByRole('button', { name: 'Återställ meningen', exact: true }).click();
        expect((await saved(page)).drafts.practice.session.particles[id].marking.ok).toBe(true);
        await moveWo();
        await page.getByRole('button', { name: /Spara & lämna/ }).click();
        await resume(page);
        await expect(
          page.getByRole('button', { name: 'Rätta meningen', exact: true }),
        ).toBeVisible();
        await screenshot(page, testInfo, `${theme}-editing`);
      } else if (n === 4) {
        await page.locator('[data-token-id="original-2"]').click();
        await page.getByRole('button', { name: 'Byt', exact: true }).click();
        await page.getByRole('button', { name: 'に', exact: true }).click();
      } else if (n === 6) {
        await page.locator('[data-token-id="original-11"]').click();
        await page.getByRole('button', { name: 'Ta bort', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Rätta meningen', exact: true }).click();
      await expect(page.locator('.feedback h3')).toHaveText('Båda stegen är rätt!');
      const stored = await saved(page);
      expect(stored.drafts.practice.session.answers[id]).toBe(particleDefinition(id).answers[0]);
      expect(Object.keys(stored.reviews)).toHaveLength(n);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (n === 3) await screenshot(page, testInfo, `${theme}-done`);
      await page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ }).click();
    }
    await expect(page.locator('.result-number')).toHaveText('6 / 6');
    expect(errors).toEqual([]);
  });
}

test('wrong and missed markings stay distinct from correction; self-rating can override', async ({
  page,
}, testInfo) => {
  await setup(page, ['l5-review-3', 'l5-review-5'], 'classic');
  await page.locator('[data-char-id="original-0-0"]').click();
  await page.locator('[data-char-id="original-1-0"]').click();
  await page.getByRole('button', { name: 'Rätta', exact: true }).click();
  await expect(page.locator('.particle-char.right')).toHaveCount(1);
  await expect(page.locator('.particle-char.wrong')).toHaveCount(1);
  await expect(page.locator('.particle-char.missed')).toHaveCount(1);
  await screenshot(page, testInfo, 'mixed-marking');
  await expect(page.locator('.particle-char.missed')).toBeDisabled();
  await page.locator('.particle-char.missed').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.particle-char.missed')).toHaveCount(1);
  await page.getByRole('button', { name: 'Till steg 2', exact: true }).click();
  await page.getByRole('button', { name: 'Rätta meningen', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText('Meningen behöver rättas');
  await page.reload();
  await resume(page);
  await expect(page.locator('.feedback')).toBeVisible();
  expect(Object.keys((await saved(page)).reviews)).toHaveLength(1);
  await page.getByRole('button', { name: 'Nästa fråga', exact: true }).click();
  // An empty marking is a valid attempt, and an unchanged correct sentence is accepted.
  await page.getByRole('button', { name: 'Rätta', exact: true }).click();
  await page.getByRole('button', { name: 'Till steg 2', exact: true }).click();
  await page.getByRole('button', { name: 'Rätta meningen', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText('Steg 1: Behöver övas');
  await expect(page.locator('.feedback')).toContainText('Steg 2: Rätt mening');
  expect((await saved(page)).drafts.practice.session.grades['l5-review-5']).toBe(false);
  await page.keyboard.press('3');
  await expect(page.locator('.result-number')).toHaveText('1 / 2');
  expect(Object.keys((await saved(page)).reviews)).toHaveLength(2);
});

test('an old draft keeps its original time question and saved free text', async ({ page }) => {
  await setup(page, ['l5-review-4'], 'classic', true);
  await expect(page.locator('.question-title')).toContainText('まいにち７じはんぐらいねます。');
  await expect(page.getByLabel('Ditt svar', { exact: true })).toHaveValue(
    'Mitt sparade fritextsvar',
  );
  await expect(page.locator('.particle-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Visa modellösning', exact: true }).click();
  await page.getByRole('button', { name: 'Jag kunde detta', exact: true }).click();
  await expect(page.locator('.result-number')).toHaveText('1 / 1');
});
