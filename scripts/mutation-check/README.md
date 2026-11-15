# mutation-check

綠燈只代表測試沒失敗，不代表它抓得到錯。這個工具在 `mark_order_ready()` 埋入已知缺陷，確認 `tests/generated/03-order-mark-ready/api/` 的測試會轉紅。

## 執行

```bash
scripts/mutation-check/run.sh                      # 全部突變
scripts/mutation-check/run.sh M1-extra-field       # 指定突變
```

需要 `python3`、已安裝好的 AI-agent harness（`tests/e2e/ai-agent/food-grandma-fastapi` 執行過 `npm install`）。第一次執行會在 `WORK_DIR` 建立 Python venv。

## 不碰產品程式碼

每個突變都從 `food-grandma-fastapi/app` 複製一份到 `WORK_DIR`（預設 `$TMPDIR/food-grandma-mutation`），只修改複本，另起 uvicorn（預設 port 8091）與獨立的 SQLite。測試透過 `API_BASE_URL` 指向它。repo 的原始碼與 Docker 後端（8081）不受影響，跑完不需要還原。

## 突變

| 名稱 | 缺陷 |
|---|---|
| `baseline` | 無。必須全綠，否則其他結果都不可信 |
| `M1-extra-field` | 回應多一個 `warning` 欄位 |
| `M2-touch-other-order` | 同時改掉同餐廳另一筆訂單的 `address` |
| `M3-not-persisted` | 不 commit，回應仍顯示 Ready |
| `M4-no-cooking-guard` | 任何狀態都改成 Ready |

`mark_order_ready()` 若被改寫，`mutate.py` 找不到錨點會直接失敗，不會默默變成沒有缺陷的突變。

## 預期結果（2026-10-24）

| 突變 | v1 | v2 | v3 | READY-T04 |
|---|---|---|---|---|
| baseline | 綠 | 綠 | 綠 | 綠 |
| M1 | 綠 | 紅 | 紅 | 三列皆紅 |
| M2 | 綠 | 紅 | 紅 | 綠 |
| M3 | 紅 | 紅 | 紅 | 綠 |
| M4 | 綠 | 綠 | 綠 | Ready 綠、On the way 與 Delivered 紅 |
