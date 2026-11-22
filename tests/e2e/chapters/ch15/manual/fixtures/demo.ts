import { expect, test as base } from '@playwright/test';

type Demo = {
  restaurant_login: { username: string; password: string };
  driver_access_token: string;
  seeded_order_id: number;
};

const apiURL = process.env.API_BASE_URL ?? 'http://localhost:8081';
const headers = { 'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key' };

export const test = base.extend<{ demo: Demo; deliveryOrderId: number }>({
  demo: async ({ request }, use) => {
    const reset = await request.post(`${apiURL}/api/test/reset`, { headers });
    await expect(reset, '重設本機練習資料庫').toBeOK();
    const seed = await request.post(`${apiURL}/api/test/seed`, { headers });
    await expect(seed, '建立本次練習資料').toBeOK();
    await use(await seed.json());
  },

  deliveryOrderId: async ({ demo, request }, use) => {
    const active = await request.get(`${apiURL}/api/driver/orders/active`, {
      params: { access_token: demo.driver_access_token },
    });
    await expect(active, '查詢外送員的起始配送資料').toBeOK();
    const { orders } = await active.json() as { orders: { id: number }[] };
    expect(orders, '練習開始前，外送員只有一筆進行中的配送').toHaveLength(1);
    await use(orders[0].id);
  },
});

export { expect };
