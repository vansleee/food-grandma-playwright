import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'tests/features/*.feature',
  steps: 'tests/steps/*.ts',
  outputDir: process.env.CH06_BDD_OUTPUT_DIR || '.features-gen',
});

export default defineConfig({
  testDir,
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON || '../test-results/ch06/results.json' }]],
  outputDir: process.env.TEST_OUTPUT_DIR || '../test-results/ch06/artifacts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'retain-on-failure',
  },
});
