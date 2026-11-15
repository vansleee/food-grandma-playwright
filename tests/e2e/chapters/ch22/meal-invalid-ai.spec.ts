import type { Request } from '@playwright/test';
import { MealFormPage, MealsPage, openManagementAs, type MealFormValues } from '../support/pages';
import { expect, test } from '../support/test';

type InvalidMealCase = {
  caseId: string;
  title: string;
  values: Required<Pick<MealFormValues, 'name' | 'price'>>;
  field: 'name' | 'price';
  failure: 'valueMissing' | 'rangeUnderflow' | 'stepMismatch';
};

const cases: InvalidMealCase[] = [
  { caseId: 'CH28-T05', title: '名稱留空', values: { name: '', price: '120' }, field: 'name', failure: 'valueMissing' },
  { caseId: 'CH28-T06', title: '價格輸入負數 -1', values: { name: '負價格便當', price: '-1' }, field: 'price', failure: 'rangeUnderflow' },
  { caseId: 'CH28-T07', title: '價格輸入小數 12.5', values: { name: '小數價格便當', price: '12.5' }, field: 'price', failure: 'stepMismatch' },
];

const isCreateMealRequest = (request: Request) =>
  request.method() === 'POST' && new URL(request.url()).pathname.startsWith('/api/restaurant/meals');

test.describe('練習：用資料表宣告無效餐點測試', () => {
  for (const row of cases) {
    test(`${row.caseId} [MEAL-T03] ${row.title}，表單擋下送出`, async ({ page, api, restaurant }) => {
      // Arrange：開啟新增餐點表單，記錄目前餐點數量並監聽新增請求。
      const meals = new MealsPage(page);
      const form = new MealFormPage(page);
      const countBefore = (await api.listMeals(restaurant.token)).length;
      await openManagementAs(page, restaurant.token, '/management/meals');
      await meals.waitUntilLoaded();
      await meals.addLink().click();
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      const createRequests: Request[] = [];
      page.on('request', (request) => {
        if (isCreateMealRequest(request)) createRequests.push(request);
      });

      // Act：填入本列資料並按下儲存。
      await form.fill({ name: row.values.name, description: '', image: '', price: row.values.price });
      await form.submit().click();

      // Assert：瀏覽器驗證不通過，留在表單，沒有送出請求也沒有新增餐點。
      const input = row.field === 'name' ? form.name() : form.price();
      expect(await form.validity(input)).toMatchObject({ valid: false, [row.failure]: true });
      await expect(page).toHaveURL(/\/management\/meals\/add$/);
      await expect(form.submit()).toBeEnabled();
      expect(createRequests).toHaveLength(0);
      expect(await api.listMeals(restaurant.token)).toHaveLength(countBefore);
    });
  }
});
