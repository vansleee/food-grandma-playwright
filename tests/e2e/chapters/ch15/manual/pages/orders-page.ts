import type { Page } from '@playwright/test';

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async reload() {
    await this.page.reload();
  }

  heading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  table() {
    return this.page.getByTestId('order-table');
  }

  row(orderId: number) {
    return this.page.locator(`[data-testid="order-row"][data-order-id="${orderId}"]`);
  }

  async search(address: string) {
    await this.page.getByRole('textbox', { name: '搜尋訂單' }).fill(address);
  }

  statusOf(orderId: number) {
    return this.row(orderId).getByTestId('order-status');
  }

  readyButton(orderId: number) {
    return this.row(orderId).getByTestId('order-ready-button');
  }

  async markReady(orderId: number) {
    await this.readyButton(orderId).click();
  }
}
