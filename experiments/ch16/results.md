# 第 16 章：精簡提示詞的最新實驗

這次在 AAA、外送員環境的準備與關閉、跨角色等待上，都比前一輪更接近第 15 章。仍有未達到手寫版的地方：外送員的送達按鈕沒有依編號限定在對應卡片內，頁面程式也採用另一種分工。

## 實際提示詞

提示詞來自本對話。沒有提供手寫版、original、前次 revised 或第二部分書稿，也沒有指定模式名稱。

```text
請使用 Playwright Generator，依提供的測試案例撰寫網頁測試，
保留所有驗收條件，沿用專案既有的命名與寫法。

每支測試只用一組 AAA：Arrange 準備環境並確認原始狀態，
Act 執行受測動作，Assert 核對結果，expect 留在測試裡。

各頁面的定位器與動作分開管理，依編號找到目標再操作。
登入測試自行登入；其他測試共用登入準備。
額外瀏覽器環境透過測試參數取得，測試成功或失敗都要關閉。

跨角色驗收時，先等操作方顯示完成，再由另一方重新查詢。
請以 headless 執行，回報實際結果。
```

## 怎麼產生與驗證

1. 建立獨立副本，只提供 test-cases.md、seed.spec.ts、fixtures/demo.ts、精簡提示詞、套件與執行設定。資料準備 Fixture 是事先提供的，不把這部分當成本輪新生成的功能。
2. 登入確認後另開全新的 Claude Code 對話，使用 Playwright Generator 的探索與寫檔工具。MCP 與測試設定都明確使用 headless。
3. Claude 實際探索登入、備餐與送達流程，寫出三支測試，以及 pages/locators.ts、pages/actions.ts、fixtures/roles.ts。探索時有一次 MCP 尚未初始化的工具錯誤，重新 setup 後繼續；細節保留在工具紀錄。
4. 模型首次執行得到 4 passed（26.0 秒）。其中三支是正式案例，另一支是 seed；不能把這次結果寫成新增四支測試。獨立型別檢查首次通過，沒有再提供診斷或追加風格要求。
5. 將三支測試合併到 revised/ui-generated.spec.ts，定位器、動作與角色 Fixture 移到 revised/ 下，只調整共用 demo 的相對匯入。T01 統一使用延伸的 test，但沒有宣告角色 Fixture，不會因此自動登入。測試區塊與共用程式邏輯維持模型產出。
6. 合併時一度因重複具名匯入而出現 SyntaxError。這是整理檔案時造成的問題，已合併同模組的匯入後重跑；不是 Generator 原始測試失敗，也沒有修改測試步驟或驗收。錯誤紀錄留在 installation-import-error.log。
7. 在兩個範例專案各執行三支正式測試，再重跑手寫版、original 及既有練習。全程使用獨立本機 SQLite、1 個 worker、零重試；共用資料 Fixture 會重設資料庫，因此沒有平行執行。

## 實跑結果

| 執行內容 | 結果 | 時間 |
| --- | --- | --- |
| 公開專案：新 revised | 3 passed | 21.3 秒 |
| 原範例專案：新 revised | 3 passed | 19.9 秒 |
| 第 15 章手寫版 | 3 passed | 19.8 秒 |
| original | 3 passed | 20.3 秒 |
| 公開專案：既有練習 | 1 passed | 7.1 秒 |
| 原範例專案：既有練習 | 1 passed | 6.8 秒 |

兩個範例專案與獨立副本的型別檢查都通過。本輪沒有另外注入失敗驗證環境關閉，也沒有多次重跑判定穩定性。秒數只記錄本次結果，不用來比較效能。

## 和其他版本比較

| 檢查項目 | 第 15 章手寫版 | original | 前一輪 revised | 本輪精簡提示詞的 revised |
| --- | --- | --- | --- | --- |
| AAA | 每支一組 | 依案例步驟與預期結果加註解 | T03 有兩組 | 三支各一組；T02、T03 的原狀態確認放在 Arrange |
| 登入測試 | 自行登入 | 自行登入 | 自行登入 | 自行登入 |
| 其他測試的登入準備 | signedInOrders Fixture 提供訂單頁物件 | 各測試重寫登入 | managementPage Fixture 提供 Page | restaurantPage Fixture 提供 Page |
| 外送員環境 | driverPage Fixture 提供，finally 關閉 | 測試尾端 close，中途失敗可能跳過 | 測試呼叫 withIsolatedPage，函式 finally 關閉 | driverPage Fixture 提供，finally 關閉，更接近手寫版 |
| 跨角色等待 | 先等外送員空清單，再查餐廳 | 同樣先等空清單再查餐廳 | 先等空清單再查餐廳 | 等 noActiveDelivery 出現後才重新查餐廳 |
| T03 的 Act | 確認指定訂單送達 | 依案例步驟排列 | 送達與查詢分成兩組 Act | 送達、等待與餐廳重新整理都在同一個 Act；仍比手寫版範圍大 |
| 訂單狀態定位 | data-order-id 找列，再找 order-status | 顯示編號找列，比對整列 | order-row 搭配顯示文字找列，再找 order-status | order-row 搭配完整的顯示編號文字找列，再找 order-status |
| 外送員送達按鈕 | 在指定編號的卡片內找按鈕 | 全頁按鈕 | 指定卡片內按鈕 | 全頁 complete-delivery；這點未達到手寫版 |
| 頁面分工 | 各頁面類別放定位器與動作，Workflow 串接導覽 | 都寫在測試 | pages 定位器、steps 動作，多層轉呼叫 | 回傳定位器物件與動作物件的函式；仍有分開查檔的成本 |
| expect | 網頁驗收留在測試，頁面物件無 expect | 留在測試 | pages、steps 無 expect | pages 無 expect，驗收留在測試；等待方法使用 waitFor |

本輪保留三個案例原有的驗收，另外增加登入前頁面路徑、備餐前按鈕存在的確認。手寫版、original、共用資料準備及既有練習的檔案雜湊都與實驗前相同。

## 第三支測試的重點

以下是這次模型產出的原文。外送員頁面由測試參數 driverPage 提供，測試不再自行建立 context，也沒有 withIsolatedPage 回呼，整支只有一組 AAA。

```typescript
    // Arrange: 餐廳管理者已登入、外送員只有一筆進行中配送（兩者使用獨立瀏覽器環境）
    // 1. 餐廳管理者依訂單編號確認該筆訂單顯示「配送中」。
    await expect(orders.status(deliveryOrderId)).toHaveText('配送中');

    // 2. 外送員從「體驗登入」進入工作台，再開啟進行中配送，確認指定編號的訂單出現在清單中。
    await driver.enterWorkbench();
    await driver.openActiveDelivery();
    await expect(delivery.orderLabel(deliveryOrderId)).toBeVisible();

    // Act: 3. 外送員按下該筆訂單的「確認已送達」。
    await driver.completeDelivery();
    await driver.waitUntilNoActiveDelivery();

    // 4. 餐廳管理者重新整理訂單清單，查看同一筆訂單。
    await restaurant.refresh();

    // Assert
    await expect(delivery.noActiveDelivery).toContainText('目前沒有進行中的配送');
    await expect(orders.status(deliveryOrderId)).toHaveText('已送達');
```

waitUntilNoActiveDelivery() 只等待空清單元素顯示，後面的 expect 才核對訊息文字。因此，餐廳重新整理之前已先等待外送員畫面更新。手寫版把這段等待與餐廳查詢放在 Assert；本輪放在 Act，分段方式還不完全一樣。

## 仍要審查的送達按鈕

本輪先確認目標訂單的編號出現在外送員清單，按送達時卻沒有傳入編號：

```typescript
completeDelivery: () => delivery.completeDelivery.click(),
```

對應定位器是：

```typescript
completeDelivery: page.getByTestId('complete-delivery'),
```

第 15 章手寫版則先找指定編號的卡片，再在卡片裡找送達按鈕：

```typescript
async confirmDelivered(orderId: number) {
  await this.order(orderId).getByRole('button', { name: '確認已送達', exact: true }).click();
}
```

這個案例的前置只有一筆進行中配送，所以本輪仍能通過。若清單有多筆訂單，全頁按鈕的定位就可能匹配到多個元素；本輪未實測多筆情境，不能宣稱已支援。訂單列也仍依賴補零後的顯示格式，與手寫版直接使用 data-order-id 不同。

## 程式結構與判斷

前一輪 revised 有 8 個 TypeScript 檔案，共 232 行；本輪合併後有 4 個，共 176 行。統計包含正式測試、共用程式、註解和空白行，不把檔案數與行數當成品質分數。

這輪移除了前一輪額外的回呼與部分只轉呼叫的步驟函式，讀測試時較容易順著一組 AAA 看完，也保留了網頁驗收。定位器與動作仍放在兩個檔案、兩種物件裡；driverActions 也同時負責登入、導覽與送達，未像手寫版依頁面與 Workflow 分工。

這次精簡提示詞在 AAA 和資源準備上更接近手寫版，跨角色等待也符合要求；它沒有保證所有定位器與程式結構都同樣好。這是一次獨立生成的觀察，不能把結果推論為提示詞每次都能產生相同品質。

## 檔案與重跑指令

正式程式在 tests/e2e/chapters/ch16/generated/revised/：

```text
revised/
├── prompt.txt
├── ui-generated.spec.ts
├── fixtures/roles.ts
└── pages/
    ├── actions.ts
    └── locators.ts
```

只保留最新 revised 的正式程式，沒有額外複製另一套測試。生成時的三個檔名與工具呼叫可在 generation/revised-tools.json 查看。書稿沒有修改，兩個範例專案已同步。

先依專案說明，以專用本機練習資料庫啟動 API（8081）、管理站內部服務（5180）與網站入口（8082），從範例專案根目錄執行：

```bash
cd tests/e2e/chapters
npx playwright test -c playwright.agent-loop.config.ts ch16/generated/revised/ui-generated.spec.ts --grep 'CH15-T0[123]' --workers=1 --retries=0 --trace=on
npx playwright test -c playwright.agent-loop.config.ts ch16/generated/original/ui-generated.spec.ts --grep 'CH15-T0[123]' --workers=1 --retries=0 --trace=on
npx playwright test -c playwright.first-part.config.ts ch15/manual/ui-manual.spec.ts --workers=1 --retries=0 --trace=on
npm run typecheck
```

這些指令在 macOS Terminal 與 PowerShell 的寫法相同，本輪只在 macOS 實跑。trace、截圖與詳細報告放在兩個專案各自的 tests/e2e/chapters/test-results/direct/ch16-revised-concise-latest/，不納入 Git。
