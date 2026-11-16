import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: [
    '**/ch{09,10,11}/agent-loop/*.spec.ts',
    '**/ch{13,16}/generator/*.spec.ts',
    '**/ch16/comparison/*.spec.ts',
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
