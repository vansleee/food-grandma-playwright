import type { Api, MealView } from '../../baseline/tests/support/api';

// 延伸情境：呼叫端使用 title／description／amount；v1 API 使用另一組欄位與參數。
export type MealDraft = { title: string; description: string; imageUrl: string; amount: number };
export interface MealCatalog {
  add(draft: MealDraft): Promise<MealView>;
  all(): Promise<MealView[]>;
}

export class V1MealAdapter implements MealCatalog {
  constructor(private readonly api: Api, private readonly token: string) {}

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
