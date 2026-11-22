import { expect } from '@playwright/test';
import { restaurantCredentials, test } from './fixtures';

test.describe('未使用 POM', () => {
  test('餐廳管理者登入後看到訂單管理', async ({ page }) => {
    // Arrange：取得測試帳號並開啟登入頁面。
    const { username, password } = restaurantCredentials();
    await page.goto('/management/sign-in');

    // Act：填寫帳號和密碼，再按下登入。
    await page.getByLabel('帳號', { exact: true }).fill(username);
    await page.getByLabel('密碼').fill(password);
    await page.getByTestId('sign-in-submit').click();

    // Assert：登入後顯示訂單管理。
    await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
  });

  test('餐廳管理者依配送地址查詢訂單', async ({ page, order, otherOrder }) => {
    // Arrange：登入並確認兩筆訂單都已顯示。
    const { username, password } = restaurantCredentials();
    await page.goto('/management/sign-in');
    await page.getByLabel('帳號', { exact: true }).fill(username);
    await page.getByLabel('密碼').fill(password);
    await page.getByTestId('sign-in-submit').click();
    const target = page.locator(`[data-testid="order-row"][data-order-id="${order.id}"]`);
    const other = page.locator(`[data-testid="order-row"][data-order-id="${otherOrder.id}"]`);
    await expect(target).toBeVisible();
    await expect(other).toBeVisible();

    // Act：以第一筆訂單的配送地址搜尋。
    await page.getByRole('textbox', { name: '搜尋訂單' }).fill(order.address);

    // Assert：搜尋結果只顯示指定訂單。
    await expect(page.getByTestId('order-row')).toHaveCount(1);
    await expect(target).toContainText(order.address);
  });

  test('餐廳管理者將既有餐點價格改為 150 元', async ({ page, meal }) => {
    // Arrange：登入後，依編號開啟本次餐點的編輯頁面。
    const { username, password } = restaurantCredentials();
    await page.goto('/management/sign-in');
    await page.getByLabel('帳號', { exact: true }).fill(username);
    await page.getByLabel('密碼').fill(password);
    await page.getByTestId('sign-in-submit').click();
    await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
    await page.goto('/management/meals');
    const row = page.locator(`[data-testid="meal-row"][data-meal-id="${meal.id}"]`);
    await row.getByTestId('meal-edit-link').click();
    await expect(page.getByTestId('meal-price')).toHaveValue('100');

    // Act：將價格改為 150 元並儲存。
    await page.getByTestId('meal-price').fill('150');
    await page.getByTestId('meal-submit').click();

    // Assert：重新開啟同一筆餐點，確認新價格已儲存。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await row.getByTestId('meal-edit-link').click();
    await expect(page.getByTestId('meal-price')).toHaveValue('150');
  });

  test('餐廳管理者將指定訂單標記為備餐完成', async ({ page, cookingOrder }) => {
    // Arrange：登入並確認指定訂單正在備餐。
    const { username, password } = restaurantCredentials();
    await page.goto('/management/sign-in');
    await page.getByLabel('帳號', { exact: true }).fill(username);
    await page.getByLabel('密碼').fill(password);
    await page.getByTestId('sign-in-submit').click();
    const row = page.locator(`[data-testid="order-row"][data-order-id="${cookingOrder.id}"]`);
    await expect(row.getByTestId('order-status')).toHaveText('備餐中');

    // Act：按下這筆訂單的「備餐完成」。
    await row.getByTestId('order-ready-button').click();

    // Assert：同一筆訂單顯示「待取餐」。
    await expect(row.getByTestId('order-status')).toHaveText('待取餐');
  });
});
