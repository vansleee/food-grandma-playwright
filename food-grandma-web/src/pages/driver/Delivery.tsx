import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatchForm, apiPutForm, getDriverToken } from "../../api";
import { Order } from "../../types";
import DeliveryMap, {
  Coordinates,
  parseCoordinates,
} from "../../components/DeliveryMap";
function directions(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
export default function Delivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const locating = false;
  useEffect(() => {
    let active = true;
    const token = getDriverToken();
    if (!token) {
      setError("請先登入外送員體驗帳號。");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet<{ orders: Order[] }>("/api/driver/orders/active", token)
      .then((data) => {
        if (active) setOrders(data.orders);
      })
      .catch(() => {
        if (active) setError("無法載入配送資料，請重新整理。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  async function handleUpdateLocation(e: FormEvent) {
    e.preventDefault();
    if (updating || completing) return;
    setError(null);
    setNotice("");
    const parsed = parseCoordinates(location);
    if (!parsed) {
      setError("請輸入有效的「緯度,經度」，例如 25.0330,121.5654。");
      return;
    }
    if (Math.abs(parsed.lat) > 85) {
      setError("地圖支援緯度介於 -85 到 85 度的位置。");
      return;
    }
    const token = getDriverToken();
    if (!token) {
      setError("請先登入外送員體驗帳號。");
      return;
    }
    setUpdating(true);
    try {
      const result = await apiPutForm<{ status: string; error?: string }>(
        "/api/driver/location",
        { access_token: token, location: `${parsed.lat},${parsed.lng}` },
      );
      if (result.status !== "success")
        throw new Error(result.error || "位置更新失敗。");
      setCoordinates(parsed);
      setNotice("位置已更新，地圖標記已同步。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "位置更新失敗，請重試。");
    } finally {
      setUpdating(false);
    }
  }
  function locate() {
    setLocation("25.0330,121.5654");
    setNotice("已填入虛構示範位置，不會取得裝置定位。");
    setError(null);
  }
  async function handleComplete(orderId: number) {
    const token = getDriverToken();
    if (!token || completing || updating) return;
    setCompleting(true);
    setError(null);
    try {
      const result = await apiPatchForm<{ status: string; error?: string }>(
        `/api/driver/orders/${orderId}`,
        { access_token: token },
      );
      if (result.status !== "success")
        throw new Error(result.error || "無法完成配送。");
      setOrders((current) => current.filter((order) => order.id !== orderId));
      setNotice("配送已完成，謝謝你的辛苦！");
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法完成配送，請重試。");
    } finally {
      setCompleting(false);
    }
  }
  return (
    <div className="screen">
      <h1>進行中配送</h1>
      {error && (
        <div className="alert" role="alert" data-testid="active-delivery-error">
          {error}{" "}
          {!getDriverToken() ? (
            <Link to="/account">前往體驗登入</Link>
          ) : (
            orders.length === 0 && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setAttempt((a) => a + 1)}
              >
                重新整理
              </button>
            )
          )}
        </div>
      )}
      <p role="status">{notice}</p>
      {loading && <p role="status">正在載入配送資料…</p>}
      {!loading && orders.length === 0 && !error && (
        <div className="empty-state" data-testid="no-active-delivery">
          <h2>目前沒有進行中的配送</h2>
          <Link to="/driver/orders">查看可接訂單 →</Link>
        </div>
      )}
      {orders.map((order) => (
        <div className="delivery-workspace" data-testid="active-delivery-card" key={order.id}>
          <div>
            <DeliveryMap coordinates={coordinates} />
            <form
              className="card location-editor"
              onSubmit={handleUpdateLocation}
              data-testid="location-form"
            >
              <label htmlFor="location">外送員位置（緯度,經度）</label>
              <input
                id="location"
                data-testid="driver-location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如 25.0330,121.5654"
                required
              />
              <div className="location-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={locate}
                  disabled={locating || updating || completing}
                >
                  {locating ? "定位中…" : "使用示範位置"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-testid="update-location"
                  disabled={updating || completing || locating}
                >
                  {updating ? "更新中…" : "更新位置"}
                </button>
              </div>
            </form>
          </div>
          <aside className="card delivery-summary">
            <span className="status-badge">配送中</span>
            <h2>訂單 #{order.id}</h2>
            <div className="delivery-stop">
              <span>取餐地點</span>
              <h3>{order.restaurant.name}</h3>
              <p>{order.restaurant.address}</p>
              <a
                href={directions(order.restaurant.address)}
                target="_blank"
                rel="noreferrer"
              >
                導航至餐廳 ↗
              </a>
            </div>
            <div className="delivery-stop">
              <span>送達地點</span>
              <h3>{order.customer.name}</h3>
              <p>{order.address}</p>
              <a
                href={directions(order.address)}
                target="_blank"
                rel="noreferrer"
              >
                導航至送達地址 ↗
              </a>
            </div>
            <p className="map-note">
              示範地址可能無法定位，請以導航服務搜尋結果為準。
            </p>
            <button
              className="btn btn-primary"
              data-testid="complete-delivery"
              disabled={completing || updating}
              onClick={() => handleComplete(order.id)}
            >
              {completing ? "完成配送中…" : "確認已送達"}
            </button>
          </aside>
        </div>
      ))}
    </div>
  );
}
