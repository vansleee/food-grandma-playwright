import type { Page } from '@playwright/test';
import { restaurantSignInActions } from '../pages/actions';
import { expect, test as demoTest } from '../../fixtures/demo';

export const test = demoTest.extend<{ restaurantPage: Page; driverPage: Page }>({
  // 共用登入準備：餐廳管理者已登入訂單管理頁面
  restaurantPage: async ({ page, demo }, use) => {
    const signIn = restaurantSignInActions(page);
    await signIn.open();
    await signIn.signIn(demo.restaurant_login);
    await page.waitForURL('**/management/orders');
    await use(page);
  },

  // 獨立的外送員瀏覽器環境；測試成功或失敗都會關閉
  driverPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    try {
      await use(await context.newPage());
    } finally {
      await context.close();
    }
  },
});

export { expect };
