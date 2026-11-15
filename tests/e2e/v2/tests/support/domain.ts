/** 後端狀態值與畫面文字的對照（FIND 規格「技術契約」）。 */
export type OrderStatus = 'Cooking' | 'Ready' | 'On the way' | 'Delivered';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  Cooking: '備餐中',
  Ready: '待取餐',
  'On the way': '配送中',
  Delivered: '已送達',
};

export const ALL_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export type ApiOrder = {
  id: number;
  customer: { id: number; name: string; address: string };
  driver: { id: number; name: string } | null;
  total: number;
  status: OrderStatus;
  address: string;
};

export type ApiMeal = {
  id: number;
  name: string;
  short_description: string;
  image: string;
  price: number;
};

export type MealDraft = Pick<ApiMeal, 'name' | 'short_description' | 'image' | 'price'>;

export type ProfilePayload = {
  first_name: string;
  last_name: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  logo: string;
};

export type RestaurantProfile = {
  restaurant: { id: number; name: string; phone: string; address: string; logo: string };
  user: { username: string; first_name: string; last_name: string; email: string };
};

export const TOKEN_KEYS = {
  restaurant: 'food_grandma_restaurant_token',
  driver: 'food_alpaca_driver_token',
} as const;

/** FIND-02：原始數字 ID、顧客姓名或送達地址；忽略大小寫、去除查詢前後空白、包含比對。 */
export function matchesOrderSearch(order: ApiOrder, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return `${order.id} ${order.customer.name} ${order.address}`.toLowerCase().includes(needle);
}

/** 管理站與外送員頁面都以四位補零顯示訂單編號。 */
export const displayOrderNumber = (id: number) => `#${String(id).padStart(4, '0')}`;
