import type { Page } from '@playwright/test';
import {
  driverAccountLocators,
  driverDeliveryLocators,
  restaurantOrdersLocators,
  restaurantSignInLocators,
} from './locators';

export const restaurantSignInActions = (page: Page) => {
  const locators = restaurantSignInLocators(page);
  return {
    open: () => page.goto('/management/sign-in'),
    signIn: async (login: { username: string; password: string }) => {
      await locators.username.fill(login.username);
      await locators.password.fill(login.password);
      await locators.submit.click();
    },
  };
};

export const restaurantOrdersActions = (page: Page) => {
  const locators = restaurantOrdersLocators(page);
  return {
    markReady: (orderId: number) => locators.readyButton(orderId).click(),
    refresh: () => locators.refresh.click(),
  };
};

export const driverActions = (page: Page) => {
  const account = driverAccountLocators(page);
  const delivery = driverDeliveryLocators(page);
  return {
    enterWorkbench: async () => {
      await page.goto('/account');
      await account.continueAsDriver.click();
    },
    openActiveDelivery: () => delivery.navDelivery.click(),
    completeDelivery: () => delivery.completeDelivery.click(),
    // 等外送員畫面顯示完成，餐廳端才重新查詢（這裡只等待，不做驗收）
    waitUntilNoActiveDelivery: () => delivery.noActiveDelivery.waitFor(),
  };
};
