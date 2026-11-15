import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { accountsFor } from '../../../support/env';

const { Given, When, Then } = createBdd();

Given('餐廳管理者在登入頁面', async ({ page }) => {
  await page.goto('/management/sign-in');
});

When('餐廳管理者填寫有效的帳號與錯誤的密碼並送出', async ({ page }) => {
  await page.getByLabel('帳號', { exact: true }).fill(accountsFor('CH04').restaurantA);
  await page.getByLabel('密碼', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: '登入', exact: true }).click();
});

Then('畫面應顯示登入錯誤訊息', async ({ page }) => {
  await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible();
});
