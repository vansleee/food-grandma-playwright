import { expect } from '@playwright/test';
import { ALL_STATUSES, STATUS_LABEL, type ApiOrder, type OrderStatus } from './domain';
import type { OrderRow, OrdersPage } from './pages/orders-page';

/**
 * Ch36 自訂斷言：名稱描述業務結果，不描述 DOM。
 * 只放會重複、且每個斷言都明確寫出檢查內容的驗證；案例層級的驗收仍留在測試裡。
 */
export async function expectOrderStatus(row: OrderRow, status: OrderStatus) {
  await expect(row.status()).toHaveText(STATUS_LABEL[status]);
}

/** 列表只顯示 `visible` 中的訂單（其餘 `all` 內的訂單都不在畫面上），且頁尾筆數相符。 */
export async function expectOrdersShown(orders: OrdersPage, all: ApiOrder[], visible: ApiOrder[]) {
  const shown = new Set(visible.map((order) => order.id));
  for (const order of all) {
    await expect(orders.order(order.id).root, `訂單 ${order.id}`).toHaveCount(shown.has(order.id) ? 1 : 0);
  }
  await expect(orders.footer).toContainText(`共 ${visible.length} 筆符合條件的訂單`);
}

/** FIND-04：狀態頁籤筆數反映整份已載入清單，不隨搜尋縮減。 */
export async function expectStatusTabCounts(orders: OrdersPage, all: ApiOrder[]) {
  await expect(orders.statusTab('all')).toHaveText(`全部${all.length}`);
  for (const status of ALL_STATUSES) {
    const count = all.filter((order) => order.status === status).length;
    await expect(orders.statusTab(status)).toHaveText(`${STATUS_LABEL[status]}${count}`);
  }
}
