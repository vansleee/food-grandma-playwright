import { expect, type Page } from '@playwright/test';
import type { OrderView } from '../../support/api';
import { restaurantCredentials, test as base } from '../../ch17/pom/fixtures';
import { OrdersPage } from '../../ch17/pom/orders-page';
import { SignInPage } from '../../ch17/pom/sign-in-page';

const test = base.extend<{
  orderPair: { target: OrderView; other: OrderView };
}>({
  orderPair: async ({ world, restaurant, meal }, use) => {
    // 先建立目標訂單，再建立另一筆。訂單清單會把較新的訂單排在前面。
    const target = await world.order(restaurant, 'customerA', '台北市示範路 1 號', meal.id);
    const other = await world.order(restaurant, 'customerB', '台北市示範路 2 號', meal.id);
    await use({ target, other });
  },
});

async function signInAsRestaurant(page: Page) {
  const { username, password } = restaurantCredentials();
  const signInPage = new SignInPage(page);
  await signInPage.goto();
  await signInPage.signIn(username, password);
}

test('第 16 章：點第一列｜應更新指定訂單', async ({ page, orderPair }) => {
  // Arrange：等兩筆訂單都顯示「備餐中」，確認另一筆在第一列。
  const { target, other } = orderPair;
  await signInAsRestaurant(page);
  const ordersPage = new OrdersPage(page);
  const firstRow = page.getByTestId('order-row').first();
  await expect(firstRow).toHaveAttribute('data-order-id', String(other.id));
  await expect(ordersPage.statusOf(target.id)).toHaveText('備餐中');
  await expect(ordersPage.statusOf(other.id)).toHaveText('備餐中');

  // Act：假設第一列就是要更新的訂單。
  await firstRow.getByTestId('order-ready-button').click();

  // Assert：檢查兩筆訂單，讓錯誤更新的結果都顯示在報告中。
  await expect.soft(ordersPage.statusOf(target.id), `目標訂單 #${target.id}`).toHaveText('待取餐');
  await expect.soft(ordersPage.statusOf(other.id), `另一筆訂單 #${other.id}`).toHaveText('備餐中');
});

test('第 16 章：依訂單編號｜應更新指定訂單', async ({ page, orderPair }) => {
  // Arrange：確認另一筆在第一列，並等目標訂單顯示「備餐中」。
  const { target, other } = orderPair;
  await signInAsRestaurant(page);
  const ordersPage = new OrdersPage(page);
  const firstRow = page.getByTestId('order-row').first();
  await expect(firstRow).toHaveAttribute('data-order-id', String(other.id));
  await expect(ordersPage.statusOf(other.id)).toHaveText('備餐中');
  await expect(ordersPage.statusOf(target.id)).toHaveText('備餐中');

  // Act：依目標訂單編號點擊該列的「備餐完成」。
  await ordersPage.markReady(target.id);

  // Assert：目標訂單變成「待取餐」，另一筆仍是「備餐中」。
  await expect(ordersPage.statusOf(target.id), `目標訂單 #${target.id}`).toHaveText('待取餐');
  await expect(ordersPage.statusOf(other.id), `另一筆訂單 #${other.id}`).toHaveText('備餐中');
});
