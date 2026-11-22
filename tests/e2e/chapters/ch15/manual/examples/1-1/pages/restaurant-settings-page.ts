import type { Locator, Page } from '@playwright/test';

export class RestaurantSettingsPage {
  readonly heading: Locator;
  readonly savedMessage: Locator;
  readonly name: Locator;
  readonly phone: Locator;
  readonly address: Locator;
  readonly save: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: '餐廳設定', level: 1 });
    this.savedMessage = page.getByText('已儲存設定');
    this.name = page.getByLabel('餐廳名稱');
    this.phone = page.getByTestId('account-phone');
    this.address = page.getByTestId('account-address');
    this.save = page.getByTestId('account-save');
  }

  async open() {
    await this.page.getByTestId('nav-account').click();
  }

  async updateContact(phone: string, address: string) {
    await this.phone.fill(phone);
    await this.address.fill(address);
    await this.save.click();
  }

  async reload() {
    await this.page.reload();
  }
}
