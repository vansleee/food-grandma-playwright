import { expect, test } from '../../fixtures/demo';
import { SignInPage } from './pages';

test('餐廳管理者用錯誤密碼登入會看到錯誤訊息並留在登入頁', async ({ page, demo }) => {
  // Arrange
  const signIn = new SignInPage(page);
  const wrongPassword = `${demo.restaurant_login.password}-wrong`;
  await signIn.open();

  // Act
  await signIn.signIn({ username: demo.restaurant_login.username, password: wrongPassword });

  // Assert
  await expect(signIn.error).toBeVisible();
  await expect(signIn.error).toHaveText('Invalid username or password');
  await expect(page).toHaveURL(/\/management\/sign-in$/);
  await expect(signIn.username).toBeVisible();
  await expect(signIn.password).toBeVisible();
  await expect(signIn.submit).toBeVisible();
});
