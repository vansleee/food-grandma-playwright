// spec: ch09/agent-loop/plan-rerun.md
// seed: ch09/agent-loop/seed.spec.ts

import { expect, test } from '../../ch09/agent-loop/order-fixture';

test.describe('訂單管理：備餐完成', () => {
  test('將指定的備餐中訂單標記為備餐完成', async ({ page, orderId }) => {
    // Arrange: 以訂單編號定位目標列，並確認原狀態為備餐中
    const order = page.getByTestId('order-row').and(page.locator(`[data-order-id="${orderId}"]`));
    await expect(order).toHaveCount(1);
    await expect(order.getByTestId('order-status')).toHaveText('備餐中');
    await expect(order.getByTestId('order-ready-button')).toHaveText('備餐完成 →');

    // Act: 在目標訂單列內點擊「備餐完成 →」按鈕
    await order.getByTestId('order-ready-button').click();

    // Assert: 同一筆訂單狀態變為待取餐
    await expect(order.getByTestId('order-status')).toHaveText('待取餐');

    // Assert: 該列備餐完成按鈕消失
    await expect(order.getByTestId('order-ready-button')).toHaveCount(0);

    // Assert: 訂單仍在列表中，編號、顧客、金額與餐點明細不變
    await expect(order).toHaveCount(1);
    await expect(order).toContainText(`#${String(orderId).padStart(4, '0')}`);
    await expect(order).toContainText('Cathy Customer');
    await expect(order).toContainText(/Margherita\s*× 2 · \$20/);
  });
});
