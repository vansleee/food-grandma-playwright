import { useEffect, useState } from "react";
import { apiGet, getDriverToken } from "../../api";

export default function Earnings() {
  const [revenue, setRevenue] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getDriverToken();
    if (!token) {
      setError("請先登入外送員體驗帳號。");
      return;
    }
    apiGet<{ revenue: Record<string, number> }>("/api/driver/revenue/", token)
      .then((data) => setRevenue(data.revenue))
      .catch((err) => setError(err.message));
  }, []);

  const total = revenue
    ? Object.values(revenue).reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <div className="screen">
      <h1>本週配送紀錄</h1>
      {error && (
        <div className="alert" data-testid="earnings-error">
          {error}
        </div>
      )}
      {!revenue && !error && <p>正在載入本週紀錄…</p>}

      {revenue && (
        <>
          <div className="cart-total" data-testid="earnings-total">
            已完成訂單金額：${total.toFixed(2)}
          </div>
          <ul className="card-list" data-testid="earnings-list">
            {Object.entries(revenue).map(([day, amount]) => (
              <li
                key={day}
                className="card earnings-row"
                data-testid="earnings-row"
              >
                <span>
                  {{
                    Mon: "週一",
                    Tue: "週二",
                    Wed: "週三",
                    Thu: "週四",
                    Fri: "週五",
                    Sat: "週六",
                    Sun: "週日",
                  }[day] ?? day}
                </span>
                <span>${amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
