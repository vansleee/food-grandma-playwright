import { expect, test } from './order-fixture';

test('seed', async ({ page, orderId }) => {
  const order = page.getByTestId('order-row').and(page.locator(`[data-order-id="${orderId}"]`));
  await expect(order.getByTestId('order-status')).toHaveText('備餐中');
});
