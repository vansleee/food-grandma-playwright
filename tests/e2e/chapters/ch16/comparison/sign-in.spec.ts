// spec: ch16/comparison/plan.md
// seed: ch16/comparison/seed.spec.ts

import { test, expect } from '../../support/ch15-16-comparison';

test.describe('CH15-T01 餐廳管理者登入後看到訂單管理', () => {
  test('餐廳管理者登入後看到訂單管理', async ({ page, demo }) => {
    // Arrange: 開啟餐廳後台登入頁，準備好可用的餐廳管理帳號
    await page.goto('/management/sign-in');
    const { username, password } = demo.restaurant_login;

    // Act: 輸入正確的帳號與密碼，按下「登入」
    await page.getByTestId('sign-in-username').fill(username);
    await page.getByTestId('sign-in-password').fill(password);
    await page.getByTestId('sign-in-submit').click();

    // Assert: 到達 /management/orders，顯示「訂單管理」標題與訂單表格
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(page.getByRole('heading', { name: '訂單管理', level: 1 })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
