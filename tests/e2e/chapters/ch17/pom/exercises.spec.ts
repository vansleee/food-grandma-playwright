import { expect } from '@playwright/test';
import { restaurantCredentials, test } from './fixtures';
import { MealsPage } from './meals-page';
import { OrdersPage } from './orders-page';
import { SignInPage } from './sign-in-page';

test.describe('第 15 章練習', () => {
  test('第 1 題：依配送地址搜尋訂單', async ({ page, order, otherOrder }) => {
    // Arrange：登入並確認兩筆訂單都已顯示。
    const { username, password } = restaurantCredentials();
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.signIn(username, password);

    const ordersPage = new OrdersPage(page);
    await expect(ordersPage.row(order.id)).toBeVisible();
    await expect(ordersPage.row(otherOrder.id)).toBeVisible();

    // Act：以第一筆訂單的配送地址搜尋。
    await ordersPage.search(order.address);

    // Assert：搜尋結果只顯示指定訂單。
    await expect(page.getByTestId('order-row')).toHaveCount(1);
    await expect(ordersPage.row(order.id)).toContainText(order.address);
  });

  test('第 2 題：在餐點清單找到剛準備的餐點', async ({ page, meal }) => {
    // Arrange：登入並取得本次測試準備的餐點。
    const { username, password } = restaurantCredentials();
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.signIn(username, password);

    // Act：從管理後台的側欄開啟餐點清單。
    const mealsPage = new MealsPage(page);
    await mealsPage.open();

    // Assert：依編號找到本次的餐點，並確認名稱相符。
    await expect(mealsPage.row(meal.id)).toContainText(meal.name);
  });

  test('第 3 題：備餐更新失敗時保留原狀態', async ({ page, cookingOrder }) => {
    // Arrange：登入並確認訂單正在備餐，接著模擬該筆訂單的更新失敗。
    const { username, password } = restaurantCredentials();
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.signIn(username, password);

    const ordersPage = new OrdersPage(page);
    await expect(ordersPage.statusOf(cookingOrder.id)).toHaveText('備餐中');

    await page.route(`**/api/restaurant/orders/${cookingOrder.id}`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 500 });
      } else {
        await route.continue();
      }
    });

    // Act：用第 4 節的頁面物件按下「備餐完成」。
    await ordersPage.markReady(cookingOrder.id);

    // Assert：先等到畫面顯示失敗訊息，再確認同一筆訂單仍在備餐。
    await expect(page.getByRole('alert')).toHaveText('更新訂單失敗，請稍後重試。');
    await expect(ordersPage.statusOf(cookingOrder.id)).toHaveText('備餐中');
  });
});
