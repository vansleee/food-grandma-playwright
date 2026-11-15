import { expect, test, World } from '../../../v1/tests/support/fixtures';
import { DriverOrdersPage } from '../../../v1/tests/support/pages';

test('ROLE-T01 外送員接取待取餐訂單後進入配送', async ({ page, api }) => {
  // Arrange：準備一筆待取餐訂單，並登入外送員頁面。
  const world = new World(api, 'ROLE-T01');
  const restaurant = await world.restaurant();
  const driverToken = await world.token('driverA');
  const driver = await api.driverProfile(driverToken);
  const meal = await world.meal(restaurant, { name: 'ROLE-T01 Meal', price: 100 });
  const order = await world.order(restaurant, 'customerA', 'ROLE-T01 Alpha Road 1', meal.id);
  await api.markReady(restaurant.token, order.id);

  const orders = new DriverOrdersPage(page);
  await orders.openAs(driverToken);
  await expect(orders.rowFor(order.id)).toBeVisible();

  // Act：從網頁接取指定訂單。
  await orders.pickButton(order.id).click();

  // Assert：配送頁面顯示同一筆訂單，餐廳查回的接單者與狀態正確。
  await expect(page).toHaveURL(/\/driver\/delivery$/);
  await expect(page.getByRole('heading', { name: '進行中配送', level: 1 })).toBeVisible();
  const card = page.getByTestId('active-delivery-card').filter({
    has: page.getByRole('heading', { name: `訂單 #${order.id}`, level: 2, exact: true }),
  });
  await expect(card).toBeVisible();
  await expect(card.getByText('配送中', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: '確認已送達' })).toBeVisible();

  const storedOrder = await world.readOrder(restaurant, order.id);
  expect(storedOrder.status).toBe('On the way');
  expect(storedOrder.driver?.id).toBe(driver.id);
});
