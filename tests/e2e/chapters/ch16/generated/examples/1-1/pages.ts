import type { Locator, Page } from '@playwright/test';

type Login = { username: string; password: string };

export class SignInPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByTestId('sign-in-username');
    this.password = page.getByTestId('sign-in-password');
    this.submit = page.getByTestId('sign-in-submit');
    this.error = page.getByTestId('sign-in-error');
  }

  async open() {
    await this.page.goto('/management/sign-in');
  }

  async signIn({ username, password }: Login) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
}
