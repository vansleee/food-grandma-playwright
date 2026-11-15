import { CartPage, CheckoutPage, MenuPage, RestaurantsPage } from '../ch20/page';
import { expect, test, World } from '../support/test';
import { OrderBuilder, type OrderInput } from './order-builder';

type OrderCase = {
  caseId: string;
  expectedQuantity: number;
  expectedTotal: number;
  prepareOrder(restaurantName: string, meal: { id: number; name: string }): OrderInput;
};

const directCases: OrderCase[] = [
  {
    caseId: 'CH29-T02', expectedQuantity: 1, expectedTotal: 120,
    prepareOrder: (restaurantName, meal) => ({
      restaurantName,
      mealId: meal.id,
      mealName: meal.name,
      address: '測試用配送地址',
      quantity: 1,
    }),
  },
  {
    caseId: 'CH29-T03', expectedQuantity: 2, expectedTotal: 240,
    prepareOrder: (restaurantName, meal) => ({
      restaurantName,
      mealId: meal.id,
      mealName: meal.name,
      address: '測試用配送地址',
      quantity: 2,
    }),
  },
];

const builderCases: OrderCase[] = [
  {
    caseId: 'CH29-T02', expectedQuantity: 1, expectedTotal: 120,
    prepareOrder: (restaurantName, meal) => new OrderBuilder(restaurantName, meal).withQuantity(1).build(),
  },
  {
    caseId: 'CH29-T03', expectedQuantity: 2, expectedTotal: 240,
    prepareOrder: (restaurantName, meal) => new OrderBuilder(restaurantName, meal).withQuantity(2).build(),
  },
];

function registerOrderTests(cases: OrderCase[]) {
  for (const { caseId, expectedQuantity, expectedTotal, prepareOrder } of cases) {
    test(`${caseId} 訂 ${expectedQuantity} 份雞腿便當，金額為 ${expectedTotal} 元`, async ({ page, api, restaurant }) => {
      // Arrange：準備單價 120 元的餐點，讓這個案例的顧客登入。
      const profile = await api.restaurantMe(restaurant.token);
      const meal = await api.createMeal(restaurant.token, {
        name: '香煎雞腿便當', short_description: '附白飯與三樣配菜', image: '', price: 120,
      });
      const order = prepareOrder(profile.restaurant.name, meal);
      const customerToken = await new World(api, caseId).token('customerA');
      await page.addInitScript((token) => {
        localStorage.setItem('food_alpaca_customer_token', token);
      }, customerToken);
      const restaurants = new RestaurantsPage(page);
      const menu = new MenuPage(page);
      const cart = new CartPage(page);
      const checkout = new CheckoutPage(page);
      await page.goto('/customer/restaurants');

      // Act：從網頁選餐，在購物車調整數量，再送出訂單。
      await restaurants.search(order.restaurantName);
      await restaurants.openRestaurant(order.restaurantName);
      await menu.addMealToCart(order.mealName);
      await menu.viewCart();
      const increase = page.getByRole('button', { name: `增加 ${order.mealName}`, exact: true });
      for (let quantity = 1; quantity < order.quantity; quantity++) {
        await increase.click();
      }
      await cart.goToCheckout();
      await checkout.fillAddress(order.address);
      await checkout.submitOrder();

      // Assert：配送頁面顯示正確的訂單與金額，後端也記下正確的單價與數量。
      const orders = await api.listOrders(restaurant.token);
      expect(orders).toHaveLength(1);
      const [placedOrder] = orders;
      expect(placedOrder).toMatchObject({
        status: 'Cooking',
        address: order.address,
        total: expectedTotal,
        order_details: [{
          meal: { id: order.mealId, name: order.mealName, price: 120 },
          quantity: expectedQuantity,
          sub_total: expectedTotal,
        }],
      });
      const card = page.getByTestId('delivery-card');
      await expect(card).toContainText(`訂單 #${placedOrder.id}`);
      await expect(card).toContainText(`$${expectedTotal.toFixed(2)}`);
    });
  }
}

test.describe('改寫前：直接寫訂餐資料', () => registerOrderTests(directCases));
test.describe('改寫後：用 OrderBuilder 準備訂餐資料', () => registerOrderTests(builderCases));
