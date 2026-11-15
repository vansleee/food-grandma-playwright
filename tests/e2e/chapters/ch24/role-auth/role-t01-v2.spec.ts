import { expect, test } from '../../../v2/tests/support/fixtures';
import { OrderMother } from '../../../v2/tests/support/order-mother';
import { DriverDeliveryPage, DriverOrdersPage } from '../../../v2/tests/support/pages/driver-pages';

test.use({ session: 'driverA' });

test('ROLE-T01 外送員接取待取餐訂單後進入配送', async ({ page, stage }) => {
  // Arrange：準備一筆待取餐訂單，並使用已登入的外送員頁面。
  const mother = await OrderMother.open(stage, 'ROLE-T01');
  const order = await mother.ready('customerA', 'ROLE-T01 Alpha Road 1');
  const driverRepository = await stage.driver('driverA');
  const driver = await driverRepository.profile();

  const orders = new DriverOrdersPage(page);
  const delivery = new DriverDeliveryPage(page);
  await orders.goto();
  await expect(orders.order(order.id).root).toBeVisible();

  // Act：從網頁接取指定訂單。
  await orders.order(order.id).claim();

  // Assert：配送頁面顯示同一筆訂單，餐廳查回的接單者與狀態正確。
  await delivery.waitUntilReady();
  const card = delivery.activeDelivery(order.id);
  await expect(card).toBeVisible();
  await expect(card.getByText('配送中', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: '確認已送達' })).toBeVisible();

  const storedOrder = await mother.restaurant.getOrder(order.id);
  expect(storedOrder.status).toBe('On the way');
  expect(storedOrder.driver?.id).toBe(driver.id);
});
