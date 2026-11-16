# 全書範例與閱讀順序

[回到專案首頁](../../README.md)

所有讀者範例都在 `master`。先依書籍進度選擇入口，再閱讀或執行該部分的程式，不需要把每個資料夾都跑一遍。

## 第一部分：Playwright 基礎

[manual/food-grandma-fastapi/](manual/food-grandma-fastapi/) 保留人工撰寫的測試，供定位元素、等待條件與結果檢查等練習使用。需要先啟動 Food Grandma 網站，環境與指令見 [既有練習的執行方式](../../docs/existing-exercises.md)。

## 第二部分：v1 → 各章範例 → v2

先看 AI 在沒有指定模式時寫出了什麼，再帶著程式碼中的問題閱讀書中第 17～30 章（範例編號 15～28）。最後看 AI 先閱讀第二部分後獨立產生的 v2，比較兩版的寫法。

| 順序 | 入口 | 閱讀重點 |
| --- | --- | --- |
| 1 | [原始 v1](v1/README.md) | 相同的規格如何變成測試？哪些部分清楚，哪些部分可能難以修改？ |
| 2 | [各章範例](chapters/README.md#按章執行) | 每章比較同一案例的三種寫法，觀察本章做法改變了什麼，以及多出了哪些程式。 |
| 3 | [原始 v2](v2/README.md) | AI 選了哪些模式？哪些做法讓測試更容易讀懂，哪些仍值得修改？ |

原始 v1、v2 直接讀取相同 specs，使用相同 27 個案例，各自開啟獨立對話產生。v1 沒有指定模式；v2 先閱讀第二部分、選擇適合的模式，沒有讀取 v1。因此，v2 是獨立生成的比較版。

### 各章的 v1、v2 是什麼

各章提供對應的測試檔，多數包含「未使用本章做法、v1、v2」三組，統一採 Arrange／Act／Assert。為了集中討論當章差異，這些程式會抽取原始版本的相關做法，統一帳號、資料準備與驗收檢查，並非原始專案的逐字副本。

書中第 21 章（範例 ch19）使用新增的 [顧客訂餐情境](chapters/ch19/customer-order.spec.ts)，比較逐步呼叫 POM、流暢介面（Fluent Interface）與 Workflow Facade。三版皆保留 POM，只有流程寫法不同，不標成原始 v1、v2 的輸出。

Page Factory、Workflow Facade、Screenplay、Adapter、Repository Fake 等未完整出現在原始 v2 的部分，會標示為教學延伸。章節中的 v2 不代表原始 AI 已經選用了所有模式。

例如：餐點價格修改可以先對照 [v1 的餐點測試](v1/tests/meals.spec.ts) 與 [v2 的餐點測試](v2/tests/specs/meals.spec.ts)，再閱讀 [書中第 17 章的 POM 三版本](chapters/ch15/pom/meal-price.spec.ts)。各章主題、案例與來源見 [素材對照表](../../experiments/part-two/chapter-example-map.md)。章節內不另設 COMPARISON.md。

### 從同一個入口執行

首次使用先完成 [Python 與前端環境設定](chapters/README.md#開始執行)。完成後，從範例專案根目錄執行：

```text
cd tests/e2e/chapters
npm --prefix ../v1 ci
npm --prefix ../v2 ci
npm run chapter -- v1
npm run chapter -- 15
npm run chapter -- v2
```

上面三個執行指令可依閱讀進度分開使用。執行器各自準備獨立資料並啟動服務；`shared/` 只提供兩版共同的帳號與建立帳號的程式，不是另一套測試。

`npm run chapter -- all` 只執行書中第 17～30 章（範例編號 15～28），不包含原始 v1、v2。書中第 29 章的固定等待反例會留下失敗；原始 v1、v2 的 ROLE-T02 也保留規格與實作差異。這些指令可能以非零狀態結束，請依 [驗證說明](chapters/VERIFICATION.md) 區分已記錄的失敗與新問題。

## 第三部分：Planner、Generator 與 Healer

第 31 章使用[需求草稿](../../specs-draft/01-restaurant-auth/)、[規格提示詞](../../.github/prompts/generate-spec.md)和[產出的規格草稿](../../specs-generated/01-restaurant-auth.md)。第 32 章的後端規格可從 [本機 API 文件](../../docs/existing-exercises.md#啟動-food-grandma)取得。

[ai-agent/food-grandma-fastapi/](ai-agent/food-grandma-fastapi/) 保存 AI 測試流程的範例。餐點價格修改的 [測試計畫與測試程式](ai-agent/food-grandma-fastapi/tests/generated/04-meal-management/) 放在一起；後續的 [測試維護挑戰](ai-agent/food-grandma-fastapi/tests/generated/06-test-maintenance/README.md) 提供十種常見問題。

這些範例使用原有網站環境，與第二部分的獨立執行器不同。請依 [網站啟動與執行說明](../../docs/existing-exercises.md) 或題目的 README 操作，不必切換到第二部分的 v1、v2。

## 需要查閱實驗證據時

[完整實驗紀錄](../../experiments/part-two/README.md) 保留原始提示詞、獨立對話、生成快照、各輪結果與截圖。較早紀錄的案例數、名稱與路徑反映當時版本；目前執行方式以各章 README 為準。

日後若使用書中指定的出版標籤，請整份專案一起切換，讓測試、規格與網站維持對應版本。
