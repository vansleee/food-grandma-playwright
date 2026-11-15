import type { MealInput, MealView } from '../../baseline/tests/support/api';
import type { MealsRepository } from './meals-repository';

export class InMemoryMealsRepository implements MealsRepository {
  private readonly meals = new Map<number, MealView>();
  private nextId = 1;

  async add(input: MealInput): Promise<MealView> {
    const meal = { id: this.nextId++, name: input.name, short_description: input.short_description ?? '',
      image: input.image ?? '', price: input.price ?? 0 };
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
