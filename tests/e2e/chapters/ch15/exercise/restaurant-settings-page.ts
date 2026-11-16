import type { Locator, Page } from '@playwright/test';

/** 餐廳管理後台的「餐廳設定」頁。只放定位器與操作，斷言留在測試。 */
export class RestaurantSettingsPage {
  readonly heading: Locator;
  readonly restaurantName: Locator;
  readonly phone: Locator;
  readonly address: Locator;
  readonly saveButton: Locator;
  readonly savedMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: '餐廳設定', level: 1 });
    this.restaurantName = page.getByTestId('account-restaurant-name');
    this.phone = page.getByTestId('account-phone');
    this.address = page.getByTestId('account-address');
    this.saveButton = page.getByTestId('account-save');
    this.savedMessage = page.getByText('已儲存設定');
  }

  async signInAndOpen(username: string, password: string) {
    await this.page.goto('/management/sign-in');
    await this.page.getByTestId('sign-in-username').fill(username);
    await this.page.getByTestId('sign-in-password').fill(password);
    await this.page.getByTestId('sign-in-submit').click();
    await this.page.getByTestId('nav-account').click();
  }

  async fillContact(phone: string, address: string) {
    await this.phone.fill(phone);
    await this.address.fill(address);
  }

  async save() {
    await this.saveButton.click();
  }

  async reload() {
    await this.page.reload();
  }
}
