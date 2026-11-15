import { expect } from '@playwright/test';
import { accountsFor, testPassword } from '../../../support/env';
import { test } from '../../fixtures/data.fixture';

test('依訂單編號搜尋，只顯示指定訂單', async ({ page, orders }) => {
  // Arrange：登入後，重新開啟訂單管理以載入這次準備的訂單。
  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill(accountsFor('CH05').restaurantA);
  await page.getByLabel('密碼', { exact: true }).fill(testPassword());
  await page.getByRole('button', { name: '登入', exact: true }).click();
  await expect(page).toHaveURL(/\/management\/orders$/);
  await page.goto('/management/orders');
  const { target, other } = orders;
  const targetRow = page.locator(`[data-testid="order-row"][data-order-id="${target.id}"]`);
  const otherRow = page.locator(`[data-testid="order-row"][data-order-id="${other.id}"]`);
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toBeVisible();

  // Act：輸入目標訂單編號。
  await page.getByRole('textbox', { name: '搜尋訂單' }).fill(String(target.id));

  // Assert：搜尋結果只有這筆訂單。
  await expect(page.getByTestId('order-row')).toHaveCount(1);
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toHaveCount(0);
});
