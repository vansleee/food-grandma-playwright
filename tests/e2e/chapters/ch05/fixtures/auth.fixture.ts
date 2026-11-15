import { expect, type Page } from '@playwright/test';
import { accountsFor, testPassword } from '../../support/env';
import { test as base } from './data.fixture';

export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/management/sign-in');
    await page.getByLabel('帳號', { exact: true }).fill(accountsFor('CH05').restaurantA);
    await page.getByLabel('密碼', { exact: true }).fill(testPassword());
    await page.getByRole('button', { name: '登入', exact: true }).click();
    await expect(page).toHaveURL(/\/management\/orders$/);
    await use(page);
  },
});
