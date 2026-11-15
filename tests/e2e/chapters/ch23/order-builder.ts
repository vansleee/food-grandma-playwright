export type OrderInput = {
  restaurantName: string;
  mealId: number;
  mealName: string;
  address: string;
  quantity: number;
};

export class OrderBuilder {
  private readonly order: OrderInput;

  constructor(restaurantName: string, meal: { id: number; name: string }) {
    this.order = {
      restaurantName,
      mealId: meal.id,
      mealName: meal.name,
      address: '測試用配送地址',
      quantity: 1,
    };
  }

  withQuantity(quantity: number): this {
    this.order.quantity = quantity;
    return this;
  }

  build(): OrderInput {
    return { ...this.order };
  }
}
