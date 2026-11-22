import { defineConfig } from '@playwright/test';

export default defineConfig({
  testIgnore: ['**/test-results/**'],
  testDir: '.',
  testMatch: [
    '**/ch{09,10,11}/agent-loop/*.spec.ts',
    '**/ch{13,16}/generator/*.spec.ts',
    '**/ch15/exercise/*.spec.ts',
    '**/ch16/comparison/*.spec.ts',
    '**/ch16/generated/seed.spec.ts',
    '**/ch16/generated/{original,revised}/*.spec.ts',
    '**/ch16/generated/examples/{1-1,1-2,1-3}/*.spec.ts',
  ],
  workers: 1,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results/direct/agent-loop',
  use: {
    baseURL: process.env.WEB_BASE_URL ?? 'http://localhost:8082',
    trace: 'retain-on-failure',
  },
});
