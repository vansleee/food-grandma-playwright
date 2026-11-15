import { expect, type Locator, type Page } from '@playwright/test';
import { displayOrderNumber } from '../domain';

export class DispatchRow {
  constructor(readonly root: Locator) {}

  async claim() {
    await this.root.getByRole('button', { name: '接取訂單' }).click();
  }
}

export class DriverOrdersPage {
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.error = page.getByTestId('orders-error');
  }

  async goto() {
    await this.page.goto('/driver/orders');
    await this.waitUntilReady();
  }

  /** 標題出現後，還要等載入文字消失且更新完成（重新整理按鈕可按）。 */
  async waitUntilReady() {
    await expect(this.page).toHaveURL(/\/driver\/orders$/);
    await expect(this.page.getByRole('heading', { name: '可接訂單', level: 1 })).toBeVisible();
    await expect(this.page.getByText('正在載入可接訂單…')).toBeHidden();
    await expect(this.page.getByRole('button', { name: '重新整理' })).toBeEnabled();
  }

  /** 畫面沒有 data-order-id，改用該列唯一的補零訂單編號定位。 */
  order(id: number): DispatchRow {
    const root = this.page
      .getByTestId('ready-order-card')
      .filter({ has: this.page.getByText(displayOrderNumber(id), { exact: true }) });
    return new DispatchRow(root);
  }
}

export class DriverDeliveryPage {
  constructor(private readonly page: Page) {}

  async waitUntilReady() {
    await expect(this.page).toHaveURL(/\/driver\/delivery$/);
    await expect(this.page.getByRole('heading', { name: '進行中配送', level: 1 })).toBeVisible();
    await expect(this.page.getByText('正在載入配送資料…')).toBeHidden();
  }

  activeDelivery(orderId: number) {
    return this.page
      .getByTestId('active-delivery-card')
      .filter({ has: this.page.getByRole('heading', { name: `訂單 #${orderId}`, level: 2, exact: true }) });
  }
}
