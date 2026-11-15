import type { PlaywrightTestConfig } from '@playwright/test';

export default {
  testDir: '.',
  projects: [
    { name: 'v1', testMatch: '**/role-t01-v1.spec.ts' },
    { name: 'v2', testMatch: '**/role-t01-v2.spec.ts' },
    { name: 'driver-auth', testMatch: '**/driver-profile-auth.spec.ts' },
  ],
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON || './test-results/results.json' }]],
  outputDir: process.env.TEST_OUTPUT_DIR || './test-results/artifacts',
  use: {
    browserName: 'chromium',
    baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'on',
    screenshot: 'on',
  },
} satisfies PlaywrightTestConfig;
