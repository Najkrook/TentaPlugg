import { test, expect } from '@playwright/test';
import { questions } from '../../src/data.js';
import { fresh, nextStat } from '../../src/engine.js';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const key = 'tentaplugg-v1-guest';
const main = (page) => page.locator('main');
async function nav(page, name) {
  await page.getByRole('button', { name, exact: true }).filter({ visible: true }).click();
}
async function openExams(page) {
  const mobile = await page.locator('.mobile-nav').isVisible();
  await nav(page, mobile ? 'Tentor' : 'Gamla tentor');
}
async function answer(page, correct = true) {
  const title = await main(page).locator('h1').textContent();
  const compact = (s) => s.replace(/\s+/g, '');
  const q = questions.find((q) => compact(q.prompt) === compact(title));
  expect(q).toBeTruthy();
  const field = page.locator('#answer');
  if (await field.count())
    await field.fill(q.self ? 'Ett genomtänkt svar.' : correct ? q.answers[0] : 'fel');
  else {
    const choices = page.locator('.choice');
    await choices
      .filter({
        hasText: correct
          ? q.answers[0]
          : q.choices.find((a) => !q.answers.includes(a)) || q.choices[0],
      })
      .first()
      .click();
    await expect(page.locator('.choice.selected')).toBeFocused();
  }
  await page
    .getByRole('button', { name: q.self ? 'Visa modellösning' : 'Kontrollera svar', exact: true })
    .click();
  if (q.self)
    await page
      .getByRole('button', { name: correct ? 'Jag kunde detta' : 'Behöver öva mer', exact: true })
      .click();
  else await page.getByRole('button', { name: /^(Nästa fråga|Visa resultat)$/ }).click();
}
test('complete a practice session, keep focus and show real results', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/TentaPlugg/);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: /い Böjningar/ }).click();
  await expect(main(page).locator('h1')).toBeFocused();
  for (let i = 0; i < 10; i++) await answer(page);
  await expect(main(page).locator('h1')).toHaveText('Ett steg framåt.');
  await expect(page.locator('.result-number')).toContainText('10');
  expect(errors).toEqual([]);
});
test('exam input and IME composition survive navigation and immediate reload', async ({ page }) => {
  await page.goto('/');
  await openExams(page);
  await page
    .locator('[data-exam-card="gema70"]')
    .getByRole('button', { name: 'Börja tentan' })
    .click();
  const input = page.getByLabel('Ditt svar');
  await input.focus();
  await input.dispatchEvent('compositionstart', { data: '' });
  await input.fill('にほん');
  await input.dispatchEvent('input', { isComposing: true, data: 'にほん' });
  await expect(input).toBeFocused();
  await input.fill('日本語');
  await input.dispatchEvent('compositionend', { data: '日本語' });
  await page.getByRole('button', { name: 'Nästa fråga', exact: true }).click();
  await page.reload();
  await openExams(page);
  await page
    .locator('[data-exam-card="gema70"]')
    .getByRole('button', { name: 'Fortsätt tentan' })
    .click();
  await page.getByRole('button', { name: 'Föregående', exact: true }).click();
  await expect(page.getByLabel('Ditt svar')).toHaveValue('日本語');
  await expect(main(page).locator('h1')).toBeFocused();
});
test('submission, self assessment and exam-specific mistakes preserve original score', async ({
  page,
}) => {
  await page.goto('/');
  await openExams(page);
  await page
    .locator('[data-exam-card="gema70"]')
    .getByRole('button', { name: 'Börja tentan' })
    .click();
  await page.getByLabel('Ditt svar').fill('Hiragana, katakana och kanji.');
  await page.getByRole('button', { name: 'Fråga 55', exact: true }).click();
  await page.getByRole('button', { name: 'Falskt', exact: true }).click();
  await page.getByRole('button', { name: 'Lämna in tentan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lämna in', exact: true }).click();
  await expect(page.locator('.result-panel')).toContainText('1 uppskattade poäng av 100');
  await page.getByRole('button', { name: 'Rätta längre svar' }).click();
  await page.getByRole('button', { name: 'Jag kunde detta' }).click();
  await page.getByRole('button', { name: 'Spara & lämna' }).click();
  await openExams(page);
  const card = page.locator('[data-exam-card="gema70"]');
  await expect(card).toContainText('11/100');
  await card.getByRole('button', { name: /Öva felen/ }).click();
  await expect(page.locator('.session-top')).toContainText('Träningspass');
  await page.getByRole('button', { name: 'Spara & lämna' }).click();
  await openExams(page);
  await expect(page.locator('[data-exam-card="gema70"]')).toContainText('11/100');
});
test('daily plan is stable across reload and kana never exposes speech before grading', async ({
  page,
}) => {
  await page.goto('/');
  const tasks = await page.locator('.plan-task').allTextContents();
  await page.reload();
  await expect(page.locator('.plan-task')).toHaveCount(3);
  expect(await page.locator('.plan-task').allTextContents()).toEqual(tasks);
  await page.getByRole('button', { name: /あ Kana/ }).click();
  await expect(page.getByRole('button', { name: /Lyssna/ })).toHaveCount(0);
  await expect(main(page).locator('h1 span[lang="ja"]')).toHaveCount(1);
  await expect(page.getByLabel('Ditt svar')).toHaveAttribute('lang', 'en');
});
test('completed repetition offers extra practice and preserves old history', async ({ page }) => {
  const state = fresh();
  for (const q of questions) state.baselineStats[q.id] = nextStat(null, true, Date.now(), 'seed');
  state.history = [{ id: 'old', name: 'Äldre pass', at: Date.now(), ok: 3, total: 10 }];
  await page.addInitScript(({ state, key }) => localStorage.setItem(key, JSON.stringify(state)), {
    state,
    key,
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Träna partiklar', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Dagens repetition är klar');
  await page.getByRole('button', { name: 'Träna extra', exact: true }).click();
  await expect(page.locator('.question-title')).toBeVisible();
});
test('broken original image has a useful fallback and mobile page does not overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  const folder = process.env.QA_SCREENSHOT_DIR || join(tmpdir(), 'tentaplugg-qa');
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: join(folder, `${testInfo.project.name}.png`), fullPage: true });
  await page.route('**/material/reading-03.jpg', (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' }),
  );
  await openExams(page);
  await page
    .locator('[data-exam-card="reading"]')
    .getByRole('button', { name: 'Börja tentan' })
    .click();
  await page.getByRole('button', { name: 'Fråga 11', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Bilden kunde inte laddas');
  await expect(page.getByRole('alert').getByRole('link')).toHaveAttribute(
    'href',
    '/material/reading.pdf',
  );
});
