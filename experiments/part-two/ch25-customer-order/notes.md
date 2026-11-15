# CH25-T01 觀察

三版共用同一份測試案例、四個 POM、資料準備與驗收程式。`browser-steps.json` 的八個步驟逐項比對一致，`database-state.json` 的訂單與明細也一致。

逐版的 `api-evidence.json` 同時包含準備資料與瀏覽器的實際請求。每版只有一次瀏覽器訂單 POST，HTTP 200 且回應成功；最後由餐廳 API 查詢到一筆訂單，餐點數量為 1、總額 120。`after-order.png` 顯示相同的訂單編號、餐廳、測試地址與金額。

`console.log` 保留 React 的 `fetchPriority` 屬性警告及 Router 未來版本警告。本輪沒有觀察到 API 非 2xx 回應，見 `non-2xx.json`。這次只驗證正常訂購，不代表網站其他行為已驗證。

此比較可以用來討論流程的表達與程式結構，沒有量測長期維護成本或證明某個模式一定更好。原始 v1、v2、其他既有測試與書稿已依本輪開始前的雜湊核對保留。
