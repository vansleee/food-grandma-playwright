# 第 16 章 Generator 實跑紀錄

使用 Claude Code 2.1.311、Playwright 1.63.0，各章分開開啟一個新對話。這次使用的[計畫](plan.md)與[提示詞](prompt.txt)都保留在同一目錄。

Generator 以種子測試開啟餐廳登入頁，實際在網頁驗證登入、備餐完成及餐點導覽，再用 `generator_write_test` 分別存成三支 UI 測試。

Generator 寫檔後，由終端機執行三支原始產出。從 `tests/e2e/chapters` 執行：

```bash
npx playwright test -c playwright.agent-loop.config.ts ch16/generator/mark-order-ready.spec.ts ch16/generator/open-meals.spec.ts ch16/generator/sign-in.spec.ts
```

結果：`3 passed (21.0s)`，使用一個 worker，測試無重試。種子測試用於探索起點，未計入這三支測試。
手寫版另從 `practice/` 執行，得到 `5 passed (35.1s)`。其中三支與 Generator 版對照，另外兩支是練習。
