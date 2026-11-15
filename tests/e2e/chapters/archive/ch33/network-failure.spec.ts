import type { Page, Route } from '@playwright/test';
import { MealFormPage, openManagementAs } from '../../support/pages';
import { expect, test } from '../../support/test';

test.describe('未封裝網路攔截', () => {
  test('CH33-T01 儲存失敗保留輸入，重試後真正保存', async ({ page, api, restaurant, caseId }, info) => {
    // Arrange：準備表單，讓第一次儲存保持等待後回傳 500。
    let count = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/api/restaurant/meals/', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      count += 1;
      if (count === 1) {
        await gate;
        await route.fulfill({ status: 500, json: { detail: 'Internal Server Error' } });
      } else await route.continue();
    });
    const values = { name: `${caseId} meal`, description: 'Keep this input', image: '', price: '77' };
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals/add');
    await form.fill(values);
    try {
      // Act：送出第一次儲存。
      await form.submit().click();
      await expect.poll(() => count).toBe(1);

      // Assert：等待期間不能再次送出。
      await expect(form.submit()).toBeDisabled();

      // Act：讓伺服器錯誤回應送回網頁。
      release();

      // Assert：留在表單、保留輸入，資料尚未新增。
      await expect(form.alert()).toContainText('餐點儲存失敗，請稍後重試。');
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.name()).toHaveValue(values.name);
      await expect(form.description()).toHaveValue(values.description);
      await expect(form.image()).toHaveValue(values.image);
      await expect(form.price()).toHaveValue(values.price);
      await expect(form.submit()).toBeEnabled();
      expect(await api.listMeals(restaurant.token)).toHaveLength(0);

      // Act：第二次儲存交給真實後端。

      await form.submit().click();

      // Assert：只新增一筆餐點，輸入資料正確保存。
      await expect(page).toHaveURL(/\/management\/meals$/);
      const stored = await api.listMeals(restaurant.token);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ name: values.name, short_description: values.description, image: '', price: 77 });
      expect(count).toBe(2);
      await expect(page.locator(`[data-testid="meal-row"][data-meal-id="${stored[0].id}"]`)).toContainText('$77');
    } finally { release(); }
  });
});

test.describe('v1', () => {
  test('CH33-T01 儲存失敗保留輸入，重試後真正保存', async ({ page, api, restaurant, caseId }, info) => {
    // Arrange：準備表單，讓第一次儲存保持等待後回傳 500。
    let count = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route('**/api/restaurant/meals/', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      count += 1;
      if (count === 1) {
        await gate;
        await route.fulfill({ status: 500, json: { detail: 'Internal Server Error' } });
      } else await route.continue();
    });
    const values = { name: `${caseId} meal`, description: 'Keep this input', image: '', price: '77' };
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals/add');
    await form.fill(values);
    try {
      // Act：送出第一次儲存。
      await form.submit().click();
      await expect.poll(() => count).toBe(1);

      // Assert：等待期間不能再次送出。
      await expect(form.submit()).toBeDisabled();

      // Act：讓伺服器錯誤回應送回網頁。
      release();

      // Assert：留在表單、保留輸入，資料尚未新增。
      await expect(form.alert()).toContainText('餐點儲存失敗，請稍後重試。');
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.name()).toHaveValue(values.name);
      await expect(form.description()).toHaveValue(values.description);
      await expect(form.image()).toHaveValue(values.image);
      await expect(form.price()).toHaveValue(values.price);
      await expect(form.submit()).toBeEnabled();
      expect(await api.listMeals(restaurant.token)).toHaveLength(0);

      // Act：第二次儲存交給真實後端。

      await form.submit().click();

      // Assert：只新增一筆餐點，輸入資料正確保存。
      await expect(page).toHaveURL(/\/management\/meals$/);
      const stored = await api.listMeals(restaurant.token);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ name: values.name, short_description: values.description, image: '', price: 77 });
      expect(count).toBe(2);
      await expect(page.locator(`[data-testid="meal-row"][data-meal-id="${stored[0].id}"]`)).toContainText('$77');
    } finally { release(); }
  });
});

test.describe('v2', () => {
  class Gate {
    private release!: () => void;
    readonly opened = new Promise<void>((resolve) => (this.release = resolve));
    open() {
      this.release();
    }
  }

  type Reply =
    | { kind: 'continue' } // 交給真實後端
    | { kind: 'fulfill'; status: number; json: unknown }; // Stub 回應

  const serverError: Reply = {
    kind: 'fulfill',
    status: 500,
    json: { detail: 'Internal Server Error' },
  };


  const failedBody = (error: string): Reply => ({
    kind: 'fulfill',
    status: 200,
    json: { status: 'failed', error },
  });

  type Rule = { reply: Reply; hold?: Gate };


  class RequestStub {
    private rule: Rule = { reply: { kind: 'continue' } };
    private seen = 0;

    private constructor() { }

    static async install(page: Page, url: string | RegExp, method: string): Promise<RequestStub> {
      const stub = new RequestStub();
      await page.route(url, (route) => stub.handle(route, method));
      return stub;
    }

    get count() {
      return this.seen;
    }


    respondWith(reply: Reply, hold?: Gate): this {
      this.rule = { reply, hold };
      return this;
    }

    passThrough(): this {
      return this.respondWith({ kind: 'continue' });
    }

    private async handle(route: Route, method: string) {
      if (route.request().method() !== method) {
        await route.fallback();
        return;
      }
      this.seen += 1;
      const { reply, hold } = this.rule;
      if (hold) await hold.opened;
      if (reply.kind === 'continue') await route.continue();
      else await route.fulfill({ status: reply.status, json: reply.json });
    }
  }
  test('CH33-T01 儲存失敗保留輸入，重試後真正保存', async ({ page, api, restaurant, caseId }, info) => {
    // Arrange：準備表單，讓第一次儲存保持等待後回傳 500。
    const save = await RequestStub.install(page, '**/api/restaurant/meals/', 'POST');
    const gate = new Gate();
    save.respondWith(serverError, gate);
    const values = { name: `${caseId} meal`, description: 'Keep this input', image: '', price: '77' };
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals/add');
    await form.fill(values);
    try {
      // Act：送出第一次儲存。
      await form.submit().click();
      await expect.poll(() => save.count).toBe(1);

      // Assert：等待期間不能再次送出。
      await expect(form.submit()).toBeDisabled();

      // Act：讓伺服器錯誤回應送回網頁。
      gate.open();

      // Assert：留在表單、保留輸入，資料尚未新增。
      await expect(form.alert()).toContainText('餐點儲存失敗，請稍後重試。');
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.name()).toHaveValue(values.name);
      await expect(form.description()).toHaveValue(values.description);
      await expect(form.image()).toHaveValue(values.image);
      await expect(form.price()).toHaveValue(values.price);
      await expect(form.submit()).toBeEnabled();
      expect(await api.listMeals(restaurant.token)).toHaveLength(0);

      // Act：第二次儲存交給真實後端。
      save.passThrough();
      await form.submit().click();

      // Assert：只新增一筆餐點，輸入資料正確保存。
      await expect(page).toHaveURL(/\/management\/meals$/);
      const stored = await api.listMeals(restaurant.token);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({ name: values.name, short_description: values.description, image: '', price: 77 });
      expect(save.count).toBe(2);
      await expect(page.locator(`[data-testid="meal-row"][data-meal-id="${stored[0].id}"]`)).toContainText('$77');
    } finally { gate.open(); }
  });
});
