// spec: ch16/generator/plan.md
// seed: ch16/generator/seed.spec.ts
import { expect, test } from './demo-fixture';

test.describe('Food Grandma 餐廳後台 UI 對照', () => {
  test('從導覽開啟餐點列表', async ({ page, demo }) => {
    // 3. 從網頁登入
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();
    await expect(page).toHaveURL(/\/management\/orders$/);

    // 透過餐廳後台導覽開啟餐點列表
    await page.getByTestId('nav-meals').click();

    // 確認到達 /management/meals、顯示餐點表格及 seed 的 Margherita 餐點
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Margherita' })).toBeVisible();
  });
});
