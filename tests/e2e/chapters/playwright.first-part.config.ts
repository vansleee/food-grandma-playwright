import { defineConfig } from '@playwright/test';

export default defineConfig({
  testIgnore: ['**/test-results/**'],
  testDir: '.',
  testMatch: [
    '**/ch{08,12,13}/practice/*.spec.ts',
    '**/ch15/manual/*.spec.ts',
    '**/ch15/manual/examples/{1-2,1-3}/*.spec.ts',
  ],
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results/direct/first-part',
  use: { baseURL: 'http://localhost:8082', trace: 'retain-on-failure' },
});
