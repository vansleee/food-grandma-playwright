import { useState } from "react";
import { api } from "../api";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
import OrderStatus, { statuses } from "../components/OrderStatus";

export default function Orders() {
  const { data, loading, error, reload } = useResource(api.listOrders);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const orders = data?.orders ?? [];
  const shown = orders.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      `${o.id} ${o.customer.name} ${o.address}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  async function markReady(id: number) {
    if (busy !== null) return;
    setBusy(id);
    setActionError("");
    setNotice("");
    try {
      await api.markOrderReady(id);
      setNotice(`訂單 #${id} 已標記為待取餐。`);
      reload();
    } catch {
      setActionError("更新訂單失敗，請稍後重試。");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <PageHeader
        title="訂單管理"
        description="查看訂單進度，處理備餐與取餐。"
      >
        <button className="btn-secondary" onClick={reload} disabled={loading}>
          ↻ {loading ? "更新中…" : "重新整理"}
        </button>
      </PageHeader>
      {(error || actionError) && (
        <div role="alert" className="alert">
          {error || actionError}
        </div>
      )}
      <p role="status" className="action-notice">
        {notice}
      </p>
      <section className="data-panel">
        <div className="panel-toolbar">
          <div>
            <h2>
              所有訂單 <span>{orders.length}</span>
            </h2>
            <p>顯示這間餐廳的訂單紀錄</p>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜尋訂單"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋訂單編號、顧客或地址"
            />
          </label>
        </div>
        <div className="filter-tabs" aria-label="依訂單狀態篩選">
          {[{ value: "all", label: "全部" }, ...statuses].map((s) => (
            <button
              key={s.value}
              aria-pressed={filter === s.value}
              onClick={() => setFilter(s.value)}
            >
              {s.label}
              <span>
                {s.value === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === s.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="table-wrapper">
          <table data-testid="order-table">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>餐點明細</th>
                <th>顧客／送達地址</th>
                <th>外送員</th>
                <th className="amount">金額</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={7} className="empty-state" role="status">
                    正在載入訂單…
                  </td>
                </tr>
              )}
              {!loading && !error && !shown.length && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {orders.length
                      ? "沒有符合條件的訂單，請調整搜尋或篩選。"
                      : "目前還沒有訂單，新的訂單會顯示在這裡。"}
                  </td>
                </tr>
              )}
              {shown.map((order) => (
                <tr
                  key={order.id}
                  data-testid="order-row"
                  data-order-id={order.id}
                >
                  <td>
                    <strong className="order-number">
                      #{String(order.id).padStart(4, "0")}
                    </strong>
                  </td>
                  <td>
                    <ul className="order-items">
                      {order.order_details.map((item) => (
                        <li key={item.id}>
                          <strong>{item.meal.name}</strong>
                          <span>
                            × {item.quantity} · ${item.sub_total}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <strong>{order.customer.name}</strong>
                    <small className="cell-note">{order.address}</small>
                  </td>
                  <td>{order.driver?.name ?? "尚未指派"}</td>
                  <td className="amount">${order.total.toLocaleString()}</td>
                  <td data-testid="order-status">
                    <OrderStatus value={order.status} />
                  </td>
                  <td>
                    {order.status === "Cooking" ? (
                      <button
                        className="btn-ready"
                        disabled={busy !== null || loading}
                        data-testid="order-ready-button"
                        onClick={() => markReady(order.id)}
                      >
                        {busy === order.id ? "更新中…" : "備餐完成 →"}
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          共 {shown.length} 筆符合條件的訂單<span>資料依最近一次更新顯示</span>
        </div>
      </section>
    </div>
  );
}
