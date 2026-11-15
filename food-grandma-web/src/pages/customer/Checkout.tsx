import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { apiPostForm, getCustomerToken } from "../../api";
import { useCart } from "../../CartContext";

export default function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState("網站示範地址（非真實配送地址）");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (cart.items.length === 0 || !cart.restaurant) {
    return <Navigate to="/customer/cart" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!address.trim()) {
      setError("請輸入配送地址。");
      return;
    }
    setError(null);
    setSubmitting(true);

    const token = getCustomerToken();
    if (!token) {
      setError("請先選擇顧客體驗身分，再回來完成訂單。");
      setSubmitting(false);
      return;
    }

    const orderDetails = cart.items.map((item) => ({
      meal_id: item.meal.id,
      quantity: item.quantity,
    }));

    try {
      const result = await apiPostForm<{ status: string; error?: string }>(
        "/api/customer/orders/",
        {
          access_token: token,
          restaurant_id: String(cart.restaurant!.id),
          address: address.trim(),
          order_details: JSON.stringify(orderDetails),
        },
      );

      if (result.status !== "success") {
        setError(result.error ?? "訂單送出失敗，請稍後重試。");
        setSubmitting(false);
        return;
      }

      cart.clear();
      navigate("/customer/delivery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "訂單送出失敗，請稍後重試。");
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <h1>確認訂單</h1>
      <div className="cart-total" data-testid="checkout-total">
        餐點合計：${cart.total.toFixed(2)}
      </div>

      {error && (
        <div className="alert" data-testid="checkout-error">
          {error}{" "}
          {!getCustomerToken() && <Link to="/account">前往體驗登入</Link>}
        </div>
      )}

      <div className="card">
        <h2>{cart.restaurant.name}</h2>
        {cart.items.map((item) => (
          <p key={item.meal.id}>
            {item.meal.name} × {item.quantity}{" "}
            <strong>${(item.meal.price * item.quantity).toFixed(2)}</strong>
          </p>
        ))}
      </div>
      <form onSubmit={handleSubmit} data-testid="checkout-form">
        <label htmlFor="address">配送地址</label>
        <input
          autoComplete="off"
          placeholder="請使用虛構的示範地址"
          id="address"
          data-testid="checkout-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          data-testid="place-order"
          disabled={submitting}
        >
          {submitting ? "訂單送出中…" : "確認送出訂單"}
        </button>
      </form>
    </div>
  );
}
