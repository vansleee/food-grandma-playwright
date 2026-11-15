# Food Grandma 餐廳後台：備餐完成情境測試計畫

## Application Overview

範圍僅限單一情境：餐廳管理者在「訂單管理」頁，將 seed 指定的「備餐中」訂單標記為備餐完成。探索結果：seed 會重置並建立資料後登入，頁面為 http://localhost:8082/management/orders，共 4 筆訂單（#0024 已送達、#0023 配送中、#0022 待取餐、#0001 備餐中）。seed 回傳的 seeded_order_id 為 1（顯示為 #0001），列為 data-testid=order-row 並帶 data-order-id；狀態為 order-status；按鈕為 order-ready-button「備餐完成 →」。實測按下後出現 status 訊息「訂單 #1 已標記為待取餐。」，#0001 狀態變為「待取餐」，篩選計數變為備餐中 0、待取餐 2，且該列操作欄不再有按鈕（顯示「—」）。

## Test Scenarios

### 1. 訂單管理：備餐完成

**Seed:** `ch09/agent-loop/seed.spec.ts`

#### 1.1. 將 seed 指定的備餐中訂單標記為備餐完成

**File:** `tests/order-ready/mark-order-ready.spec.ts`

**Steps:**
  1. 執行 seed（order-fixture）：重置並建立資料、以餐廳帳號登入，取得 seeded_order_id（預期為 1，顯示為 #0001）。以 data-testid=order-row 且 data-order-id 等於 seeded_order_id 定位目標列，不要依賴列的位置或其他訂單。
    - expect: 網址為 /management/orders，頁面標題為「Food Grandma｜餐廳管理後台」
    - expect: 目標訂單列的 order-status 文字為「備餐中」（確認原狀態）
    - expect: 目標列的操作欄有「備餐完成 →」按鈕（order-ready-button）
  2. 記錄操作前狀態：各篩選計數（全部 4、備餐中 1、待取餐 1、配送中 1、已送達 1）與其他訂單（#0024、#0023、#0022）的狀態。
    - expect: 作為後續比對基準
  3. 在目標訂單列點擊「備餐完成 →」按鈕。
    - expect: 頁面出現狀態訊息「訂單 #1 已標記為待取餐。」
    - expect: 沒有錯誤訊息，Console 無 error
  4. 檢查同一筆目標訂單列（同一 data-order-id）。
    - expect: order-status 文字為「待取餐」
    - expect: 該列不再有「備餐完成 →」按鈕（order-ready-button 數量為 0），操作欄顯示「—」
    - expect: 訂單編號、餐點、顧客與金額維持不變
  5. 檢查篩選計數與其他訂單。
    - expect: 備餐中計數為 0、待取餐計數為 2，全部仍為 4，配送中 1、已送達 1
    - expect: #0024、#0023、#0022 狀態不變
  6. （持久性）點擊「↻ 重新整理」後再檢查目標列。
    - expect: 目標訂單仍為「待取餐」且無備餐完成按鈕，證明狀態已存到後端
