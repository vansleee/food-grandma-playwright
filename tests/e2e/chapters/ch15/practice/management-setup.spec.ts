import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://localhost:8082' });

test('第 15 章：餐廳管理者可以從統一入口登入', async ({ page, request }) => {
  const headers = { 'X-Demo-Reset-Key': process.env.DEMO_RESET_KEY ?? 'local-dev-reset-key' };
  const reset = await request.post('http://localhost:8081/api/test/reset', { headers });
  expect(reset.status()).toBe(200);

  const seed = await request.post('http://localhost:8081/api/test/seed', { headers });
  expect(seed.status()).toBe(200);
  const { restaurant_login: account } = await seed.json();

  await page.goto('/management/sign-in');
  await page.getByLabel('帳號', { exact: true }).fill(account.username);
  await page.getByLabel('密碼').fill(account.password);
  await page.getByRole('button', { name: '登入', exact: true }).click();

  await expect(page).toHaveURL(/\/management\/orders$/);
  await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
  await expect(page.getByTestId('order-row').first()).toBeVisible();
});
