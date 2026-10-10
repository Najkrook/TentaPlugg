import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320px' },
  { width: 360, height: 640, name: '360px' },
  { width: 375, height: 667, name: '375px' },
  { width: 390, height: 844, name: '390px' },
  { width: 414, height: 896, name: '414px' },
  { width: 768, height: 1024, name: '768px' },
  { width: 1024, height: 768, name: '1024px' },
];

const THEMES = ['classic', 'sakura'];

async function getOverflowMetrics(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body ? document.body.scrollWidth : 0;
    const winWidth = window.innerWidth;
    const overflow = Math.max(0, docWidth - winWidth, bodyWidth - winWidth);

    let offenders = [];
    if (overflow > 0) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > winWidth + 1) {
          offenders.push({
            tag: el.tagName,
            cls: el.className ? String(el.className) : '',
            right: r.right,
            width: r.width,
            winWidth,
          });
          if (offenders.length >= 5) break;
        }
      }
    }
    return { docWidth, bodyWidth, winWidth, overflow, offenders };
  });
}

async function setThemeOnPage(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('tentaplugg-theme', t);
    document.documentElement.dataset.theme = t;
  }, theme);
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  const activeTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(activeTheme).toBe(theme);
}

async function navigateTo(page, target) {
  const isMobile = await page.locator('.mobile-nav').isVisible();
  const labelMap = {
    exams: isMobile ? 'Tentor' : 'Gamla tentor',
    progress: isMobile ? 'Framsteg' : 'Mina framsteg',
    guide: 'Snabbguide',
    home: 'Plugga',
  };
  const name = labelMap[target];
  if (isMobile && target === 'guide') {
    await page.locator('.mobile-nav').getByRole('button', { name: 'Mer', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
    return;
  }
  await page.getByRole('button', { name, exact: true }).filter({ visible: true }).click();
}

test.describe('Empirical Challenge: Multi-Viewport Overflow & Layout Boundaries', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Home view zero overflow at ${vp.width}px in ${theme} mode`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await setThemeOnPage(page, theme);

        const metrics = await getOverflowMetrics(page);
        expect(
          metrics.overflow,
          `Expected 0px overflow at ${vp.width}px [${theme}]. docWidth=${metrics.docWidth}, winWidth=${metrics.winWidth}, offenders=${JSON.stringify(metrics.offenders)}`,
        ).toBe(0);
        expect(metrics.docWidth).toBeLessThanOrEqual(metrics.winWidth);
      });
    }
  }

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Practice session zero overflow at ${vp.width}px in ${theme} mode`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await setThemeOnPage(page, theme);

        // Start practice
        const startBtn = page.getByRole('button', { name: /Träna partiklar/i });
        if (await startBtn.isVisible()) {
          await startBtn.click();
        } else {
          await page.locator('.topic-card').first().click();
        }

        // Wait for question to render
        await expect(page.locator('.question-panel')).toBeVisible();

        const metrics = await getOverflowMetrics(page);
        expect(
          metrics.overflow,
          `Expected 0px overflow in practice session at ${vp.width}px [${theme}]. Offenders=${JSON.stringify(metrics.offenders)}`,
        ).toBe(0);

        // Grade question to check feedback mascots and contrastive cards
        const choices = page.locator('.choice');
        if (await choices.count()) {
          await choices.first().click();
        } else {
          const input = page.locator('#answer');
          if (await input.count()) {
            await input.fill('テスト');
          }
        }

        const checkBtn = page.getByRole('button', { name: /Kontrollera svar/i });
        if (await checkBtn.isVisible()) {
          await checkBtn.click();
          await expect(page.locator('.feedback')).toBeVisible();

          const feedbackMetrics = await getOverflowMetrics(page);
          expect(
            feedbackMetrics.overflow,
            `Expected 0px overflow in practice feedback screen at ${vp.width}px [${theme}]. Offenders=${JSON.stringify(feedbackMetrics.offenders)}`,
          ).toBe(0);
        }
      });
    }
  }

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test(`Secondary views (Exams, Progress, Guide) zero overflow at ${vp.width}px in ${theme} mode`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await setThemeOnPage(page, theme);

        // 1. Exams view
        await navigateTo(page, 'exams');
        await expect(page.locator('.exam-card').first()).toBeVisible();
        let m = await getOverflowMetrics(page);
        expect(
          m.overflow,
          `Exams view overflow at ${vp.width}px [${theme}]: docWidth=${m.docWidth}, winWidth=${m.winWidth}, offenders=${JSON.stringify(m.offenders)}`,
        ).toBe(0);

        // 2. Progress view
        await navigateTo(page, 'progress');
        await expect(page.locator('.score-circle')).toBeVisible();
        m = await getOverflowMetrics(page);
        expect(
          m.overflow,
          `Progress view overflow at ${vp.width}px [${theme}]: docWidth=${m.docWidth}, winWidth=${m.winWidth}, offenders=${JSON.stringify(m.offenders)}`,
        ).toBe(0);

        // 3. Snabbguide view
        await navigateTo(page, 'guide');
        await expect(page.locator('.guide').first()).toBeVisible();
        m = await getOverflowMetrics(page);
        expect(
          m.overflow,
          `Snabbguide view overflow at ${vp.width}px [${theme}]: docWidth=${m.docWidth}, winWidth=${m.winWidth}, offenders=${JSON.stringify(m.offenders)}`,
        ).toBe(0);
      });
    }
  }

  const MOBILE_VIEWPORTS = [320, 360, 375, 390, 414];
  for (const width of MOBILE_VIEWPORTS) {
    test(`Mobile theme toggle sweep at ${width}px: 10 toggles cause 0px overflow at every step`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/');

      const toggleBtn = page.locator('.topbar-theme-toggle');
      await expect(toggleBtn).toBeVisible();

      // Ensure starting in classic
      let curTheme = await page.evaluate(() => document.documentElement.dataset.theme);
      if (curTheme !== 'classic') {
        await toggleBtn.click();
      }

      // Initial overflow check
      let initialM = await getOverflowMetrics(page);
      expect(initialM.overflow, `Initial classic overflow at ${width}px`).toBe(0);

      // Perform 10 consecutive toggles
      for (let i = 1; i <= 10; i++) {
        await toggleBtn.click();
        const expectedTheme = i % 2 === 1 ? 'sakura' : 'classic';

        // Wait brief tick for any DOM re-render
        await page.waitForTimeout(50);

        const currentTheme = await page.evaluate(() => document.documentElement.dataset.theme);
        expect(currentTheme).toBe(expectedTheme);

        const stepMetrics = await getOverflowMetrics(page);
        expect(
          stepMetrics.overflow,
          `Overflow detected on toggle #${i} (${expectedTheme}) at ${width}px: docWidth=${stepMetrics.docWidth}, winWidth=${stepMetrics.winWidth}, offenders=${JSON.stringify(stepMetrics.offenders)}`,
        ).toBe(0);
        expect(stepMetrics.docWidth).toBeLessThanOrEqual(stepMetrics.winWidth);
      }
    });
  }

  for (const width of MOBILE_VIEWPORTS) {
    test(`Quick Guide modal at mobile ${width}px does not overflow in either theme`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/');

      for (const theme of ['classic', 'sakura']) {
        await setThemeOnPage(page, theme);

        // Open modal via window helper
        await page.evaluate(() => {
          if (window.openGuideModal) {
            window.openGuideModal('wa-ga');
          }
        });

        const modal = page.locator('dialog.guide-modal');
        await expect(modal).toBeVisible();
        const m = await getOverflowMetrics(page);
        expect(
          m.overflow,
          `Guide modal overflow at ${width}px [${theme}]: docWidth=${m.docWidth}, winWidth=${m.winWidth}, offenders=${JSON.stringify(m.offenders)}`,
        ).toBe(0);

        // Close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  }
});
