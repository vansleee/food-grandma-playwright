import { defineConfig, devices } from '@playwright/test';
import { posix } from 'node:path';
import chapters from './chapters.json';

const chapter = process.env.CHAPTER;
if (chapter && !/^(1[5-9]|2[0-8])$/.test(chapter)) throw new Error('章號必須介於 15～28');
const chapterDefinition = chapters.find((entry) => entry.chapter === Number(chapter));
const chapterDirectory = chapterDefinition?.file ? posix.dirname(chapterDefinition.file) : undefined;
const variantPatterns: Record<string, RegExp> = {
  before: /改寫前/,
  exercises: /第 15 章練習/,
  'first-row': /第 16 章：點第一列/,
  'order-id': /第 16 章：依訂單編號/,
  after: /改寫後/,
  'ai-exercise': /練習：用資料表宣告無效餐點測試/,
  'no-pom': /未使用 POM/,
  none: /未使用|未封裝|未整理網頁步驟/,
  v1: /\bv1\b/,
  v2: /\bv2\b/,
  pom: /POM（角色分工）/,
  screenplay: /Screenplay/,
  fluent: /Fluent Interface/,
  workflow: /Workflow Facade/,
  'general-fixture': /General Fixture/,
  'focused-fixtures': /用途明確的 Fixture/,
};

export default defineConfig({
  testIgnore: ['**/test-results/**'],
  testDir: chapterDirectory ?? '.',
  testMatch: chapterDirectory
    ? [`${chapterDirectory}/*.spec.ts`]
    : ['**/ch??/*.spec.ts', '**/ch17/pom/*.spec.ts', '**/ch18/locators/*.spec.ts'],
  grep: process.env.CHAPTER_VARIANT ? variantPatterns[process.env.CHAPTER_VARIANT] : undefined,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['json', { outputFile: process.env.RESULT_JSON || './test-results/results.json' }]],
  outputDir: process.env.TEST_OUTPUT_DIR || './test-results/artifacts',
  use: { ...devices['Desktop Chrome'], baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:18082',
    trace: 'on', screenshot: 'on' },
});
