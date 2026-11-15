import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1, retries: 0,
  forbidOnly: true, timeout: 60_000, expect: { timeout: 8_000 },
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON || './test-results/results.json' }]],
  outputDir: process.env.TEST_OUTPUT_DIR || './test-results/artifacts',
  use: { ...devices['Desktop Chrome'], baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'on', screenshot: 'on' },
});
