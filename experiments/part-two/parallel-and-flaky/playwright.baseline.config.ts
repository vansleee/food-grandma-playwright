import { defineConfig } from '@playwright/test';
import baseline from './baseline/playwright.config';

// baseline/tests 與 v1 完全相同，只改執行位置。
export default defineConfig({ ...baseline, testDir: './baseline/tests' });
