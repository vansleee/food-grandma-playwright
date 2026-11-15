import type { Page } from '@playwright/test';
import { CartPage, CheckoutPage, MenuPage, RestaurantsPage } from './page';

export type OrderInput = { restaurantName: string; mealId: number; mealName: string; address: string; total: number; driverId: number };

export class CustomerOrderingWorkflow {
  private readonly restaurants: RestaurantsPage;
  private readonly menu: MenuPage;
  private readonly cart: CartPage;
  private readonly checkout: CheckoutPage;
  constructor(page: Page) {
    this.restaurants = new RestaurantsPage(page);
    this.menu = new MenuPage(page);
    this.cart = new CartPage(page);
    this.checkout = new CheckoutPage(page);
  }
  async placeOrder(order: OrderInput) {
    await this.restaurants.search(order.restaurantName);
    await this.restaurants.openRestaurant(order.restaurantName);
    await this.menu.addMealToCart(order.mealName);
    await this.menu.viewCart();
    await this.cart.goToCheckout();
    await this.checkout.fillAddress(order.address);
    await this.checkout.submitOrder();
  }
}
