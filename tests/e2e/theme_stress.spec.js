import { test, expect } from '@playwright/test';

test.describe('Milestone M3: Theme Switching & Persistence Stress Tests', () => {
  test('rapid clicking of topbar theme toggle maintains 100% state synchronization', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/TentaPlugg/);

    const toggleBtn = page.locator('.topbar-theme-toggle');
    await expect(toggleBtn).toBeVisible();

    // Verify initial classic state
    let initialTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(initialTheme).toBe('classic');

    // 50 rapid clicks
    for (let i = 1; i <= 50; i++) {
      await toggleBtn.click();
      const expectedTheme = i % 2 === 1 ? 'sakura' : 'classic';

      const domTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      const storedTheme = await page.evaluate(() => localStorage.getItem('tentaplugg-theme'));
      const metaColor = await page.evaluate(
        () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
      );

      expect(domTheme).toBe(expectedTheme);
      expect(storedTheme).toBe(expectedTheme);
      expect(metaColor).toBe(expectedTheme === 'sakura' ? '#a82e66' : '#183f37');
    }

    expect(pageErrors).toEqual([]);
  });

  test('rapid clicking of sidebar theme toggle maintains 100% state synchronization', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Ensure desktop viewport so sidebar is visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const sidebarToggle = page.locator('.sidebar-theme-toggle');
    await expect(sidebarToggle).toBeVisible();

    for (let i = 1; i <= 40; i++) {
      await sidebarToggle.click();
      const expectedTheme = i % 2 === 1 ? 'sakura' : 'classic';

      const domTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      const storedTheme = await page.evaluate(() => localStorage.getItem('tentaplugg-theme'));

      expect(domTheme).toBe(expectedTheme);
      expect(storedTheme).toBe(expectedTheme);
    }

    expect(pageErrors).toEqual([]);
  });

  test('interleaved toggles between topbar and sidebar stay consistent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const topbarToggle = page.locator('.topbar-theme-toggle');
    const sidebarToggle = page.locator('.sidebar-theme-toggle');

    for (let i = 1; i <= 30; i++) {
      if (i % 2 === 1) {
        await topbarToggle.click();
      } else {
        await sidebarToggle.click();
      }

      const expectedTheme = i % 2 === 1 ? 'sakura' : 'classic';
      const domTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      const storedTheme = await page.evaluate(() => localStorage.getItem('tentaplugg-theme'));

      expect(domTheme).toBe(expectedTheme);
      expect(storedTheme).toBe(expectedTheme);
    }
  });

  test('cold start with various localStorage states', async ({ page }) => {
    const testCases = [
      { keyVal: null, expected: 'classic', desc: 'missing key' },
      { keyVal: '', expected: 'classic', desc: 'empty string' },
      { keyVal: 'invalid-val', expected: 'classic', desc: 'invalid value' },
      { keyVal: 'undefined', expected: 'classic', desc: 'string undefined' },
      { keyVal: 'null', expected: 'classic', desc: 'string null' },
      { keyVal: 'dark', expected: 'classic', desc: 'unsupported theme' },
      { keyVal: 'sakura', expected: 'sakura', desc: 'valid sakura' },
      { keyVal: 'classic', expected: 'classic', desc: 'valid classic' },
    ];

    for (const { keyVal, expected, desc } of testCases) {
      await page.goto('/');
      await page.evaluate((val) => {
        if (val === null) {
          localStorage.removeItem('tentaplugg-theme');
        } else {
          localStorage.setItem('tentaplugg-theme', val);
        }
      }, keyVal);

      await page.reload();
      await expect(page).toHaveTitle(/TentaPlugg/);

      const domTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      const metaColor = await page.evaluate(
        () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
      );

      expect(domTheme, `Theme for ${desc}`).toBe(expected);
      if (expected === 'sakura') {
        expect(metaColor).toBe('#a82e66');
      } else {
        expect(metaColor).toBe('#183f37');
      }
    }
  });

  test('page reloads confirm early head script prevents flash of unstyled theme (FOUT)', async ({
    page,
  }) => {
    // 1. Set to Sakura
    await page.goto('/');
    const topbarToggle = page.locator('.topbar-theme-toggle');
    await topbarToggle.click(); // switches to sakura
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('sakura');

    // Add an init script to observe documentElement data-theme mutations during reload
    await page.addInitScript(() => {
      window.__foutCheck = {
        themeChanges: [],
      };
      const observer = new MutationObserver(() => {
        window.__foutCheck.themeChanges.push(document.documentElement.dataset.theme);
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    });

    await page.reload();

    const domThemeAfterReload = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(domThemeAfterReload).toBe('sakura');

    // The theme changes observed must NEVER contain 'classic' (no flash of classic theme)
    const foutCheck = await page.evaluate(() => window.__foutCheck);
    const classicFlickers = foutCheck.themeChanges.filter((t) => t === 'classic');
    expect(classicFlickers).toEqual([]);
  });

  test('anime figures visibility in Sakura mode and complete absence/hard-hiding in Classic mode', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Ensure we start in Classic mode
    const current = await page.evaluate(() => document.documentElement.dataset.theme);
    if (current === 'sakura') {
      await page.locator('.topbar-theme-toggle').click();
    }

    // 1. Verify Classic mode state on home view
    const classicStudyFigure = page.locator('.anime-study-panel');
    await expect(classicStudyFigure).toHaveCount(0);
    const classicParticleArt = page.locator('.particle-art');
    await expect(classicParticleArt).toBeVisible();

    // 2. Switch to Sakura mode
    await page.locator('.topbar-theme-toggle').click();
    await expect(page.locator('.anime-study-panel')).toBeVisible();
    await expect(classicParticleArt).toHaveCount(0);

    // Verify study image loads with non-zero dimensions
    const studyImg = page.locator('.anime-study-panel img');
    await expect(studyImg).toBeVisible();
    const naturalWidth = await studyImg.evaluate((img) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);

    // 3. Test Practice Session Feedback Mascot in Sakura mode
    // Click on 'い Böjningar' topic (auto-graded question bank)
    await page.getByRole('button', { name: /い Böjningar/ }).click();

    // Answer question: fill answer input or click choice
    const answerField = page.locator('#answer');
    if (await answerField.count()) {
      await answerField.fill('おいしくない');
    } else {
      const choice = page.locator('.choice').first();
      await expect(choice).toBeVisible();
      await choice.click();
    }

    await page.getByRole('button', { name: 'Kontrollera svar' }).click();

    // In Sakura mode, .anime-feedback-mascot must be visible in feedback panel
    const mascot = page.locator('.anime-feedback-mascot img');
    await expect(mascot).toBeVisible();
    const mascotWidth = await mascot.evaluate((img) => img.naturalWidth);
    expect(mascotWidth).toBeGreaterThan(0);

    // 4. Switch back to Classic mode while on practice feedback screen
    await page.locator('.topbar-theme-toggle').click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('classic');

    // Feedback mascot must now be omitted from DOM
    await expect(page.locator('.anime-feedback-mascot')).toHaveCount(0);

    // 5. Verify CSS hard-hiding rule: even if an anime figure element is forcefully inserted,
    // it MUST have computed display: none !important
    const dummyDisplay = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'anime-figure injected-test';
      el.textContent = 'test';
      document.body.appendChild(el);
      const computed = window.getComputedStyle(el).display;
      el.remove();
      return computed;
    });
    expect(dummyDisplay).toBe('none');
  });

  test('mobile viewport theme switcher is functional and responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const topbarToggle = page.locator('.topbar-theme-toggle');
    await expect(topbarToggle).toBeVisible();

    // Click on mobile
    await topbarToggle.click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('sakura');
    expect(await page.evaluate(() => localStorage.getItem('tentaplugg-theme'))).toBe('sakura');

    // Click again to toggle back
    await topbarToggle.click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('classic');
    expect(await page.evaluate(() => localStorage.getItem('tentaplugg-theme'))).toBe('classic');
  });
});
