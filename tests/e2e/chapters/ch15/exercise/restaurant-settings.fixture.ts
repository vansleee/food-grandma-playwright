import { test as base, expect } from '../../support/ch15-16-comparison';
import { RestaurantSettingsPage } from './restaurant-settings-page';

/** settingsPage：已用餐廳管理者登入並停在「餐廳設定」頁。 */
export const test = base.extend<{ settingsPage: RestaurantSettingsPage }>({
  settingsPage: async ({ page, demo }, use) => {
    const settingsPage = new RestaurantSettingsPage(page);
    await settingsPage.signInAndOpen(demo.restaurant_login.username, demo.restaurant_login.password);
    await use(settingsPage);
  },
});

export { expect };
