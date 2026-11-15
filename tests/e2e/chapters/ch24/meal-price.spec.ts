import type { APIRequestContext } from '@playwright/test';
import type { Api, MealView } from '../support/api';
import { API_BASE_URL } from '../support/env';
import { expectStoredMeal } from '../support/meal-assertions';
import { MealFormPage, MealsPage, openManagementAs } from '../support/pages';
import { expect, test, World } from '../support/test';


test.describe('未使用本章模式', () => {
  test('CH31-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const draft = { title: `${caseId} meal ${info.repeatEachIndex + 1}`, description: `${caseId} original description`, imageUrl: '', amount: 100 };
    const input = { name: draft.title, short_description: draft.description, image: draft.imageUrl, price: draft.amount };
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

  test('CH31-T02 使用餐廳與外送員的認證查詢資料', async ({ api, request, caseId }, info) => {
    // Arrange：取得餐廳與外送員的測試帳號。
    const world = new World(api, caseId);
    const restaurant = await world.restaurant();
    const driverToken = await world.token('driverA');

    // Act：依角色的認證方式查詢個人資料。
    const restaurantResponse = await request.get(`${API_BASE_URL}/api/restaurant/me/`, { headers: { Authorization: `Bearer ${restaurant.token}` } });
    const driverResponse = await request.get(`${API_BASE_URL}/api/driver/me/`, { params: { access_token: driverToken } });

    // Assert：兩個端點都回傳正確角色的資料。
    expect(restaurantResponse.status()).toBe(200);
    expect((await restaurantResponse.json()).restaurant.id).toBe(restaurant.id);
    expect(driverResponse.status()).toBe(200);
    expect((await driverResponse.json()).driver.id).toBeGreaterThan(0);
  });
});

test.describe('v1', () => {
  test('CH31-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const draft = { title: `${caseId} meal ${info.repeatEachIndex + 1}`, description: `${caseId} original description`, imageUrl: '', amount: 100 };
    const input = { name: draft.title, short_description: draft.description, image: draft.imageUrl, price: draft.amount };
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

  test('CH31-T02 使用餐廳與外送員的認證查詢資料', async ({ api, request, caseId }, info) => {
    // Arrange：取得餐廳與外送員的測試帳號。
    const world = new World(api, caseId);
    const restaurant = await world.restaurant();
    const driverToken = await world.token('driverA');

    // Act：依角色的認證方式查詢個人資料。
    const restaurantProfile = await api.restaurantMe(restaurant.token);
    const driver = await api.driverProfile(driverToken);

    // Assert：兩個端點都回傳正確角色的資料。
    expect(restaurantProfile.restaurant.id).toBe(restaurant.id);
    expect(driver.id).toBeGreaterThan(0);
  });
});

test.describe('v2（含 Adapter 教學延伸）', () => {
  interface AuthStrategy {
    headers(): Record<string, string>;
    params(): Record<string, string>;
  }

  class BearerAuth implements AuthStrategy {
    constructor(private readonly token: string) { }
    headers() { return { Authorization: `Bearer ${this.token}` }; }
    params() { return {}; }
  }

  class AccessTokenAuth implements AuthStrategy {
    constructor(private readonly token: string) { }
    headers() { return {}; }
    params() { return { access_token: this.token }; }
  }

  class RoleClient {
    constructor(private readonly request: APIRequestContext, private readonly auth: AuthStrategy) { }
    get(path: string) {
      return this.request.get(`${API_BASE_URL}${path}`, { headers: this.auth.headers(), params: this.auth.params() });
    }
  }
  type MealDraft = { title: string; description: string; imageUrl: string; amount: number };
  interface MealCatalog {
    add(draft: MealDraft): Promise<MealView>;
    all(): Promise<MealView[]>;
  }

  class V1MealAdapter implements MealCatalog {
    constructor(private readonly api: Api, private readonly token: string) { }

    add(draft: MealDraft) {
      return this.api.createMeal(this.token, {
        name: draft.title,
        short_description: draft.description,
        image: draft.imageUrl,
        price: draft.amount,
      });
    }

    all() {
      return this.api.listMeals(this.token);
    }
  }
  test('CH31-T01 將原價格 100 修改為 150，保留原餐點及其他資料', async ({ page, api, restaurant, caseId, request }, info) => {
    // Arrange：準備本次餐點，開啟編輯頁面並確認原有資料。
    const draft = { title: `${caseId} meal ${info.repeatEachIndex + 1}`, description: `${caseId} original description`, imageUrl: '', amount: 100 };
    const catalog = new V1MealAdapter(api, restaurant.token);
    const original = await catalog.add(draft);
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

  test('CH31-T02 使用餐廳與外送員的認證查詢資料', async ({ api, request, caseId }, info) => {
    // Arrange：取得餐廳與外送員的測試帳號。
    const world = new World(api, caseId);
    const restaurant = await world.restaurant();
    const driverToken = await world.token('driverA');
    const restaurantClient = new RoleClient(request, new BearerAuth(restaurant.token));
    const driverClient = new RoleClient(request, new AccessTokenAuth(driverToken));

    // Act：依角色的認證方式查詢個人資料。
    const restaurantResponse = await restaurantClient.get('/api/restaurant/me/');
    const driverResponse = await driverClient.get('/api/driver/me/');

    // Assert：兩個端點都回傳正確角色的資料。
    expect(restaurantResponse.status()).toBe(200);
    expect((await restaurantResponse.json()).restaurant.id).toBe(restaurant.id);
    expect(driverResponse.status()).toBe(200);
    expect((await driverResponse.json()).driver.id).toBeGreaterThan(0);
  });
});
