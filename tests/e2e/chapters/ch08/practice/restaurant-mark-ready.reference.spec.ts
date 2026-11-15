import { expect, test } from '../../ch09/agent-loop/order-fixture';

test('餐廳管理者將指定訂單標記為待取餐', async ({ page, orderId }) => {
  // Arrange：依這次準備的訂單編號找出備餐中的訂單。
  const order = page.getByTestId('order-row').and(page.locator(`[data-order-id="${orderId}"]`));
  await expect(order.getByTestId('order-status')).toHaveText('備餐中');

  // Act：按下同一列的「備餐完成」。
  const readyButton = order.getByTestId('order-ready-button');
  await readyButton.click();

  // Assert：同一筆訂單應變成待取餐，備餐完成按鈕應消失。
  await expect(order.getByTestId('order-status')).toHaveText('待取餐');
  await expect(readyButton).toHaveCount(0);
});
