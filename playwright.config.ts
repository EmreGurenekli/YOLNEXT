import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000, // Increased for comprehensive tests
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['html']],
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: 'npx vite preview --host 0.0.0.0 --port 4173',
    url: 'http://localhost:4173',
    timeout: 30_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
