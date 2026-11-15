import { expect, test } from '../support/fixtures';
import { testPassword } from '../support/env';
import { ManagementShell, SignInPage } from '../support/pages/management-shell';
import { OrdersPage } from '../support/pages/orders-page';

// 規格：specs/01-restaurant-auth-all.md（ROLE-04、ROLE-06）。三個案例都從「沒有登入狀態」開始。
test.describe('店家管理者認證', () => {
  test('AUTH-T01 有效店家帳密登入後導向訂單管理', async ({ page, stage }) => {
    const signIn = new SignInPage(page);
    const orders = new OrdersPage(page);
    const shell = new ManagementShell(page);

    await signIn.goto();
    expect(await shell.storedToken(), '起點不得已有登入狀態').toBeNull();

    await signIn.signIn(stage.accounts.restaurantA, testPassword());

    await expect(page).toHaveURL(/\/management\/orders$/);
    await orders.waitUntilReady();
    expect(await shell.storedToken()).not.toBeNull();
  });

  test('AUTH-T02 沒有 token 直接開啟訂單頁會導向登入頁且不顯示受保護內容', async ({ page }) => {
    const signIn = new SignInPage(page);

    await page.goto('/management/orders');

    await expect(page).toHaveURL(/\/management\/sign-in$/);
    await signIn.waitUntilReady();
    await expect(page.getByRole('heading', { name: '訂單管理' })).toHaveCount(0);
    await expect(page.getByTestId('order-table')).toHaveCount(0);
    await expect(page.getByTestId('sidebar')).toHaveCount(0);
  });

  test('AUTH-T03 登出後前端清除 token，重新開啟受保護頁面導向登入頁', async ({ page, stage }) => {
    const signIn = new SignInPage(page);
    const orders = new OrdersPage(page);
    const shell = new ManagementShell(page);

    await test.step('先以真實 UI 登入管理站', async () => {
      await signIn.goto();
      await signIn.signIn(stage.accounts.restaurantA, testPassword());
      await orders.waitUntilReady();
      expect(await shell.storedToken()).not.toBeNull();
    });

    await test.step('登出：導向登入頁並清除 token', async () => {
      await shell.signOut();
      await signIn.waitUntilReady();
      expect(await shell.storedToken()).toBeNull();
    });

    await test.step('重新開啟受保護頁面：仍導向登入頁', async () => {
      await page.goto('/management/orders');
      await expect(page).toHaveURL(/\/management\/sign-in$/);
      await signIn.waitUntilReady();
      await expect(page.getByTestId('order-table')).toHaveCount(0);
    });
  });
});
