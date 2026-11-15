import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../../api";
import { useCart } from "../../CartContext";
import { Meal, Restaurant } from "../../types";

export default function Meals() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const cart = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);
    setMeals(null);
    setRestaurant(null);
    setNotice("");
    Promise.all([
      apiGet<{ restaurants: Restaurant[] }>("/api/customer/restaurants/"),
      apiGet<{ meals: Meal[] }>(`/api/customer/meals/${restaurantId}`),
    ])
      .then(([data, menu]) => {
        if (!active) return;
        const found = data.restaurants.find(
          (r) => String(r.id) === restaurantId,
        );
        if (!found) {
          setError("找不到這間餐廳，請返回餐廳列表重新選擇。");
          return;
        }
        setRestaurant(found);
        setMeals(menu.meals);
      })
      .catch(() => {
        if (active) setError("無法載入菜單，請稍後重試。");
      });
    return () => {
      active = false;
    };
  }, [restaurantId]);

  function handleAdd(meal: Meal) {
    if (!restaurant) return;
    if (
      cart.restaurant &&
      cart.restaurant.id !== restaurant.id &&
      cart.items.length &&
      !window.confirm(
        "購物車已有其他餐廳的餐點。要清空並加入這間餐廳的餐點嗎？",
      )
    )
      return;
    cart.addMeal(restaurant, meal);
    setNotice(`已加入 ${meal.name}`);
  }

  return (
    <div className="screen">
      <Link to="/customer/restaurants" className="back-link">
        ← 返回餐廳
      </Link>
      <span className="eyebrow">FRESHLY MADE FOR YOU</span>
      <h1>{restaurant?.name ?? "餐廳菜單"}</h1>
      <p className="subtitle">{restaurant?.address}</p>
      <p role="status">{notice}</p>
      {error && (
        <div className="alert" data-testid="meals-error">
          {error}
        </div>
      )}
      {!meals && !error && <p role="status">正在準備菜單…</p>}
      {meals?.length === 0 && (
        <div className="empty-state">餐點準備中，請稍後再回來看看。</div>
      )}
      <ul className="card-list meal-grid" data-testid="meal-list">
        {meals?.map((meal) => (
          <li key={meal.id} className="card" data-testid="meal-card">
            <div className="meal-art">
              {meal.image ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={meal.image}
                  alt={`${meal.name} 類型示意照片`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="photo-placeholder">餐點照片準備中</span>
              )}
            </div>
            <div className="card-title">{meal.name}</div>
            <div className="card-subtitle">{meal.short_description}</div>
            <div className="card-price">${meal.price.toFixed(2)}</div>
            <button
              className="btn btn-primary btn-small"
              data-testid="add-to-cart"
              onClick={() => handleAdd(meal)}
            >
              ＋ 加入購物車
            </button>
          </li>
        ))}
      </ul>

      {cart.items.length > 0 && (
        <button
          className="btn btn-primary cart-fab"
          data-testid="view-cart"
          onClick={() => navigate("/customer/cart")}
        >
          查看購物車 ({cart.items.reduce((sum, i) => sum + i.quantity, 0)}) — $
          {cart.total.toFixed(2)}
        </button>
      )}
    </div>
  );
}
