import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, getCustomerToken } from "../../api";
import { Order } from "../../types";

const POLL_INTERVAL_MS = 4000;

export default function Delivery() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setError("請先以顧客身分登入，查看訂單進度。");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data = await apiGet<{ last_order: Order | null }>(
          "/api/customer/orders/latest",
          token,
        );
        if (cancelled) return;
        setOrder(data.last_order);
        setError(null);
        setLocation(null);

        if (data.last_order?.status === "On the way") {
          const loc = await apiGet<{ location: string | null }>(
            "/api/customer/driver/location/",
            token,
          );
          if (!cancelled) setLocation(loc.location);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "無法載入訂單，請稍後重試。",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="screen">
      <Link to="/customer/restaurants" className="back-link">
        ← 返回餐廳
      </Link>
      <h1>訂單進度</h1>

      {error && (
        <div className="alert" data-testid="delivery-error">
          {error}{" "}
          {!getCustomerToken() && <Link to="/account">前往體驗登入</Link>}
        </div>
      )}
      {loading && <p role="status">正在確認訂單進度…</p>}
      {!loading && !order && !error && (
        <div className="empty-state" data-testid="no-order">
          <h2>美味旅程尚未開始</h2>
          <p>下單後，可以在這裡查看配送進度。</p>
          <Link to="/customer/restaurants">探索餐廳 →</Link>
        </div>
      )}

      {order && (
        <div className="card" data-testid="delivery-card">
          <div className="card-title">訂單 #{order.id}</div>
          <div className="status-badge" data-testid="order-status">
            {order.status}
          </div>
          <div className="card-subtitle">{order.restaurant.name}</div>
          <div className="card-subtitle">配送地址： {order.address}</div>
          <div className="cart-total">餐點合計： ${order.total.toFixed(2)}</div>

          {order.driver && (
            <div className="driver-info" data-testid="driver-info">
              <div>外送員： {order.driver.name}</div>
              <div>
                {order.driver.car_model} — {order.driver.plate_number}
              </div>
              {location && (
                <div data-testid="driver-location">位置： {location}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
