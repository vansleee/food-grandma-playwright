import type { Page } from '@playwright/test';
import { test as base } from '../../support/ch15-16-comparison';
import { OrdersPage } from '../pom/orders-page';
import { SignInPage } from '../pom/sign-in-page';

export const test = base.extend<{ signedInOrders: OrdersPage; driverPage: Page }>({
  signedInOrders: async ({ page, demo }, use) => {
    const signIn = new SignInPage(page);
    const { username, password } = demo.restaurant_login;
    await signIn.goto();
    await signIn.signIn(username, password);
    await page.waitForURL('**/management/orders');
    await use(new OrdersPage(page));
  },
  driverPage: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL });
    try {
      await use(await context.newPage());
    } finally {
      await context.close();
    }
  },
});
