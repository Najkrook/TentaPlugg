import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: __dirname,
  testMatch: /diag\.spec\.js$/,
  use: { baseURL: 'http://127.0.0.1:5175' },
  projects: [
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort --mode test',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
    env: { VITE_FIREBASE_EMULATORS: 'false' },
  },
});
