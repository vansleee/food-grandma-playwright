import { expect, test } from './fixtures';

test('CH15-E01 餐廳管理者儲存電話與地址後，重新整理仍看得到新資料', async ({ settingsPage }) => {
  // Arrange: 已登入並開啟餐廳設定，等資料顯示後記下原餐廳名稱
  await expect(settingsPage.name).not.toHaveValue('');
  const originalName = await settingsPage.name.inputValue();
  const newPhone = '02-5555-0172';
  const newAddress = '台北市大安區測試路 172 號';

  // Act: 修改電話與地址並儲存
  await settingsPage.updateContact(newPhone, newAddress);

  // Assert: 仍在設定頁並顯示已儲存，重新整理後資料仍正確且名稱不變
  await expect(settingsPage.heading).toBeVisible();
  await expect(settingsPage.savedMessage).toBeVisible();
  await settingsPage.reload();
  await expect(settingsPage.phone).toHaveValue(newPhone);
  await expect(settingsPage.address).toHaveValue(newAddress);
  await expect(settingsPage.name).toHaveValue(originalName);
});
