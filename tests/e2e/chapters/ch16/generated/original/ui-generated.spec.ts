// spec: ch16/generated/test-cases.md
// seed: ch16/generated/seed.spec.ts
import { expect, test } from '../fixtures/demo';

test.describe('CH15-T01 餐廳管理者登入後看到訂單管理', () => {
  test('CH15-T01 餐廳管理者登入後看到訂單管理', async ({ page, demo }) => {
    // 前置：有可用的餐廳管理帳號（demo fixture 提供），目前尚未登入。

    // 1. 開啟餐廳後台登入頁面。
    await page.goto('/management/sign-in');

    // 2. 輸入正確的帳號與密碼，按下「登入」。
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();

    // 預期結果：頁面路徑為 /management/orders。
    await expect(page).toHaveURL(/\/management\/orders$/);

    // 預期結果：顯示「訂單管理」標題與訂單表格。
    await expect(page.getByRole('heading', { name: '訂單管理', level: 1 })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('CH15-T02 指定訂單變成待取餐', () => {
  test('CH15-T02 指定訂單變成待取餐', async ({ page, demo }) => {
    // 前置：餐廳管理者已登入訂單管理頁面，並記下「備餐中」的訂單編號。
    const orderNo = `#${String(demo.seeded_order_id).padStart(4, '0')}`;
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();
    await expect(page).toHaveURL(/\/management\/orders$/);

    // 1. 依訂單編號找到指定訂單，確認目前為「備餐中」。
    const row = page.getByRole('row').filter({ has: page.getByText(orderNo, { exact: true }) });
    await expect(row).toContainText('備餐中');

    // 2. 按下該筆訂單的「備餐完成」。
    await row.getByTestId('order-ready-button').click();

    // 預期結果：同一筆訂單顯示「待取餐」。
    await expect(row).toContainText('待取餐');

    // 預期結果：該筆訂單的「備餐完成」按鈕消失。
    await expect(row.getByTestId('order-ready-button')).toHaveCount(0);
  });
});

test.describe('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', () => {
  test('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', async ({ page, browser, demo, deliveryOrderId }, testInfo) => {
    // 前置：管理者已登入訂單管理頁面；外送員只有一筆進行中配送（deliveryOrderId）。
    // 管理者與外送員各自使用獨立的瀏覽器登入環境。
    const orderNo = `#${String(deliveryOrderId).padStart(4, '0')}`;
    await page.goto('/management/sign-in');
    await page.getByTestId('sign-in-username').fill(demo.restaurant_login.username);
    await page.getByTestId('sign-in-password').fill(demo.restaurant_login.password);
    await page.getByTestId('sign-in-submit').click();
    await expect(page).toHaveURL(/\/management\/orders$/);

    const driverContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const driverPage = await driverContext.newPage();

    // 1. 餐廳管理者依訂單編號確認該筆訂單顯示「配送中」。
    const row = page.getByRole('row').filter({ has: page.getByText(orderNo, { exact: true }) });
    await expect(row).toContainText('配送中');

    // 2. 外送員從「體驗登入」進入工作台，再開啟進行中配送，確認指定編號的訂單出現在清單中。
    await driverPage.goto('/account');
    await driverPage.getByTestId('continue-as-driver').click();
    await driverPage.getByTestId('nav-driver-delivery').click();
    await expect(driverPage.getByRole('heading', { name: `訂單 #${deliveryOrderId}`, level: 2 })).toBeVisible();

    // 3. 外送員按下該筆訂單的「確認已送達」。
    await driverPage.getByTestId('complete-delivery').click();

    // 預期結果：外送員畫面顯示「目前沒有進行中的配送」。
    await expect(driverPage.getByText('目前沒有進行中的配送')).toBeVisible();

    // 4. 餐廳管理者重新整理訂單清單，查看同一筆訂單。
    await page.getByRole('button', { name: /重新整理/ }).click();

    // 預期結果：餐廳後台原訂單編號的狀態為「已送達」。
    await expect(row).toContainText('已送達');

    await driverContext.close();
  });
});
