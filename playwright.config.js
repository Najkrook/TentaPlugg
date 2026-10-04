import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5175', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort --mode test',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
    env: { VITE_FIREBASE_EMULATORS: process.env.FIRESTORE_EMULATOR_HOST ? 'true' : 'false' },
  },
});
