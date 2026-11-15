import { expect, test as base, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import { DriverDeliveryPage } from '../ch20/page';
import { DriverOrdersPage } from '../support/pages';

type SeededReadyOrder = { orderId: number; driverToken: string };
type SignedInDriver = { ordersPage: DriverOrdersPage; deliveryPage: DriverDeliveryPage };

function demoAdminHeaders() {
  const key = process.env.CH27_DEMO_RESET_KEY;
  if (!key) throw new Error('請用第 27 章的章節指令啟動專用測試資料庫。');
  return { 'X-Demo-Reset-Key': key };
}

async function seedDemoOrders(request: APIRequestContext): Promise<SeededReadyOrder> {
  const response = await request.post('/api/test/seed', { headers: demoAdminHeaders() });
  expect(response.ok(), '建立示範資料').toBeTruthy();
  const { driver_access_token: driverToken } = await response.json();

  const readyOrders = await request.get('/api/driver/orders/?status=ready');
  expect(readyOrders.ok(), '查詢待取餐訂單').toBeTruthy();
  const { orders } = await readyOrders.json();
  expect(orders.length).toBeGreaterThan(0);

  return { orderId: orders[0].id, driverToken };
}

async function resetDemoData(request: APIRequestContext) {
  const response = await request.post('/api/test/reset', { headers: demoAdminHeaders() });
  expect(response.ok(), '清除本次示範資料').toBeTruthy();
}

const generalTest = base.extend<{
  everythingReady: { orderId: number; driverPage: Page; customerPage: Page; managementPage: Page };
}>({
  everythingReady: async ({ browser, baseURL, page, request }, use) => {
    const extraContexts: BrowserContext[] = [];

    async function openPage(path: string) {
      const context = await browser.newContext({ baseURL });
      extraContexts.push(context);
      const extraPage = await context.newPage();
      await extraPage.goto(path);
      return extraPage;
    }

    try {
      const { orderId, driverToken } = await seedDemoOrders(request);
      await new DriverOrdersPage(page).openAs(driverToken);
      const customerPage = await openPage('/customer/restaurants');
      const managementPage = await openPage('/management/');
      await use({ orderId, driverPage: page, customerPage, managementPage });
    } finally {
      await Promise.all([
        ...extraContexts.map((context) => context.close()),
        resetDemoData(request),
      ]);
    }
  },
});

generalTest.describe('General Fixture', () => {
  generalTest('CH27-T02 外送員接單後可以在配送頁面看到這筆訂單', async ({ everythingReady }) => {
    // Arrange：只取出要接的訂單與外送員頁面。
    const { orderId, driverPage } = everythingReady;
    const ordersPage = new DriverOrdersPage(driverPage);
    const deliveryPage = new DriverDeliveryPage(driverPage);

    // Act：接取指定訂單。
    await ordersPage.claim(orderId);

    // Assert：這筆訂單出現在外送員的配送頁面。
    await deliveryPage.expectActiveOrder(orderId);
  });
});

const focusedTest = base.extend<{ seededReadyOrder: SeededReadyOrder; signedInDriver: SignedInDriver }>({
  seededReadyOrder: async ({ request }, use) => {
    try {
      const order = await seedDemoOrders(request);
      await use(order);
    } finally {
      await resetDemoData(request);
    }
  },

  signedInDriver: async ({ page, seededReadyOrder }, use) => {
    const ordersPage = new DriverOrdersPage(page);
    await ordersPage.openAs(seededReadyOrder.driverToken);
    await use({ ordersPage, deliveryPage: new DriverDeliveryPage(page) });
  },
});

focusedTest.describe('用途明確的 Fixture', () => {
  focusedTest('CH27-T02 外送員接單後可以在配送頁面看到這筆訂單', async ({ seededReadyOrder, signedInDriver }) => {
    // Arrange：取出本次準備的訂單編號與外送員頁面物件。
    const { orderId } = seededReadyOrder;
    const { ordersPage, deliveryPage } = signedInDriver;

    // Act：接取指定訂單。
    await ordersPage.claim(orderId);

    // Assert：這筆訂單出現在外送員的配送頁面。
    await deliveryPage.expectActiveOrder(orderId);
  });
});
