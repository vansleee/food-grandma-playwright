import type { Page } from '@playwright/test';

export class OrdersPage {
  constructor(private readonly page: Page) {}

  row(orderId: number) {
    return this.page.locator(`[data-testid="order-row"][data-order-id="${orderId}"]`);
  }

  async search(address: string) {
    await this.page.getByRole('textbox', { name: '搜尋訂單' }).fill(address);
  }

  statusOf(orderId: number) {
    return this.row(orderId).getByTestId('order-status');
  }

  async markReady(orderId: number) {
    await this.row(orderId).getByTestId('order-ready-button').click();
  }
}
