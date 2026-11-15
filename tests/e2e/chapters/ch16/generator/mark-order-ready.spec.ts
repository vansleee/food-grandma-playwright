// spec: ch16/generator/plan.md
// seed: ch16/generator/seed.spec.ts
import { expect, test } from './demo-fixture';

test.describe('Food Grandma 餐廳後台 UI 對照', () => {
  test('備餐完成後訂單顯示待取餐', async ({ page, demo }) => {
    // 2. 從網頁登入
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();
    await expect(page).toHaveURL(/\/management\/orders$/);

    // 依 seed 的訂單編號找出「備餐中」的訂單，在同一列按下「備餐完成」
    const orderNo = `#${String(demo.seeded_order_id).padStart(4, '0')}`;
    const row = page.getByRole('row').filter({ hasText: orderNo });
    await expect(row.getByText('備餐中')).toBeVisible();
    await row.getByTestId('order-ready-button').click();

    // 確認同一筆訂單顯示「待取餐」，且按鈕消失
    await expect(row.getByText('待取餐')).toBeVisible();
    await expect(row.getByTestId('order-ready-button')).toHaveCount(0);
  });
});
