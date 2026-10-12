import { test, expect } from '@playwright/test';
import { hayashiQuestions } from '../../src/hayashi-data.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function open(page, id, resume = false) {
  await page.goto('/exams');
  const card = page.locator(`[data-exam-card="hayashi-${id}"]`);
  await expect(card.locator('a')).toHaveCount(0);
  await card.getByRole('button', { name: resume ? 'Fortsätt tentan' : 'Börja tentan' }).click();
}
async function noLeak(page) {
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expect(page.locator('.original')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Lyssna på (svaret|modellsvaret)/ })).toHaveCount(
    0,
  );
  await expect(page.locator('a[href*="hayashi"]')).toHaveCount(0);
}

test('mobile: one tap grades and locks, survives reload, wraps long choices and keeps a separate draft', async ({
  page,
}, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, 'mobile');
  await expect(page).toHaveTitle(/TentaPlugg/);
  await noLeak(page);
  await expect(page.locator('#answer')).toHaveCount(0);
  await expect(page.locator('.choice')).toHaveCount(4);
  await page.getByRole('button', { name: 'さんぜんにひゃくよんじゅうさん', exact: true }).click();
  await expect(page.locator('.feedback')).toContainText('Rätt svar!');
  const wrong = page.locator('.choice').filter({ hasText: 'さんぜんよんひゃくにじゅうさん' });
  await expect(wrong).toHaveAttribute('aria-disabled', 'true');
  await wrong.dispatchEvent('click');
  await expect(page.locator('.choice.selected')).toHaveText('さんぜんにひゃくよんじゅうさん');
  await open(page, 'mobile', true);
  await expect(page.locator('.feedback')).toContainText('Rätt svar!');
  await page.getByRole('button', { name: 'Fråga 17', exact: true }).click();
  await noLeak(page);
  await expect(page.locator('.choice')).toHaveCount(4);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: join(tmpdir(), `hayashi-mobile-${info.project.name}.png`) });
  await open(page, 'exam');
  await expect(page.getByLabel('Ditt svar')).toHaveValue('');
  await expect(page.locator('.choice')).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('tentaplugg-v1-guest')));
  expect(state.drafts['hayashi-mobile'].session.grades['hayashi-mobile-number-1']).toBe(true);
  expect(state.drafts['hayashi-exam'].session.answers).toEqual({});
  await open(page, 'mobile', true);
  const bank = hayashiQuestions.filter((q) => q.exam === 'hayashi-mobile');
  await page.getByRole('button', { name: `Fråga ${bank.length}`, exact: true }).click();
  await page
    .getByRole('button', {
      name: bank.at(-1).choices.find((c) => c !== bank.at(-1).answers[0]),
      exact: true,
    })
    .click();
  await expect(page.locator('.feedback')).toContainText('Inte riktigt');
  await page.getByRole('button', { name: 'Lämna in tentan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lämna in', exact: true }).click();
  await expect(page.locator('.result-panel')).toContainText('1 uppskattade poäng av 135');
  expect(errors).toEqual([]);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
});

test('serious: IME and Enter never reveal answers, submission unlocks Kyoto self assessment and mistake practice', async ({
  page,
}, info) => {
  await open(page, 'exam');
  await noLeak(page);
  const input = page.getByLabel('Ditt svar');
  await input.dispatchEvent('compositionstart');
  await input.fill('さんぜんにひゃくよんじゅうさん');
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true });
  await input.dispatchEvent('compositionend');
  await input.press('Enter');
  await noLeak(page);
  await open(page, 'exam', true);
  await expect(page.getByLabel('Ditt svar')).toHaveValue(/さんぜんにひゃくよんじゅうさん/);
  await noLeak(page);
  await page.getByRole('button', { name: 'Fråga 17', exact: true }).click();
  await page.screenshot({ path: join(tmpdir(), `hayashi-exam-blank-${info.project.name}.png`) });
  await page
    .getByLabel('Ditt svar')
    .fill(
      'きょうとはとてもさむかったです。\nたべものはおいしかったです。\nホテルはあたらしくなかったです。',
    );
  await page.getByLabel('Ditt svar').press('Enter');
  await noLeak(page);
  await page.screenshot({ path: join(tmpdir(), `hayashi-exam-${info.project.name}.png`) });
  const last = hayashiQuestions.filter((q) => q.exam === 'hayashi-exam').length;
  await page.getByRole('button', { name: `Fråga ${last}`, exact: true }).click();
  await page.getByRole('button', { name: 'Lämna in tentan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lämna in', exact: true }).click();
  await expect(page.locator('.result-panel')).toContainText('1 uppskattade poäng av 131');
  await page.getByRole('button', { name: 'Rätta längre svar' }).click();
  await expect(page.locator('.feedback')).toContainText('レストランはにぎやかでした。');
  await expect(page.locator('.self-checklist')).toContainText('tre fullständiga meningar');
  await expect(page.locator('.original')).toHaveCount(0);
  await page.getByRole('button', { name: 'Jag kunde detta', exact: true }).click();
  await expect(page.locator('.result-panel')).toContainText('4 uppskattade poäng av 131');
  await page.getByRole('button', { name: 'Till studierummet', exact: true }).click();
  await page.goto('/exams');
  await page
    .locator('[data-exam-card="hayashi-exam"]')
    .getByRole('button', { name: /Öva felen/ })
    .click();
  await expect(page.locator('.session-top')).toContainText('Träningspass');
  await noLeak(page);
});
