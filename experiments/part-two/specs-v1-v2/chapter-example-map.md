# 第二部分：以 v1 實際程式碼選擇章節素材

更新日期：2026 年 11 月 4 日（台灣時間）。這份文件整理各章可使用的實際程式、值得討論的判斷與實測結果，書稿尚未修改。

素材包含三組：

- [原始 v1／v2 比較](RESULTS.md)：兩版直接讀取相同 specs，以獨立 session 產生；只有 v2 額外閱讀第二部分。v1 只修正過帳號檔相對路徑，沒有刻意加入壞味道。
- [第 34、35 章實驗](../parallel-and-flaky/RESULTS.md)：從 v1 另外建立平行執行、共用餐點與等待方式的對照，實際執行 216 次案例。
- [五種模式的延伸實驗](../pattern-comparisons/RESULTS.md)：補上 Page Factory、Workflow Facade、Screenplay、Adapter 與 Repository Fake。五組前後對照共 20 個真實 E2E，加上真實 API、Fake 各四個契約案例，28 個全部通過。

後兩組依教學需求另外撰寫，原始 v1、v2 保留不動。每章都能從 v1 開始，但應分清楚哪些是原本已有的寫法、哪些是後續加入的比較範例。

| 章 | 主題 | v1 實際位置 | 可以討論的判斷 | v2 與已完成的延伸對照 |
| --- | --- | --- | --- | --- |
| 20 | POM | [v1/support/pages.ts](../../../tests/e2e/v1/tests/support/pages.ts#L34) | 已經有頁面物件。可以從保留哪些職責、六個類別是否需要拆檔開始，而非捏造完全沒有 POM 的第一版。 | [v2/support/pages/orders-page.ts](../../../tests/e2e/v2/tests/support/pages/orders-page.ts#L21) |
| 21 | 定位元素 | [v1/support/pages.ts](../../../tests/e2e/v1/tests/support/pages.ts#L52) | 已依訂單編號選列，值得保留；頁尾與頁籤仍使用 CSS 類別，可以討論畫面改版會影響哪些地方。沒有實測改版破壞案例。 | [v2/support/pages/orders-page.ts](../../../tests/e2e/v2/tests/support/pages/orders-page.ts#L59) |
| 22 | Page Factory／Fixture | [v1/meals.spec.ts](../../../tests/e2e/v1/tests/meals.spec.ts#L64) 的 `new MealsPage(page)`、`new MealFormPage(page)`。 | 直接建立兩個物件已經清楚。集中建立後省下什麼？每個 Factory 是否仍只使用目前測試的 page？可以比較便利與多一層類別的代價。 | v2 沒有採用 Factory。延伸實驗的 [before](../pattern-comparisons/examples/page-factory/before.spec.ts)、[after](../pattern-comparisons/examples/page-factory/after.spec.ts) 各 2/2 通過；[FoodGrandmaPages](../pattern-comparisons/examples/page-factory/food-grandma-pages.ts) 統一建立兩個 POM。測試檔由 22 行變成 24 行，另增加 13 行 Factory，沒有程式量減少的證據。 |
| 23 | Component | [v1/support/pages.ts](../../../tests/e2e/v1/tests/support/pages.ts#L52) | OrdersPage 直接處理一列的狀態與按鈕。可討論將「找哪一列」與「列內做什麼」分開。 | [v2/support/pages/orders-page.ts](../../../tests/e2e/v2/tests/support/pages/orders-page.ts#L5) |
| 24 | 功能就緒 | [v1/support/pages.ts](../../../tests/e2e/v1/tests/support/pages.ts#L47) 的等待條件，以及 [MEAL-T02](../../../tests/e2e/v1/tests/meals.spec.ts#L75) 確認表單原值的步驟。 | v1 已經等待資料載入。可以討論表格出現、載入文字消失、價格欄位出現原值，各自能確認什麼。本章說明等待條件，第 35 章再用重跑結果驗證等待方式。 | v2 的 [expectLoaded()](../../../tests/e2e/v2/tests/support/pages/meals-pages.ts#L86) 集中確認原值；第 35 章的 [條件等待版本](../parallel-and-flaky/ch35/after/price-edit.spec.ts) 提供實測對照。 |
| 25 | Fluent／Workflow Facade | [openManagementAs()](../../../tests/e2e/v1/tests/support/pages.ts#L13)，以及 [MEAL-T02](../../../tests/e2e/v1/tests/meals.spec.ts#L61) 開啟列表、進入編輯頁面、填價與儲存的步驟。 | 哪些步驟組成值得命名的任務？流程方法讓測試更容易閱讀後，讀者還能否看見資料準備與預期結果？Fluent 的連續呼叫與跨頁流程應分開說明。 | v2 沒有 Workflow Facade，已有 [Builder 的連續呼叫](../../../tests/e2e/v2/tests/support/builders.ts)。延伸 [before](../pattern-comparisons/examples/workflow/before.spec.ts)、[after](../pattern-comparisons/examples/workflow/after.spec.ts) 各 2/2 通過；[MealPriceWorkflow](../pattern-comparisons/examples/workflow/meal-price-workflow.ts) 提供 `openEditor()`、`changePrice()`。測試檔由 22 行變成 16 行，另增加 28 行流程實作，驗收檢查仍保留在外面。 |
| 26 | Screenplay | [World](../../../tests/e2e/v1/tests/support/fixtures.ts#L12) 的多角色資料準備，以及 [MEAL-T02](../../../tests/e2e/v1/tests/meals.spec.ts#L61) 直接使用 POM 的步驟。 | 準備多角色資料，與把網頁任務拆成 Actor、Task、Question 有什麼不同？這份 v1 沒有 POM 肥大失控的證據，可以直接比較兩種表達方式及額外結構。 | v2 沒有 Screenplay。延伸 [before](../pattern-comparisons/examples/screenplay/before.spec.ts)、[after](../pattern-comparisons/examples/screenplay/after.spec.ts) 各 2/2 通過；[Actor／Task／Question](../pattern-comparisons/examples/screenplay/screenplay.ts) 重複使用同一組餐點編輯任務。測試檔由 22 行變成 20 行，另增加 42 行支援程式。已驗證單一網頁角色，尚未驗證跨角色旅程重組的效益。 |
| 27 | Fixture 與隔離 | [api Fixture 與 World](../../../tests/e2e/v1/tests/support/fixtures.ts#L67)。 | 可以重複使用準備程式，但會被修改的資料是否也能共用？每個測試應取得什麼帳號與餐點？釋放 API context 與清理資料是不同工作；本次資料由整輪獨立資料庫隔離。 | v2 的 [Fixture](../../../tests/e2e/v2/tests/support/fixtures.ts#L21) 準備帳號與登入狀態。另可對照 [共用餐點 Fixture](../parallel-and-flaky/ch34/support/shared-fixture.ts) 與 [各自建立餐點的 Fixture](../parallel-and-flaky/ch34/support/isolated-fixture.ts)：前者三輪平行執行共 3 通過、3 失敗，後者 6 次全部通過。第 27 章說明資料準備，第 34 章展開干擾的實測過程。 |
| 28 | 資料驅動測試 | [v1/meals.spec.ts](../../../tests/e2e/v1/tests/meals.spec.ts#L114) | 空名稱、負數、小數已用資料表走相同步驟，是現成的正面例子；可比較表格如何寫才看得懂，不必先改壞。 | [v2/specs/meals.spec.ts](../../../tests/e2e/v2/tests/specs/meals.spec.ts#L75) |
| 29 | Builder | [v1/meals.spec.ts](../../../tests/e2e/v1/tests/meals.spec.ts#L66) | 餐點直接用物件準備，Api.createMeal 已補部分預設值。可用新增欄位時要改哪些地方討論 Builder；本輪沒有實測新增欄位。 | [v2/support/builders.ts](../../../tests/e2e/v2/tests/support/builders.ts#L7) |
| 30 | Object Mother | [v1/order-search.spec.ts](../../../tests/e2e/v1/tests/order-search.spec.ts#L7)、[v1/order-ready.spec.ts](../../../tests/e2e/v1/tests/order-ready.spec.ts#L6) | 不同檔案各自準備訂單，seedTwoOrders 用布林值決定第二筆是否待取餐。可比較「技術步驟與開關」和「有名稱的訂單情境」。 | [v2/support/order-mother.ts](../../../tests/e2e/v2/tests/support/order-mother.ts#L15) |
| 31 | Strategy／Adapter | [v1/support/api.ts](../../../tests/e2e/v1/tests/support/api.ts#L34) 的 Bearer、access_token 與餐點參數。 | Strategy 可以從不同認證方式談起；Adapter 則比較既有介面如何接上呼叫端。兩者處理的差異要分清楚，不必把不同角色的能力硬湊成同一件事。 | v2 已有 [認證 Strategy](../../../tests/e2e/v2/tests/support/api/role-client.ts#L7)，沒有 Adapter。延伸 [before](../pattern-comparisons/examples/adapter/before.spec.ts)、[after](../pattern-comparisons/examples/adapter/after.spec.ts) 各 2/2 通過；[V1MealAdapter](../pattern-comparisons/examples/adapter/v1-meal-adapter.ts) 集中 title／description／amount 與 v1 欄位的轉換。測試檔同為 26 行，另增加 25 行 Adapter。這是另行安排的欄位介面情境，沒有驗證跨角色的共同能力介面。 |
| 32 | Repository／Fake | [v1 Api 的餐點與訂單方法](../../../tests/e2e/v1/tests/support/api.ts#L55)。 | API 細節已集中，改成 Repository 後增加了什麼分工？同一份資料準備程式能否換用 Fake？應讓讀者看見實作替換的範圍，以及真實 E2E 仍需確認的事。 | v2 已有 [各角色 Repository](../../../tests/e2e/v2/tests/support/api/repositories.ts#L15)。延伸 [before](../pattern-comparisons/examples/repository/before.spec.ts)、[after](../pattern-comparisons/examples/repository/after.spec.ts) 各 2/2 真實 E2E 通過；[同一份契約案例](../pattern-comparisons/examples/repository/contract/meal-repository.spec.ts) 注入 [API 實作](../pattern-comparisons/examples/repository/meals-repository.ts) 或 [記憶體 Fake](../pattern-comparisons/examples/repository/in-memory-meals-repository.ts)，各 4/4 通過。Fake 未啟動服務、未提供密碼，HTTP 請求數為 0。 |
| 33 | Test Double／網路模擬 | [訂單更新](../../../tests/e2e/v1/tests/order-ready.spec.ts#L48)、[餐點儲存](../../../tests/e2e/v1/tests/meals.spec.ts#L227)、[帳戶儲存](../../../tests/e2e/v1/tests/account.spec.ts#L120) 各自使用 Promise、route 與計數器。 | 可以用實際程式分辨 Stub 的回應控制、Spy 的請求計數，以及 Fake 真正保存和更新資料的行為。成功畫面與被模擬的回應，能驗證的範圍各有多少？ | v2 的 [RequestStub／Gate](../../../tests/e2e/v2/tests/support/network.ts#L4) 集中重複的網路控制。延伸的 [InMemoryMealsRepository](../pattern-comparisons/examples/repository/in-memory-meals-repository.ts) 提供 Fake 實例，四個相同行為檢查全部通過；[第 35 章載入控制](../parallel-and-flaky/ch35/support/price-case.ts) 暫停真實 GET，不替換餐點內容，適合補充延遲模擬。 |
| 34 | 平行執行 | [World 的帳號與資料準備](../../../tests/e2e/v1/tests/support/fixtures.ts#L12)，以及 [MEAL-T02](../../../tests/e2e/v1/tests/meals.spec.ts#L61) 修改既有餐點的流程。 | 先檢查原始案例是否獨立，再比較 worker 數。另一組範例讓兩個案例修改同一筆餐點，觀察為什麼各自都收到成功回應，最後卻有一個預期不符。 | 已完成 [三輪原始 v1 比較](../parallel-and-flaky/RESULTS.md)：1／4 workers 每輪皆 26 通過、同一個 ROLE-T02 失敗；耗時中位數 33.88／11.80 秒。另有 [共用餐點](../parallel-and-flaky/ch34/support/shared-fixture.ts) 與 [獨立餐點](../parallel-and-flaky/ch34/support/isolated-fixture.ts) 對照：共用版每輪 1 通過、1 失敗；隔離後三輪共 6 次全部通過。碰撞時間由 [實驗同步點](../parallel-and-flaky/ch34/support/test-base.ts) 刻意安排。v2 未做這組平行驗證。 |
| 35 | Flaky Test | [FIND-T07 的延遲控制](../../../tests/e2e/v1/tests/order-search.spec.ts#L168)，以及 [MEAL-T02 確認表單原值](../../../tests/e2e/v1/tests/meals.spec.ts#L75)。 | v1 本來已有正確等待，可以先說明值得保留的地方，再用另外建立的反例觀察固定等待為何不夠。重點是留下每次讀到的值與載入時間，讓修正有證據。 | 已完成 [固定等待 before](../parallel-and-flaky/ch35/before/price-edit.spec.ts) 與 [條件等待 after](../parallel-and-flaky/ch35/after/price-edit.spec.ts)：同一份 0／900 毫秒延遲順序各跑 20 次，before 10 通過、10 失敗，after 20 次全部通過。十次失敗皆在慢回應時讀到初始價格 0。這是受控延遲的重現結果，詳見 [逐次結果](../parallel-and-flaky/run-results.csv)，不是原始 v1 的自然失敗率。 |
| 36 | 審查與比較 | [AUTH-T02 的 sidebar 檢查](../../../tests/e2e/v1/tests/auth.spec.ts#L26)、[expectRows()](../../../tests/e2e/v1/tests/support/pages.ts#L115)，以及前面各章採用的同一組案例。 | 先確認檢查真的碰到需求，再決定保留、拆分或抽出程式。可以比較測試本身變短後，讀者還要多看哪些檔案；實測通過與容易維護應分開判斷。 | 對照 [v2 共用斷言](../../../tests/e2e/v2/tests/support/assertions.ts#L9)、[原始 v1／v2 結果](RESULTS.md) 與 [五種模式的結果](../pattern-comparisons/RESULTS.md)。原始 v2 測試檔行數較少、總程式量較多。延伸五組 E2E 前後的觀察值逐筆一致，加上 API／Fake 契約檢查共 28 個案例通過；只有部分測試檔變短，另有新增實作成本。 |

第 22、25、26、31、32 章現在已有可執行的延伸比較；第 34、35 章也已有平行與等待方式的實測。第 20、21、24、28 章可以保留 v1 已經做得好的地方，說明選擇理由。第 23、29、30、33 章則有原始 v1／v2 的結構差異可直接討論。

## 延伸範例的共同前提

五種模式各有兩個餐點編輯案例：原價 100 分別改成 150 與 0。每組 before／after 使用相同資料及驗收程式，檢查原編號、其他欄位、不重複新增與重新開啟後的價格，逐筆觀察值完全相同。第二個是本次新增的編輯輸入，不能稱為原 spec 中「新增零元餐點」的 MEAL-T04。

Repository 另外用同一份四個契約案例比較真實 API 與 Fake，驗證建立後查詢、更新時保留其他資料、找不到時不新增，以及回傳物件不會直接改動儲存內容。這八次檢查與二十次真實 E2E 分開計算。完整檔案入口：[五種模式範例](../pattern-comparisons/README.md)、[第 34／35 章範例](../parallel-and-flaky/README.md)。

## 寫作時仍須交代的範圍

- 原始 v2 是從相同 specs 獨立產生的另一版實作，沒有讀取 v1。後續延伸範例才是以 v1 為基礎建立的 before／after，不要把兩種實驗寫成同一輪生成或宣稱 v2 自行採用了所有模式。
- Screenplay 已展示單一角色的 Actor、Task、Question；Adapter 已展示另行安排的欄位介面轉換。這兩組尚未證明跨角色旅程或大型專案的維護效益。
- 第 34 章的時間包含 ROLE-T02 等待錯誤提示逾時。這個已知規格差異每輪都保留，沒有新增平行失敗；時間比較限於本機三輪結果。共用餐點的碰撞是刻意安排的教學情境。
- 第 35 章固定等待的 10/20 失敗，是在事先安排的延遲順序下重現；修正後 20/20 通過也只涵蓋本次條件。原始帳號路徑錯誤與 ROLE-T02 都不能當作 Flaky 的例子。
- 模式比較可以說明分工、可見步驟與程式量變化。本次沒有測量長期維護工時，也沒有證明每種模式都值得用在目前這兩個案例。
