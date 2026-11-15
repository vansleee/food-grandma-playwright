import { expect, test } from '../support/fixtures';
import { OrderMother } from '../support/order-mother';
import { DriverDeliveryPage, DriverOrdersPage } from '../support/pages/driver-pages';

// 規格：specs/01-restaurant-auth.md（ROLE-01、ROLE-02）。
// 外送員頁面沒有登入 UI，所以以 session 預載該案例外送員的真實 token；接單操作本身走真實 UI。

test.describe('外送員 A 接單', () => {
  test.use({ session: 'driverA' });

  test('ROLE-T01 接取待取餐訂單後進入進行中配送', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'ROLE-T01');
    const ready = await mother.ready('customerA', 'ROLE-T01 Alpha Road 1');
    const driver = await (await stage.driver('driverA')).profile();
    const orders = new DriverOrdersPage(page);
    const delivery = new DriverDeliveryPage(page);

    await orders.goto();
    await expect(orders.order(ready.id).root).toBeVisible();

    await orders.order(ready.id).claim();

    await delivery.waitUntilReady();
    const card = delivery.activeDelivery(ready.id);
    await expect(card).toBeVisible();
    await expect(card.getByText('配送中', { exact: true })).toBeVisible();
    await expect(card.getByRole('button', { name: '確認已送達' })).toBeVisible();

    const after = await mother.restaurant.getOrder(ready.id);
    expect(after.status).toBe('On the way');
    expect(after.driver?.id).toBe(driver.id);
  });
});

test.describe('外送員 B 已有進行中配送', () => {
  test.use({ session: 'driverB' });

  test('ROLE-T02 再接另一筆訂單被拒絕並留在可接訂單頁', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'ROLE-T02');
    const inProgress = await mother.onTheWay('customerA', 'ROLE-T02 Alpha Road 1', 'driverB');
    const another = await mother.ready('customerB', 'ROLE-T02 Bravo Lane 2');
    const driver = await (await stage.driver('driverB')).profile();
    expect(inProgress.driver?.id).toBe(driver.id);
    const orders = new DriverOrdersPage(page);

    await orders.goto();
    await expect(orders.order(another.id).root).toBeVisible();

    await orders.order(another.id).claim();

    await expect(orders.error).toContainText('Your outstanding order is not delivered yet.');
    await orders.waitUntilReady();
    await expect(orders.order(another.id).root).toBeVisible();

    const first = await mother.restaurant.getOrder(inProgress.id);
    expect(first.status).toBe('On the way');
    expect(first.driver?.id).toBe(driver.id);
    const second = await mother.restaurant.getOrder(another.id);
    expect(second.status).toBe('Ready');
    expect(second.driver).toBeNull();
  });
});
