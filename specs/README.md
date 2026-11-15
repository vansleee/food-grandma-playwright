# Food Grandma：規格驅動測試範例

本目錄包含五份主要練習規格，以及一份三角色權限完整參考版，可交給人與 AI 共同審查。`01-restaurant-auth.md` 是外送員接單的入門範例；`01-restaurant-auth-all.md` 擴充為顧客、外送員與店家管理者的權限分析。

## 規格索引

| 規格 | 主題 | 對應設計模式 |
|---|---|---|
| [01 入門](01-restaurant-auth.md) | 外送員接單權限 | 角色權限、正向／拒絕案例 |
| [01 完整參考](01-restaurant-auth-all.md) | 顧客、外送員、店家管理者認證與權限 | 決策表、跨角色流程、狀態轉換 |
| [02](02-order-search-filter.md) | 訂單搜尋、狀態篩選與空狀態 | OrdersPage、OrderRow、DDT |
| [03](03-order-mark-ready.md) | 備餐完成與狀態持久化 | POM、領域斷言、狀態轉換測試 |
| [04](04-meal-management.md) | 餐點新增、編輯與搜尋 | MealFormPage、Builder、Fixture |
| [05](05-restaurant-account.md) | 餐廳資料更新 | AccountPage、資料隔離 |

## AI 產生規格草稿

- `specs-draft/01-restaurant-auth/` 存放提供給 AI 的需求草稿與現況線索。
- `.github/prompts/generate-spec.md` 說明如何根據這些輸入整理規格草稿。
- AI 的輸出放在 `specs-generated/01-restaurant-auth.md`，不覆寫本目錄中的參考規格。
- `specs-generated/` 內的內容尚未核准，不可直接當成測試需求；人工審查後，才決定是否整理進 `specs/`。

## 依據與狀態

- 依據本機配套專案 `grandma-playwright-ai-agent-testing-patterns` 的原始碼靜態檢查撰寫；沒有操作部署網站，也沒有執行這些規格的測試。
- 來源 HEAD：`f498f3be1ed641aa3d8aaea2a9591f4799b0c500`；讀取當下來源工作樹無未提交變更。
- 前端：`food-grandma-management/src`；後端：`food-grandma-fastapi/app`。各規格末尾列出的來源路徑均相對於配套專案根目錄，不是本書根目錄。
- [03 備餐完成與狀態持久化](03-order-mark-ready.md) 已於 2026-10-25 由作者人工核准，尚未執行驗證。[04 餐點新增、編輯與搜尋](04-meal-management.md) 已依作者授權於 2026-10-26 審閱核准，並完成 MEAL-T02 的真實 UI 改價操作與回應核對；其餘測試情境未於本次逐項執行。其餘文件仍依各自標示的狀態處理。既有程式碼是現況證據，不等於業務規則已經獲得產品負責人確認。待決問題不得讓 AI 自行改寫成已核准要求。
- 前端開發設定為 port 5180，後端 proxy 目標為 8081；瀏覽器路由包含 `/management`，API 路徑不包含此前綴。執行時仍須確認實際服務網址。

## 共用測試前提

1. 僅在可重建的測試環境使用 reset／seed。依序呼叫 `POST /api/test/reset`、`POST /api/test/seed`，兩者都要帶 `X-Demo-Reset-Key` header（值取自環境變數 `DEMO_RESET_KEY`，本機預設 `local-dev-reset-key`），確認 HTTP 結果及 body 的 `status`。缺 header 或不符一律回 403。
2. seed 使用 `rebuild_dummy_data()`；不能沿用舊教材「只有一筆訂單／固定顧客」的假設。使用回傳的登入資料，並透過餐廳 API 查詢實際資源 ID、所屬餐廳及狀態。
3. 每案獨立準備資料；共用資料庫 reset 時使用單 worker，並避免其他 harness 同時執行。多 worker 需先提供獨立後端／資料庫，不能只換帳號。
4. API 級跨餐廳案例需兩個不同餐廳與各自資源；若沒有可用 Fixture，先列為建置前提。不可發明任意建單、改狀態或刪除 endpoint。
5. UI 失敗回應案例可攔截該 API，明確標示為 Stub 測試；持久化、權限與業務規則必須另以真實後端驗證。
6. 規格描述行為；Locator 放在 POM。既有 `data-order-id`、`data-meal-id` 可精確定位，禁止依賴第一列或固定等待。
7. 每個測試標示對應規則 ID。保留完整斷言；HTTP 200 並不一定表示業務成功。

## 交給 AI 的執行指令

先閱讀指定規格與本 README，對照真實 API、現有 POM 和 Fixture。列出規則 ID 對應的測試案例，以及未滿足的資料／環境前提。人工釐清待決問題後，再實作可驗證的案例。重用既有架構，不臆造 endpoint、test id 或 helper；缺少能力時先明確提出實作需求。執行後回報每個案例的 pass、fail 或 blocked，以及證據位置。產品不符合規格時保存差異，不得弱化斷言或跳過測試來求通過。

## 規格變更與視覺驗證

- 先審查規則差異，再更新案例對照、測試及必要產品實作；保留原始規則 ID 的變更歷程。
- 本目錄尚無核准的視覺 baseline，不宣稱任何截圖已驗收。若延伸視覺回歸，固定資料、字型、OS、瀏覽器與 viewport，先確認頁面資料載入完成，再由人核准 baseline。
- 建議以「備餐完成標籤改版」為視覺練習：確認文字、金額與操作欄差異，不遮罩正在驗證的區域，也不自動更新 baseline。
