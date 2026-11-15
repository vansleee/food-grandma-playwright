# 餐廳設定與聯絡資料更新

狀態：依現有實作整理，待人工核准；未執行驗證。共用前提見 [README](README.md)。

## 目的與範圍

餐廳在 `/management/account` 維護聯絡人與餐廳資料。包含名字、姓氏、電子郵件、餐廳名稱、電話、地址、圖片網址；不含帳號／密碼修改、email 驗證或圖片上傳。

## 規則

- ACCOUNT-01：進入設定頁載入目前餐廳與聯絡人資料，表單內容對應真實資料。
- ACCOUNT-02：電子郵件、餐廳名稱、電話、地址在 UI 必填；電子郵件使用原生 email 格式驗證。名字、姓氏及圖片網址選填。
- ACCOUNT-03：保存成功停留在設定頁，顯示「已儲存設定」；重新載入後顯示保存的內容。
- ACCOUNT-04：保存期間停用按鈕；每次開始保存清除前次成功提示。失敗顯示「設定儲存失敗，請稍後重試。」，保留使用者輸入。
- ACCOUNT-05：資料載入失敗時顯示「無法載入餐廳設定，請重新整理頁面。」。
- ACCOUNT-06：API 更新對象由認證的餐廳決定。A 更新自己的設定不得改動 B 的餐廳或聯絡人資料。

## 資料與前提

優先使用每案專用餐廳帳號，避免修改共享 admin 影響其他測試。先以 API 取得原始欄位，等待 UI 顯示已載入值再編輯。若需還原，以原始完整 payload 呼叫現有 PUT；保存或驗證失敗仍應執行 teardown。多人共用資料庫時不得用全域 reset 做個別清理。

## 驗收情境

| 案例 ID | Given／When | Then | 規則／層級 |
|---|---|---|---|
| ACCOUNT-T01 | 登入 A，開設定頁 | 已知名字、email、餐廳名稱及地址出現在對應欄位 | ACCOUNT-01／UI |
| ACCOUNT-T02 | 修改電話與地址並保存 | 顯示成功、仍在設定頁；reload 後新值存在，其他欄位保持 | ACCOUNT-03／真實 UI |
| ACCOUNT-T03 | 逐一清空必填欄位，或輸入明顯錯誤 email | 原生 validity 不通過，沒有保存請求 | ACCOUNT-02／UI DDT |
| ACCOUNT-T04 | 保存回應尚未完成，後續回應 500 | 等待時按鈕停用；失敗顯示錯誤、沒有本次成功提示，輸入保留 | ACCOUNT-04／Stub UI |
| ACCOUNT-T05 | 初次 GET 被 Stub 為失敗 | 顯示無法載入設定訊息 | ACCOUNT-05／Stub UI |
| ACCOUNT-T06 | 保存 A 的新資料 | A 重新查詢得到新值；B 以自己的 token 查詢仍為原值 | ACCOUNT-06／API |

## 現有技術契約

- `GET /api/restaurant/me/` 與 `PUT /api/restaurant/me/`，Bearer token。
- PUT JSON：`first_name`、`last_name`、`email`、`name`、`phone`、`address`、`logo`。
- 正常 HTTP 200，回傳 `{ restaurant, user }`；回讀應驗證本次修改欄位及未修改欄位。圖片網址可能經 serializer 正規化，不直接假設所有字串原樣回傳。
- 定位契約：各欄位中文 label、`account-form`、`account-save`；成功提示目前不是 role=status，不臆造 test id。

## 待確認與限制

- 後端 schema 的 email 是一般字串，且沒有 UI 同等的非空驗證。API 邊界行為必須另外確認，不能由 HTML 規則推論。
- 名稱或電話只含空白、電話格式、最大長度目前沒有明確規則，留待產品決策。
- 初次載入失敗時是否禁用保存，以及成功後再次編輯是否立即清除成功訊息，尚未形成一致 UX 要求。
- 後端成功寫入但回應遺失的情境另行設計，不能因畫面報錯就斷定資料沒有保存。

## 來源

`food-grandma-management/src/pages/Account.tsx`、`src/api.ts`；`food-grandma-fastapi/app/routers/restaurant.py`、`app/schemas.py`。
