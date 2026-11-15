import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON }]],
  outputDir: process.env.TEST_OUTPUT_DIR,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'retain-on-failure',
  },
});
