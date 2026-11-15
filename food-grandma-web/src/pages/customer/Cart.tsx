import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../CartContext";

export default function Cart() {
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <div className="screen">
      <Link to="/customer/restaurants" className="back-link">
        ← 繼續探索餐廳
      </Link>
      <h1>你的購物車</h1>
      {cart.restaurant && (
        <p className="card-subtitle">{cart.restaurant.name}</p>
      )}

      {cart.items.length === 0 && (
        <p data-testid="cart-empty">購物車還是空的，先去挑選喜歡的餐點吧。</p>
      )}

      <ul className="card-list" data-testid="cart-list">
        {cart.items.map((item) => (
          <li
            key={item.meal.id}
            className="card cart-row"
            data-testid="cart-row"
          >
            <div>
              <div className="card-title">{item.meal.name}</div>
              <div className="card-subtitle">
                {item.quantity} × ${item.meal.price.toFixed(2)}
              </div>
            </div>
            <div className="quantity-control">
              <button
                aria-label={`減少 ${item.meal.name}`}
                onClick={() =>
                  cart.setQuantity(item.meal.id, item.quantity - 1)
                }
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                aria-label={`增加 ${item.meal.name}`}
                onClick={() =>
                  cart.setQuantity(item.meal.id, item.quantity + 1)
                }
              >
                +
              </button>
            </div>
            <button
              className="btn btn-small btn-danger"
              data-testid="remove-from-cart"
              onClick={() => cart.removeMeal(item.meal.id)}
            >
              移除
            </button>
          </li>
        ))}
      </ul>

      {cart.items.length > 0 && (
        <>
          <div className="cart-total" data-testid="cart-total">
            餐點合計：${cart.total.toFixed(2)}
          </div>
          <button
            className="btn btn-primary"
            data-testid="go-to-checkout"
            onClick={() => navigate("/customer/checkout")}
          >
            前往結帳
          </button>
        </>
      )}
    </div>
  );
}
