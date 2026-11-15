# 第 11 章 Healer 實跑紀錄

2026 年 11 月 15 日在 macOS 執行，使用 Claude Code 2.1.311、Playwright 1.63.0 與 Chromium。網站入口使用 `http://localhost:8082`，後端使用本輪專用的 SQLite 資料庫。修復前後都從同一套 Fixture 準備訂單。

## 重現第 10 章的失敗

照第 09 章啟動網站與後端後，在練習副本的 `tests/e2e/chapters` 目錄執行。第一行會用第 10 章的 [Generator 原始產出](../../ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts) 覆寫練習副本中的第 11 章同名檔案。

```bash
node -e "require('node:fs').copyFileSync('ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts','ch11/agent-loop/restaurant-mark-ready.rerun.spec.ts')"
npx playwright test -c playwright.agent-loop.config.ts ch11/agent-loop/restaurant-mark-ready.rerun.spec.ts --trace on
```

結果是 `1 failed`。同一筆訂單已從「備餐中」變成「待取餐」，「備餐完成」按鈕也消失了。測試最後卡在第 27 行的餐點文字檢查。

```text
Expected substring: "Margherita × 2 · $20"
Received string:    "#0001Margherita× 2 · $20Cathy Customer3 Demo St, Taipei尚未指派$20待取餐—"
```

## 用 Healer 調查並修復

在同一個目錄另開 Claude Code，再貼上 [prompt-rerun.txt](prompt-rerun.txt)。

```bash
claude --agent playwright-test-healer --strict-mcp-config --mcp-config agent-loop.mcp.json
```

Healer 用 Playwright 的 `test_run` 工具重現 `1 failed`，再對照測試程式碼和錯誤訊息。測試預期品名和乘號之間有一個空格，Playwright 讀到的整列文字在這個位置沒有空格。

Healer 將第 27 行改成正規表示式，用 `\s*` 接受品名和乘號之間的零個或多個空白字元。餐點名稱、數量和金額仍要符合，訂單編號、顧客名稱、狀態和按鈕的檢查也保留在同一支測試。

```diff
-    await expect(order).toContainText('Margherita × 2 · $20');
+    await expect(order).toContainText(/Margherita\s*× 2 · \$20/);
```

## 重跑修復版本

Healer 用 `test_run` 重跑，結果為 `1 passed`。我再用與修復前相同的 Playwright 指令獨立執行，結果為 `1 passed (6.9s)`，TypeScript 型別檢查也通過。完整修復版本在 [restaurant-mark-ready.rerun.spec.ts](restaurant-mark-ready.rerun.spec.ts)。修復前後都可用終端機列出的 `trace.zip` 回看操作與結果。
