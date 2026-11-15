# 第 09 章 Planner 實跑紀錄

2026 年 11 月 15 日在 macOS 執行，使用 Claude Code 2.1.311、Playwright 1.63.0、Node.js v26.9.0 與 Chromium。後端使用本輪專用的 SQLite 資料庫，網站入口為 `http://localhost:8082`。

## 重跑第 09 章

先照[章節 README](../../README.md)啟動 Food Grandma，再從 `tests/e2e/chapters` 執行。

```bash
npm ci
npx playwright install chromium
npx playwright init-agents --loop=claude --config=playwright.agent-loop.config.ts
npx playwright test -c playwright.agent-loop.config.ts ch09/agent-loop/seed.spec.ts
claude --agent playwright-test-planner --strict-mcp-config --mcp-config agent-loop.mcp.json
```

Claude Code 開啟後，貼上 [prompt.txt](prompt.txt) 的內容。提示詞會把計畫寫到 `ch09/agent-loop/plan.md`。這次在獨立的練習副本執行，將 Planner 的原始輸出另存為 [plan-rerun.md](plan-rerun.md)。

## 執行結果

種子測試通過，終端機顯示 `1 passed (7.4s)`。在獨立的 Claude Code 對話中，`playwright-test` MCP 已連線，Planner 用種子測試開啟「訂單管理」頁面，取得這次的訂單編號。實際操作的紀錄如下。

| 檢查項目 | 實際看到的結果 |
| --- | --- |
| 按下按鈕前 | 訂單編號為 1，畫面顯示 `#0001`，狀態是「備餐中」，該列有「備餐完成 →」按鈕 |
| 按下「備餐完成 →」 | 後端收到 `PATCH /api/restaurant/orders/1`，回傳 HTTP 200 |
| 更新後 | 編號仍為 1，同一列顯示「待取餐」，該列已找不到備餐完成按鈕 |

計畫也列了重新整理後的預期結果。這輪 Planner 未執行重新整理。

## 獨立驗證範例

[verify-plan.spec.ts](verify-plan.spec.ts) 使用和種子測試相同的 Fixture 準備資料，再用 Playwright 驗證表格中的結果。執行時會重新建立練習資料，因此請在專用的本機練習資料庫依序執行。

```bash
npx playwright test -c playwright.agent-loop.config.ts ch09/agent-loop/verify-plan.spec.ts --trace on
```

這次執行結果為 `1 passed (7.0s)`。用 `--trace on` 重跑時，可以在這一輪的 `test-results` 找到 `trace.zip`，再用 Trace Viewer 核對按鈕操作和對應的 PATCH 請求。
