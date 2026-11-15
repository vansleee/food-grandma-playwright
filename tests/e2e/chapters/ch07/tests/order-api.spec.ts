import { test, expect } from '@playwright/test';
import { Api } from '../../support/api';
import { World } from '../../support/base-fixtures';

test('CH07-T01 顧客已有未完成訂單時，再次下單會被拒絕且不會新增訂單', async ({ request }) => {
  // Arrange：準備餐廳、100 元招牌便當，以及一筆未完成的訂單
  const api = new Api(request);
  const world = new World(api, 'CH07-T01');
  const restaurant = await world.restaurant();
  const meal = await world.meal(restaurant, { name: '招牌便當', price: 100 });
  const customerToken = await world.token('customerA');

  const existingAddress = '台北市信義區示範路 1 號';
  const anotherAddress = '台北市大安區示範街 2 號';
  const existingOrder = await world.order(restaurant, 'customerA', existingAddress, meal.id);

  // Act：用另一個示範地址再送出一份招牌便當
  const response = await request.post('/api/customer/orders/', {
    form: {
      access_token: customerToken,
      restaurant_id: String(restaurant.id),
      address: anotherAddress,
      order_details: JSON.stringify([{ meal_id: meal.id, quantity: 1 }]),
    },
  });

  // Assert：API 回應拒絕下單，餐廳訂單清單仍只有原本那一筆
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('failed');
  expect(body.error).toBe('Your last order must be completed.');

  const orders = await api.listOrders(restaurant.token);
  expect(orders).toHaveLength(1);
  expect(orders[0].id).toBe(existingOrder.id);
  expect(orders[0].address).toBe(existingAddress);
});
