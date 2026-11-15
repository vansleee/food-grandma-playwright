import { expect, type Locator, type Page } from '@playwright/test';
import type { ProfilePayload } from '../domain';

export type AccountField = keyof ProfilePayload;

const LABELS: Record<AccountField, string> = {
  first_name: '名字',
  last_name: '姓氏',
  email: '電子郵件',
  name: '餐廳名稱',
  phone: '電話',
  address: '地址',
  logo: '餐廳圖片網址',
};

export class AccountPage {
  readonly saveButton: Locator;
  readonly savedNotice: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.saveButton = page.getByRole('button', { name: '儲存設定' });
    this.savedNotice = page.getByText('已儲存設定');
    this.alert = page.getByRole('alert');
  }

  field(key: AccountField): Locator {
    return this.page.getByLabel(LABELS[key], { exact: true });
  }

  async goto() {
    await this.page.goto('/management/account');
    await expect(this.page).toHaveURL(/\/management\/account$/);
    await expect(this.page.getByRole('heading', { name: '餐廳設定', level: 1 })).toBeVisible();
  }

  /**
   * 設定頁一開始所有欄位都是空字串，不能把「還沒載入」當成「載入完成」。
   * 必填欄位（email、餐廳名稱、地址、電話）放在前面逐一等待，載入完成後再核對選填欄位。
   */
  async expectLoaded(expected: ProfilePayload) {
    for (const key of ['email', 'name', 'address', 'phone', 'first_name', 'last_name', 'logo'] as const) {
      await expect(this.field(key)).toHaveValue(expected[key]);
    }
  }

  async fill(key: AccountField, value: string) {
    await this.field(key).fill(value);
  }

  async save() {
    await this.saveButton.click();
  }

  validity(key: AccountField) {
    return this.field(key).evaluate((input: HTMLInputElement) => ({
      valid: input.validity.valid,
      valueMissing: input.validity.valueMissing,
      typeMismatch: input.validity.typeMismatch,
    }));
  }
}
