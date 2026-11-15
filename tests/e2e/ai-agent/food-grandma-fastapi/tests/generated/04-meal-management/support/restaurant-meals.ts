import { expect, type APIRequestContext } from "@playwright/test";

// Shape of the meal returned by food-grandma-fastapi /api/restaurant/meals/.
export type Meal = {
  id: number;
  name: string;
  short_description: string;
  image: string;
  price: number;
};

export type MealInput = Omit<Meal, "id">;

// Repository over the signed-in restaurant's meals. The wrapped context already
// carries the restaurant's Bearer token, so callers never handle auth.
export class RestaurantMeals {
  constructor(private readonly api: APIRequestContext) {}

  async list(): Promise<Meal[]> {
    const resp = await this.api.get("/api/restaurant/meals/");
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).not.toBe("failed");
    expect(Array.isArray(body.meals)).toBe(true);
    return body.meals;
  }

  async create(input: MealInput): Promise<Meal> {
    const resp = await this.api.post("/api/restaurant/meals/", { data: input });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    // HTTP 200 does not imply business success: check the envelope.
    expect(body.status).not.toBe("failed");
    expect(body.meal).toBeDefined();
    return body.meal;
  }

  async get(id: number): Promise<Meal> {
    const resp = await this.api.get(`/api/restaurant/meals/${id}`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).not.toBe("failed");
    expect(body.meal).toBeDefined();
    return body.meal;
  }

  async ids(): Promise<number[]> {
    return (await this.list()).map((m) => m.id);
  }
}
