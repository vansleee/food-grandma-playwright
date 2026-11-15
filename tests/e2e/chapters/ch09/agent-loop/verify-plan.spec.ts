import { expect, test } from './order-fixture';

test('餐廳管理者將指定訂單標記為待取餐', async ({ page, orderId }) => {
  // Arrange：用種子資料提供的編號找出原本處於「備餐中」的訂單。
  const order = page.getByTestId('order-row').and(page.locator(`[data-order-id="${orderId}"]`));
  const status = order.getByTestId('order-status');
  const readyButton = order.getByTestId('order-ready-button');
  await expect(status).toHaveText('備餐中');

  // Act：按下這筆訂單的「備餐完成」，取得對應的更新回應。
  const [update] = await Promise.all([
    page.waitForResponse((response) =>
      response.request().method() === 'PATCH' &&
      new URL(response.url()).pathname === `/api/restaurant/orders/${orderId}`,
    ),
    readyButton.click(),
  ]);

  // Assert：更新成功，同一筆訂單顯示「待取餐」，備餐完成按鈕已移除。
  expect(update.ok()).toBe(true);
  await expect(status).toHaveText('待取餐');
  await expect(readyButton).toHaveCount(0);
});
