import { defineConfig, devices } from '@playwright/test';

const group = process.env.PATTERN_GROUP || 'page-factory';
const variant = process.env.PATTERN_VARIANT || 'before';
const groups = ['page-factory', 'workflow', 'screenplay', 'adapter', 'repository', 'repository-contract'];
if (!groups.includes(group)) throw new Error(`Unknown PATTERN_GROUP: ${group}`);
if (!['before', 'after'].includes(variant)) throw new Error(`Unknown PATTERN_VARIANT: ${variant}`);

export default defineConfig({
  testDir: group === 'repository-contract' ? './examples/repository/contract' : `./examples/${group}`,
  testMatch: group === 'repository-contract' ? '**/*.spec.ts' : `**/${variant}.spec.ts`,
  workers: 1,
  retries: 0,
  fullyParallel: false,
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
