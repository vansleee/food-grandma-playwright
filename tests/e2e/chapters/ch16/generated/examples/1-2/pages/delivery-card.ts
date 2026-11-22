import type { Page } from '@playwright/test';

// 依訂單編號找到進行中配送卡片；heading 精確比對，避免 #2 誤中 #23
export const deliveryCardLocators = (page: Page) => {
  const card = (orderId: number) =>
    page
      .getByTestId('active-delivery-card')
      .filter({ has: page.getByRole('heading', { name: `訂單 #${orderId}`, exact: true }) });
  return {
    card,
    orderLabel: (orderId: number) => card(orderId).getByRole('heading', { name: `訂單 #${orderId}`, exact: true }),
    completeButton: (orderId: number) => card(orderId).getByTestId('complete-delivery'),
    noActiveDelivery: page.getByTestId('no-active-delivery'),
  };
};

export const deliveryCardActions = (page: Page) => {
  const locators = deliveryCardLocators(page);
  return {
    // 只按下指定訂單卡片內的送達按鈕
    completeDelivery: (orderId: number) => locators.completeButton(orderId).click(),
    // 只等待外送員畫面完成，不做驗收
    waitUntilNoActiveDelivery: () => locators.noActiveDelivery.waitFor(),
  };
};
