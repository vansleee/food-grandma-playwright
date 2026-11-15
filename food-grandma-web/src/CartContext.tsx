import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { CartItem, Meal, Restaurant } from "./types";
interface CartData {
  restaurant: Restaurant | null;
  items: CartItem[];
}
interface CartState extends CartData {
  total: number;
  addMeal: (restaurant: Restaurant, meal: Meal) => void;
  removeMeal: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  clear: () => void;
}
const empty: CartData = { restaurant: null, items: [] };
const CartContext = createContext<CartState | null>(null);
function restore(): CartData {
  try {
    const data = JSON.parse(localStorage.getItem("food_alpaca_cart") || "null");
    if (
      data?.restaurant &&
      Number.isInteger(data.restaurant.id) &&
      Array.isArray(data.items) &&
      data.items.every(
        (i: CartItem) =>
          Number.isInteger(i.quantity) &&
          i.quantity > 0 &&
          Number.isFinite(i.meal?.price) &&
          i.meal.price >= 0 &&
          Number.isInteger(i.meal.id),
      )
    )
      return data;
  } catch {
    /* A damaged or unavailable browser store should not prevent ordering. */
  }
  return empty;
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CartData>(restore);
  useEffect(() => {
    try {
      localStorage.setItem("food_alpaca_cart", JSON.stringify(data));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [data]);
  function addMeal(restaurant: Restaurant, meal: Meal) {
    setData((current) => {
      const items =
        current.restaurant?.id === restaurant.id ? current.items : [];
      return {
        restaurant,
        items: items.some((i) => i.meal.id === meal.id)
          ? items.map((i) =>
              i.meal.id === meal.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...items, { meal, quantity: 1 }],
      };
    });
  }
  function setQuantity(id: number, quantity: number) {
    setData((current) => {
      const items = current.items
        .map((i) =>
          i.meal.id === id
            ? { ...i, quantity: Math.max(0, Math.floor(quantity)) }
            : i,
        )
        .filter((i) => i.quantity > 0);
      return { restaurant: items.length ? current.restaurant : null, items };
    });
  }
  return (
    <CartContext.Provider
      value={{
        ...data,
        total: data.items.reduce(
          (sum, i) => sum + i.meal.price * i.quantity,
          0,
        ),
        addMeal,
        setQuantity,
        removeMeal: (id) => setQuantity(id, 0),
        clear: () => setData(empty),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
