import { Locator, Page, expect } from '@playwright/test';
import { DRIVER_TOKEN_KEY, RESTAURANT_TOKEN_KEY, testPassword } from './env';
import { OrderView } from './api';

export const STATUS_LABEL: Record<string, string> = {
  Cooking: '備餐中',
  Ready: '待取餐',
  'On the way': '配送中',
  Delivered: '已送達',
};

/** Puts a real, API-issued token into the management site's storage, then opens `path`. */
export async function openManagementAs(page: Page, token: string, path: string): Promise<void> {
  await page.goto('/management/sign-in');
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [RESTAURANT_TOKEN_KEY, token]);
  await page.goto(path);
}

export class SignInPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/management/sign-in');
    await expect(this.page.getByTestId('sign-in-form')).toBeVisible();
  }

  async signIn(username: string) {
    await this.page.getByTestId('sign-in-username').fill(username);
    await this.page.getByTestId('sign-in-password').fill(testPassword());
    await this.page.getByTestId('sign-in-submit').click();
  }
}

export class OrdersPage {
  readonly rows: Locator;
  readonly tableFooter: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByTestId('order-row');
    this.tableFooter = page.locator('.table-footer');
  }

  heading() {
    return this.page.getByRole('heading', { name: '訂單管理', exact: true });
  }

  async waitUntilLoaded() {
    await expect(this.page.getByTestId('order-table')).toBeVisible();
    await expect(this.page.getByText('正在載入訂單…')).toHaveCount(0);
  }

  row(orderId: number) {
    return this.page.locator(`[data-testid="order-row"][data-order-id="${orderId}"]`);
  }

  readyButton(orderId: number) {
    return this.row(orderId).getByTestId('order-ready-button');
  }

  allReadyButtons() {
    return this.page.getByTestId('order-ready-button');
  }

  statusOf(orderId: number) {
    return this.row(orderId).getByTestId('order-status');
  }

  search(text: string) {
    return this.page.getByRole('textbox', { name: '搜尋訂單' }).fill(text);
  }

  searchBox() {
    return this.page.getByRole('textbox', { name: '搜尋訂單' });
  }

  tab(label: string) {
    return this.page.locator('.filter-tabs button').filter({ hasText: label });
  }

  async chooseTab(label: string) {
    await this.tab(label).click();
    await expect(this.tab(label)).toHaveAttribute('aria-pressed', 'true');
  }

  async tabCount(label: string): Promise<number> {
    return Number(await this.tab(label).locator('span').innerText());
  }

  refreshButton() {
    return this.page.getByRole('button', { name: /重新整理|更新中/ });
  }

  notice() {
    return this.page.getByRole('status').filter({ hasText: '已標記為待取餐' });
  }

  alert() {
    return this.page.getByRole('alert');
  }

  emptyNoMatch() {
    return this.page.getByText('沒有符合條件的訂單，請調整搜尋或篩選。');
  }

  emptyNoOrders() {
    return this.page.getByText('目前還沒有訂單，新的訂單會顯示在這裡。');
  }

  async visibleOrderIds(): Promise<number[]> {
    const ids = await this.rows.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-order-id'))));
    return ids.sort((a, b) => a - b);
  }

  /** Waits until the displayed row set equals `expected` and the footer count agrees. */
  async expectRows(expected: number[]) {
    const sorted = [...expected].sort((a, b) => a - b);
    await expect.poll(() => this.visibleOrderIds()).toEqual(sorted);
    await expect(this.tableFooter).toContainText(`共 ${sorted.length} 筆符合條件的訂單`);
  }
}

/** FIND-02/03 as written in the spec; used only as the oracle for expected rows. */
export function expectedOrders(
  orders: OrderView[],
  opts: { query?: string; status?: string },
): number[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  return orders
    .filter((o) => !opts.status || o.status === opts.status)
    .filter((o) => `${o.id} ${o.customer.name} ${o.address}`.toLowerCase().includes(q))
    .map((o) => o.id);
}

export class MealsPage {
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByTestId('meal-row');
  }

  async open() {
    await this.page.goto('/management/meals');
    await this.waitUntilLoaded();
  }

  async waitUntilLoaded() {
    await expect(this.page.getByTestId('meal-table')).toBeVisible();
    await expect(this.page.getByText('正在載入菜單…')).toHaveCount(0);
  }

  row(mealId: number) {
    return this.page.locator(`[data-testid="meal-row"][data-meal-id="${mealId}"]`);
  }

  searchBox() {
    return this.page.getByRole('textbox', { name: '搜尋餐點' });
  }

  addLink() {
    return this.page.getByTestId('add-meal-link');
  }

  noMatchMessage() {
    return this.page.getByText('沒有符合的餐點，試試其他關鍵字。');
  }

  async visibleMealIds(): Promise<number[]> {
    const ids = await this.rows.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-meal-id'))));
    return ids.sort((a, b) => a - b);
  }
}

export interface MealFormValues {
  name?: string;
  description?: string;
  image?: string;
  price?: string;
}

export class MealFormPage {
  constructor(private readonly page: Page) {}

  name() {
    return this.page.getByTestId('meal-name');
  }
  description() {
    return this.page.getByTestId('meal-description');
  }
  image() {
    return this.page.getByTestId('meal-image');
  }
  price() {
    return this.page.getByTestId('meal-price');
  }
  submit() {
    return this.page.getByTestId('meal-submit');
  }
  alert() {
    return this.page.getByRole('alert');
  }

  async fill(values: MealFormValues) {
    if (values.name !== undefined) await this.name().fill(values.name);
    if (values.description !== undefined) await this.description().fill(values.description);
    if (values.image !== undefined) await this.image().fill(values.image);
    if (values.price !== undefined) await this.price().fill(values.price);
  }

  async openNew() {
    await this.page.goto('/management/meals/add');
    await expect(this.page.getByRole('heading', { name: '新增餐點', level: 1 })).toBeVisible();
  }

  /** Native validity of one input, as the browser reports it. */
  validity(input: Locator) {
    return input.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      rangeUnderflow: el.validity.rangeUnderflow,
      stepMismatch: el.validity.stepMismatch,
    }));
  }
}

export type AccountField = 'firstName' | 'lastName' | 'email' | 'restaurantName' | 'phone' | 'address' | 'logo';

const ACCOUNT_TEST_IDS: Record<AccountField, string> = {
  firstName: 'account-first-name',
  lastName: 'account-last-name',
  email: 'account-email',
  restaurantName: 'account-restaurant-name',
  phone: 'account-phone',
  address: 'account-address',
  logo: 'account-logo',
};

export class AccountPage {
  constructor(private readonly page: Page) {}

  field(name: AccountField) {
    return this.page.getByTestId(ACCOUNT_TEST_IDS[name]);
  }
  save() {
    return this.page.getByTestId('account-save');
  }
  savedNotice() {
    return this.page.getByText('已儲存設定', { exact: true });
  }
  alert() {
    return this.page.getByRole('alert');
  }

  async values(): Promise<Record<AccountField, string>> {
    const out = {} as Record<AccountField, string>;
    for (const name of Object.keys(ACCOUNT_TEST_IDS) as AccountField[]) {
      out[name] = await this.field(name).inputValue();
    }
    return out;
  }

  validity(name: AccountField) {
    return this.field(name).evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      typeMismatch: el.validity.typeMismatch,
    }));
  }
}

/** Driver site (separate app on the same origin); the token key is the one the app itself reads. */
export class DriverOrdersPage {
  constructor(private readonly page: Page) {}

  async openAs(driverToken: string) {
    await this.page.goto('/driver/orders');
    await this.page.evaluate(([key, value]) => localStorage.setItem(key, value), [DRIVER_TOKEN_KEY, driverToken]);
    await this.page.reload();
    await expect(this.page.getByRole('heading', { name: '可接訂單', level: 1 })).toBeVisible();
  }

  rowFor(orderId: number) {
    const padded = `#${String(orderId).padStart(4, '0')}`;
    return this.page.getByTestId('ready-order-card').filter({
      has: this.page.locator('td strong', { hasText: new RegExp(`^${padded}$`) }),
    });
  }

  pickButton(orderId: number) {
    return this.rowFor(orderId).getByTestId('pick-order');
  }

  async claim(orderId: number) {
    await this.page.goto('/driver/orders');
    await this.pickButton(orderId).click();
    await this.page.waitForURL(/\/driver\/delivery$/);
  }

  error() {
    return this.page.getByTestId('orders-error');
  }
}
