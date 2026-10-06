import { test, expect } from '@playwright/test';

test.describe('Milestone M1: Sidebar Peeking Mascot & Interactive Dialogue', () => {
  test('sidebar peeking mascot renders in Sakura mode and is completely omitted in Classic mode', async ({
    page,
    isMobile,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // 1. Initial Classic Mode: Zero mascot elements in the sidebar or DOM
    const sidebarMascot = page.locator('.sidebar .sidebar-chibi-card');
    await expect(sidebarMascot).toHaveCount(0);

    const studyMascot = page.locator('.anime-study-panel');
    await expect(studyMascot).toHaveCount(0);

    // 2. Switch to Sakura Mode via topbar toggle
    const themeToggle = page.locator('.topbar-theme-toggle');
    await themeToggle.click();

    // 3. Desktop Viewport: Sidebar Peeking Mascot is present and visible
    if (!isMobile) {
      await expect(sidebarMascot).toHaveCount(1);
      await expect(sidebarMascot).toBeVisible();

      // Verify mascot image asset
      const chibiImg = sidebarMascot.locator('img');
      await expect(chibiImg).toBeVisible();
      await expect(chibiImg).toHaveAttribute('src', '/anime/mascot_peek.jpg');

      // Verify speech bubble exists
      const bubble = sidebarMascot.locator('.sidebar-chibi-bubble');
      await expect(bubble).toBeVisible();
      await expect(bubble.locator('strong')).toContainText('先輩、今日もいっしょにがんばろう！✨');

      // Click sidebar mascot to cycle dialogue
      await sidebarMascot.click();
      await expect(bubble.locator('strong')).toContainText('すごい！その調子だよ〜！💮');

      // Click again to cycle to next quote
      await sidebarMascot.click();
      await expect(bubble.locator('strong')).toContainText('一歩ずつ進めば大丈夫！🌸');
    } else {
      // On mobile viewports (<= 760px), sidebar is hidden by media query
      await expect(sidebarMascot).toHaveCount(1); // rendered in Lit-HTML
      await expect(sidebarMascot).toBeHidden(); // but hidden by responsive CSS .sidebar { display: none }
    }

    // 4. Study Panel Mascot is interactive on both desktop and mobile
    await expect(studyMascot).toBeVisible();
    const studyBubble = studyMascot.locator('.kawaii-speech-bubble');
    const avatarBtn = studyMascot.locator('.anime-study-avatar-btn');

    await expect(studyBubble).toContainText('先輩、今日もいっしょにがんばろう！✨');

    // Click study mascot avatar button
    await avatarBtn.click();
    await expect(studyBubble).toContainText('すごい！その調子だよ〜！💮');

    // Click again to verify further rotation
    await avatarBtn.click();
    await expect(studyBubble).toContainText('一歩ずつ進めば大丈夫！🌸');

    // 5. Hard-Hiding: Switch back to Classic Mode
    await themeToggle.click();
    await expect(sidebarMascot).toHaveCount(0);
    await expect(studyMascot).toHaveCount(0);

    // Verify zero page errors throughout the test flow
    expect(pageErrors).toEqual([]);
  });
});
