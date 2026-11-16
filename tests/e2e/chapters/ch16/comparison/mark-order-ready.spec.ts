// spec: ch16/comparison/plan.md
// seed: ch16/comparison/seed.spec.ts

import { test, expect } from '../../support/ch15-16-comparison';

test.describe('CH15-T02 指定訂單變成待取餐', () => {
  test('指定訂單變成待取餐', async ({ page, demo }) => {
    // Arrange: 登入餐廳後台，依 demo 提供的訂單編號找到「備餐中」的那一列
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();

    const orderNumber = `#${String(demo.seeded_order_id).padStart(4, '0')}`;
    const orderRow = page.getByTestId('order-row').filter({ hasText: orderNumber });
    const readyButton = orderRow.getByRole('button', { name: /備餐完成/ });
    await expect(orderRow).toContainText('備餐中');

    // Act: 按下該列的「備餐完成」
    await readyButton.click();

    // Assert: 同一列顯示「待取餐」，且「備餐完成」按鈕消失
    await expect(orderRow).toContainText('待取餐');
    await expect(orderRow).not.toContainText('備餐中');
    await expect(readyButton).toHaveCount(0);
  });
});
