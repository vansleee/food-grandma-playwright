import type { APIRequestContext } from '@playwright/test';
import type { Api, MealInput, MealView } from '../support/api';
import { API_BASE_URL } from '../support/env';
import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test, World } from '../support/test';


test.describe('未使用本章模式', () => {
  test('CH32-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = { name: `${caseId} meal ${info.repeatEachIndex + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
    const original = await api.createMeal(restaurant.token, input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await form.price().fill(String(150));
    await form.submit().click();

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 150);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(150));
  });

  test('CH32-T02 建立後可以依編號查詢餐點', async ({ api, request, caseId }, info) => {
    // Arrange：準備相同餐點欄位。
    const restaurant = await new World(api, caseId).restaurant();
    const input = { name: 'Repository meal', short_description: 'Original description', price: 100 };

    // Act：新增後依編號查詢。
    const original = await api.createMeal(restaurant.token, input);
    const found = (await api.listMeals(restaurant.token)).find((meal) => meal.id === original.id);

    // Assert：可以查到剛建立的同一筆餐點。
    expect(found).toMatchObject({ ...input, id: original.id });
  });

  test('CH32-T03 更新原餐點而不新增資料', async ({ api, request, caseId }, info) => {
    // Arrange：建立價格 100 的餐點。
    const restaurant = await new World(api, caseId).restaurant();
    const input = { name: 'Price contract', price: 100 };
    const original = await api.createMeal(restaurant.token, input);

    // Act：更新該編號的價格。
    const response = await request.put(`${API_BASE_URL}/api/restaurant/meals/${original.id}`, {
      headers: { Authorization: `Bearer ${restaurant.token}` }, data: { ...original, price: 150 },
    });
    expect(response.status()).toBe(200);
    const updated = (await response.json()).meal;

    // Assert：只更新價格，不新增餐點。
    expect(updated).toEqual({ ...original, price: 150 });
    expect(await api.listMeals(restaurant.token)).toEqual([updated]);
  });
});

test.describe('v1', () => {
  test('CH32-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = { name: `${caseId} meal ${info.repeatEachIndex + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
    const original = await api.createMeal(restaurant.token, input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await form.price().fill(String(150));
    await form.submit().click();

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 150);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(150));
  });

  test('CH32-T02 建立後可以依編號查詢餐點', async ({ api, request, caseId }, info) => {
    // Arrange：準備相同餐點欄位。
    const restaurant = await new World(api, caseId).restaurant();
    const input = { name: 'Repository meal', short_description: 'Original description', price: 100 };

    // Act：新增後依編號查詢。
    const original = await api.createMeal(restaurant.token, input);
    const found = (await api.listMeals(restaurant.token)).find((meal) => meal.id === original.id);

    // Assert：可以查到剛建立的同一筆餐點。
    expect(found).toMatchObject({ ...input, id: original.id });
  });

  test('CH32-T03 更新原餐點而不新增資料', async ({ api, request, caseId }, info) => {
    // Arrange：建立價格 100 的餐點。
    const restaurant = await new World(api, caseId).restaurant();
    const input = { name: 'Price contract', price: 100 };
    const original = await api.createMeal(restaurant.token, input);

    // Act：更新該編號的價格。
    const response = await request.put(`${API_BASE_URL}/api/restaurant/meals/${original.id}`, {
      headers: { Authorization: `Bearer ${restaurant.token}` }, data: { ...original, price: 150 },
    });
    expect(response.status()).toBe(200);
    const updated = (await response.json()).meal;

    // Assert：只更新價格，不新增餐點。
    expect(updated).toEqual({ ...original, price: 150 });
    expect(await api.listMeals(restaurant.token)).toEqual([updated]);
  });
});

test.describe('v2', () => {
  interface MealsRepository {
    add(input: MealInput): Promise<MealView>;
    all(): Promise<MealView[]>;
    find(id: number): Promise<MealView | undefined>;
    changePrice(id: number, price: number): Promise<MealView | undefined>;
  }

  class ApiMealsRepository implements MealsRepository {
    constructor(private readonly api: Api, private readonly request: APIRequestContext, private readonly token: string) { }

    add(input: MealInput) {
      return this.api.createMeal(this.token, input);
    }

    all() {
      return this.api.listMeals(this.token);
    }

    async find(id: number) {
      return (await this.all()).find((meal) => meal.id === id);
    }
    async changePrice(id: number, price: number) {
      const original = await this.find(id);
      if (!original) return undefined;
      const response = await this.request.put(`${API_BASE_URL}/api/restaurant/meals/${id}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        data: { name: original.name, short_description: original.short_description, image: original.image, price },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.meal).toBeDefined();
      return body.meal as MealView;
    }
  }

  async function prepareMealForEditing(repository: MealsRepository, input: MealInput) {
    const original = await repository.add(input);
    const idsBefore = (await repository.all()).map((meal) => meal.id).sort((a, b) => a - b);
    return { original, idsBefore };
  }

  class InMemoryMealsRepository implements MealsRepository {
    private readonly meals = new Map<number, MealView>();
    private nextId = 1;

    async add(input: MealInput): Promise<MealView> {
      const meal = {
        id: this.nextId++, name: input.name, short_description: input.short_description ?? '',
        image: input.image ?? '', price: input.price ?? 0
      };
      this.meals.set(meal.id, meal);
      return { ...meal };
    }

    async all() {
      return [...this.meals.values()].map((meal) => ({ ...meal }));
    }

    async find(id: number) {
      const meal = this.meals.get(id);
      return meal ? { ...meal } : undefined;
    }

    async changePrice(id: number, price: number) {
      const original = this.meals.get(id);
      if (!original) return undefined;
      const updated = { ...original, price };
      this.meals.set(id, updated);
      return { ...updated };
    }
  }
  test('CH32-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const input = { name: `${caseId} meal ${info.repeatEachIndex + 1}`, short_description: `${caseId} original description`, image: '', price: 100 };
    const repository = new ApiMealsRepository(api, request, restaurant.token);
    const original = await repository.add(input);
    const idsBefore = (await api.listMeals(restaurant.token)).map((meal) => meal.id).sort((a, b) => a - b);
    const meals = new MealsPage(page);
    const form = new MealFormPage(page);
    await openManagementAs(page, restaurant.token, '/management/meals');
    await meals.waitUntilLoaded();
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.name()).toHaveValue(original.name);
    await expect(form.description()).toHaveValue(original.short_description);
    await expect(form.price()).toHaveValue('100');

    // Act：在網頁修改價格並儲存。
    await form.price().fill(String(150));
    await form.submit().click();

    // Assert：更新原餐點、不重複新增，重新開啟後仍為新價格。
    await expect(page).toHaveURL(/\/management\/meals$/);
    await expect(meals.row(original.id)).toContainText('$' + 150);
    await expectStoredMeal(api, restaurant.token, original, idsBefore, 150);
    await meals.row(original.id).getByTestId('meal-edit-link').click();
    await expect(form.price()).toHaveValue(String(150));
  });

  test('CH32-T02 建立後可以依編號查詢餐點', async ({ api, request, caseId }, info) => {
    // Arrange：準備相同餐點欄位。
    const restaurant = await new World(api, caseId).restaurant();
    const repository = new ApiMealsRepository(api, request, restaurant.token);
    const input = { name: 'Repository meal', short_description: 'Original description', price: 100 };

    // Act：新增後依編號查詢。
    const original = await repository.add(input);
    const found = await repository.find(original.id);

    // Assert：可以查到剛建立的同一筆餐點。
    expect(found).toMatchObject({ ...input, id: original.id });
  });

  test('CH32-T03 更新原餐點而不新增資料', async ({ api, request, caseId }, info) => {
    // Arrange：建立價格 100 的餐點。
    const restaurant = await new World(api, caseId).restaurant();
    const repository = new ApiMealsRepository(api, request, restaurant.token);
    const input = { name: 'Price contract', price: 100 };
    const original = await repository.add(input);

    // Act：更新該編號的價格。
    const updated = await repository.changePrice(original.id, 150);

    // Assert：只更新價格，不新增餐點。
    expect(updated).toEqual({ ...original, price: 150 });
    expect(await repository.all()).toEqual([updated]);
  });

  test('CH32-T02 Fake 補充：相同資料存取行為', async ({ }, info) => {
    // Arrange：使用本次測試獨立的記憶體資料。
    const repository = new InMemoryMealsRepository();

    // Act：執行相同的資料存取步驟。
    const original = await repository.add({ name: 'Repository meal', short_description: 'Original description', price: 100 });
    const found = await repository.find(original.id);

    // Assert：可查到同一筆資料。
    expect(found).toEqual(original);
  });

  test('CH32-T03 Fake 補充：相同資料存取行為', async ({ }, info) => {
    // Arrange：使用本次測試獨立的記憶體資料。
    const repository = new InMemoryMealsRepository();

    // Act：執行相同的資料存取步驟。
    const original = await repository.add({ name: 'Price contract', price: 100 });
    const updated = await repository.changePrice(original.id, 150);

    // Assert：只改價格，不增加資料。
    expect(updated).toEqual({ ...original, price: 150 });
    expect(await repository.all()).toEqual([updated]);
  });
});
