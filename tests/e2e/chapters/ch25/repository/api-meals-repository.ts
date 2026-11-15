import type { Api, MealInput, MealView } from '../../support/api';

export class ApiMealsRepository {
  constructor(
    private readonly api: Api,
    private readonly token: string,
  ) {}

  add(input: MealInput): Promise<MealView> {
    return this.api.createMeal(this.token, input);
  }

  async find(id: number): Promise<MealView | undefined> {
    const meals = await this.api.listMeals(this.token);
    return meals.find((meal) => meal.id === id);
  }
}
