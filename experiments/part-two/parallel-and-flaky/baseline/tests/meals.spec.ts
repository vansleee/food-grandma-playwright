import { MealView } from './support/api';
import { expect, test, World } from './support/fixtures';
import { MealFormPage, MealsPage, openManagementAs } from './support/pages';

const MEALS_COLLECTION_URL = /\/api\/restaurant\/meals\/$/;

function mealUrl(id: number) {
  return new RegExp(`/api/restaurant/meals/${id}$`);
}

/** MEAL-05 as written in the spec; used only as the oracle for expected rows. */
function expectedMeals(meals: MealView[], query: string): number[] {
  const q = query.toLowerCase();
  return meals.filter((m) => `${m.name} ${m.short_description}`.toLowerCase().includes(q)).map((m) => m.id);
}

test('MEAL-T01 新增餐點後回到列表，重新整理仍存在', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T01');
  const rest = await world.restaurant();
  const meals = new MealsPage(page);
  const form = new MealFormPage(page);
  const name = world.tag('Meal Create ');
  const description = world.tag('Description ');

  await openManagementAs(page, rest.token, '/management/meals');
  await meals.waitUntilLoaded();

  await test.step('從列表進入新增表單並填入名稱、描述與價格 120，圖片網址留空', async () => {
    await meals.addLink().click();
    await expect(page).toHaveURL(/\/management\/meals\/add$/);
    await form.fill({ name, description, price: '120' });
    await expect(form.image()).toHaveValue('');
    await form.submit().click();
  });

  let created!: MealView;
  await test.step('返回列表並確認新餐點的 ID 與內容', async () => {
    await expect(page).toHaveURL(/\/management\/meals$/);
    const matches = (await api.listMeals(rest.token)).filter((m) => m.name === name);
    expect(matches).toHaveLength(1);
    created = matches[0];
    expect(created.short_description).toBe(description);
    expect(created.price).toBe(120);
    expect(created.image).toBe('');

    const row = meals.row(created.id);
    await expect(row).toBeVisible();
    await expect(row).toContainText(name);
    await expect(row).toContainText(description);
    await expect(row).toContainText('$120');
  });

  await test.step('重新整理頁面後仍能看到', async () => {
    await page.reload();
    await meals.waitUntilLoaded();
    await expect(meals.row(created.id)).toContainText(name);
    await expect(meals.row(created.id)).toContainText('$120');
  });
});

test('MEAL-T02 編輯既有餐點價格為 150，更新同一個 ID 不新增', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T02');
  const rest = await world.restaurant();
  const meals = new MealsPage(page);
  const form = new MealFormPage(page);
  const original = await world.meal(rest, {
    name: world.tag('Meal Edit '),
    short_description: world.tag('Original description '),
    price: 100,
  });

  await openManagementAs(page, rest.token, '/management/meals');
  await meals.waitUntilLoaded();

  await test.step('開啟既有餐點，表單先顯示原有資料', async () => {
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(page).toHaveURL(new RegExp(`/management/meals/${original.id}/edit$`));
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');
  });

  await test.step('把價格改為 150 並儲存', async () => {
    await form.price().fill('150');
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);
  });

  await test.step('同一個 ID 顯示新價格，沒有重複新增', async () => {
    await expect(meals.row(original.id)).toContainText('$150');
    const after = await api.listMeals(rest.token);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({
      id: original.id,
      name: original.name,
      short_description: original.short_description,
      price: 150,
    });
  });
});

test('MEAL-T03 名稱留空、價格負數或小數時瀏覽器驗證不通過且不送出', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T03');
  const rest = await world.restaurant();
  const form = new MealFormPage(page);

  let saveRequests = 0;
  page.on('request', (req) => {
    if (['POST', 'PUT'].includes(req.method()) && /\/api\/restaurant\/meals\//.test(req.url())) saveRequests += 1;
  });

  await openManagementAs(page, rest.token, '/management/meals');

  const cases = [
    {
      label: '名稱留空',
      values: { name: '', price: '50' },
      target: () => form.name(),
      expectFlag: 'valueMissing' as const,
    },
    {
      label: '價格為負數 -1',
      values: { name: world.tag('Invalid price '), price: '-1' },
      target: () => form.price(),
      expectFlag: 'rangeUnderflow' as const,
    },
    {
      label: '價格為小數 12.5',
      values: { name: world.tag('Invalid price '), price: '12.5' },
      target: () => form.price(),
      expectFlag: 'stepMismatch' as const,
    },
  ];

  for (const c of cases) {
    await test.step(c.label, async () => {
      await form.openNew();
      await form.fill(c.values);
      await form.submit().click();

      const validity = await form.validity(c.target());
      expect(validity.valid).toBe(false);
      expect(validity[c.expectFlag]).toBe(true);
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.submit()).toBeEnabled();
      // 讓瀏覽器處理完送出事件後再確認沒有任何儲存請求。
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(null))));
      expect(saveRequests).toBe(0);
    });
  }

  await test.step('後端沒有任何新增的餐點', async () => {
    expect(await api.listMeals(rest.token)).toHaveLength(0);
  });
});

test('MEAL-T04 價格為 0 的餐點可以儲存且 API 回讀仍為 0', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T04');
  const rest = await world.restaurant();
  const meals = new MealsPage(page);
  const form = new MealFormPage(page);
  const name = world.tag('Free meal ');

  await openManagementAs(page, rest.token, '/management/meals/add');
  await expect(form.name()).toBeVisible();
  await form.fill({ name, description: '免費試吃', price: '0' });
  await form.submit().click();

  await expect(page).toHaveURL(/\/management\/meals$/);
  const matches = (await api.listMeals(rest.token)).filter((m) => m.name === name);
  expect(matches).toHaveLength(1);
  expect(matches[0].price).toBe(0);
  await expect(meals.row(matches[0].id)).toContainText('$0');
});

test('MEAL-T05 依名稱或描述搜尋且不分大小寫，無符合時顯示提示', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T05');
  const rest = await world.restaurant();
  const meals = new MealsPage(page);
  await world.meal(rest, { name: 'Spicy Chicken Rice', short_description: 'Crispy fried skin', price: 90 });
  await world.meal(rest, { name: 'Vegetable Soup', short_description: 'Mild BROTH with herbs', price: 60 });
  await world.meal(rest, { name: '紅燒牛肉麵', short_description: 'Braised beef noodle', price: 150 });
  const all = await api.listMeals(rest.token);

  await openManagementAs(page, rest.token, '/management/meals');
  await meals.waitUntilLoaded();
  await expect(meals.rows).toHaveCount(3);

  const matching = [
    { label: '名稱（小寫）', query: 'spicy' },
    { label: '名稱（大寫）', query: 'SPICY' },
    { label: '名稱（中文）', query: '牛肉' },
    { label: '描述（小寫）', query: 'crispy' },
    { label: '描述（大寫）', query: 'CRISPY' },
    { label: '描述原為大寫，以小寫搜尋', query: 'broth' },
    { label: '描述（混合大小寫）', query: 'bRaIsEd' },
  ];

  for (const m of matching) {
    await test.step(`搜尋${m.label}：「${m.query}」`, async () => {
      const expected = expectedMeals(all, m.query);
      expect(expected.length).toBeGreaterThan(0);
      await meals.searchBox().fill(m.query);
      await expect.poll(() => meals.visibleMealIds()).toEqual([...expected].sort((a, b) => a - b));
      await expect(meals.noMatchMessage()).toHaveCount(0);
    });
  }

  await test.step('沒有符合條件時顯示搜尋無結果提示', async () => {
    await meals.searchBox().fill('完全不存在的餐點-zzzz');
    await expect(meals.rows).toHaveCount(0);
    await expect(meals.noMatchMessage()).toBeVisible();
  });
});

test('MEAL-T06 儲存請求延遲後回傳 500：停用按鈕、保留輸入並可再次送出', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T06');
  const rest = await world.restaurant();
  const form = new MealFormPage(page);
  const values = {
    name: world.tag('Retry meal '),
    description: world.tag('Retry description '),
    image: 'https://example.com/retry.png',
    price: '77',
  };

  let saveRequests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(MEALS_COLLECTION_URL, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    saveRequests += 1;
    if (saveRequests === 1) {
      await gate;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'stub' }) });
    } else {
      await route.continue();
    }
  });

  await openManagementAs(page, rest.token, '/management/meals/add');
  await expect(form.name()).toBeVisible();
  await form.fill(values);

  await test.step('送出後等待期間儲存按鈕停用', async () => {
    await form.submit().click();
    await expect.poll(() => saveRequests).toBe(1);
    await expect(form.submit()).toBeDisabled();
  });

  await test.step('回傳 500 後仍停留在表單並保留輸入', async () => {
    release();
    await expect(form.alert()).toContainText('餐點儲存失敗，請稍後重試。');
    await expect(page).toHaveURL(/\/management\/meals\/add$/);
    await expect(form.name()).toHaveValue(values.name);
    await expect(form.description()).toHaveValue(values.description);
    await expect(form.image()).toHaveValue(values.image);
    await expect(form.price()).toHaveValue(values.price);
    await expect(form.submit()).toBeEnabled();
    expect((await api.listMeals(rest.token)).filter((m) => m.name === values.name)).toHaveLength(0);
  });

  await test.step('可再次送出並成功儲存', async () => {
    await form.submit().click();
    await expect(page).toHaveURL(/\/management\/meals$/);
    expect(saveRequests).toBe(2);
    const saved = (await api.listMeals(rest.token)).filter((m) => m.name === values.name);
    expect(saved).toHaveLength(1);
    expect(saved[0].price).toBe(77);
  });
});

test('MEAL-T08 編輯頁載入餐點失敗時顯示提示而非正常空白表單', async ({ page, api }) => {
  const world = new World(api, 'MEAL-T08');
  const rest = await world.restaurant();
  const form = new MealFormPage(page);
  const meal = await world.meal(rest, { name: world.tag('Load failure '), price: 40 });

  let stub: 'http500' | 'failedBody' = 'http500';
  let putRequests = 0;
  await page.route(mealUrl(meal.id), async (route) => {
    const method = route.request().method();
    if (method === 'PUT') putRequests += 1;
    if (method !== 'GET') return route.fallback();
    if (stub === 'http500') {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'stub' }) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'failed', error: 'Meal not found' }),
      });
    }
  });

  const scenarios = [
    { name: 'HTTP 500', mode: 'http500' as const },
    { name: 'HTTP 200 且 body status:failed', mode: 'failedBody' as const },
  ];

  for (const scenario of scenarios) {
    await test.step(`餐點資料載入回應 ${scenario.name}`, async () => {
      stub = scenario.mode;
      await openManagementAs(page, rest.token, `/management/meals/${meal.id}/edit`);
      await expect(form.alert()).toContainText('無法載入餐點，請重新整理頁面。');
      await expect(page).toHaveURL(new RegExp(`/management/meals/${meal.id}/edit$`));
      // 載入失敗不是正常的新增表單，也沒有帶出原有資料。
      await expect(page.getByRole('heading', { name: '新增餐點', level: 1 })).toHaveCount(0);
      await expect(form.name()).not.toHaveValue(meal.name);
      expect(putRequests).toBe(0);
    });
  }

  await test.step('原餐點資料未被改動', async () => {
    const after = await api.listMeals(rest.token);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: meal.id, name: meal.name, price: 40 });
  });
});
