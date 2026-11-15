# v2 設計說明：第二部分（第 20～36 章）在這組案例的實際運用

本文只說明程式如何組織、為什麼這樣選。程式碼尚未執行，**這裡不宣稱任何測試通過或失敗**。

## 範圍

27 個案例與 `cases.json` 一一對應，每個案例一個 `test`，標題以唯一 ID 開頭，ID 同時用來查 `accounts.json` 的專屬帳號（`support/fixtures.ts` 的 `caseId`）。

| 檔案 | 案例 |
|---|---|
| `specs/auth.spec.ts` | AUTH-T01、T02、T03 |
| `specs/driver-claim.spec.ts` | ROLE-T01、T02 |
| `specs/order-search.spec.ts` | FIND-T02～T08 |
| `specs/order-ready.spec.ts` | READY-T02、T05、T06 |
| `specs/meals.spec.ts` | MEAL-T01～T06、T08 |
| `specs/account.spec.ts` | ACCOUNT-T01～T05 |

含多種輸入或回應的案例都在同一個 test 內以 `test.step` 逐項完成：FIND-T02（ID／姓名／地址 × 大小寫與空白）、MEAL-T03（空名稱／負數／小數）、MEAL-T05、ACCOUNT-T03（四個必填欄位＋錯誤 email）、READY-T06（HTTP 500／`status:failed`）、AUTH-T03、FIND-T07 等。

## 目錄

```
support/
  env.ts            環境變數、accounts.json 讀取（密碼只從 TEST_PASSWORD 讀，不輸出）
  domain.ts         狀態對照、型別、FIND-02 搜尋規則
  fixtures.ts       caseId／stage／session 與 storageState 覆寫
  api/              role-client（Strategy）、repositories、stage
  builders.ts       MealBuilder、ProfileBuilder
  order-mother.ts   命名的訂單情境（Cooking／Ready／On the way／Delivered）
  network.ts        RequestStub（Stub + Spy）、Gate
  assertions.ts     自訂領域斷言
  pages/            POM + Component + 就緒條件
specs/              27 個案例
```

## 各章對照

| 章 | 採用？ | 實際做法與理由 |
|---|---|---|
| 20 POM | 採用 | `SignInPage`、`OrdersPage`、`MealsPage`、`MealFormPage`、`AccountPage`、`DriverOrdersPage`、`DriverDeliveryPage`。Page Object 只放 Locator 與操作；`expect` 驗收留在 spec。例外是 `waitUntilReady()`／`expectLoaded()`，屬於第 24 章的就緒條件。 |
| 21 Locator | 採用 | 順序為 role → label → test id → text。列內操作一律先以 `data-order-id`／`data-meal-id` 精確定位，不用 `nth`、第一列或同名顧客。外送員頁面沒有 `data-order-id`，改用該列唯一的 `#0012` 補零編號（`exact`）。沒有新增或臆測任何 test id。 |
| 22 Page Factory | **不採用** | 每個測試只用 1～3 個 Page Object，建構子都只需要 `page`，直接 `new` 最清楚。包一層 Factory 只會把 `new X(page)` 換成 `getX()`。 |
| 23 Component | 採用 | `OrderRow`、`MealRow`、`DispatchRow` 只在傳入的 root 內操作；Page 負責找出那一列。沒有硬套 Composite。 |
| 24 Loadable | 採用 | 每頁 `waitUntilReady()` 檢查 URL、標題、表格，再加上「資料真的載入完」：訂單頁等「正在載入訂單…」消失且重新整理鈕可按；設定頁與編輯頁一開始欄位是空的，所以必須用 `expectLoaded()` 等到 API 回讀的值出現。全程沒有 `waitForTimeout`。需要的「暫停」一律用 `Gate` 控制請求，不是猜時間。 |
| 25 Workflow／Fluent | 不採用 | 跨頁流程只有「登入」，且 AUTH-T01／T03 要在測試中清楚看到登入步驟；為此包 Facade 不值得。 |
| 26 Screenplay | 不採用 | 角色與任務的重組需求不高。多角色的複雜度已由 API 層的 Strategy／Repository 吸收（見 31、32 章）；UI 每個案例只有一個角色。 |
| 27 Fixture | 採用 | test scope 的 `stage`（每個測試自己的 request context，結束時 dispose）與 `caseId`；`session` 是 option，覆寫內建 `storageState`，讓內建 `page`／`context`（含 trace、截圖）直接帶登入狀態，不另外開 context。只建立測試用到的東西，沒有 General Fixture；資料狀態都不放 worker scope。 |
| 28 DDT | 採用（有節制） | 只用在「流程相同、只有輸入不同」的地方：MEAL-T03、ACCOUNT-T03、FIND-T02 的查詢表、MEAL-T05 搜尋表、READY-T06 的兩種失敗。每列有標題；各列不依賴前一列留下的狀態（每列重新載入頁面）。 |
| 29 Builder | 採用 | `MealBuilder`（預設值確定，不使用亂數或時間，名稱以案例 ID 為前綴）與 `ProfileBuilder`（以 API 讀回的原始資料為起點，只改電話、地址）。測試中會影響結果的值（價格 120、150、0）直接寫在測試裡。 |
| 30 Object Mother | 採用（小範圍） | `OrderMother` 只命名會在 FIND／READY／ROLE 反覆出現的訂單情境：`cooking`、`ready`、`onTheWay`、`delivered`。因為沒有「設定狀態」的 API，每個情境都走合法流程；顧客有未完成訂單不能再下單，所以同一顧客的第二筆要等第一筆 Delivered。它只組合 Repository，不寫 SQL。 |
| 31 Strategy／Adapter | Strategy 採用、Adapter 不採用 | 店家用 Bearer header，顧客與外送員用 `access_token`（query／form），這是「同一動作、不同做法」，用 `AuthStrategy` 解決。不需要 Adapter：本輪沒有「跨角色用同一介面做同一件事」的測試。 |
| 32 Repository | 採用（只有真實 API 版） | `RestaurantRepository`、`CustomerRepository`、`DriverRepository` 隱藏 URL、HTTP 與 body 解析。每個方法同時檢查 HTTP 狀態與 `status:'failed'`（後端常回 200＋failed）。**刻意不做 in-memory fake**：本輪要驗證的就是真實後端，Fake 的綠燈不能當證據。 |
| 33 Test Double | 採用 | `RequestStub` 只攔截指定 method＋URL：Stub 控制回應（500、`status:failed`、延遲），Spy 統計請求數。用於 FIND-T07／T08、READY-T05／T06、MEAL-T03／T06／T08、ACCOUNT-T03／T04／T05。持久化、權限與狀態一律用真實 API 回讀；被 Stub 的失敗案例還會回讀確認資料沒有被改動。 |
| 34 平行 | 不採用 | `playwright.config.ts` 固定 `workers: 1`、`fullyParallel: false`，資料庫是共用快照。每個案例使用專屬帳號與專屬餐廳，不會互相干擾，但本輪不調整平行度。 |
| 35 Flaky | 原則採用 | 沒有固定等待、沒有重試。全部用 web-first assertion 或 `expect.poll` 等可觀察結果。成功通知先於列表 reload 出現（READY-T02），所以最後等的是目標狀態文字，不是通知。`Gate` 讓「回應尚未完成」成為確定性的狀態而不是賽跑。 |
| 36 審查 AI 產生的測試 | 採用 | `assertions.ts` 放自訂領域斷言（`expectOrderStatus`、`expectOrdersShown`、`expectStatusTabCounts`），名稱描述業務結果，且每個斷言只檢查一件事。案例層級的驗收（要看哪筆訂單、預期什麼狀態）仍寫在測試裡。 |

## 資料準備與登入

- 所有資料經真實 API 合法流程建立：餐廳新增餐點 → 顧客下單 → 店家備餐完成 → 外送員接單／完成配送。沒有發明 endpoint，也沒有 reset／seed。
- 每筆新訂單的 ID 以「下單前後的餐廳訂單列表差集」取得，不假設 ID 或順序。
- 管理站與外送員頁面的 Given「已登入」由 `session` 以真實 `POST /api/social/token/` 取得的 token 預載到 localStorage。顧客與外送員網站本來就沒有登入 UI；AUTH-T01／T03 的登入與登出則完全走真實 UI。
- 所有案例要求的網頁步驟（登入、導覽、搜尋、篩選、點擊備餐完成、接單、新增與編輯餐點、儲存設定）都由瀏覽器真正執行；API 只用於準備資料與回讀。

## 對規格的解讀與限制（請審查）

1. **ROLE-T02**：依規格，外送員 B 已有一筆進行中配送時再接單應被拒，並顯示 `Your outstanding order is not delivered yet.`。程式維持這個預期。靜態閱讀後端 `driver.py` 時，目前實作的是「進行中配送達 3 筆才拒絕」且訊息為中文，與規格不一致；若實際執行確實如此，應保留失敗，不得改預期。
2. **MEAL-T08**：規格要求「顯示載入失敗提示，不能當成正常的空白新增表單」。測試斷言載入失敗提示、沒有「新增餐點」標題與提交鈕，並確認原餐點沒有被改動。規格沒有定義失敗後表單是否要停用，所以不替它新增這個預期。
3. **ACCOUNT-T04**：為了讓「沒有本次成功提示」與「每次開始保存會清除前次成功提示」有意義，先做一次真實保存，再做被 Stub 的保存。原案例的條件（保存回應未完成後回 500）完整保留。
4. **FIND-T02**：`matchesOrderSearch`（`domain.ts`）只實作規格 FIND-02 的文字規則（原始數字 ID、姓名、地址、忽略大小寫、去前後空白、包含比對），用來算出「這個查詢應該顯示哪些訂單」；目標訂單必定包含在內，並同時檢查其他訂單不在畫面上。畫面上補零的 `#0001` 不保證能搜尋，規格將它列為待確認，因此沒有測試。
5. **FIND-T03／T04**：兩位顧客的姓名取自後端實際回傳，測試先確認它們彼此不相符，才使用姓名搜尋；若帳號資料讓兩人姓名無法區分，這個前提檢查會失敗，應視為資料問題回報。
6. **Stub 為持續生效的規則**：管理站以 React StrictMode 啟動，開發模式下載入型 GET 會重複送出，所以 `RequestStub` 的規則對之後每個符合的請求生效，GET 請求數只斷言「大於 0」或「大於重新整理前」，只有 POST／PUT／PATCH 才斷言精確次數。
7. 地址欄位會受伺服器的示範模式影響（可能被改寫），因此地址片段取自後端回傳的實際地址。

## 尚未驗證

- 未執行任何命令，也未連線；TypeScript 型別與 Locator 實際命中狀況都需要由外部第一次執行來確認。
- 若執行發現 Locator 或資料前提不成立，應優先修正 `support/pages/` 或 `support/order-mother.ts`，而不是調整 spec 的預期。
