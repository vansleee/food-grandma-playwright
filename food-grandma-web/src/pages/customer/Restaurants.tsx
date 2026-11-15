import StorefrontHero from "../../components/storefront/StorefrontHero";
import RestaurantCard from "../../components/storefront/RestaurantCard";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api";
import { Restaurant } from "../../types";
export default function Restaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("default");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(null);
    setRestaurants(null);
    apiGet<{ restaurants: Restaurant[] }>("/api/customer/restaurants/")
      .then((data) => {
        if (active) setRestaurants(data.restaurants);
      })
      .catch(() => {
        if (active) setError("目前無法取得餐廳資料，請確認服務已啟動後重試。");
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const filtered = (restaurants ?? []).filter((r) =>
    `${r.name} ${r.address}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="screen discovery">
      <section aria-label="探索餐廳">
        <header className="market-heading"><div><h1>今天想吃什麼？</h1><p>搜尋餐廳或地區，選好你的下一餐。</p></div><Link to="/customer/delivery">查看訂單進度 →</Link></header>
        <div className="search-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜尋餐廳或地址"
              placeholder="搜尋餐廳名稱或地址…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="清除搜尋">
                ×
              </button>
            )}
          </label>
          <select
            aria-label="餐廳排序"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">預設排序</option>
            <option value="name">名稱排序</option>
          </select>
        </div>
        <StorefrontHero />
        <div className="market-results" id="restaurants"><h2>{query ? "搜尋結果" : "所有餐廳"}</h2><span>{restaurants ? `${filtered.length} 間餐廳` : "載入中…"}</span></div>
        {error && (
          <div
            className="empty-state"
            role="alert"
            data-testid="restaurants-error"
          >
            <h3>無法載入餐廳</h3>
            <p>{error}</p>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setAttempt((a) => a + 1)}
            >
              重新載入
            </button>
          </div>
        )}
        {!restaurants && !error && (
          <div
            className="restaurant-grid"
            role="status"
            aria-label="正在載入餐廳"
          >
            {[0, 1, 2].map((i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        )}
        <ul className="card-list restaurant-grid" data-testid="restaurant-list">
          {filtered.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i} />
          ))}
        </ul>
        {restaurants && !filtered.length && (
          <div className="empty-state">
            <h3>{query ? "沒有符合的餐廳" : "餐廳準備中"}</h3>
            <p>
              {query
                ? "試試其他名稱或地址，尋找下一餐。"
                : "目前沒有可顯示的餐廳，請稍後再回來。"}
            </p>
            {query && (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setQuery("")}
              >
                清除搜尋
              </button>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
