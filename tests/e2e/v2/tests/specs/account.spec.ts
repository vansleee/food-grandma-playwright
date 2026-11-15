import { expect, test } from '../support/fixtures';
import { ProfileBuilder } from '../support/builders';
import { Gate, RequestStub, serverError } from '../support/network';
import { AccountPage, type AccountField } from '../support/pages/account-page';

// 規格：specs/05-restaurant-account.md（ACCOUNT-01～ACCOUNT-05）。
// 每案使用專屬餐廳帳號；先以 API 讀回原始欄位，等 UI 顯示已載入的值再編輯。
const PROFILE_API = '**/api/restaurant/me/';

test.describe('餐廳設定', () => {
  test.use({ session: 'restaurantA' });

  test('ACCOUNT-T01 開啟設定頁時欄位顯示目前的名字、email、餐廳名稱與地址', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const original = ProfileBuilder.from(await restaurant.profile()).build();
    const account = new AccountPage(page);

    await account.goto();

    await account.expectLoaded(original);
    await expect(account.field('first_name')).toHaveValue(original.first_name);
    await expect(account.field('email')).toHaveValue(original.email);
    await expect(account.field('name')).toHaveValue(original.name);
    await expect(account.field('address')).toHaveValue(original.address);
  });

  test('ACCOUNT-T02 修改電話與地址並保存，重新載入後新值存在且其他欄位不變', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const profile = await restaurant.profile();
    const original = ProfileBuilder.from(profile).build();
    const updated = ProfileBuilder.from(profile)
      .withPhone('02-2345-6789')
      .withAddress('No. 99 Spec Road ACCOUNT-T02')
      .build();
    const account = new AccountPage(page);
    await account.goto();
    await account.expectLoaded(original);

    await account.fill('phone', updated.phone);
    await account.fill('address', updated.address);
    await account.save();

    await expect(account.savedNotice).toBeVisible();
    await expect(page).toHaveURL(/\/management\/account$/);

    await page.reload();
    await account.expectLoaded(updated);
    expect(ProfileBuilder.from(await restaurant.profile()).build()).toEqual(updated);
  });

  test('ACCOUNT-T03 清空必填欄位或輸入錯誤 email 時原生驗證不通過且沒有保存請求', async ({ page, stage }) => {
    const restaurant = await stage.restaurant();
    const original = ProfileBuilder.from(await restaurant.profile()).build();
    const account = new AccountPage(page);
    const save = await RequestStub.install(page, PROFILE_API, 'PUT');

    const invalidInputs: { title: string; field: AccountField; value: string; flag: 'valueMissing' | 'typeMismatch' }[] = [
      { title: '清空電子郵件', field: 'email', value: '', flag: 'valueMissing' },
      { title: '清空餐廳名稱', field: 'name', value: '', flag: 'valueMissing' },
      { title: '清空電話', field: 'phone', value: '', flag: 'valueMissing' },
      { title: '清空地址', field: 'address', value: '', flag: 'valueMissing' },
      { title: '輸入明顯錯誤的 email', field: 'email', value: 'not-an-email', flag: 'typeMismatch' },
    ];
    for (const scenario of invalidInputs) {
      await test.step(scenario.title, async () => {
        await account.goto();
        await account.expectLoaded(original);

        await account.fill(scenario.field, scenario.value);
        await account.save();

        expect(await account.validity(scenario.field)).toMatchObject({ valid: false, [scenario.flag]: true });
        await expect(account.savedNotice).toBeHidden();
      });
    }

    expect(save.count, '驗證不通過時不得送出保存請求').toBe(0);
    expect(ProfileBuilder.from(await restaurant.profile()).build(), '後端資料不得改變').toEqual(original);
  });

  test('ACCOUNT-T04 保存回應未完成時按鈕停用，之後 HTTP 500 顯示失敗、無成功提示、輸入保留', async ({
    page,
    stage,
  }) => {
    const restaurant = await stage.restaurant();
    const original = ProfileBuilder.from(await restaurant.profile()).build();
    const newPhone = '02-3456-7890';
    const account = new AccountPage(page);
    const save = await RequestStub.install(page, PROFILE_API, 'PUT');
    const hold = new Gate();
    await account.goto();
    await account.expectLoaded(original);

    await test.step('先完成一次真實保存，畫面出現前次成功提示', async () => {
      await account.save();
      await expect(account.savedNotice).toBeVisible();
    });

    await test.step('再次保存但回應尚未完成：按鈕停用，前次成功提示已清除', async () => {
      await account.fill('phone', newPhone);
      save.respondWith(serverError, hold);
      await account.save();
      await expect(account.saveButton).toBeDisabled();
      await expect(account.savedNotice).toBeHidden();
    });

    await test.step('回應 500：顯示錯誤、沒有成功提示、輸入保留', async () => {
      hold.open();
      await expect(account.alert).toContainText('設定儲存失敗，請稍後重試。');
      await expect(account.savedNotice).toBeHidden();
      await expect(account.field('phone')).toHaveValue(newPhone);
      expect((await restaurant.profile()).restaurant.phone, '失敗的保存不得改變後端電話').toBe(original.phone);
    });
  });

  test('ACCOUNT-T05 初次載入設定失敗時顯示無法載入設定訊息', async ({ page }) => {
    const account = new AccountPage(page);
    const load = await RequestStub.install(page, PROFILE_API, 'GET');
    load.respondWith(serverError);

    await account.goto();

    await expect(account.alert).toContainText('無法載入餐廳設定，請重新整理頁面。');
    expect(load.count).toBeGreaterThan(0);
  });
});
