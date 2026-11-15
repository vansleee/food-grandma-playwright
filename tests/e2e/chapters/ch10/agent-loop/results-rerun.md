# 第 10 章 Generator 實跑紀錄

2026 年 11 月 15 日在 macOS 執行，使用 Claude Code 2.1.311、Playwright 1.63.0 與 Chromium。網站入口使用 `http://localhost:8082`，後端使用這一輪專用的 SQLite 資料庫。

在獨立的練習副本中，從 `tests/e2e/chapters` 開啟一個新的 Claude Code 對話。

```bash
claude --agent playwright-test-generator --strict-mcp-config --mcp-config agent-loop.mcp.json
```

貼上 [prompt-rerun.txt](prompt-rerun.txt) 的內容。這份提示詞沿用第 10 章的寫法，將計畫路徑換成第 09 章這次產出的 [plan-rerun.md](../../ch09/agent-loop/plan-rerun.md)。

Generator 讀取計畫後，用種子測試開啟餐廳後台，按下第 `#0001` 筆訂單的「備餐完成 →」。後端收到 `PATCH /api/restaurant/orders/1` 並回傳 HTTP 200。它接著用 `generator_write_test` 寫出測試檔。這次對話沒有 Bash 工具，Generator 嘗試執行測試時未能啟動 Playwright。

[restaurant-mark-ready.rerun.spec.ts](restaurant-mark-ready.rerun.spec.ts) 是這次的原始程式碼，檔名加上 `.rerun` 方便辨識。它沿用第 09 章的 Fixture，用 Fixture 提供的訂單編號找出要操作的那一列。

## 從終端機執行

照第 09 章啟動本機網站與後端後，從 `tests/e2e/chapters` 執行。

```bash
npx playwright test -c playwright.agent-loop.config.ts ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts --trace on
```

TypeScript 型別檢查通過。Playwright 執行結果為 `1 failed`。測試已確認原狀態是「備餐中」，按下按鈕後同一筆訂單顯示「待取餐」，且這一列的按鈕已移除。最後新增的餐點文字檢查失敗。

```text
Expected substring: "Margherita × 2 · $20"
Received string:    "#0001Margherita× 2 · $20Cathy Customer3 Demo St, Taipei尚未指派$20待取餐—"
```

失敗發生在第 27 行的 `toContainText('Margherita × 2 · $20')`。測試寫的餐點名稱和乘號之間有一個空格，Playwright 讀到的整列文字在這個位置沒有空格。原始產出保留這個檢查，重跑時可以用終端機列出的 `trace.zip` 在 Trace Viewer 查看失敗前的操作。
