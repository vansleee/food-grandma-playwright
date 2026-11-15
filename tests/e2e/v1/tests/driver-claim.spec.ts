import { expect, test, World } from './support/fixtures';
import { DriverOrdersPage } from './support/pages';

const OUTSTANDING_MESSAGE = 'Your outstanding order is not delivered yet.';

test('ROLE-T01 外送員接取未指派的待取餐訂單後進入進行中配送', async ({ page, api }) => {
  const world = new World(api, 'ROLE-T01');
  const rest = await world.restaurant();
  const driverToken = await world.token('driverA');
  const driver = await api.driverProfile(driverToken);

  const meal = await world.meal(rest, { name: 'Role T01 meal', price: 90 });
  const order = await world.order(rest, 'customerA', world.tag('role-addr-'), meal.id);
  await api.markReady(rest.token, order.id);

  const driverOrders = new DriverOrdersPage(page);
  await test.step('進入可接訂單頁，該筆訂單顯示在列表中', async () => {
    await driverOrders.openAs(driverToken);
    await expect(driverOrders.rowFor(order.id)).toBeVisible();
  });

  await test.step('點選「接取訂單」', async () => {
    await driverOrders.pickButton(order.id).click();
  });

  await test.step('進入進行中配送頁並顯示該筆訂單、配送中、確認已送達', async () => {
    await expect(page).toHaveURL(/\/driver\/delivery$/);
    await expect(page.getByRole('heading', { name: '進行中配送', level: 1 })).toBeVisible();
    const card = page.getByTestId('active-delivery-card').filter({ hasText: `訂單 #${order.id}` });
    await expect(card).toBeVisible();
    await expect(card.getByText('配送中', { exact: true })).toBeVisible();
    await expect(card.getByTestId('complete-delivery')).toHaveText('確認已送達');
  });

  await test.step('以訂單資料回讀接單者與狀態', async () => {
    const after = await world.readOrder(rest, order.id);
    expect(after.status).toBe('On the way');
    expect(after.driver?.id).toBe(driver.id);
  });
});

test('ROLE-T02 外送員已有進行中配送時接單被拒', async ({ page, api }) => {
  const world = new World(api, 'ROLE-T02');
  const rest = await world.restaurant();
  const driverToken = await world.token('driverB');
  const driver = await api.driverProfile(driverToken);

  const meal = await world.meal(rest, { name: 'Role T02 meal', price: 80 });
  const current = await world.order(rest, 'customerA', world.tag('role-current-'), meal.id);
  const other = await world.order(rest, 'customerB', world.tag('role-other-'), meal.id);
  await api.markReady(rest.token, current.id);
  await api.markReady(rest.token, other.id);
  await api.claim(driverToken, current.id);

  const driverOrders = new DriverOrdersPage(page);
  await test.step('可接訂單列表有另一筆未指派的待取餐訂單', async () => {
    await driverOrders.openAs(driverToken);
    await expect(driverOrders.rowFor(other.id)).toBeVisible();
  });

  await test.step('點選另一筆訂單的「接取訂單」', async () => {
    await driverOrders.pickButton(other.id).click();
  });

  await test.step('接單被拒：留在可接訂單頁並顯示提示', async () => {
    await expect(driverOrders.error()).toContainText(OUTSTANDING_MESSAGE);
    await expect(page).toHaveURL(/\/driver\/orders$/);
    await expect(page.getByRole('heading', { name: '可接訂單', level: 1 })).toBeVisible();
  });

  await test.step('以訂單資料回讀：原配送仍屬於 B，另一筆仍未指派', async () => {
    const first = await world.readOrder(rest, current.id);
    expect(first.status).toBe('On the way');
    expect(first.driver?.id).toBe(driver.id);

    const second = await world.readOrder(rest, other.id);
    expect(second.status).toBe('Ready');
    expect(second.driver).toBeNull();
  });
});
