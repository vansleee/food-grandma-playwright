// spec: ch16/generated/examples/1-2/test-case.md
// seed: ch16/generated/examples/1-2/seed.spec.ts
import { expect, test } from '../../revised/fixtures/roles';
import { driverActions, restaurantOrdersActions } from '../../revised/pages/actions';
import { restaurantOrdersLocators } from '../../revised/pages/locators';
import { deliveryCardActions, deliveryCardLocators } from './pages/delivery-card';

test.describe('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', () => {
  test('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', async ({ restaurantPage, driverPage, deliveryOrderId }) => {
    const orders = restaurantOrdersLocators(restaurantPage);
    const restaurant = restaurantOrdersActions(restaurantPage);
    const driver = driverActions(driverPage);
    const card = deliveryCardLocators(driverPage);
    const cardActions = deliveryCardActions(driverPage);

    // Arrange: 餐廳管理者已登入、外送員只有一筆進行中配送（兩者使用獨立瀏覽器環境）
    // 1. 餐廳管理者依訂單編號確認該筆訂單顯示「配送中」。
    await expect(orders.status(deliveryOrderId)).toHaveText('配送中');

    // 2. 外送員從「體驗登入」進入工作台，再開啟進行中配送，確認指定編號的訂單出現在清單中。
    await driver.enterWorkbench();
    await driver.openActiveDelivery();
    await expect(card.orderLabel(deliveryOrderId)).toBeVisible();

    // Act: 3. 外送員按下該筆訂單卡片內的「確認已送達」。
    await cardActions.completeDelivery(deliveryOrderId);
    await cardActions.waitUntilNoActiveDelivery();

    // 4. 餐廳管理者重新整理訂單清單，查看同一筆訂單。
    await restaurant.refresh();

    // Assert
    await expect(card.noActiveDelivery).toContainText('目前沒有進行中的配送');
    await expect(orders.status(deliveryOrderId)).toHaveText('已送達');
  });
});
