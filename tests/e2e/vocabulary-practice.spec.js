import { test, expect } from '@playwright/test';
import { vocabularyById } from '../../src/vocabulary-practice.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const key = 'tentaplugg-v1-guest';
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);

for (const theme of ['classic', 'sakura']) {
  test(`${theme}: kana quiz, immediate marking, resume, result and separate retry`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((theme) => {
      localStorage.setItem('tentaplugg-theme', theme);
    }, theme);
    await page.goto('/');
    await expect(page).toHaveTitle(/TentaPlugg/);
    await page.getByRole('button', { name: 'Träna glosor', exact: true }).click();
    const panel = page.locator('.vocabulary-session');
    await expect(panel.locator('h1')).toBeFocused();
    await expect(panel.locator('.vocabulary-choice')).toHaveCount(4);
    let draft = (await saved(page)).drafts.practice.session;
    const originalId = draft.attemptId;
    const first = vocabularyById.get(draft.ids[0]);
    const wrong = draft.vocabularyChoices[first.id].find((c) => c !== first.answers[0]);
    const button = panel.getByRole('button', { name: wrong, exact: true });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(panel.getByRole('status')).toContainText('Inte riktigt');
    await expect(panel.getByRole('button', { name: 'Nästa', exact: true })).toBeFocused();
    // A rapid second activation cannot change an already graded answer.
    await button.dispatchEvent('click');
    expect((await saved(page)).stats[first.id].attempts).toBe(1);
    expect(await panel.innerText()).not.toMatch(/\p{Script=Han}/u);
    expect(await panel.innerText()).not.toMatch(/romaji/i);
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    const options = draft.vocabularyChoices;
    await page.reload();
    await page.goto('/vocabulary');
    await page.getByRole('button', { name: 'Fortsätt glospasset', exact: true }).click();
    expect((await saved(page)).drafts.practice.session.vocabularyChoices).toEqual(options);
    await expect(panel.getByRole('status')).toContainText('Inte riktigt');
    await panel.getByRole('button', { name: 'Nästa', exact: true }).click();
    await page.screenshot({
      path: join(tmpdir(), `tentaplugg-glosor-${theme}-${testInfo.project.name}.png`),
      fullPage: false,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    for (let i = 1; i < 10; i++) {
      draft = (await saved(page)).drafts.practice.session;
      const q = vocabularyById.get(draft.ids[draft.index]);
      await panel.getByRole('button', { name: q.answers[0], exact: true }).click();
      await expect(panel.getByRole('status')).toContainText('Rätt!');
      await panel
        .getByRole('button', { name: i === 9 ? 'Visa resultat' : 'Nästa', exact: true })
        .click();
    }
    await expect(panel.locator('h1')).toHaveText('Glospasset är klart!');
    await expect(panel.locator('.result-number')).toContainText('9');
    expect(await panel.innerText()).not.toMatch(/\p{Script=Han}/u);
    await panel.getByRole('button', { name: 'Öva missarna', exact: true }).click();
    draft = (await saved(page)).drafts.practice.session;
    expect(draft.ids).toEqual([first.id]);
    expect(draft.attemptId).not.toBe(originalId);
    await panel.getByRole('button', { name: first.answers[0], exact: true }).click();
    await panel.getByRole('button', { name: 'Visa resultat', exact: true }).click();
    expect((await saved(page)).attempts[originalId].grades[first.id]).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('lesson filter and completion offer extra practice', async ({ page }) => {
  await page.goto('/vocabulary');
  await page.getByRole('button', { name: 'Lektion 4', exact: true }).click();
  await page.getByRole('button', { name: 'Träna glosor', exact: true }).click();
  const draft = (await saved(page)).drafts.practice.session;
  expect(draft.ids.every((id) => vocabularyById.get(id).lesson === 4)).toBe(true);
  await page.addInitScript(
    ({ key, ids, state }) => {
      state.reviews = {};
      state.baselineStats = Object.fromEntries(
        ids.map((id) => [id, { ok: true, dueAt: Date.now() + 86400000 }]),
      );
      state.drafts = {};
      localStorage.setItem(key, JSON.stringify(state));
    },
    { key, ids: [...vocabularyById.keys()], state: await saved(page) },
  );
  await page.reload();
  await page.goto('/vocabulary');
  await expect(
    page.getByText('Dagens repetition är klar för det här urvalet.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Träna extra', exact: true }).click();
  await expect(page.locator('.vocabulary-choice')).toHaveCount(4);
});
