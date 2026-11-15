# 備餐完成與訂單狀態持久化

狀態：已人工核准（2026-10-25）；未執行驗證。共用前提見 [README](README.md)。

核准紀錄：作者確認本文件的規則與 API 預期行為，包含不存在或非本人訂單回傳 HTTP 200 與失敗 body，以及自己的非 Cooking 訂單維持原狀。核准不代表測試已執行或通過。

## 目的與範圍

餐廳在 `/management/orders` 將自己的備餐中訂單標記為待取餐。只涵蓋餐廳端操作，不含通知送達、外送員接單及付款。

## 規則

- READY-01：自己的 Cooking 訂單可更新為 Ready；UI 分別顯示「備餐中」與「待取餐」。
- READY-02：只有 Cooking 列提供「備餐完成 →」按鈕。成功後顯示「訂單 #{id} 已標記為待取餐。」並重新取得訂單資料。
- READY-03：更新完成且列表重新載入後，該列不再提供備餐完成按鈕。整頁重新載入後狀態仍為待取餐。
- READY-04：訂單不存在或不屬於目前餐廳時，API 回報失敗，不能修改其他餐廳訂單。
- READY-05：目前 API 對自己的非 Cooking 訂單回傳原訂單，保持狀態不變；不回報狀態非法錯誤。重複操作 Ready 也保持 Ready。
- READY-06：更新請求或列表載入期間，備餐完成按鈕停用；更新失敗顯示「更新訂單失敗，請稍後重試。」，不顯示本次成功通知。

## 資料與前提

由餐廳 API 選取自己的 Cooking 訂單，保存 ID、原狀態與內容。非 Cooking 案例需各有 Ready、On the way、Delivered 資料；跨餐廳案例需 B 的訂單。以受控後端 fixture、已知 seed 或真實合法流程建立前提，不發明狀態設定 endpoint。每案獨立建立起點。

## 驗收情境

| 案例 ID | Given／When | Then | 規則／層級 |
|---|---|---|---|
| READY-T01 | A 對自己的 Cooking 訂單送出更新 | 回應與再次查詢均為 Ready，ID 未改變 | READY-01／API |
| READY-T02 | 在 UI 找到指定 Cooking 訂單並完成備餐 | 顯示成功訊息、待取餐、按鈕消失；reload 後仍為待取餐 | READY-02、03／真實 UI |
| READY-T03 | A 更新 B 的訂單或不存在的 ID | body 表示失敗；B 以自己的認證確認資料未改變 | READY-04／API |
| READY-T04 | 對自己的各種非 Cooking 訂單送出更新 | 回傳原狀態，再查詢亦未改變 | READY-05／API DDT |
| READY-T05 | 更新回應尚未完成 | 所有備餐完成按鈕停用，不重複送出 | READY-06／受控 UI |
| READY-T06 | 更新 API 被 Stub 為 500 或 status:failed | 顯示更新失敗，無成功通知；畫面不樂觀改成待取餐 | READY-06／Stub UI |

## 現有 API 與定位契約

- `PATCH /api/restaurant/orders/{order_id}`，Bearer token，無需 JSON body。
- 成功／非 Cooking 不變：HTTP 200，`{ order: ... }`，serialized 狀態為顯示用英文。
- 不存在／非本人：HTTP 200，`{ status: "failed", error: "Order not found" }`。不能只驗證 `response.ok()`。
- UI 使用 `order-row` 搭配 `data-order-id`，列內使用 `order-ready-button`、`order-status`；不要依賴第一列或同名顧客。

## 待確認與限制

- 前面討論過的「非備餐中一律拒絕」不是目前實作。本規格保留現況，若要改成拒絕必須另立需求變更。
- 成功通知先於列表 reload 完成，必須等待目標狀態，不能只看通知就算通過。
- 網路斷線不保證伺服器未完成更新；不把模擬 HTTP 失敗與真實提交結果不明混為一談。

## 來源

`food-grandma-management/src/pages/Orders.tsx`、`src/components/OrderStatus.tsx`、`src/api.ts`；`food-grandma-fastapi/app/routers/restaurant.py`。
