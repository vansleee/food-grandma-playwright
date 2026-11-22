import { expect } from './fixtures/demo';
import { OrdersPage } from './pages/orders-page';
import { SignInPage } from './pages/sign-in-page';
import { test } from './fixtures';
import { DriverDeliveryWorkflow } from './workflows/driver-delivery-workflow';
import { DriverDeliveryPage } from './pages/driver-pages';

test('CH15-T01 餐廳管理者登入後看到訂單管理', async ({ page, demo }) => {
  // Arrange：開啟登入頁面，準備餐廳管理者的帳號與密碼。
  const signIn = new SignInPage(page);
  const orders = new OrdersPage(page);
  const { username, password } = demo.restaurant_login;
  await signIn.goto();

  // Act：從網頁登入。
  await signIn.signIn(username, password);

  // Assert：進入訂單管理，看到標題和表格。
  await expect(page).toHaveURL(/\/management\/orders$/);
  await expect(orders.heading()).toHaveText('訂單管理');
  await expect(orders.table()).toBeVisible();
});

test('CH15-T02 指定訂單變成待取餐', async ({ signedInOrders: orders, demo }) => {
  // Arrange：確認指定訂單還在備餐中。
  const orderId = demo.seeded_order_id;
  await expect(orders.statusOf(orderId)).toHaveText('備餐中');

  // Act：按下這筆訂單的「備餐完成」。
  await orders.markReady(orderId);

  // Assert：同一筆訂單變成「待取餐」，而且按鈕消失。
  await expect(orders.statusOf(orderId)).toHaveText('待取餐');
  await expect(orders.readyButton(orderId)).toHaveCount(0);
});

test('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', async ({
  signedInOrders: orders, driverPage, deliveryOrderId,
}) => {
  // Arrange：餐廳確認這筆訂單在配送中，外送員開啟配送清單並找到同一筆訂單。
  await expect(orders.statusOf(deliveryOrderId)).toHaveText('配送中');

  const driver = new DriverDeliveryWorkflow(driverPage);
  const deliveries = new DriverDeliveryPage(driverPage);
  await driver.openActiveDeliveries();
  await expect(deliveries.order(deliveryOrderId)).toBeVisible();

  // Act：外送員確認這筆訂單已送達。
  await deliveries.confirmDelivered(deliveryOrderId);

  // Assert：外送員沒有進行中的配送，餐廳重新查看後，同一筆訂單顯示「已送達」。
  await expect(deliveries.emptyMessage()).toBeVisible();
  await orders.reload();
  await expect(orders.statusOf(deliveryOrderId)).toHaveText('已送達');
});
