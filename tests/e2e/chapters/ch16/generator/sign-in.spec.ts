// spec: ch16/generator/plan.md
// seed: ch16/generator/seed.spec.ts
import { expect, test } from './demo-fixture';

test.describe('Food Grandma 餐廳後台 UI 對照', () => {
  test('餐廳登入後進入訂單管理', async ({ page, demo }) => {
    // 1. 從 /management/sign-in 送出正確帳密
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();

    // 確認到達 /management/orders，看得到「訂單管理」標題和訂單表格
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(page.getByRole('heading', { name: '訂單管理' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
