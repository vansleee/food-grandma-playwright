import { RESTAURANT_TOKEN_KEY, accountsFor } from './support/env';
import { expect, test } from './support/fixtures';
import { OrdersPage, SignInPage } from './support/pages';

test('AUTH-T01 店家使用有效帳密登入後導向訂單管理', async ({ page }) => {
  const { restaurantA } = accountsFor('AUTH-T01');
  const signIn = new SignInPage(page);
  const orders = new OrdersPage(page);

  await test.step('沒有既存登入狀態', async () => {
    await signIn.open();
    expect(await page.evaluate((key) => localStorage.getItem(key), RESTAURANT_TOKEN_KEY)).toBeNull();
  });

  await test.step('登入 /management/sign-in', async () => {
    await signIn.signIn(restaurantA);
  });

  await test.step('導向 /management/orders 並顯示訂單管理內容', async () => {
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(orders.heading()).toBeVisible();
    await expect(page.getByTestId('order-table')).toBeVisible();
  });
});

test('AUTH-T02 沒有 token 直接開啟訂單頁會導向登入頁', async ({ page }) => {
  const orders = new OrdersPage(page);

  await page.goto('/management/orders');

  await expect(page).toHaveURL(/\/management\/sign-in$/);
  await expect(page.getByTestId('sign-in-form')).toBeVisible();
  await expect(orders.heading()).toHaveCount(0);
  await expect(page.getByTestId('order-table')).toHaveCount(0);
  await expect(page.getByTestId('sidebar')).toHaveCount(0);
});

test('AUTH-T03 登出後清除 token 並導向登入頁', async ({ page }) => {
  const { restaurantA } = accountsFor('AUTH-T03');
  const signIn = new SignInPage(page);
  const orders = new OrdersPage(page);

  await test.step('先登入管理站', async () => {
    await signIn.open();
    await signIn.signIn(restaurantA);
    await expect(page).toHaveURL(/\/management\/orders$/);
    await expect(orders.heading()).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), RESTAURANT_TOKEN_KEY)).toBeTruthy();
  });

  await test.step('登出：前端清除 token 並導向登入頁', async () => {
    await page.getByTestId('nav-sign-out').click();
    await expect(page).toHaveURL(/\/management\/sign-in$/);
    expect(await page.evaluate((key) => localStorage.getItem(key), RESTAURANT_TOKEN_KEY)).toBeNull();
  });

  await test.step('重新開啟受保護頁面仍導向登入頁', async () => {
    await page.goto('/management/orders');
    await expect(page).toHaveURL(/\/management\/sign-in$/);
    await expect(page.getByTestId('order-table')).toHaveCount(0);
  });
});
