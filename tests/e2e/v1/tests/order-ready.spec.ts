import { expect, test, World } from './support/fixtures';
import { OrdersPage, STATUS_LABEL, openManagementAs } from './support/pages';

const MARK_READY_URL = /\/api\/restaurant\/orders\/\d+$/;

async function seedCookingOrders(world: World, count: 1 | 2) {
  const rest = await world.restaurant();
  const meal = await world.meal(rest, { name: `${world.caseId} meal`, price: 120 });
  const first = await world.order(rest, 'customerA', world.tag('ready-addr-'), meal.id);
  const second = count === 2 ? await world.order(rest, 'customerB', world.tag('ready-addr-'), meal.id) : undefined;
  expect(first.status).toBe('Cooking');
  return { rest, first, second };
}

test('READY-T02 在 UI 完成備餐後顯示待取餐且 reload 後仍保持', async ({ page, api }) => {
  const world = new World(api, 'READY-T02');
  const { rest, first: order } = await seedCookingOrders(world, 1);
  const ordersPage = new OrdersPage(page);

  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();
  await expect(ordersPage.statusOf(order.id)).toHaveText(STATUS_LABEL.Cooking);

  await test.step('按下指定訂單的「備餐完成 →」', async () => {
    await ordersPage.readyButton(order.id).click();
  });

  await test.step('顯示成功訊息、待取餐、按鈕消失', async () => {
    await expect(ordersPage.notice()).toHaveText(`訂單 #${order.id} 已標記為待取餐。`);
    await expect(ordersPage.statusOf(order.id)).toHaveText(STATUS_LABEL.Ready);
    await expect(ordersPage.readyButton(order.id)).toHaveCount(0);
  });

  await test.step('整頁 reload 後仍為待取餐', async () => {
    await page.reload();
    await ordersPage.waitUntilLoaded();
    await expect(ordersPage.statusOf(order.id)).toHaveText(STATUS_LABEL.Ready);
    await expect(ordersPage.readyButton(order.id)).toHaveCount(0);
    expect((await world.readOrder(rest, order.id)).status).toBe('Ready');
  });
});

test('READY-T05 更新回應尚未完成時所有備餐完成按鈕停用且不重複送出', async ({ page, api }) => {
  const world = new World(api, 'READY-T05');
  const { rest, first, second } = await seedCookingOrders(world, 2);
  const ordersPage = new OrdersPage(page);

  let patchRequests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(MARK_READY_URL, async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    patchRequests += 1;
    await gate;
    await route.continue();
  });

  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();
  await expect(ordersPage.allReadyButtons()).toHaveCount(2);

  await test.step('送出更新後，回應未完成', async () => {
    await ordersPage.readyButton(first.id).click();
    await expect.poll(() => patchRequests).toBe(1);
  });

  await test.step('所有備餐完成按鈕停用，嘗試再點擊也不會再送出', async () => {
    await expect(ordersPage.readyButton(first.id)).toBeDisabled();
    await expect(ordersPage.readyButton(second!.id)).toBeDisabled();
    await ordersPage.readyButton(first.id).click({ force: true });
    await ordersPage.readyButton(second!.id).click({ force: true });
    expect(patchRequests).toBe(1);
  });

  await test.step('回應完成後只有第一筆被更新，且只送出一次', async () => {
    release();
    await expect(ordersPage.statusOf(first.id)).toHaveText(STATUS_LABEL.Ready);
    await expect(ordersPage.statusOf(second!.id)).toHaveText(STATUS_LABEL.Cooking);
    expect(patchRequests).toBe(1);
    expect((await world.readOrder(rest, first.id)).status).toBe('Ready');
    expect((await world.readOrder(rest, second!.id)).status).toBe('Cooking');
  });
});

test('READY-T06 更新 API 失敗（HTTP 500 或 status:failed）時顯示失敗且不樂觀更新', async ({ page, api }) => {
  const world = new World(api, 'READY-T06');
  const { rest, first: order } = await seedCookingOrders(world, 1);
  const ordersPage = new OrdersPage(page);

  let stub: 'http500' | 'failedBody' = 'http500';
  let patchRequests = 0;
  await page.route(MARK_READY_URL, async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    patchRequests += 1;
    if (stub === 'http500') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'stub' }) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'failed', error: 'Order not found' }),
      });
    }
  });

  await openManagementAs(page, rest.token, '/management/orders');
  await ordersPage.waitUntilLoaded();

  const scenarios = [
    { name: 'HTTP 500', mode: 'http500' as const },
    { name: 'HTTP 200 且 body status:failed', mode: 'failedBody' as const },
  ];

  for (const [index, scenario] of scenarios.entries()) {
    await test.step(`更新 API 回應 ${scenario.name}`, async () => {
      stub = scenario.mode;
      await ordersPage.readyButton(order.id).click();
      await expect.poll(() => patchRequests).toBe(index + 1);

      await expect(ordersPage.alert()).toContainText('更新訂單失敗，請稍後重試。');
      await expect(ordersPage.notice()).toHaveCount(0);
      await expect(ordersPage.statusOf(order.id)).toHaveText(STATUS_LABEL.Cooking);
      await expect(ordersPage.readyButton(order.id)).toBeVisible();
      await expect(ordersPage.readyButton(order.id)).toBeEnabled();
      expect((await world.readOrder(rest, order.id)).status).toBe('Cooking');
    });
  }
});
