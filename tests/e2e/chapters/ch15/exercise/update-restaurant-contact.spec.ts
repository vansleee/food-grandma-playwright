import { test, expect } from './restaurant-settings.fixture';

test.describe('餐廳設定', () => {
  test('CH15-E01 餐廳管理者儲存電話與地址後，重新整理仍看得到新資料', async ({ settingsPage }) => {
    // Arrange：已登入並開啟「餐廳設定」，等資料顯示後記下原本的餐廳名稱
    const newPhone = '02-5555-0172';
    const newAddress = '台北市大安區測試路 172 號';
    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.restaurantName).not.toHaveValue('');
    const originalName = await settingsPage.restaurantName.inputValue();

    // Act：只改電話與地址（餐廳名稱不動），再按「儲存設定」
    await settingsPage.fillContact(newPhone, newAddress);
    await settingsPage.save();

    // Assert 1：儲存後仍在「餐廳設定」頁並顯示「已儲存設定」
    await expect(settingsPage.heading).toBeVisible();
    await expect(settingsPage.savedMessage).toBeVisible();

    // Act：重新整理頁面
    await settingsPage.reload();

    // Assert 2：重新整理後電話、地址是剛才儲存的值，餐廳名稱與修改前相同
    await expect(settingsPage.phone).toHaveValue(newPhone);
    await expect(settingsPage.address).toHaveValue(newAddress);
    await expect(settingsPage.restaurantName).toHaveValue(originalName);
  });
});
