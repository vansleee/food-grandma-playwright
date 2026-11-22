// spec: ch16/generated/test-cases.md
// seed: ch16/generated/seed.spec.ts
import { expect, test } from './fixtures/roles';
import { restaurantSignInActions, restaurantOrdersActions, driverActions } from './pages/actions';
import { restaurantOrdersLocators, driverDeliveryLocators } from './pages/locators';

test.describe('CH15-T01 餐廳管理者登入後看到訂單管理', () => {
  test('CH15-T01 餐廳管理者登入後看到訂單管理', async ({ page, demo }) => {
    const signIn = restaurantSignInActions(page);
    const orders = restaurantOrdersLocators(page);

    // Arrange: 有可用的餐廳管理帳號，目前尚未登入
    // 1. 開啟餐廳後台登入頁面。
    await signIn.open();
    await expect(page).toHaveURL(/\/management\/sign-in/);

    // Act: 2. 輸入正確的帳號與密碼，按下「登入」。
    await signIn.signIn(demo.restaurant_login);

    // Assert
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(orders.heading).toBeVisible();
    await expect(orders.table).toBeVisible();
  });
});

test.describe('CH15-T02 指定訂單變成待取餐', () => {
  test('CH15-T02 指定訂單變成待取餐', async ({ restaurantPage, demo }) => {
    const orderId = demo.seeded_order_id;
    const orders = restaurantOrdersLocators(restaurantPage);
    const actions = restaurantOrdersActions(restaurantPage);

    // Arrange: 餐廳管理者已登入；1. 依訂單編號找到指定訂單，確認目前為「備餐中」。
    await expect(orders.status(orderId)).toHaveText('備餐中');
    await expect(orders.readyButton(orderId)).toBeVisible();

    // Act: 2. 按下該筆訂單的「備餐完成」。
    await actions.markReady(orderId);

    // Assert
    await expect(orders.status(orderId)).toHaveText('待取餐');
    await expect(orders.readyButton(orderId)).toHaveCount(0);
  });
});

test.describe('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', () => {
  test('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', async ({ restaurantPage, driverPage, deliveryOrderId }) => {
    const orders = restaurantOrdersLocators(restaurantPage);
    const restaurant = restaurantOrdersActions(restaurantPage);
    const driver = driverActions(driverPage);
    const delivery = driverDeliveryLocators(driverPage);

    // Arrange: 餐廳管理者已登入、外送員只有一筆進行中配送（兩者使用獨立瀏覽器環境）
    // 1. 餐廳管理者依訂單編號確認該筆訂單顯示「配送中」。
    await expect(orders.status(deliveryOrderId)).toHaveText('配送中');

    // 2. 外送員從「體驗登入」進入工作台，再開啟進行中配送，確認指定編號的訂單出現在清單中。
    await driver.enterWorkbench();
    await driver.openActiveDelivery();
    await expect(delivery.orderLabel(deliveryOrderId)).toBeVisible();

    // Act: 3. 外送員按下該筆訂單的「確認已送達」。
    await driver.completeDelivery();
    await driver.waitUntilNoActiveDelivery();

    // 4. 餐廳管理者重新整理訂單清單，查看同一筆訂單。
    await restaurant.refresh();

    // Assert
    await expect(delivery.noActiveDelivery).toContainText('目前沒有進行中的配送');
    await expect(orders.status(deliveryOrderId)).toHaveText('已送達');
  });
});
