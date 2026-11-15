import { test, expect } from '@playwright/test';
import { Api } from '../../support/api';
import { World } from '../../support/base-fixtures';

test('CH07-T02 顧客從網頁訂購一份招牌便當後看到正確的訂單進度', async ({ page, request }) => {
  // Arrange：準備餐廳、100 元招牌便當，並以測試顧客身分登入
  const api = new Api(request);
  const world = new World(api, 'CH07-T02');
  const restaurant = await world.restaurant();
  const meal = await world.meal(restaurant, { name: '招牌便當', price: 100 });
  const customerToken = await world.token('customerA');
  const address = '台北市中山區示範大道 7 號';

  await page.goto(`/customer/restaurants/${restaurant.id}/meals`);
  await page.evaluate((token) => {
    localStorage.setItem('food_alpaca_customer_token', token);
  }, customerToken);

  // Act：加入購物車、前往結帳、填入地址並送出
  const mealCard = page.getByTestId('meal-card').filter({ hasText: meal.name });
  await mealCard.getByRole('button', { name: '加入購物車' }).click();
  await page.getByRole('button', { name: /查看購物車/ }).click();
  await page.getByRole('button', { name: '前往結帳' }).click();
  await page.getByLabel('配送地址').fill(address);
  await page.getByRole('button', { name: '確認送出訂單' }).click();

  // Assert：進到訂單進度，畫面與餐廳端查到的這筆訂單一致
  await expect(page.getByRole('heading', { name: '訂單進度' })).toBeVisible();

  const orders = await api.listOrders(restaurant.token);
  expect(orders).toHaveLength(1);
  const [placedOrder] = orders;
  expect(placedOrder).toMatchObject({ address, total: 100 });

  const deliveryCard = page.getByTestId('delivery-card');
  await expect(deliveryCard.getByText(`訂單 #${placedOrder.id}`, { exact: true })).toBeVisible();
  await expect(deliveryCard).toContainText(address);
  await expect(deliveryCard).toContainText('餐點合計： $100.00');
});
