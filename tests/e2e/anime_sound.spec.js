import { test, expect } from '@playwright/test';

test.describe('Milestone M4: Anime Sound & Uniform Theme Toggle Tests', () => {
  test('theme toggle buttons have uniform Kawaii-ify labels and dimensions', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const topbarToggle = page.locator('.topbar-theme-toggle');
    const sidebarToggle = page.locator('.sidebar-theme-toggle');

    await expect(topbarToggle).toBeVisible();
    await expect(sidebarToggle).toBeVisible();

    // In Classic mode, both should show Kawaii-ify
    await expect(topbarToggle).toContainText('Kawaii-ify');
    await expect(sidebarToggle).toContainText('Kawaii-ify');

    // Both should have height 40px
    const topbarBox = await topbarToggle.boundingBox();
    const sidebarBox = await sidebarToggle.boundingBox();
    expect(topbarBox?.height).toBe(40);
    expect(sidebarBox?.height).toBe(40);

    // Switch to Sakura mode
    await topbarToggle.click();

    // In Sakura mode, both should show Klassisk
    await expect(topbarToggle).toContainText('Klassisk');
    await expect(sidebarToggle).toContainText('Klassisk');

    // Check sound toggle and slider are visible in Sakura mode
    const soundToggle = page.locator('.sound-toggle');
    await expect(soundToggle).toBeVisible();
    await expect(soundToggle).toContainText('Ljud');

    const soundSlider = page.locator('.sound-slider');
    const soundSliderWrapper = page.locator('.sound-slider-wrapper');
    await expect(soundSliderWrapper).toBeVisible();
    await expect(soundSlider).toBeVisible();
    expect(await soundSlider.inputValue()).toBe('50');

    // Adjust volume slider to 70%
    await soundSlider.fill('70');
    await soundSlider.dispatchEvent('input');
    const storedVolume = await page.evaluate(() => localStorage.getItem('tentaplugg-sound-volume'));
    expect(storedVolume).toBe('0.7');

    // Mute sound
    await soundToggle.click();
    const mutedStorage = await page.evaluate(() => localStorage.getItem('tentaplugg-sound-muted'));
    expect(mutedStorage).toBe('true');
    await expect(soundToggle).toContainText('Tyst');

    // Unmute sound
    await soundToggle.click();
    const unmutedStorage = await page.evaluate(() =>
      localStorage.getItem('tentaplugg-sound-muted'),
    );
    expect(unmutedStorage).toBe('false');
    await expect(soundToggle).toContainText('Ljud');

    // Switch back to Classic mode
    await sidebarToggle.click();
    await expect(topbarToggle).toContainText('Kawaii-ify');
    await expect(sidebarToggle).toContainText('Kawaii-ify');

    // Sound toggle and slider must be hidden in Classic mode
    await expect(soundToggle).toBeHidden();
    await expect(soundSliderWrapper).toBeHidden();

    expect(pageErrors).toEqual([]);
  });

  test('sound playback calls do not throw unhandled rejections during quiz practice', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Activate Sakura mode
    const topbarToggle = page.locator('.topbar-theme-toggle');
    await topbarToggle.click();

    // Start practice mode
    const practiceBtn = page
      .locator(
        'button:has-text("Öva"), button:has-text("Starta övning"), button:has-text("Börja öva")',
      )
      .first();
    if (await practiceBtn.isVisible()) {
      await practiceBtn.click();

      // Wait for question options
      const optionBtn = page.locator('.option-btn, .choice-btn').first();
      if (await optionBtn.isVisible()) {
        await optionBtn.click();
        const checkBtn = page
          .locator('button:has-text("Kontrollera"), button:has-text("Svara")')
          .first();
        if (await checkBtn.isVisible()) {
          await checkBtn.click();
        }
      }
    }

    expect(pageErrors).toEqual([]);
  });

  test('clicking anime study mascot in Sakura mode triggers arigato sound without errors', async ({
    page,
  }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Activate Sakura mode
    const topbarToggle = page.locator('.topbar-theme-toggle');
    await topbarToggle.click();

    // Verify mascot and avatar button are visible
    const mascot = page.locator('.anime-study-panel');
    await expect(mascot).toBeVisible();

    const avatarBtn = page.locator('.anime-study-avatar-btn');
    await expect(avatarBtn).toBeVisible();

    // Click on the mascot avatar button
    await avatarBtn.click();

    // Press Enter on the mascot avatar button
    await avatarBtn.press('Enter');

    expect(pageErrors).toEqual([]);
  });
});
