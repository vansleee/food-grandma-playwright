// spec: ch13/generator/plan.md
// seed: ch13/generator/seed.spec.ts
import { apiURL, expect, test } from './demo-fixture';

test.describe('Food Grandma API 對照', () => {
  test('reject second order', async ({ request, demo }) => {
    const accessToken = 'e2e-customer-token';

    // 3. 先以 e2e-customer-token 查詢最新訂單，確認它仍是 Cooking
    const latest = await request.get(`${apiURL}/api/customer/orders/latest`, {
      params: { access_token: accessToken },
    });
    expect(latest.status()).toBe(200);
    const lastOrder = (await latest.json()).last_order;
    expect(lastOrder.status).toBe('Cooking');

    // 從既有訂單取得餐廳和餐點，POST /api/customer/orders/，用表單傳 access_token、restaurant_id、address 和 JSON 字串 order_details
    const detail = lastOrder.order_details[0];
    const response = await request.post(`${apiURL}/api/customer/orders/`, {
      form: {
        access_token: accessToken,
        restaurant_id: String(lastOrder.restaurant.id),
        address: lastOrder.address,
        order_details: JSON.stringify([
          { meal_id: detail.meal.id, quantity: detail.quantity },
        ]),
      },
    });

    // 應回 HTTP 200，status 為 failed，error 為 Your last order must be completed.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('failed');
    expect(body.error).toBe('Your last order must be completed.');
  });
});
