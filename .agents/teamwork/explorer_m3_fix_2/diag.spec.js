import { test, expect } from '@playwright/test';

test('check all views for mobile overflow on iPhone 13 (390px)', async ({ page }) => {
  // Apply Candidate B CSS
  const fixCSS = `
    @media (max-width: 760px) {
      .topbar {
        padding: 0 16px;
        gap: 8px;
      }
      .topbar-actions {
        gap: 6px;
        min-width: 0;
        flex-shrink: 1;
      }
      .topbar-theme-toggle {
        padding: 5px 9px;
        font-size: 11px;
        flex-shrink: 0;
      }
      .account {
        min-width: 0;
        flex-shrink: 1;
      }
      .account span {
        max-width: 110px;
      }
    }
    @media (max-width: 480px) {
      .topbar-theme-toggle .theme-label {
        display: none;
      }
      .topbar-theme-toggle {
        padding: 6px 10px;
      }
      .account span {
        max-width: 110px;
      }
    }
    @media (max-width: 360px) {
      .topbar {
        padding: 0 10px;
      }
      .account span {
        max-width: 80px;
      }
    }
  `;

  await page.goto('/');
  await page.addStyleTag({ content: fixCSS });

  const checkOverflow = async (name) => {
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const winW = await page.evaluate(() => window.innerWidth);
    const ok = scrollW <= winW;
    console.log(`View "${name}": scrollWidth=${scrollW}, innerWidth=${winW} -> ${ok ? 'PASS' : 'FAIL (diff=' + (scrollW - winW) + 'px)'}`);
    expect(ok).toBe(true);
  };

  // 1. Home view (Classic)
  await checkOverflow('Home (Classic)');

  // 2. Home view (Sakura)
  await page.locator('.topbar-theme-toggle').click();
  await checkOverflow('Home (Sakura)');

  // 3. Exams view
  await page.getByRole('button', { name: 'Tentor' }).click();
  await checkOverflow('Exams (Sakura)');

  // 4. Start Exam
  await page.locator('[data-exam-card="gema70"]').getByRole('button', { name: 'Börja tentan' }).click();
  await checkOverflow('Active Exam (Sakura)');

  // 5. Leave exam, go to Guide view
  await page.getByRole('button', { name: 'Spara & lämna' }).click();
  await page.getByRole('button', { name: 'Snabbguide' }).click();
  await checkOverflow('Guide View (Sakura)');

  // 6. Practice session
  await page.getByRole('button', { name: 'Studierum' }).click();
  await page.getByRole('button', { name: 'Träna partiklar' }).click();
  await checkOverflow('Active Practice (Sakura)');

  // 7. Toggle back to Classic in practice
  await page.locator('.topbar-theme-toggle').click();
  await checkOverflow('Active Practice (Classic)');
});
