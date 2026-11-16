import { expect, test } from '../../support/ch15-16-comparison';
import { OrdersPage } from '../pom/orders-page';
import { SignInPage } from '../pom/sign-in-page';

test('CH15-T01 餐廳管理者登入後看到訂單管理', async ({ page, demo }) => {
  // Arrange：開啟登入頁面，準備餐廳管理者的帳號與密碼。
  const signIn = new SignInPage(page);
  const { username, password } = demo.restaurant_login;
  await signIn.goto();

  // Act：從網頁登入。
  await signIn.signIn(username, password);

  // Assert：進入訂單管理，看到標題和表格。
  await expect(page).toHaveURL(/\/management\/orders$/);
  await expect(page.getByRole('heading', { name: '訂單管理', exact: true })).toBeVisible();
  await expect(page.getByTestId('order-table')).toBeVisible();
});

test('CH15-T02 指定訂單變成待取餐', async ({ page, demo }) => {
  // Arrange：登入後台，確認指定訂單還在備餐中。
  const signIn = new SignInPage(page);
  const orders = new OrdersPage(page);
  const { username, password } = demo.restaurant_login;
  const orderId = demo.seeded_order_id;
  await signIn.goto();
  await signIn.signIn(username, password);
  await expect(orders.statusOf(orderId)).toHaveText('備餐中');

  // Act：按下這筆訂單的「備餐完成」。
  await orders.markReady(orderId);

  // Assert：同一筆訂單變成「待取餐」，而且按鈕消失。
  await expect(orders.statusOf(orderId)).toHaveText('待取餐');
  await expect(orders.row(orderId).getByTestId('order-ready-button')).toHaveCount(0);
});

test('CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達', async ({
  page, browser, baseURL, demo, deliveryOrderId,
}) => {
  // Arrange：餐廳確認這筆訂單在配送中，外送員用另一個瀏覽器環境開啟同一筆配送。
  const signIn = new SignInPage(page);
  const orders = new OrdersPage(page);
  const { username, password } = demo.restaurant_login;
  await signIn.goto();
  await signIn.signIn(username, password);
  await expect(orders.statusOf(deliveryOrderId)).toHaveText('配送中');

  const driverContext = await browser.newContext({ baseURL });
  try {
    const driver = await driverContext.newPage();
    await driver.goto('/account');
    await driver.getByRole('button', { name: '進入外送員工作台' }).click();
    await driver.getByRole('link', { name: '查看進行中配送' }).click();
    const delivery = driver.getByTestId('active-delivery-card').filter({
      has: driver.getByRole('heading', { name: `訂單 #${deliveryOrderId}`, exact: true }),
    });
    await expect(delivery).toBeVisible();

    // Act：外送員確認這筆訂單已送達。
    await delivery.getByRole('button', { name: '確認已送達', exact: true }).click();

    // Assert：外送員沒有進行中的配送，餐廳重新查看後，同一筆訂單顯示「已送達」。
    await expect(driver.getByText('目前沒有進行中的配送', { exact: true })).toBeVisible();
    await page.reload();
    await expect(orders.statusOf(deliveryOrderId)).toHaveText('已送達');
  } finally {
    await driverContext.close();
  }
});
