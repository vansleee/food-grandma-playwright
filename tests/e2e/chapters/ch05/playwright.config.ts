import { defineConfig, devices } from '@playwright/test';

const variant = process.env.CHAPTER_VARIANT;
if (variant !== 'before' && variant !== 'after') {
  throw new Error('請使用 npm run chapter -- 05 執行第 05 章的範例。');
}

export default defineConfig({
  testDir: `./tests/${variant}`,
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON }]],
  outputDir: process.env.TEST_OUTPUT_DIR,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'retain-on-failure',
  },
});
