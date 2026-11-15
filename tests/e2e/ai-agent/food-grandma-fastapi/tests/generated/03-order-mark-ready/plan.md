# 03 備餐完成 — 測試計畫（目前僅 READY-T01、READY-T04 API）

規格：`specs/03-order-mark-ready.md`。OpenAPI 來源：`GET http://127.0.0.1:8081/openapi.json`（OpenAPI 3.1.0，Food Grandma API 1.0.0）。

## API 規格（OpenAPI）

| 項目 | OpenAPI 內容 |
|---|---|
| Operation | `PATCH /api/restaurant/orders/{order_id}`，`operationId: mark_order_ready_api_restaurant_orders__order_id__patch`，tag `restaurant` |
| Path 參數 | `order_id`：integer，必填 |
| Header | `authorization`：string \| null，`required: false`（未宣告 securityScheme） |
| Request body | 無 |
| 200 | `application/json`，schema `{}`（未定型） |
| 422 | `HTTPValidationError`（例如 `order_id` 非整數） |
| 未列出 | 401（缺／錯 token，由 `LookupError` handler 回傳） |

輔助端點：`GET /api/restaurant/orders/`（同樣 200 schema `{}`）、`POST /api/social/token/`（form）、`POST /api/test/reset`、`POST /api/test/seed`。

## API 契約（OpenAPI 未定型，依實作補齊）

OpenAPI 的 200 schema 是空的，以下契約取自 `app/routers/restaurant.py`、`app/serializers.py`、`app/auth.py`、`app/main.py`。

| 契約 ID | 條件 | 回應 |
|---|---|---|
| C1 | 自己的 Cooking 訂單 | 200，body 只有 `order` |
| C2 | `order` 形狀 | `id, customer{id,name,avatar,address}, restaurant{id,name,phone,address}, driver(null\|object), order_details[{id,meal{id,name,price},quantity,sub_total}], total, status, address` |
| C3 | `status` 值 | 顯示用英文：`Cooking`／`Ready`／`On the way`／`Delivered`；成功後為 `Ready` |
| C4 | 其他欄位 | 與更新前相同，ID 不變 |
| C5 | 持久化 | 再查詢 `GET /orders/` 該筆為 `Ready`，其他訂單不變 |
| C6 | 不存在／非本人 | 200 + `{status:"failed", error:"Order not found"}` — READY-04，不在本範圍 |
| C7 | 非 Cooking | 200 + 原訂單 — READY-05，由 READY-T04 涵蓋 |
| C8 | 缺／錯 token | 401 + `{status:"failed", error}` — 認證前提，不屬 READY-01 |
| C9 | `order_id` 非整數 | 422 — 框架驗證，不屬 READY-01 |

## 規則 ↔ 契約 ↔ 測試案例

| 規則 | 案例 | 契約 | 測試 | 斷言 |
|---|---|---|---|---|
| READY-01（API 部分） | READY-T01 | C1 | `api/mark-ready.spec.ts` | HTTP 200、JSON、`Object.keys(body) == ["order"]`（排除 `status:"failed"`） |
| | | C2 | 同上 | `order` 欄位集合完全相符 |
| | | C3 | 同上 | `status === "Ready"` |
| | | C4 | 同上 | 除 status 外與更新前物件 deep equal，ID 相同 |
| | | C5 | 同上 | 再查詢該筆等於回應 `order`；其他訂單 deep equal |
| READY-01（UI 部分：備餐中／待取餐） | READY-T02 | — | 未實作（e2e） | — |
| READY-05 | READY-T04 | C7 | `api/mark-ready-non-cooking.spec.ts`（v3 風格）；`api/mark-ready-non-cooking-v2.spec.ts`（v2 風格，對照用） | Ready／On the way／Delivered 三列 DDT：回應 `order` 等於原訂單；再查詢整份列表不變 |

## 前提

- 每案 reset + seed（帶 `X-Demo-Reset-Key`），使用 seed 回傳的 `restaurant_login` 取 token。
- 從 `GET /orders/` 找 Cooking 訂單，不假設 seed ID。
- 單 worker（共用 SQLite）。
