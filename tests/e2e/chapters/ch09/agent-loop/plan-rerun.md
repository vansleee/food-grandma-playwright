# 餐廳管理者將備餐中訂單標記為備餐完成

## Application Overview

Food Grandma 餐廳管理後台（http://localhost:8082/management/orders）。本計畫只涵蓋一個情境：管理者將 seed 指定的「備餐中」訂單標記為備餐完成，該訂單狀態變為「待取餐」，且備餐完成按鈕消失。探索時 seed 回傳的訂單編號為 1（畫面顯示 #0001，顧客 Cathy Customer），其餘訂單 #0022 待取餐、#0023 配送中、#0024 已送達，皆無操作按鈕。

## Test Scenarios

### 1. 訂單管理：備餐完成

**Seed:** `ch09/agent-loop/seed.spec.ts`

#### 1.1. 將指定的備餐中訂單標記為備餐完成

**File:** `ch09/agent-loop/tests/mark-order-ready.spec.ts`

**Steps:**
  1. 使用 seed（order-fixture）重設並建立資料、以餐廳帳號登入，取得 seeded_order_id（探索時為 1），停留在 /management/orders。以 data-testid=order-row 且 data-order-id 等於該編號定位目標列，不要依賴列的位置或固定的 #0001。
    - expect: 網址為 /management/orders
    - expect: 頁面標題為「Food Grandma｜餐廳管理後台」
    - expect: 目標訂單列存在，且只有一列符合該訂單編號
  2. 確認目標列的原狀態：讀取該列的 order-status。
    - expect: 狀態文字為「備餐中」
    - expect: 該列「操作」欄有 data-testid=order-ready-button 的「備餐完成 →」按鈕
  3. （選用）記錄其他訂單的狀態作為對照：#0022 待取餐、#0023 配送中、#0024 已送達，且這三列沒有備餐完成按鈕。
    - expect: 其他訂單狀態與按鈕在後續步驟中不應改變
  4. 在目標訂單列內點擊「備餐完成 →」按鈕。只點擊目標列內的按鈕，不要點頁面上第一個符合的按鈕。
    - expect: 不出現錯誤訊息，主控台無錯誤
  5. 等待目標列更新後，重新讀取該列（以訂單編號重新定位，使用自動等待的斷言而非固定等待）。
    - expect: 同一筆訂單的 order-status 顯示「待取餐」
    - expect: 該列內 order-ready-button 數量為 0，「備餐完成 →」不再顯示
    - expect: 訂單仍在列表中，訂單編號、顧客、金額與餐點明細不變
  6. 確認其他訂單未受影響。
    - expect: #0022 仍為待取餐、#0023 仍為配送中、#0024 仍為已送達
    - expect: 整個列表沒有任何備餐完成按鈕
    - expect: 訂單總數仍為 4 筆
  7. （選用）點擊「↻ 重新整理」按鈕，或重新載入頁面，確認狀態已持久化。
    - expect: 目標訂單仍顯示「待取餐」且無備餐完成按鈕
    - expect: 篩選列計數：備餐中 0、待取餐 2、配送中 1、已送達 1
