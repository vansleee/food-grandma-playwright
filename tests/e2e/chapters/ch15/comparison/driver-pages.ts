import type { Page } from '@playwright/test';

export class DriverSignInPage {
  constructor(private readonly page: Page) {}

  async enterWorkspace() {
    await this.page.goto('/account');
    await this.page.getByRole('button', { name: '進入外送員工作台', exact: true }).click();
  }
}

export class DriverWorkspacePage {
  constructor(private readonly page: Page) {}

  async openActiveDeliveries() {
    await this.page.getByRole('link', { name: '查看進行中配送' }).click();
  }
}

export class DriverDeliveryPage {
  constructor(private readonly page: Page) {}

  order(orderId: number) {
    return this.page.getByTestId('active-delivery-card').filter({
      has: this.page.getByRole('heading', { name: `訂單 #${orderId}`, exact: true }),
    });
  }

  async confirmDelivered(orderId: number) {
    await this.order(orderId).getByRole('button', { name: '確認已送達', exact: true }).click();
  }

  emptyMessage() {
    return this.page.getByText('目前沒有進行中的配送', { exact: true });
  }
}
