import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPostForm, getDriverToken } from "../../api";
import { Order } from "../../types";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<number | null>(null);

  const active = useRef(false);
  const pending = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");

  function load() {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    apiGet<{ orders: Order[] }>("/api/driver/orders/?status=ready")
      .then((data) => {
        if (active.current) {
          setOrders(data.orders);
          setError(null);
          setUpdatedAt(new Date().toLocaleTimeString("zh-TW"));
        }
      })
      .catch(() => {
        if (active.current) setError("無法取得可接訂單，請稍後重新整理。");
      })
      .finally(() => {
        pending.current = false;
        if (active.current) setRefreshing(false);
      });
  }

  useEffect(() => {
    active.current = true;
    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      active.current = false;
      window.clearInterval(timer);
    };
  }, []);

  async function handlePick(orderId: number) {
    if (picking !== null) return;
    const token = getDriverToken();
    if (!token) {
      setError("請先登入外送員體驗帳號，再接取訂單。");
      return;
    }

    setPicking(orderId);
    try {
      const result = await apiPostForm<{ status: string; error?: string }>(
        `/api/driver/orders/${orderId}/claim`,
        { access_token: token },
      );
      if (result.status !== "success") {
        setError(result.error ?? "無法接取訂單，請重新整理後再試。");
        setPicking(null);
        return;
      }
      navigate("/driver/delivery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法接取訂單，請重新整理後再試。");
      setPicking(null);
    }
  }

  return (
    <div className="screen">
      <h1>可接訂單</h1>
      <p className="subtitle">查看已備妥的餐點，接單後開始配送。</p>
      <div className="driver-toolbar">
        <span role="status">
          {refreshing
            ? "正在更新訂單…"
            : updatedAt
              ? `上次更新 ${updatedAt} · 每 10 秒自動更新`
              : "等待更新"}
        </span>
        <button
          className="btn btn-secondary btn-small"
          onClick={load}
          disabled={refreshing}
        >
          重新整理
        </button>
        <Link to="/driver/delivery">查看進行中配送 →</Link>
      </div>
      {error && (
        <div className="alert" data-testid="orders-error">
          {error} {!getDriverToken() && <Link to="/account">前往體驗登入</Link>}
        </div>
      )}
      {!orders && !error && <p role="status">正在載入可接訂單…</p>}
      {!error && orders?.length === 0 && (
        <div className="empty-state" data-testid="no-ready-orders">
          <h2>目前沒有可接的訂單</h2>
          <p>
            餐廳將訂單標記為「可取餐」後，會自動出現在這裡。備餐中的訂單尚不可接取。
          </p>
          <p>如果你已經接單，請到「進行中配送」查看。</p>
        </div>
      )}

      <section className="dispatch-panel" aria-label="可接訂單列表">
        <div className="dispatch-heading"><h2>待取餐訂單 <span>{orders?.length ?? "—"}</span></h2><span>餐點已備妥，可安排配送</span></div>
        <div className="dispatch-scroll">
          <table className="dispatch-table" data-testid="ready-order-list">
            <thead><tr><th>訂單／店家</th><th>取餐地址</th><th>送達地址</th><th className="numeric">餐點金額</th><th>狀態</th><th>操作</th></tr></thead>
            <tbody>{orders?.map((order) => (
              <tr key={order.id} data-testid="ready-order-card">
                <td><strong>#{String(order.id).padStart(4, "0")}</strong><span className="dispatch-detail">{order.restaurant.name}</span></td>
                <td>{order.restaurant.address}</td>
                <td>{order.address}</td>
                <td className="numeric">${order.total.toFixed(2)}</td>
                <td><span className="dispatch-status">可取餐</span></td>
                <td><button className="btn btn-primary" data-testid="pick-order" disabled={picking !== null} onClick={() => handlePick(order.id)}>{picking === order.id ? "接單中…" : "接取訂單"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="dispatch-footer">共 {orders?.length ?? 0} 筆訂單</div>
      </section>
    </div>
  );
}
