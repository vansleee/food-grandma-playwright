import type { Page } from '@playwright/test';

export class SignInPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/management/sign-in');
  }

  async signIn(username: string, password: string) {
    await this.page.getByLabel('帳號', { exact: true }).fill(username);
    await this.page.getByLabel('密碼').fill(password);
    await this.page.getByTestId('sign-in-submit').click();
  }
}
