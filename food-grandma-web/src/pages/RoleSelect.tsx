import { useEffect, useState } from "react";
import { useCart } from "../CartContext";
import { useNavigate } from "react-router-dom";
import {
  apiGet,
  resetAndSeedDemoData,
  setCustomerToken,
  setDriverToken,
} from "../api";

// This backend has no real customer/driver login (no username/password on
// those roles) — only pre-issued demo tokens, matching what the seed
// endpoint hands out. See food-grandma-fastapi/app/routers/demo_data.py.
const DEMO_CUSTOMER_TOKEN = "e2e-customer-token";
const DEMO_DRIVER_TOKEN = "e2e-driver-token";

export default function RoleSelect() {
  const navigate = useNavigate();
  const cart = useCart();
  const [demoEnabled, setDemoEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    apiGet<{ enabled: boolean }>("/api/test/config")
      .then((data) => {
        if (active) setDemoEnabled(data.enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function continueAsCustomer() {
    setCustomerToken(DEMO_CUSTOMER_TOKEN);
    navigate("/customer/restaurants");
  }

  function continueAsDriver() {
    setDriverToken(DEMO_DRIVER_TOKEN);
    navigate("/driver/orders");
  }

  async function handleResetSeed() {
    if (busy) return;
    if (
      !window.confirm(
        "這會清除目前的帳號、餐點與訂單，重建完整 dummy 資料並儲存至資料庫。確定繼續？",
      )
    )
      return;
    setMessage("");
    setBusy(true);
    try {
      const result = await resetAndSeedDemoData();
      cart.clear();
      setCustomerToken(DEMO_CUSTOMER_TOKEN);
      setDriverToken(DEMO_DRIVER_TOKEN);
      setMessage(
        `已儲存至資料庫：${result.restaurants} 間餐廳、${result.meals} 道餐點、${result.orders} 筆訂單（含四種狀態與照片）。重新啟動後資料仍會保留。`,
      );
    } catch {
      setMessage("重建失敗，請確認後端服務。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen access-page">
      <h1>體驗登入</h1>
      <p className="subtitle">選擇工作身分，進入對應的服務與管理介面。</p>
      <div className="access-notice">示範環境 · 顧客與外送員使用預設體驗帳號，尚未提供正式會員登入。</div>
      <section className="access-options" aria-label="選擇身分">
        <article><div><h2>顧客</h2><p>瀏覽餐廳、訂購餐點及追蹤配送進度。</p></div><button className="btn btn-secondary" data-testid="continue-as-customer" onClick={continueAsCustomer}>以顧客身分開始</button></article>
        <article><div><h2>外送員</h2><p>接取訂單、更新配送位置及查看配送紀錄。</p></div><button className="btn btn-primary" data-testid="continue-as-driver" onClick={continueAsDriver}>進入外送員工作台</button></article>
        <article><div><h2>店家管理</h2><p>管理餐點、處理訂單及查看營運報表。</p></div><a className="btn btn-secondary" href="/management/">登入店家後台 ↗</a></article>
      </section>
      {demoEnabled && <section className="development-panel"><div><h2>示範資料管理</h2><p>清除目前資料並重建完整示範內容，儲存至資料庫。此操作需管理者專用金鑰。</p></div><button disabled={busy} className="btn btn-secondary" data-testid="reset-seed-demo-data" onClick={handleResetSeed}>{busy ? "正在重建並儲存資料…" : "重建示範資料（管理者專用）"}</button></section>}
      <p role="status">{message}</p>
    </div>
  );
}
