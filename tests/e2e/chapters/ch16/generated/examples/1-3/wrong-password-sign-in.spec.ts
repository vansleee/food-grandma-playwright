// spec: ch16/generated/examples/1-3/test-case.md
// seed: ch16/generated/examples/1-3/seed.spec.ts

import { expect, test } from '../../fixtures/demo';
import { SignInPage } from '../../../../ch15/manual/pages/sign-in-page';

test.describe('CH16-E03 餐廳管理者用錯誤密碼登入', () => {
  test('CH16-E03 錯誤密碼登入後顯示錯誤訊息，仍在登入頁且表單可再使用', async ({ page, demo }) => {
    // Arrange：開啟登入頁面，準備有效的餐廳帳號與不同於正確密碼的非空密碼。
    const signIn = new SignInPage(page);
    const { username, password } = demo.restaurant_login;
    const wrongPassword = `${password}-wrong`;
    await signIn.goto();

    // Act：以有效帳號與錯誤密碼送出登入。
    await signIn.signIn(username, wrongPassword);

    // Assert：顯示錯誤訊息，仍在登入頁，帳號、密碼欄位與登入按鈕仍可使用。
    await expect(page.getByText('Invalid username or password')).toBeVisible();
    await expect(page).toHaveURL(/\/management\/sign-in$/);
    await expect(page.getByTestId('sign-in-username')).toBeEditable();
    await expect(page.getByTestId('sign-in-password')).toBeEditable();
    await expect(page.getByTestId('sign-in-submit')).toBeEnabled();
  });
});
