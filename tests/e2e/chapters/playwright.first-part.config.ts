import { defineConfig } from '@playwright/test';

export default defineConfig({
  testIgnore: ['**/test-results/**'],
  testDir: '.',
  testMatch: ['**/ch{08,12,13,15,16}/practice/*.spec.ts', '**/ch15/comparison/*.spec.ts', '**/ch15/manual/*.spec.ts'],
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results/direct/first-part',
  use: { baseURL: 'http://localhost:8082', trace: 'retain-on-failure' },
});
