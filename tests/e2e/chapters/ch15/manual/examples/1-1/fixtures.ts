import { expect, test as base } from '../../fixtures/demo';
import { RestaurantSettingsPage } from './pages/restaurant-settings-page';
import { SignInPage } from './pages/sign-in-page';

export const test = base.extend<{ settingsPage: RestaurantSettingsPage }>({
  settingsPage: async ({ page, demo }, use) => {
    const signIn = new SignInPage(page);
    await signIn.goto();
    await signIn.signIn(demo.restaurant_login);

    const settings = new RestaurantSettingsPage(page);
    await settings.open();
    await expect(settings.heading).toBeVisible();
    await use(settings);
  },
});

export { expect };
