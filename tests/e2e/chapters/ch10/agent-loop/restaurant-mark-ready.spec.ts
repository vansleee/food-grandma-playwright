// spec: ch09/agent-loop/plan.md
// seed: ch09/agent-loop/seed.spec.ts

import { expect, test } from '../../ch09/agent-loop/order-fixture';

test.describe('訂單管理：備餐完成', () => {
  test('將 seed 指定的備餐中訂單標記為備餐完成', async ({ page, orderId }) => {
    // Arrange: 以 seeded_order_id 定位目標列，並確認原狀態與按鈕
    const order = page.getByTestId('order-row').and(page.locator(`[data-order-id="${orderId}"]`));
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(order.getByTestId('order-status')).toHaveText('備餐中');
    const readyButton = order.getByTestId('order-ready-button');
    await expect(readyButton).toBeVisible();
    const detailsBefore = {
      id: await order.locator('td').nth(0).innerText(),
      meals: await order.locator('td').nth(1).innerText(),
      customer: await order.locator('td').nth(2).innerText(),
      amount: await order.locator('td').nth(4).innerText(),
    };

    // Act: 在目標訂單列點擊「備餐完成 →」按鈕
    await readyButton.click();

    // Assert: 檢查同一筆目標訂單列
    await expect(page.getByRole('status')).toContainText(`訂單 #${orderId} 已標記為待取餐。`);
    // 1. 狀態為「待取餐」
    await expect(order.getByTestId('order-status')).toHaveText('待取餐');
    // 2. 不再有「備餐完成 →」按鈕，操作欄顯示「—」
    await expect(order.getByTestId('order-ready-button')).toHaveCount(0);
    await expect(order.locator('td').last()).toHaveText('—');
    // 3. 訂單編號、餐點、顧客與金額維持不變
    await expect(order.locator('td').nth(0)).toHaveText(detailsBefore.id);
    await expect(order.locator('td').nth(1)).toHaveText(detailsBefore.meals);
    await expect(order.locator('td').nth(2)).toHaveText(detailsBefore.customer);
    await expect(order.locator('td').nth(4)).toHaveText(detailsBefore.amount);
  });
});
