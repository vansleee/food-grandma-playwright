# 第二部分：以 v1 實際程式碼選擇章節素材

更新日期：2026 年 11 月 8 日（台灣時間）。表格使用 35 章版的章號，測試編號和下方的歷史實驗紀錄沿用當時的編號。

每章一份主要測試檔，內有未使用本章做法、v1、v2 三組，統一採 Arrange／Act／Assert。各組只改本章模式相關部分；前面已介紹的帳號、POM 與共同 API 驗收繼續使用。每份測試直接呈現準備、網頁步驟與結果檢查，沒有用函式代跑完整測試。

第 19 章另用新增的顧客訂餐情境，比較 POM、流暢介面（Fluent Interface）與 Workflow Facade，不冒充原始 v1、v2 的輸出。Facade 只安排本章的訂購步驟，驗收仍留在測試中。

來源與教學延伸記在 [comparisons.json](../../tests/e2e/chapters/comparisons.json)，章節內的 COMPARISON.md 已移除。

| 章 | 主題 | 各版主要差異 | 範例 | 實測（同一順序） |
| --- | --- | --- | --- | --- |
| 15 | Page Object Model | 直接定位／定位器 POM／方法型 POM | [完整測試](../../tests/e2e/chapters/ch15/pom/meal-price.spec.ts) | 1 通過／1 通過／1 通過 |
| 16 | 定位元素 | 第一列／依編號 CSS／依編號組合定位器 | [完整測試](../../tests/e2e/chapters/ch16/locators/meal-price.spec.ts) | 1 通過／1 通過／1 通過 |
| 17 | Page Factory | 直接建立／直接建立／Page Factory（延伸） | [完整測試](../../tests/e2e/chapters/ch17/meal-price.spec.ts) | 1 通過／1 通過／1 通過 |
| 18 | Component Object Model | 列內連結／列內連結／MealRow 元件 | [完整測試](../../tests/e2e/chapters/ch18/meal-price.spec.ts) | 1 通過／1 通過／1 通過 |
| 16 | 功能就緒 | 直接檢查／直接檢查／具名就緒方法 | [完整測試](../../tests/e2e/chapters/ch16/locators/page-readiness.spec.ts) | 1 通過／1 通過／1 通過 |
| 19 | 流暢介面與 Workflow Facade | 逐步呼叫 POM／流暢介面／Workflow Facade（新增情境） | [顧客訂餐測試](../../tests/e2e/chapters/ch19/customer-order.spec.ts) | 1 通過／1 通過／2 通過（含 CH25-T02，11 月 6 日） |
| 20 | Screenplay | POM 加 Workflow／Screenplay（兩版皆有單筆與雙筆訂單） | [完整測試](../../tests/e2e/chapters/ch20/multi-role-order.spec.ts) | 2 通過／2 通過；另有 5 個清理檢查 |
| 21 | Fixture 與資料隔離 | General Fixture／按用途拆分的 Fixture | [外送員接單兩版](../../tests/e2e/chapters/ch21/driver-claim.spec.ts) | 各 1 支通過 |
| 22 | 資料驅動測試 | 逐一宣告兩支新增餐點測試／每列 CSV 宣告一支測試 | [新增餐點對照](../../tests/e2e/chapters/ch22/meal-create.spec.ts) | 改寫前 2 通過／改寫後 2 通過 |
| 23 | Test Data Builder | 直接寫訂餐資料／使用 OrderBuilder | [一份與兩份雞腿便當](../../tests/e2e/chapters/ch23/order-quantity.spec.ts) | 改寫前 2 通過／改寫後 2 通過 |
| 23 | Object Mother | 逐步建立／seedTwoOrders／OrderMother | [完整測試](../../tests/e2e/chapters/ch23/order-scenarios.spec.ts) | 1 通過／1 通過／1 通過 |
| 24 | Strategy 與 Adapter | 欄位及認證直接寫出／API 包裝／Adapter 與認證 Strategy | [完整測試](../../tests/e2e/chapters/ch24/meal-price.spec.ts) | 2 通過／2 通過／2 通過 |
| 25 | Repository 與 Fake | 直接 API／API 包裝／Repository，加 Fake 補充 | [完整測試](../../tests/e2e/chapters/ch25/meal-price.spec.ts) | 3 通過／3 通過／5 通過 |
| 封存 | Test Double 與網路模擬 | 原生 page.route／原生 page.route／Stub、Gate 封裝 | [完整測試](../../tests/e2e/chapters/archive/ch33/network-failure.spec.ts) | 1 通過／1 通過／1 通過 |
| 26 | 平行執行 | 循序／循序／兩個 worker | [完整測試](../../tests/e2e/chapters/ch26/parallel-meals.spec.ts) | 2 通過／2 通過／2 通過 |
| 27 | Flaky Test 與條件等待 | 固定等待 200 ms／條件等待／具名條件等待 | [完整測試](../../tests/e2e/chapters/ch27/meal-load.spec.ts) | 10 通過、10 失敗／20 通過／20 通過 |
| 28 | 審查與整理測試程式 | 直接組合步驟／POM 步驟／具名 Workflow（延伸） | [完整測試](../../tests/e2e/chapters/ch28/meal-price.spec.ts) | 1 通過／1 通過／1 通過 |

## 閱讀與寫作時保留的判斷

v1 原本已有 POM、依編號定位、API Fixture、資料表與條件等待，不能把所有未使用版都說成 AI 原本的問題。章節版本只抽出當章的差異；沒有用過的模式可以列為教學延伸，不能冒充原始 v2 的輸出。

第 21 章本輪只有一筆餐點，第一列定位通過不能證明多筆資料或重排後仍正確。第 24 章的未使用版仍有條件檢查，只是沒有具名就緒方法。第 27 章兩版都使用 Playwright Fixture，差別在前置作業的範圍與分工。

第 30 章仍驗證 FIND-T03 的搜尋與待取餐篩選，差別在資料準備。第 31 章的 Adapter 呼叫端是教學安排，認證 Strategy 另以相同角色端點比較。第 32 章 Fake 的兩次補充不代表網頁、後端或權限已驗證。第 33 章三版皆使用網路模擬，差別是是否封裝攔截規則。

第 35 章固定等待是刻意安排的反例。二十次中十次失敗，對應 900 毫秒的延遲；v1、v2 各二十次通過。原始 v1 已有條件等待，不把這個反例當成原始程式的缺陷。

第 25 章三版皆使用相同 POM。流暢介面版保留顧客行為的順序，需額外維護記錄與執行步驟的程式；Workflow Facade 集中完整訂購流程，適合其他測試準備訂單時重複使用。這是實際網站支援的新教學情境，不是原始 v1 的缺陷或原始 v2 的產出，也沒有量測長期維護時間。

## 執行紀錄

[第 25 章顧客訂餐](ch25-customer-order/README.md)：2026 年 11 月 5 日改用訂餐情境，三版各執行一次，全部通過；訂單與餐點明細比對一致。下方 125 次是前一次全章驗證，仍保留更新前的第 25 章結果。

[本輪紀錄](chapter-three-versions-aaa/README.md)：125 次執行，115 通過、10 次固定等待反例失敗；其他章節及 v1、v2 全部通過。除固定等待反例外，三版的餐點與訂單最終資料比對一致。兩個 worker 的測試有實際重疊。

[原始獨立生成](specs-v1-v2/README.md)、[平行與等待對照](parallel-and-flaky/RESULTS.md)、[五種模式完整實驗](pattern-comparisons/RESULTS.md)、[先前雙組對照](chapter-before-after/README.md) 另行保留。歷史紀錄中的舊路徑不代表目前主線的檔案配置。

[第 25 章兩筆訂單實作](ch25-two-orders/README.md)：原有三版保留，Workflow Facade 另加 CH25-T02 搜尋測試，不作為三版共同案例比較；共四個測試通過。

第 26 章依 review 修正分工與清理，並新增 CH26-T03 的五角色情境。目前範例比較角色分工的 POM 與 Screenplay。完整過程見 [先前的實驗紀錄](ch26-review/README.md)。

第 28 章新增餐點對照於 2026 年 11 月 7 日實跑。CH28-T03 沿用 MEAL-T01 的一般價格情境，新增 120 元香煎雞腿便當。CH28-T04 沿用 MEAL-T04 的零元情境，新增 0 元試吃小菜。兩版各以獨立資料庫執行兩支測試，零重試，四支均通過。兩版都從網頁新增，再透過 API 和重新整理後的列表核對同一筆餐點。執行後直接查詢兩份資料庫，餐點名稱、描述、價格與空白圖片網址皆一致。先前的[修改價格範例](../../tests/e2e/chapters/ch22/meal-prices.spec.ts)仍可供參考。
