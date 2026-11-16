// spec: ch16/comparison/plan.md
// seed: ch16/comparison/seed.spec.ts

import { test, expect } from '../../support/ch15-16-comparison';

test.describe('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', () => {
  test('外送員確認送達後，餐廳看到同一筆訂單已送達', async ({ page, browser, demo, deliveryOrderId }) => {
    // Arrange: 餐廳管理者登入，確認指定的配送訂單目前顯示「配送中」
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();

    const orderNumber = `#${String(deliveryOrderId).padStart(4, '0')}`;
    const orderRow = page.getByTestId('order-row').filter({ hasText: orderNumber });
    await expect(orderRow).toContainText('配送中');

    // Arrange: 外送員使用獨立的瀏覽器工作階段，從「體驗登入」進入工作台並開啟進行中配送
    const driverContext = await browser.newContext();
    const driverPage = await driverContext.newPage();
    await driverPage.goto('/account');
    await driverPage.getByTestId('continue-as-driver').click();
    await driverPage.getByTestId('nav-driver-delivery').click();
    await expect(
      driverPage.getByRole('heading', { name: `訂單 #${deliveryOrderId}`, level: 2 }),
    ).toBeVisible();

    // Act: 外送員核對訂單編號後，按下「確認已送達」
    await driverPage.getByTestId('complete-delivery').click();

    // Assert: 外送員畫面顯示「目前沒有進行中的配送」
    await expect(driverPage.getByRole('heading', { name: '目前沒有進行中的配送' })).toBeVisible();

    // Act: 餐廳管理者重新開啟訂單清單
    await page.goto('/management/orders');

    // Assert: 餐廳後台原編號的訂單顯示「已送達」
    await expect(orderRow).toContainText('已送達');
    await expect(orderRow).not.toContainText('配送中');

    await driverContext.close();
  });
});
