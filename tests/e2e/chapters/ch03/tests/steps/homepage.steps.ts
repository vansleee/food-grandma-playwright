import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

Given('我開啟 Playwright 首頁', async ({ page }) => {
  await page.goto('https://playwright.dev/');
});

Then('我應該看到包含 Playwright 的標題', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
});
