import { DriverOrdersPage } from '../support/pages';
import { expect, World } from '../support/test';
import { CustomerOrderingWorkflow } from './customerworkflows';
import { test } from './fixtures';
import { expectLifecycle, readOrder } from './order-checks';
import { DriverDeliveryPage, RestaurantOrdersPage } from './page';
import {
  Actor, BrowseTheWeb, ClaimOrder, ConfirmDelivered,
  MarkOrderReady, PlaceOrder, ReadRestaurantOrders, TheOrder,
} from './screenplay';

test.describe('POM（角色分工）', () => {
  test('CH26-T01 顧客下單、餐廳備餐完成、外送員接單並確認送達', async ({ actorsPages, api, restaurant, scenario }, info) => {
    // Arrange：準備一份可訂購的餐點，讓顧客、餐廳管理者和外送員各自登入。
    const customer = new CustomerOrderingWorkflow(actorsPages.customer);
    const manager = new RestaurantOrdersPage(actorsPages.manager);
    const driverOrders = new DriverOrdersPage(actorsPages.driver);
    const driverDelivery = new DriverDeliveryPage(actorsPages.driver);

    // Act：顧客選擇餐點、填寫配送地址並送出訂單。
    await actorsPages.customer.goto('/customer/restaurants');
    await customer.placeOrder(scenario);

    // Assert：從餐廳的訂單清單查到這筆新訂單，記下「備餐中」的狀態。
    const created = await readOrder(api, restaurant.token, scenario.address);

    // 餐廳按下「備餐完成」，查詢同一筆訂單是否變成「待取餐」。
    await manager.markReady(created.id);
    const ready = await readOrder(api, restaurant.token, scenario.address);

    // 外送員按下「接取訂單」，查詢訂單是否直接進入「配送中」，並記下接單的外送員。
    await driverOrders.claim(created.id);
    await driverDelivery.expectActiveOrder(created.id);
    const onTheWay = await readOrder(api, restaurant.token, scenario.address);

    // 外送員按下「確認已送達」，查詢同一筆訂單是否變成「已送達」。
    await driverDelivery.confirmDelivered(created.id);
    const delivered = await readOrder(api, restaurant.token, scenario.address);

    // 核對四個階段的狀態、訂單編號、餐點、金額和外送員。
    // 確認訂單已從外送員的配送清單移除，顧客與餐廳都查得到這筆訂單已送達。
    expect(await api.listOrders(restaurant.token)).toHaveLength(1);
    await expectLifecycle(actorsPages, scenario, [created, ready, onTheWay, delivered], info);
  });

  test('CH26-T03 兩位顧客的訂單由不同外送員接單並交錯送達', async ({ actorsPages, extraPages, api, restaurant, caseId, scenario }, info) => {
    // Arrange：兩位顧客、一位管理者、兩位外送員各自使用獨立登入環境。
    const world = new World(api, caseId);
    const otherDriver = await api.driverProfile(await world.token('driverB'));
    const orderA = { ...scenario, address: `${scenario.address} A` };
    const orderB = { ...scenario, address: `${scenario.address} B`, driverId: otherDriver.id };
    const customerA = new CustomerOrderingWorkflow(actorsPages.customer);
    const customerB = new CustomerOrderingWorkflow(extraPages.customer);
    const manager = new RestaurantOrdersPage(actorsPages.manager);
    const driverAOrders = new DriverOrdersPage(actorsPages.driver);
    const driverBOrders = new DriverOrdersPage(extraPages.driver);
    const driverADelivery = new DriverDeliveryPage(actorsPages.driver);
    const driverBDelivery = new DriverDeliveryPage(extraPages.driver);

    // Act：兩位顧客各送出一筆訂單。
    await actorsPages.customer.goto('/customer/restaurants');
    await customerA.placeOrder(orderA);
    await extraPages.customer.goto('/customer/restaurants');
    await customerB.placeOrder(orderB);

    // Assert：記下兩筆訂單的備餐、接單與送達狀態，稍後逐一核對。
    const createdA = await readOrder(api, restaurant.token, orderA.address);
    const createdB = await readOrder(api, restaurant.token, orderB.address);
    await manager.markReady(createdA.id);
    await manager.markReady(createdB.id);
    const readyA = await readOrder(api, restaurant.token, orderA.address);
    const readyB = await readOrder(api, restaurant.token, orderB.address);

    await driverAOrders.claim(createdA.id);
    await driverADelivery.expectActiveOrder(createdA.id);
    await driverBOrders.claim(createdB.id);
    await driverBDelivery.expectActiveOrder(createdB.id);
    const onTheWayA = await readOrder(api, restaurant.token, orderA.address);
    const onTheWayB = await readOrder(api, restaurant.token, orderB.address);

    // 先讓 B 確認送達，再查詢 A 的狀態，最後才讓 A 確認送達。
    await driverBDelivery.confirmDelivered(createdB.id);
    const deliveredB = await readOrder(api, restaurant.token, orderB.address);
    const stillOnTheWayA = await readOrder(api, restaurant.token, orderA.address);
    await driverADelivery.confirmDelivered(createdA.id);
    const deliveredA = await readOrder(api, restaurant.token, orderA.address);

    // 核對兩筆訂單、顧客及外送員沒有混用，B 送達時 A 仍在配送中。
    expect(await api.listOrders(restaurant.token)).toHaveLength(2);
    expect(createdA.id).not.toBe(createdB.id);
    expect(createdA.customer.id).not.toBe(createdB.customer.id);
    expect(orderA.driverId).not.toBe(orderB.driverId);
    expect(stillOnTheWayA).toMatchObject({ id: createdA.id, status: 'On the way', driver: { id: orderA.driverId } });
    await expectLifecycle(actorsPages, orderA, [createdA, readyA, onTheWayA, deliveredA], info);
    await expectLifecycle({ customer: extraPages.customer, manager: actorsPages.manager, driver: extraPages.driver },
      orderB, [createdB, readyB, onTheWayB, deliveredB], info);
    await info.attach('interleaving.json', { body: JSON.stringify({ deliveredB, stillOnTheWayA }), contentType: 'application/json' });
  });
});

test.describe('Screenplay', () => {
  test('CH26-T01 顧客下單、餐廳備餐完成、外送員接單並確認送達', async ({ actorsPages, api, restaurant, scenario }, info) => {
    // Arrange：準備一份可訂購的餐點，讓顧客、餐廳管理者和外送員各自登入。
    const customer = new Actor('顧客', new BrowseTheWeb(actorsPages.customer));
    const manager = new Actor('餐廳管理者', new BrowseTheWeb(actorsPages.manager), new ReadRestaurantOrders(api, restaurant.token));
    const driver = new Actor('外送員', new BrowseTheWeb(actorsPages.driver));

    // Act：顧客選擇餐點、填寫配送地址並送出訂單。
    await customer.attemptsTo(PlaceOrder(scenario));

    // Assert：從餐廳的訂單清單查到這筆新訂單，記下「備餐中」的狀態。
    const created = await manager.asks(TheOrder(scenario.address));

    // 餐廳按下「備餐完成」，查詢同一筆訂單是否變成「待取餐」。
    await manager.attemptsTo(MarkOrderReady(created.id));
    const ready = await manager.asks(TheOrder(scenario.address));

    // 外送員按下「接取訂單」，查詢訂單是否直接進入「配送中」，並記下接單的外送員。
    await driver.attemptsTo(ClaimOrder(created.id));
    const onTheWay = await manager.asks(TheOrder(scenario.address));

    // 外送員按下「確認已送達」，查詢同一筆訂單是否變成「已送達」。
    await driver.attemptsTo(ConfirmDelivered(created.id));
    const delivered = await manager.asks(TheOrder(scenario.address));

    // 核對四個階段的狀態、訂單編號、餐點、金額和外送員。
    // 確認訂單已從外送員的配送清單移除，顧客與餐廳都查得到這筆訂單已送達。
    expect(await api.listOrders(restaurant.token)).toHaveLength(1);
    await expectLifecycle(actorsPages, scenario, [created, ready, onTheWay, delivered], info);
  });

  test('CH26-T03 兩位顧客的訂單由不同外送員接單並交錯送達', async ({ actorsPages, extraPages, api, restaurant, caseId, scenario }, info) => {
    // Arrange：兩位顧客、一位管理者、兩位外送員各自使用獨立登入環境。
    const world = new World(api, caseId);
    const otherDriver = await api.driverProfile(await world.token('driverB'));
    const orderA = { ...scenario, address: `${scenario.address} A` };
    const orderB = { ...scenario, address: `${scenario.address} B`, driverId: otherDriver.id };
    const customerA = new Actor('顧客 A', new BrowseTheWeb(actorsPages.customer));
    const customerB = new Actor('顧客 B', new BrowseTheWeb(extraPages.customer));
    const manager = new Actor('餐廳管理者', new BrowseTheWeb(actorsPages.manager), new ReadRestaurantOrders(api, restaurant.token));
    const driverA = new Actor('外送員 A', new BrowseTheWeb(actorsPages.driver));
    const driverB = new Actor('外送員 B', new BrowseTheWeb(extraPages.driver));

    // Act：兩位顧客各送出一筆訂單。
    await customerA.attemptsTo(PlaceOrder(orderA));
    await customerB.attemptsTo(PlaceOrder(orderB));

    // Assert：記下兩筆訂單的備餐、接單與送達狀態，稍後逐一核對。
    const createdA = await manager.asks(TheOrder(orderA.address));
    const createdB = await manager.asks(TheOrder(orderB.address));
    await manager.attemptsTo(MarkOrderReady(createdA.id), MarkOrderReady(createdB.id));
    const readyA = await manager.asks(TheOrder(orderA.address));
    const readyB = await manager.asks(TheOrder(orderB.address));
    await driverA.attemptsTo(ClaimOrder(createdA.id));
    await driverB.attemptsTo(ClaimOrder(createdB.id));
    const onTheWayA = await manager.asks(TheOrder(orderA.address));
    const onTheWayB = await manager.asks(TheOrder(orderB.address));

    // 先讓 B 確認送達，再查詢 A 的狀態，最後才讓 A 確認送達。
    await driverB.attemptsTo(ConfirmDelivered(createdB.id));
    const deliveredB = await manager.asks(TheOrder(orderB.address));
    const stillOnTheWayA = await manager.asks(TheOrder(orderA.address));
    await driverA.attemptsTo(ConfirmDelivered(createdA.id));
    const deliveredA = await manager.asks(TheOrder(orderA.address));

    // 核對兩筆訂單、顧客及外送員沒有混用，B 送達時 A 仍在配送中。
    expect(await api.listOrders(restaurant.token)).toHaveLength(2);
    expect(createdA.id).not.toBe(createdB.id);
    expect(createdA.customer.id).not.toBe(createdB.customer.id);
    expect(orderA.driverId).not.toBe(orderB.driverId);
    expect(stillOnTheWayA).toMatchObject({ id: createdA.id, status: 'On the way', driver: { id: orderA.driverId } });
    await expectLifecycle(actorsPages, orderA, [createdA, readyA, onTheWayA, deliveredA], info);
    await expectLifecycle({ customer: extraPages.customer, manager: actorsPages.manager, driver: extraPages.driver },
      orderB, [createdB, readyB, onTheWayB, deliveredB], info);
    await info.attach('interleaving.json', { body: JSON.stringify({ deliveredB, stillOnTheWayA }), contentType: 'application/json' });
  });

});
