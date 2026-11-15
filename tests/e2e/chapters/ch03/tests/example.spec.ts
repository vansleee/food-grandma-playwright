import { test, expect } from '@playwright/test';

test('Playwright 首頁標題包含 Playwright', async ({ page }) => {
  // Arrange
  await page.goto('https://playwright.dev/');

  // Act
  const title = page.getByRole('heading', { name: /Playwright/ }).first();

  // Assert
  await expect(title).toBeVisible();
});
