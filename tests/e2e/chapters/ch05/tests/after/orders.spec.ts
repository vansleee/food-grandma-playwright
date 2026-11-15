import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';

test('依訂單編號搜尋，只顯示指定訂單', async ({ loggedInPage, orders }) => {
  // Arrange：重新開啟訂單管理，載入這次準備的訂單。
  await loggedInPage.goto('/management/orders');
  const { target, other } = orders;
  const targetRow = loggedInPage.locator(`[data-testid="order-row"][data-order-id="${target.id}"]`);
  const otherRow = loggedInPage.locator(`[data-testid="order-row"][data-order-id="${other.id}"]`);
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toBeVisible();

  // Act：輸入目標訂單編號。
  await loggedInPage.getByRole('textbox', { name: '搜尋訂單' }).fill(String(target.id));

  // Assert：搜尋結果只有這筆訂單。
  await expect(loggedInPage.getByTestId('order-row')).toHaveCount(1);
  await expect(targetRow).toBeVisible();
  await expect(otherRow).toHaveCount(0);
});
