import type { Page } from '@playwright/test';

// 訂單編號在餐廳後台顯示為四位數（#0001），外送員工作台顯示為 #1
const restaurantOrderLabel = (orderId: number) => `#${String(orderId).padStart(4, '0')}`;

export const restaurantSignInLocators = (page: Page) => ({
  username: page.getByTestId('sign-in-username'),
  password: page.getByTestId('sign-in-password'),
  submit: page.getByTestId('sign-in-submit'),
});

export const restaurantOrdersLocators = (page: Page) => {
  const row = (orderId: number) =>
    page.getByTestId('order-row').filter({ has: page.getByText(restaurantOrderLabel(orderId), { exact: true }) });
  return {
    heading: page.getByRole('heading', { name: '訂單管理', level: 1 }),
    table: page.getByTestId('order-table'),
    refresh: page.getByRole('button', { name: /重新整理/ }),
    row,
    status: (orderId: number) => row(orderId).getByTestId('order-status'),
    readyButton: (orderId: number) => row(orderId).getByTestId('order-ready-button'),
  };
};

export const driverAccountLocators = (page: Page) => ({
  continueAsDriver: page.getByTestId('continue-as-driver'),
});

export const driverDeliveryLocators = (page: Page) => ({
  navDelivery: page.getByTestId('nav-driver-delivery'),
  activeCard: page.getByTestId('active-delivery-card'),
  orderLabel: (orderId: number) => page.getByTestId('active-delivery-card').getByText(`訂單 #${orderId}`),
  completeDelivery: page.getByTestId('complete-delivery'),
  noActiveDelivery: page.getByTestId('no-active-delivery'),
});
