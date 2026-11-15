import { Page } from '@playwright/test';
import { expect, test, World } from './support/fixtures';
import { AccountField, AccountPage, openManagementAs } from './support/pages';

const ME_URL = /\/api\/restaurant\/me\/$/;

async function openAccount(world: World, page: Page) {
  const rest = await world.restaurant();
  const original = await world.api.restaurantMe(rest.token);
  const account = new AccountPage(page);
  return { rest, original, account, open: () => openManagementAs(page, rest.token, '/management/account') };
}

/** Waits until the form shows the loaded restaurant (the initial form state is empty). */
async function waitUntilFormLoaded(account: AccountPage, restaurantName: string) {
  await expect(account.field('restaurantName')).toHaveValue(restaurantName);
}

test('ACCOUNT-T01 設定頁載入目前餐廳與聯絡人資料', async ({ page, api }) => {
  const world = new World(api, 'ACCOUNT-T01');
  const { original, account, open } = await openAccount(world, page);
  expect(original.restaurant.name, '前提：餐廳名稱不為空').not.toBe('');
  expect(original.restaurant.address, '前提：餐廳地址不為空').not.toBe('');

  await open();

  await waitUntilFormLoaded(account, original.restaurant.name);
  await expect(account.field('firstName')).toHaveValue(original.user.first_name);
  await expect(account.field('lastName')).toHaveValue(original.user.last_name);
  await expect(account.field('email')).toHaveValue(original.user.email);
  await expect(account.field('restaurantName')).toHaveValue(original.restaurant.name);
  await expect(account.field('phone')).toHaveValue(original.restaurant.phone);
  await expect(account.field('address')).toHaveValue(original.restaurant.address);
});

test('ACCOUNT-T02 修改電話與地址並保存，reload 後新值存在且其他欄位保持', async ({ page, api }) => {
  const world = new World(api, 'ACCOUNT-T02');
  const { rest, original, account, open } = await openAccount(world, page);
  const newPhone = '02-5550-0202';
  const newAddress = world.tag('New address ');

  await open();
  await waitUntilFormLoaded(account, original.restaurant.name);
  const before = await account.values();

  await test.step('修改電話與地址並保存', async () => {
    await account.field('phone').fill(newPhone);
    await account.field('address').fill(newAddress);
    await account.save().click();
  });

  await test.step('顯示成功且仍在設定頁', async () => {
    await expect(account.savedNotice()).toBeVisible();
    await expect(page).toHaveURL(/\/management\/account$/);
  });

  await test.step('reload 後新值存在，其他欄位保持', async () => {
    await page.reload();
    await expect(account.field('phone')).toHaveValue(newPhone);
    await expect(account.field('address')).toHaveValue(newAddress);
    const after = await account.values();
    for (const key of ['firstName', 'lastName', 'email', 'restaurantName', 'logo'] as AccountField[]) {
      expect(after[key], `${key} 應保持不變`).toBe(before[key]);
    }
  });

  await test.step('API 回讀確認', async () => {
    const me = await api.restaurantMe(rest.token);
    expect(me.restaurant.phone).toBe(newPhone);
    expect(me.restaurant.address).toBe(newAddress);
    expect(me.restaurant.name).toBe(original.restaurant.name);
    expect(me.user).toEqual(original.user);
  });
});

test('ACCOUNT-T03 清空必填欄位或輸入錯誤 email 時原生驗證不通過且不送出', async ({ page, api }) => {
  const world = new World(api, 'ACCOUNT-T03');
  const { original, account, open } = await openAccount(world, page);

  let saveRequests = 0;
  page.on('request', (req) => {
    if (req.method() === 'PUT' && ME_URL.test(req.url())) saveRequests += 1;
  });

  const cases: { label: string; field: AccountField; value: string; flag: 'valueMissing' | 'typeMismatch' }[] = [
    { label: '清空電子郵件', field: 'email', value: '', flag: 'valueMissing' },
    { label: '清空餐廳名稱', field: 'restaurantName', value: '', flag: 'valueMissing' },
    { label: '清空電話', field: 'phone', value: '', flag: 'valueMissing' },
    { label: '清空地址', field: 'address', value: '', flag: 'valueMissing' },
    { label: '輸入明顯錯誤的 email', field: 'email', value: 'not-an-email', flag: 'typeMismatch' },
  ];

  for (const c of cases) {
    await test.step(c.label, async () => {
      await open();
      await waitUntilFormLoaded(account, original.restaurant.name);
      await account.field(c.field).fill(c.value);
      await account.save().click();

      const validity = await account.validity(c.field);
      expect(validity.valid).toBe(false);
      expect(validity[c.flag]).toBe(true);
      await expect(account.savedNotice()).toHaveCount(0);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
      expect(saveRequests).toBe(0);
    });
  }

  await test.step('後端資料沒有被改動', async () => {
    const me = await api.restaurantMe(await world.token('restaurantA'));
    expect(me).toEqual(original);
  });
});

test('ACCOUNT-T04 保存回應未完成時停用按鈕，之後 500 顯示錯誤並保留輸入', async ({ page, api }) => {
  const world = new World(api, 'ACCOUNT-T04');
  const { rest, original, account, open } = await openAccount(world, page);
  const newPhone = '02-5550-0404';

  let saveRequests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(ME_URL, async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    saveRequests += 1;
    await gate;
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'stub' }) });
  });

  await open();
  await waitUntilFormLoaded(account, original.restaurant.name);
  await account.field('phone').fill(newPhone);

  await test.step('保存回應尚未完成時按鈕停用', async () => {
    await account.save().click();
    await expect.poll(() => saveRequests).toBe(1);
    await expect(account.save()).toBeDisabled();
  });

  await test.step('回應 500：顯示錯誤、沒有成功提示、輸入保留', async () => {
    release();
    await expect(account.alert()).toContainText('設定儲存失敗，請稍後重試。');
    await expect(account.savedNotice()).toHaveCount(0);
    await expect(account.field('phone')).toHaveValue(newPhone);
    await expect(account.save()).toBeEnabled();
  });

  await test.step('真實後端資料未被改動', async () => {
    expect((await api.restaurantMe(rest.token)).restaurant.phone).toBe(original.restaurant.phone);
  });
});

test('ACCOUNT-T05 初次載入設定失敗時顯示無法載入訊息', async ({ page, api }) => {
  const world = new World(api, 'ACCOUNT-T05');
  const { account, open } = await openAccount(world, page);

  await page.route(ME_URL, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'stub' }) });
  });

  await open();

  await expect(account.alert()).toContainText('無法載入餐廳設定，請重新整理頁面。');
  await expect(account.savedNotice()).toHaveCount(0);
});
