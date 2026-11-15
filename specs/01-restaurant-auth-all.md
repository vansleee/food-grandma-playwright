# Food Grandma 三角色認證與權限規格（完整參考版）

狀態：根據配套專案目前實作整理的參考草案；業務權限仍須產品／作者核准，案例未執行。共用測試前提見 [README](README.md)。本文件是完整參考版；入門流程請先讀 [01-restaurant-auth.md](01-restaurant-auth.md)。

## 目的與範圍

整理 Food Grandma 三種角色——顧客、外送員、店家管理者——目前可觀察的網站入口、認證方式、主要操作與資源存取邊界，並示範如何用決策表、使用案例及狀態轉換分析權限測試。

本文件同時記錄「目前程式如何運作」與「產品應如何運作」的差異。程式碼是現況證據，不自動等同核准需求。尚未確認的項目以「待確認」標示，不應讓 AI 自行補成正式驗收條件。

涵蓋顧客下單與個人訂單查詢、外送員接單與配送、店家管理者管理訂單及相關頁面、認證與角色隔離。平台系統管理者、付款服務及通知送達不在本規格範圍。

## 角色與現況

| 角色 | 網站入口（目前可觀察） | 主要能力（目前可觀察） | 認證／API 傳遞方式 | 尚待確認 |
|---|---|---|---|---|
| 顧客 | `/customer/restaurants`、`/customer/cart`、`/customer/checkout`、`/customer/delivery` | 瀏覽餐廳與餐點、建立訂單、查詢訂單狀態及配送資訊 | seed 提供顧客存取權杖；個人化 API 依 endpoint 以 query 或 form 傳 `access_token` | 正式登入／登出 UI、未登入路由保護、本人資料隔離 |
| 外送員 | `/driver/orders`、`/driver/delivery`、`/driver/earnings` | 查看可接訂單、接單、更新配送狀態、查看收入與個人資料 | seed 提供外送員存取權杖；個人化 API 依 endpoint 以 query 或 form 傳 `access_token` | 正式登入／登出 UI、未登入路由保護、接單列表是否應要求認證 |
| 店家管理者 | `/management/sign-in`；登入後 `/management/orders` | 管理店家訂單、餐點、店家資料及報表 | `POST /api/social/token/` 簽發存取權杖；管理站 API 使用 `Authorization: Bearer <token>` | 登入是否限制 Restaurant 角色、跨店資料隔離與各操作授權 |

目前顧客與外送員網站路由可直接開啟，未見與管理站相同的登入頁／前端 route guard。這是實作觀察，是否符合產品預期待確認。

## 業務規則

- ROLE-01（待確認）：顧客與外送員是否需要正式登入、登出及未登入導向；seed 存取權杖是測試便利機制或產品認證設計。
- ROLE-02：顧客可瀏覽餐廳及餐點；下單、查詢本人訂單與配送資訊時，後端依顧客身分處理資料。
- ROLE-03：外送員可查看可接訂單、接單、更新配送狀態、查詢本人配送及收入資料。
- ROLE-04：店家管理者以店家帳密登入管理站，成功後進入 `/management/orders`。
- ROLE-05（待確認）：店家管理者只能讀取或修改其所屬店家的訂單、餐點與店家資料；跨店存取應被拒絕。
- ROLE-06：管理站在沒有前端存取權杖時，受保護路由導向登入頁。現行前端只檢查存取權杖是否存在，未先驗證其有效性。
- ROLE-07：個人化 API 應要求與資源相符的角色身分；使用其他角色存取權杖不得取得該角色的私人資料或執行專屬操作。
- ROLE-08（待確認）：各角色可存取哪些網站頁面及 API、角色錯配或存取權杖過期時的 HTTP 狀態／錯誤內容／前端呈現，應由產品確認。
- ROLE-09：`X-Demo-Reset-Key` 是測試資料 reset／seed 管理憑證，不是一般使用者角色或登入方式。

## 權限決策表

決策表以角色、資源歸屬、訂單狀態與認證狀態為條件，整理允許、拒絕及待確認的行為。標記「現況」只代表程式中可觀察到該行為；標記「待確認」的格子必須先由產品核准，不能直接成為測試判準（oracle）。

| ID | 角色 | 操作／資源 | 條件 | 預期決策 | 規格狀態／候選案例 |
|---|---|---|---|---|---|
| AUTHZ-01 | 顧客 | 瀏覽餐廳、餐點 | 公開目錄資料 | 允許 | 現況可觀察；需確認是否有其他可見性規則 |
| AUTHZ-02 | 顧客 | 建立訂單 | 存取權杖對應顧客；餐點屬於指定餐廳；顧客符合下單前提 | 允許；訂單屬於該顧客，初始為 `Cooking` | 現況候選；AUTH-T12 |
| AUTHZ-03 | 顧客 | 查詢最新訂單／配送資訊 | 存取權杖對應顧客 | 只回傳該顧客資料 | 需求待核准；AUTH-T05、AUTH-T16 |
| AUTHZ-04 | 外送員 | 查看可接訂單 | 訂單為 `Ready` 且尚未指派 | 允許列出符合條件的訂單 | 現況 API 未要求外送員 token；需確認此設計是否符合權限需求 |
| AUTHZ-05 | 外送員 | 接取訂單 | 訂單為 `Ready`、未指派，且外送員沒有未完成配送 | 允許；指派外送員並轉為 `On the way` | 現況候選；AUTH-T13 |
| AUTHZ-06 | 外送員 | 接取訂單 | 訂單非 `Ready`、已指派，或外送員已有未完成配送 | 拒絕；訂單狀態及指派維持不變 | 現況候選；AUTH-T14 |
| AUTHZ-07 | 外送員 | 完成配送 | 訂單指派給目前外送員 | 允許；狀態轉為 `Delivered` | 現況候選；AUTH-T15、AUTH-T22 |
| AUTHZ-08 | 外送員 | 更新位置／讀取個人資料 | 存取權杖對應外送員 | 只讀寫本人資料 | 現況候選；AUTH-T07、AUTH-T08 |
| AUTHZ-09 | 店家管理者 | 管理訂單、餐點、店家資料 | 存取權杖對應店家，資源屬於該店家 | 允許 | 目前功能可觀察；店家歸屬限制待核准／驗證；AUTH-T01、AUTH-T10 |
| AUTHZ-10 | 任一角色 | 存取其他角色專屬 API | 存取權杖有效但對應不同角色 | 拒絕，不回傳其他角色資料 | 現況候選；AUTH-T06、AUTH-T08、AUTH-T11 |
| AUTHZ-11 | 任一角色 | 呼叫需認證 API | 存取權杖缺少、無效或過期 | 拒絕 | 各 endpoint 行為與狀態碼待查；AUTH-T06、AUTH-T08 |
| AUTHZ-12 | 顧客／外送員 | 開啟個人化網站頁面 | 未登入或沒有存取權杖 | 導向登入、提示或拒絕 | 預期待確認；AUTH-T09 |

## 驗收情境

下列案例是規格候選。待確認案例應先由產品決定預期，再生成確定性測試。API 測試需驗證回應及資料副作用；UI 測試需驗證使用者可觀察結果，不以存取權杖存在或 HTTP 200 作為唯一成功判準。

| 案例 ID | 角色 | Given | When | Then | 主要驗證方式／狀態 |
|---|---|---|---|---|---|
| AUTH-T01 | 店家管理者 | 使用有效店家帳密且沒有既存登入狀態 | 登入 `/management/sign-in` | 導向 `/management/orders` 並顯示訂單管理內容 | Acceptance；真實 UI＋後端；現況可觀察 |
| AUTH-T02 | 店家管理者 | 店家管理站沒有 token | 直接開啟 `/management/orders` | 導向登入頁且不呈現受保護內容 | E2E；現況可觀察 |
| AUTH-T03 | 店家管理者 | 已登入管理站 | 登出後重新開啟受保護頁面 | 前端清除 token 並導向登入頁 | E2E；不宣稱後端撤銷 token |
| AUTH-T04 | 店家管理者 | 兩間不同店家各有可識別資源 | A 嘗試讀取／修改 B 的訂單或餐點 | 依核准規則拒絕跨店存取，B 的資料不變 | API 為主；資料 fixture 與規則待確認 |
| AUTH-T05 | 顧客 | 顧客 A 有一筆可識別訂單及有效 token | 查詢自己的最新訂單／狀態 | 回傳訂單屬於顧客 A | API；本人資料隔離待核准 |
| AUTH-T06 | 顧客 | 使用無效 token 或外送員／店家 token | 呼叫顧客個人化 API | 拒絕且不回傳顧客個人資料 | API；狀態碼需實測 |
| AUTH-T07 | 外送員 | 外送員 A 有可識別的配送或個人資料 | 查詢自己的訂單、收入或 profile | 回傳資料屬於外送員 A | API；逐一確認 endpoint 與資料前提 |
| AUTH-T08 | 外送員 | 使用無效 token 或顧客／店家 token | 呼叫外送員個人化 API | 拒絕且不回傳外送員個人資料 | API；狀態碼需實測 |
| AUTH-T09 | 顧客／外送員 | 沒有登入狀態 | 直接開啟個人化頁面 | 顯示的預期導向或提示由產品確認 | E2E；待核准 |
| AUTH-T10 | 店家管理者 | 店家 A、B 各有訂單；各自使用有效憑證 | A 呼叫自己的訂單 API，再嘗試存取 B 的訂單 | A 可取得自身資料；跨店資料不可讀寫 | API；跨店權限規則與 fixture 待核准 |
| AUTH-T11 | 跨角色 | 顧客、外送員、店家管理者各有有效 token 及可識別資源 | 每個角色使用自己的 token 呼叫另外兩種角色的專屬 API | 只允許符合角色的操作；不洩漏其他角色資料 | API；權限矩陣待核准 |
| AUTH-T12 | 顧客 | 有可購買餐點、有效顧客 token，且無未完成訂單 | 顧客建立訂單 | 建立屬於顧客的 `Cooking` 訂單 | API；回讀訂單歸屬及狀態 |
| AUTH-T13 | 店家管理者、外送員 | 店家訂單為 `Cooking`；有可接單外送員 | 店家將訂單標記 `Ready`，外送員接單 | 訂單依序變成 `Ready`、`On the way`，並記錄外送員 | 跨角色 API；每一步回讀資料 |
| AUTH-T14 | 外送員 | 訂單非 `Ready`、已指派，或外送員已有未完成配送 | 嘗試接單 | 接單不成功，訂單狀態與指派不變 | API；驗證回應及資料副作用 |
| AUTH-T15 | 外送員 | 訂單為 `On the way` 且指派給目前外送員 | 外送員完成配送 | 訂單變為 `Delivered` | API；回讀狀態與指派 |
| AUTH-T16 | 顧客 | 訂單屬於顧客 A；顧客 B 有有效 token | 顧客 B 查詢自己的訂單／配送資訊 | 不得取得顧客 A 的資料 | API；需兩個顧客及可識別訂單 |
| AUTH-T17 | 店家管理者 | 訂單狀態為 `Cooking` 且屬於目前店家 | 標記待取餐 | 訂單變為 `Ready` | API＋UI；狀態持久化；可與 `03-order-mark-ready.md` 對照 |
| AUTH-T18 | 店家管理者 | 訂單狀態不是 `Cooking` | 再次標記待取餐 | 訂單維持原狀 | API；現況 handler 不更新非 `Cooking` 訂單，錯誤回應須查證 |
| AUTH-T19 | 外送員 B | 訂單指派給外送員 A 且為 `On the way` | B 嘗試完成配送 | 訂單不得變為 `Delivered`，指派維持 A | API；目前 handler 對不匹配指派仍可能回 `success`，必須回讀資料 |

## 訂單狀態轉換

目前模型中的訂單狀態為 `Cooking`、`Ready`、`On the way`、`Delivered`。下表描述現況候選；每個轉換都應驗證操作者角色、資源歸屬及持久化結果。

| 目前狀態 | 操作者／條件 | 操作 | 預期狀態 | 規則／案例 |
|---|---|---|---|---|
| 新建 | 顧客 token 對應建立者 | 建立有效訂單 | `Cooking` | ROLE-02／AUTH-T12 |
| `Cooking` | 所屬店家管理者 | 標記待取餐 | `Ready` | ROLE-05／AUTH-T17 |
| `Ready`、未指派 | 有效外送員，且無未完成配送 | 接單 | `On the way`，記錄外送員 | ROLE-03／AUTH-T13 |
| `On the way` | 目前被指派的外送員 | 完成配送 | `Delivered` | ROLE-03／AUTH-T15 |
| 非 `Cooking` | 店家管理者 | 標記待取餐 | 維持原狀 | AUTH-T18 |
| 非 `Ready` 或已指派 | 外送員 | 接單 | 維持原狀 | AUTH-T14 |
| `On the way`，屬於外送員 A | 外送員 B | 完成配送 | 維持原狀且仍屬 A | AUTH-T19 |

產品需確認是否允許其他狀態轉換、取消、重新指派或重複操作。競爭接單也應獨立測試：兩名外送員同時接取同一筆 `Ready` 訂單時，最多只能有一人成功，訂單只能指派給一人。

## 認證與技術契約線索

以下是目前程式介面，不等於業務規則核准：

- 共用登入 endpoint `POST /api/social/token/` 接收 form-urlencoded 的 `username`、`password`。成功回傳 `access_token`、`token_type`、`scope`；錯誤帳密目前為 HTTP 400，detail 為 `invalid username or password`。
- endpoint 會依帳密查找 User 並簽發存取權杖，不在簽發時限制為特定角色；角色檢查由各角色 API dependency 依存取權杖關聯的 Customer、Driver 或 Restaurant 執行。
- 店家 API 位於 `/api/restaurant/*`，管理站使用 Bearer 存取權杖；前端權杖欄位名稱為 `food_grandma_restaurant_token`。
- 顧客個人化 API 位於 `/api/customer/*`，依 endpoint 以 query 或 form 傳 `access_token`。
- 外送員 API 位於 `/api/driver/*`，依 endpoint 以 query 或 form 傳 `access_token`。接單 endpoint 為 `POST /api/driver/orders/{order_id}/claim`。
- `GET /api/driver/orders/` 目前未要求外送員認證；需確認未登入者是否應能看到可接訂單清單。
- `/api/test/reset`、`/api/test/seed`、`/api/test/rebuild` 以 `X-Demo-Reset-Key` 保護。只可在可重建測試環境使用，不可視為一般角色認證。

## 測試資料與執行策略

- 優先使用 README 定義的 reset／seed 流程，並讀取 seed 實際回傳的帳號與資源 ID；不可假設固定訂單數量或固定列表位置。
- 跨店隔離至少需要兩間店家及各自訂單／餐點；顧客隔離至少需要兩名顧客及可識別訂單；外送員隔離至少需要兩名外送員或可證明指派歸屬的訂單。
- 若 seed／fixture 無法建立必要狀態，先記錄建置前提，不臆造 endpoint，也不以直接改資料庫替代要驗證的產品行為。
- 每個角色使用獨立認證上下文；切換角色前清除或替換前一角色的存取權杖，避免跨案例污染。
- 負向權限案例同時驗證回應及資料未變；即使 API 回應 `success`，仍須回讀資源確認實際效果。
- UI Stub 可驗證畫面反應，但授權、資料隔離及狀態持久化須以真實後端測試。
- 案例應追溯至規則 ID；只有案例 ID、測試檔案存在或 CI 綠燈，不足以證明權限規格已完整驗收。

## 待產品／作者確認

1. 顧客與外送員是否有正式登入／登出及未登入路由保護？
2. 店家管理者是否只能管理所屬店家？跨店讀寫應回應何種錯誤？
3. 可接訂單列表是否應要求外送員認證？
4. 各角色存取權杖不匹配或過期時，各 API 預期的 HTTP 狀態、錯誤內容與 UI 行為為何？
5. 外送員接單後是否允許取消／重新指派？兩人同時搶單的產品預期為何？
6. 顧客下單的未完成訂單限制、店家重複標記與外送員重複操作的業務預期為何？

## 與第 31 章的連結

本規格先從業務規則與驗收案例描述角色差異，不指定測試程式如何實作。第 31 章可用 Strategy 封裝不同角色的認證傳遞方式（店家 Bearer header、顧客／外送員 query 或 form 存取權杖），再用 Adapter 把不同角色的 API endpoint 包裝成測試所需的共同能力。測試案例依賴規格中的角色行為，不應依賴 Strategy／Adapter 的內部實作。

## 來源

`food-grandma-web/src/App.tsx`、`src/pages/customer/`、`src/pages/driver/`、`src/services/http.ts`；`food-grandma-management/src/App.tsx`、`src/pages/SignIn.tsx`、`src/components/Layout.tsx`、`src/auth.ts`、`src/api.ts`；`food-grandma-fastapi/app/auth.py`、`app/models.py`、`app/routers/customer.py`、`app/routers/driver.py`、`app/routers/restaurant.py`、`app/routers/social_auth.py`、`app/routers/demo_data.py`、`app/seed.py`。路徑相對於配套專案根目錄。
