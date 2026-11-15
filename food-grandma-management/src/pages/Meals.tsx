import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useResource } from "../hooks/useResource";
import PageHeader from "../components/PageHeader";
export default function Meals() {
  const { data, loading, error, reload } = useResource(api.listMeals);
  const [query, setQuery] = useState("");
  const meals = (data?.meals ?? []).filter((m) =>
    `${m.name} ${m.short_description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div>
      <PageHeader
        title="餐點管理"
        description="把拿手的好味道，放上今天的菜單。"
      >
        <Link
          to="/meals/add"
          className="btn-primary"
          data-testid="add-meal-link"
        >
          ＋ 新增餐點
        </Link>
      </PageHeader>
      {error && (
        <div className="alert" role="alert">
          {error}{" "}
          <button className="btn-secondary" onClick={reload}>
            重新載入
          </button>
        </div>
      )}
      <section className="data-panel">
        <div className="panel-toolbar">
          <div>
            <h2>
              餐廳菜單 <span>{data?.meals.length ?? 0}</span>
            </h2>
            <p>選擇餐點名稱即可編輯內容</p>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="搜尋餐點"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋餐點名稱或描述"
            />
          </label>
        </div>
        <div className="table-wrapper">
          <table data-testid="meal-table">
            <thead>
              <tr>
                <th>編號</th>
                <th>餐點</th>
                <th>描述</th>
                <th>價格</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    正在載入菜單…
                  </td>
                </tr>
              )}
              {!loading && !error && !meals.length && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    {query
                      ? "沒有符合的餐點，試試其他關鍵字。"
                      : "菜單準備中，新增第一道餐點吧。"}
                  </td>
                </tr>
              )}
              {meals.map((meal) => (
                <tr key={meal.id} data-testid="meal-row" data-meal-id={meal.id}>
                  <td>#{meal.id}</td>
                  <td>
                    <Link
                      className="meal-name"
                      to={`/meals/${meal.id}/edit`}
                      data-testid="meal-edit-link"
                    >
                      <span className="meal-thumbnail">
                        {meal.image && (
                          <img
                            src={meal.image}
                            alt=""
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </span>
                      <strong>{meal.name}</strong>
                    </Link>
                  </td>
                  <td>{meal.short_description}</td>
                  <td className="amount">${meal.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          共 {meals.length} 道餐點<span>料理照片為示意圖</span>
        </div>
      </section>
    </div>
  );
}
