# 第 09～11 章：Claude Code 實跑紀錄

2026 年 11 月 14 日（台灣時間），macOS、Claude Code 2.1.311、Playwright 1.63.0、Chromium。本機 API 與網站入口分別使用 8081 與 8082，資料庫是本次專用的 SQLite 檔。三個 Agent 各在新對話執行。

| 階段 | 實際執行與結果 |
| --- | --- |
| 種子測試 | Playwright CLI：`1 passed`。 |
| Planner | `planner_setup_page` 開啟種子測試準備的訂單；透過 `browser_click` 操作後，在畫面確認同一筆訂單變為「待取餐」且按鈕消失；用 `planner_save_plan` 寫入 `ch09/agent-loop/plan.md`。 |
| Generator | `generator_setup_page`、`browser_click`、`generator_read_log`、`generator_write_test`。原始輸出保存在 `ch10/agent-loop/restaurant-mark-ready.spec.ts`。Generator 已操作網頁並寫檔，沒有自行執行完整測試。 |
| 獨立執行原始產出 | Playwright CLI：`1 failed`。按鈕點擊與狀態檢查都完成，餐點欄的文字比對才失敗。 |
| Healer | 從第 10 章原封不動複製測試，先用 `test_run` 重現失敗，讀取程式碼後修正擷取文字的方式，再用 `test_run` 執行一次：`1 passed`。 |
| 獨立執行修復版本 | Playwright CLI：`1 passed (6.6s)`。 |

原始失敗與 Claude 的診斷摘要：

```text
Error: expect(locator).toHaveText(expected) failed
Expected: Margherita\n× 2 · $20
Received: Margherita× 2 · $20
```

原本用 `innerText()` 記下操作前的內容，但 `toHaveText()` 預設比對 `textContent`。餐點欄兩種取值方式的結果差了一個換行。Healer 將操作前的取值統一改為 `textContent()`，保留原有的訂單定位與檢查。計畫裡有額外項目，原始測試未實作篩選數字、其他訂單、主控台錯誤與重新整理後的狀態；本次通過不代表這些項目也已驗證。
