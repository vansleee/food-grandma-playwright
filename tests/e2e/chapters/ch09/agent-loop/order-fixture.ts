import { expect, test as base } from '@playwright/test';

export const test = base.extend<{ orderId: number }>({
  orderId: async ({ page, request }, use) => {
    const apiURL = process.env.API_BASE_URL ?? 'http://localhost:8081';
    const headers = { 'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key' };

    const reset = await request.post(`${apiURL}/api/test/reset`, { headers });
    await expect(reset).toBeOK();
    const seed = await request.post(`${apiURL}/api/test/seed`, { headers });
    await expect(seed).toBeOK();
    const { restaurant_login, seeded_order_id } = await seed.json();
    expect(seeded_order_id).toEqual(expect.any(Number));

    await page.goto('/management/sign-in');
    await page.getByLabel('帳號', { exact: true }).fill(restaurant_login.username);
    await page.getByLabel('密碼').fill(restaurant_login.password);
    await page.getByRole('button', { name: '登入', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/orders$/);
    await use(seeded_order_id);
  },
});

export { expect };
