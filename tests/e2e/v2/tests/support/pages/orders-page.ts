import { expect, type Locator, type Page } from '@playwright/test';
import { STATUS_LABEL, type OrderStatus } from '../domain';

/** Ch23 Component：只在傳入的 root（由 data-order-id 精確指定的一列）內操作。 */
export class OrderRow {
  constructor(readonly root: Locator) {}

  status() {
    return this.root.getByTestId('order-status');
  }

  readyButton() {
    return this.root.getByTestId('order-ready-button');
  }

  async markReady() {
    await this.readyButton().click();
  }
}

export class OrdersPage {
  readonly searchBox: Locator;
  readonly refreshButton: Locator;
  readonly allRows: Locator;
  readonly loadingText: Locator;
  readonly noMatchText: Locator;
  readonly noOrdersText: Locator;
  readonly footer: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.searchBox = page.getByRole('textbox', { name: '搜尋訂單' });
    // 按鈕文字為「↻ 重新整理」或載入中的「↻ 更新中…」；用圖示避免和列內「更新中…」按鈕混淆。
    this.refreshButton = page.getByRole('button', { name: /↻/ });
    this.allRows = page.getByTestId('order-row');
    this.loadingText = page.getByText('正在載入訂單…');
    this.noMatchText = page.getByText('沒有符合條件的訂單，請調整搜尋或篩選。');
    this.noOrdersText = page.getByText('目前還沒有訂單，新的訂單會顯示在這裡。');
    this.footer = page.getByText(/共 \d+ 筆符合條件的訂單/);
    this.alert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/management/orders');
    await this.waitUntilReady();
  }

  /** Ch24：標題與表格出現還不夠；要等載入結束（重新整理按鈕恢復可按）才算資料就緒。 */
  async waitUntilReady() {
    await expect(this.page).toHaveURL(/\/management\/orders$/);
    await expect(this.page.getByRole('heading', { name: '訂單管理', level: 1 })).toBeVisible();
    await expect(this.page.getByTestId('order-table')).toBeVisible();
    await expect(this.loadingText).toBeHidden();
    await expect(this.refreshButton).toBeEnabled();
  }

  /** 以 API 取得的訂單 ID 精確定位，不依賴第一列或同名顧客。 */
  order(id: number): OrderRow {
    return new OrderRow(this.allRows.and(this.page.locator(`[data-order-id="${id}"]`)));
  }

  async search(text: string) {
    await this.searchBox.fill(text);
  }

  statusTab(status: OrderStatus | 'all') {
    const label = status === 'all' ? '全部' : STATUS_LABEL[status];
    return this.page.getByRole('button', { name: new RegExp(`^${label}\\s*\\d+$`) });
  }

  async chooseStatus(status: OrderStatus | 'all') {
    await this.statusTab(status).click();
  }

  async refresh() {
    await this.refreshButton.click();
  }

  notice(orderId: number) {
    return this.page.getByText(`訂單 #${orderId} 已標記為待取餐。`);
  }
}
