import { test, expect } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('mobile navigation reaches every sidebar destination', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveTitle(/TentaPlugg/);
  const bottomNav = page.locator('.mobile-nav');
  await expect(bottomNav.getByRole('button')).toHaveText([
    'Plugga',
    'Tentor',
    'Framsteg',
    '1v1',
    'Mer',
  ]);
  await bottomNav.getByRole('button', { name: '1v1', exact: true }).click();
  await expect(page).toHaveURL(/\/multiplayer$/);
  await expect(bottomNav.getByRole('button', { name: '1v1', exact: true })).toHaveClass('active');
  await bottomNav.getByRole('button', { name: 'Mer', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Snabbguide', exact: true }).click();
  await expect(page).toHaveURL(/\/guide$/);
  await expect(bottomNav.getByRole('button', { name: 'Mer', exact: true })).toHaveClass('active');
  const destinations = await page.locator('.sidebar .nav-item').allTextContents();
  await page.locator('.mobile-nav').getByRole('button', { name: 'Mer', exact: true }).click();
  const menu = page.getByRole('dialog', { name: 'Alla sidor' });
  for (const label of destinations) {
    await expect(menu.getByRole('button', { name: label.trim(), exact: true })).toBeVisible();
  }
  await menu.getByRole('button', { name: 'Ordförråd (Genki)', exact: true }).click();
  await expect(page).toHaveURL(/\/vocabulary$/);
  await expect(page.locator('main h1')).toContainText('Ordförråd');
  await expect(menu).toHaveCount(0);
  for (const [label, path] of [
    ['Partikelguide', 'particles'],
    ['1v1 Duell', 'multiplayer'],
  ]) {
    await page.locator('.mobile-nav').getByRole('button', { name: 'Mer', exact: true }).click();
    await menu.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    await expect(page.locator('main h1')).toBeVisible();
  }
  const more = page.locator('.mobile-nav').getByRole('button', { name: 'Mer', exact: true });
  await more.click();
  await menu.getByRole('button', { name: 'Stäng menyn' }).click();
  await expect(more).toBeFocused();
  await more.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('complete menu fits small phones and both themes', async ({ page }, testInfo) => {
  for (const theme of ['classic', 'sakura']) {
    await page.addInitScript((theme) => localStorage.setItem('tentaplugg-theme', theme), theme);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
      await page.goto('/');
      const baselineWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      await page.locator('.mobile-nav').getByRole('button', { name: 'Mer', exact: true }).click();
      const menu = page.getByRole('dialog', { name: 'Alla sidor' });
      await expect(
        menu.getByRole('button', { name: 'Partikelguide', exact: true }),
      ).toBeInViewport();
      const bounds = await menu.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(baselineWidth);
      await page.screenshot({
        path: join(tmpdir(), `tentaplugg-menu-${testInfo.project.name}-${theme}-${width}.png`),
      });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await expect(page.locator('.sidebar .nav-item')).toHaveCount(7);
});
