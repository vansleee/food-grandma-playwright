import { expect, type Page } from '@playwright/test';
import { TOKEN_KEYS } from '../domain';

/** 登入頁；就緒條件＝標題與表單都已出現。 */
export class SignInPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/management/sign-in');
    await this.waitUntilReady();
  }

  async waitUntilReady() {
    await expect(this.page).toHaveURL(/\/management\/sign-in$/);
    await expect(this.page.getByRole('heading', { name: '餐廳管理登入' })).toBeVisible();
    await expect(this.page.getByTestId('sign-in-form')).toBeVisible();
  }

  async signIn(username: string, password: string) {
    await this.page.getByLabel('帳號').fill(username);
    await this.page.getByLabel('密碼').fill(password);
    await this.page.getByRole('button', { name: '登入', exact: true }).click();
  }
}

/** 管理站共用的側邊欄（登出、導覽）與 token 狀態。 */
export class ManagementShell {
  constructor(private readonly page: Page) {}

  async signOut() {
    await this.page.getByRole('button', { name: '登出帳號' }).click();
  }

  storedToken(): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), TOKEN_KEYS.restaurant);
  }
}
