import { test, expect } from '@playwright/test';

test('management exploration seed', async ({ page }) => {
  await page.goto('/management/sign-in');
  await expect(page.locator('input[type="password"]')).toBeVisible();
});
