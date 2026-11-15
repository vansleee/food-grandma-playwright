import { defineConfig, devices } from '@playwright/test';

export function labConfig(chapter: 'ch34' | 'ch35') {
  const variant = process.env.LAB_VARIANT || 'before';
  if (!['before', 'after'].includes(variant)) throw new Error('LAB_VARIANT must be before or after');
  return defineConfig({
    testDir: `./${chapter}/${variant}`,
    fullyParallel: chapter === 'ch34',
    workers: 1,
    retries: 0,
    forbidOnly: true,
    timeout: 30_000,
    expect: { timeout: 5_000 },
    reporter: [
      ['list'],
      ['json', { outputFile: process.env.RESULT_JSON || './test-results/results.json' }],
    ],
    outputDir: process.env.TEST_OUTPUT_DIR || './test-results/artifacts',
    use: {
      ...devices['Desktop Chrome'],
      baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
      trace: 'on',
      screenshot: 'on',
    },
  });
}
