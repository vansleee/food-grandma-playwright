import { defineConfig, devices } from '@playwright/test';
import generated from './playwright.generated.config';

export default defineConfig(generated, {
  testDir: './tests',
  projects: [
    ...(generated.projects ?? []),
    { name: 'seed', testMatch: '**/agent-seed/seed.spec.ts', use: { ...devices['Desktop Chrome'] } },
  ],
});
