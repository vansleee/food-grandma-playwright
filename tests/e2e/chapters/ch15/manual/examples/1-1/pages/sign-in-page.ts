import type { Locator, Page } from '@playwright/test';

export class SignInPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByTestId('sign-in-username');
    this.password = page.getByTestId('sign-in-password');
    this.submit = page.getByTestId('sign-in-submit');
  }

  async goto() {
    await this.page.goto('/management/sign-in');
  }

  async signIn(login: { username: string; password: string }) {
    await this.username.fill(login.username);
    await this.password.fill(login.password);
    await this.submit.click();
  }
}
