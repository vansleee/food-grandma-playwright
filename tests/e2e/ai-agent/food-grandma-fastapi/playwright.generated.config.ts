import { defineConfig, devices } from '@playwright/test';

// Trusted harness: generation is only allowed inside tests/generated/<spec>/.
export default defineConfig({
  testDir: './tests/generated',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['json'], ['html', { open: 'never' }]],
  outputDir: 'test-results/generated',
  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:5180',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'api', testMatch: '**/api/*.spec.ts' },
    { name: 'e2e', testMatch: '**/e2e/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'acceptance', testMatch: '**/acceptance/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
  ],
});
