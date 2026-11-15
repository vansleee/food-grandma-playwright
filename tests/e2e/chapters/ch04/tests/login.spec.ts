import { expect, test } from '@playwright/test';
import { accountsFor, testPassword } from '../../support/env';

test('餐廳管理者登入後可以開啟訂單管理', async ({ page }) => {
  // Arrange：開啟餐廳管理登入頁，準備本次練習的帳號。
  const username = accountsFor('CH04').restaurantA;
  const password = testPassword();
  await page.goto('/management/sign-in');

  // Act：填寫正確的帳號和密碼，再送出表單。
  await page.getByLabel('帳號', { exact: true }).fill(username);
  await page.getByLabel('密碼', { exact: true }).fill(password);
  await page.getByRole('button', { name: '登入', exact: true }).click();

  // Assert：登入後應進到訂單管理頁面。
  await expect(page).toHaveURL(/\/management\/orders$/);
  await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
});

test('練習 1 AAA：密碼錯誤時顯示登入錯誤訊息', async ({ page }) => {
  // Arrange：開啟餐廳管理登入頁，準備有效的帳號。
  const username = accountsFor('CH04').restaurantA;
  await page.goto('/management/sign-in');

  // Act：填寫有效的帳號與錯誤的密碼，再送出表單。
  await page.getByLabel('帳號', { exact: true }).fill(username);
  await page.getByLabel('密碼', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: '登入', exact: true }).click();

  // Assert：畫面應顯示登入錯誤訊息。
  await expect(page.getByText('Invalid username or password', { exact: true })).toBeVisible();
});
