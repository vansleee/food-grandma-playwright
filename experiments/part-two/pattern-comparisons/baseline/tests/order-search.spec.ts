import { expect, test, World } from './support/fixtures';
import { OrdersPage, STATUS_LABEL, expectedOrders, openManagementAs } from './support/pages';

const ORDERS_LIST_URL = /\/api\/restaurant\/orders\/(\?.*)?$/;

/** Restaurant A with a Cooking order (customer A) and a second order (customer B). */
async function seedTwoOrders(world: World, opts: { markSecondReady: boolean }) {
  const rest = await world.restaurant();
  const meal = await world.meal(rest, { name: `${world.caseId} meal`, price: 100 });
  const common = world.tag('Common');
  const first = await world.order(rest, 'customerA', `Harbor Lane ${common}`, meal.id);
  const second = await world.order(rest, 'customerB', `Willow Court ${common}`, meal.id);
  if (opts.markSecondReady) await world.api.markReady(rest.token, second.id);
  return { rest, common, first, second };
}

test('FIND-T02 分別以 ID、姓名、地址片段搜尋，忽略大小寫與前後空白', async ({ page, api }) => {
  const world = new World(api, 'FIND-T02');
  const { rest, first } = await seedTwoOrders(world, { markSecondReady: false });
  const orders = await api.listOrders(rest.token);
  const target = orders.find((o) => o.id === first.id)!;

  const cases = [
    { label: '訂單 ID', query: String(target.id) },
    { label: '顧客姓名', query: target.customer.name },
    { label: '顧客姓名（轉大寫）', query: target.customer.name.toUpperCase() },
    { label: '地址片段（小寫）', query: 'harbor lane' },
    { label: '地址片段（大小寫混合）', query: 'hARBOR lANe' },
    { label: '地址片段（前後空白）', query: '   Harbor Lane   ' },
    { label: 'ID（前後空白）', query: `  ${target.id}  ` },
  ];

  const ordersPage = new OrdersPage(page);
  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();
  await expect(ordersPage.row(first.id)).toBeVisible();

  for (const c of cases) {
    await test.step(`搜尋 ${c.label}：「${c.query}」`, async () => {
      const expected = expectedOrders(orders, { query: c.query });
      expect(expected, '目標訂單必須符合搜尋').toContain(target.id);
      await ordersPage.search(c.query);
      await ordersPage.expectRows(expected);
    });
  }
});

test('FIND-T03 搜尋顧客後選「待取餐」只顯示同時匹配的列', async ({ page, api }) => {
  const world = new World(api, 'FIND-T03');
  const { rest, common, first, second } = await seedTwoOrders(world, { markSecondReady: true });
  const orders = await api.listOrders(rest.token);
  const cookingCustomer = orders.find((o) => o.id === first.id)!.customer.name;
  const readyCustomer = orders.find((o) => o.id === second.id)!.customer.name;

  const ordersPage = new OrdersPage(page);
  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();

  await test.step('搜尋同時匹配兩筆訂單的字串（尚未篩選狀態）', async () => {
    await ordersPage.search(common);
    await ordersPage.expectRows(expectedOrders(orders, { query: common }));
    await expect(ordersPage.row(first.id)).toBeVisible();
    await expect(ordersPage.row(second.id)).toBeVisible();
  });

  await test.step('選「待取餐」：僅留下同時匹配搜尋與 Ready 的列', async () => {
    await ordersPage.chooseTab('待取餐');
    const expected = expectedOrders(orders, { query: common, status: 'Ready' });
    expect(expected).toEqual([second.id]);
    await ordersPage.expectRows(expected);
    await expect(ordersPage.row(first.id)).toHaveCount(0);
    await expect(ordersPage.statusOf(second.id)).toHaveText(STATUS_LABEL.Ready);
  });

  await test.step('改搜尋備餐中訂單的顧客並維持「待取餐」：只顯示同時匹配者', async () => {
    await ordersPage.search(cookingCustomer);
    await ordersPage.expectRows(expectedOrders(orders, { query: cookingCustomer, status: 'Ready' }));
    await expect(ordersPage.row(first.id)).toHaveCount(0);
  });

  await test.step('搜尋待取餐訂單的顧客並維持「待取餐」：顯示該筆', async () => {
    await ordersPage.search(readyCustomer);
    const expected = expectedOrders(orders, { query: readyCustomer, status: 'Ready' });
    expect(expected).toContain(second.id);
    await ordersPage.expectRows(expected);
  });
});

test('FIND-T04 改搜尋條件時頁尾筆數更新，頁籤維持各狀態總數', async ({ page, api }) => {
  const world = new World(api, 'FIND-T04');
  const { rest, common, first, second } = await seedTwoOrders(world, { markSecondReady: true });
  const orders = await api.listOrders(rest.token);

  const totals: Record<string, number> = {
    全部: orders.length,
    備餐中: orders.filter((o) => o.status === 'Cooking').length,
    待取餐: orders.filter((o) => o.status === 'Ready').length,
    配送中: orders.filter((o) => o.status === 'On the way').length,
    已送達: orders.filter((o) => o.status === 'Delivered').length,
  };

  const ordersPage = new OrdersPage(page);
  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();

  async function expectTabsUnchanged() {
    for (const [label, total] of Object.entries(totals)) {
      await expect(ordersPage.tab(label).locator('span')).toHaveText(String(total));
    }
  }

  const searches = [
    { label: '只匹配第一筆的地址', query: 'harbor lane' },
    { label: '匹配兩筆的共同字串', query: common },
    { label: '只匹配第二筆的地址', query: 'willow court' },
    { label: '不存在的字串', query: 'no-such-order-zzzz' },
  ];

  await test.step('未搜尋時頁籤與頁尾皆為總數', async () => {
    await ordersPage.expectRows(orders.map((o) => o.id));
    await expectTabsUnchanged();
  });

  for (const s of searches) {
    await test.step(`改搜尋「${s.label}」`, async () => {
      await ordersPage.search(s.query);
      await ordersPage.expectRows(expectedOrders(orders, { query: s.query }));
      await expectTabsUnchanged();
    });
  }

  await test.step('確認兩筆訂單狀態不同，頁籤統計有意義', async () => {
    expect(orders.find((o) => o.id === first.id)!.status).toBe('Cooking');
    expect(orders.find((o) => o.id === second.id)!.status).toBe('Ready');
  });
});

test('FIND-T05 搜尋不存在的字串顯示無符合結果訊息', async ({ page, api }) => {
  const world = new World(api, 'FIND-T05');
  const { rest } = await seedTwoOrders(world, { markSecondReady: false });

  const ordersPage = new OrdersPage(page);
  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();
  await expect(ordersPage.rows).toHaveCount(2);

  await ordersPage.search('這個字串不會出現在任何訂單-zzzz-9999');

  await expect(ordersPage.rows).toHaveCount(0);
  await expect(ordersPage.emptyNoMatch()).toBeVisible();
  await expect(ordersPage.emptyNoOrders()).toHaveCount(0);
});

test('FIND-T06 沒有訂單的餐廳顯示尚無訂單而非搜尋無結果', async ({ page, api }) => {
  const world = new World(api, 'FIND-T06');
  const rest = await world.restaurant();
  expect(await api.listOrders(rest.token), '前提：餐廳沒有任何訂單').toHaveLength(0);

  const ordersPage = new OrdersPage(page);
  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();

  await expect(ordersPage.emptyNoOrders()).toBeVisible();
  await expect(ordersPage.rows).toHaveCount(0);
  await expect(ordersPage.emptyNoMatch()).toHaveCount(0);
});

test('FIND-T07 首次回應延遲顯示載入中，失敗顯示錯誤而非空狀態', async ({ page, api }) => {
  const world = new World(api, 'FIND-T07');
  const rest = await world.restaurant();
  const ordersPage = new OrdersPage(page);

  let mode: 'delay' | 'fail' = 'delay';
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(ORDERS_LIST_URL, async (route) => {
    if (mode === 'delay') {
      await gate;
      await route.continue();
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'stubbed failure' }),
      });
    }
  });

  await test.step('首次回應延遲：顯示載入中，不顯示任何空狀態', async () => {
    await openManagementAs(page, rest.token, '/management/orders');
    await expect(page.getByText('正在載入訂單…')).toBeVisible();
    await expect(ordersPage.emptyNoOrders()).toHaveCount(0);
    await expect(ordersPage.emptyNoMatch()).toHaveCount(0);
    release();
    await ordersPage.waitUntilLoaded();
    await expect(ordersPage.emptyNoOrders()).toBeVisible();
  });

  await test.step('首次回應失敗：顯示錯誤，不顯示成功的空狀態', async () => {
    mode = 'fail';
    await page.reload();
    await expect(ordersPage.alert()).toContainText('資料暫時無法載入，請重新整理後再試。');
    await expect(page.getByText('正在載入訂單…')).toHaveCount(0);
    await expect(ordersPage.emptyNoOrders()).toHaveCount(0);
    await expect(ordersPage.emptyNoMatch()).toHaveCount(0);
    await expect(ordersPage.rows).toHaveCount(0);
  });
});

test('FIND-T08 固定篩選後重新整理發出新請求並依原條件顯示新資料', async ({ page, api }) => {
  const world = new World(api, 'FIND-T08');
  const { rest, common, first, second } = await seedTwoOrders(world, { markSecondReady: true });

  const ordersPage = new OrdersPage(page);
  let listRequests = 0;
  let holdRefresh = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(ORDERS_LIST_URL, async (route) => {
    listRequests += 1;
    if (holdRefresh) await gate;
    await route.continue();
  });

  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();

  await test.step('固定搜尋與「待取餐」篩選：目前只有第二筆', async () => {
    await ordersPage.search(common);
    await ordersPage.chooseTab('待取餐');
    await ordersPage.expectRows([second.id]);
  });

  await test.step('資料在伺服器端變更（第一筆備餐完成）後按重新整理', async () => {
    await api.markReady(rest.token, first.id);
    const before = listRequests;
    holdRefresh = true;
    await ordersPage.refreshButton().click();

    await expect.poll(() => listRequests).toBe(before + 1);
    await expect(ordersPage.refreshButton()).toBeDisabled();
    await expect(ordersPage.searchBox()).toHaveValue(common);
    await expect(ordersPage.tab('待取餐')).toHaveAttribute('aria-pressed', 'true');
  });

  await test.step('回應完成後依原條件顯示新資料', async () => {
    release();
    await expect(ordersPage.refreshButton()).toBeEnabled();
    const orders = await api.listOrders(rest.token);
    const expected = expectedOrders(orders, { query: common, status: 'Ready' });
    expect(expected.sort((a, b) => a - b)).toEqual([first.id, second.id].sort((a, b) => a - b));
    await ordersPage.expectRows(expected);
    await expect(ordersPage.searchBox()).toHaveValue(common);
    await expect(ordersPage.tab('待取餐')).toHaveAttribute('aria-pressed', 'true');
  });
});
