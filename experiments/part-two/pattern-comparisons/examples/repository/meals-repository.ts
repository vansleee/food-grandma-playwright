import { expect, type APIRequestContext } from '@playwright/test';
import type { Api, MealInput, MealView } from '../../baseline/tests/support/api';
import { API_BASE_URL } from '../../baseline/tests/support/env';

export interface MealsRepository {
  add(input: MealInput): Promise<MealView>;
  all(): Promise<MealView[]>;
  find(id: number): Promise<MealView | undefined>;
  changePrice(id: number, price: number): Promise<MealView | undefined>;
}

export class ApiMealsRepository implements MealsRepository {
  constructor(private readonly api: Api, private readonly request: APIRequestContext, private readonly token: string) {}

  add(input: MealInput) {
    return this.api.createMeal(this.token, input);
  }

  all() {
    return this.api.listMeals(this.token);
  }

  async find(id: number) {
    return (await this.all()).find((meal) => meal.id === id);
  }

  // 僅供資料存取契約測試使用；E2E 案例仍從網頁修改價格。
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

export async function prepareMealForEditing(repository: MealsRepository, input: MealInput) {
  const original = await repository.add(input);
  const idsBefore = (await repository.all()).map((meal) => meal.id).sort((a, b) => a - b);
  return { original, idsBefore };
}
