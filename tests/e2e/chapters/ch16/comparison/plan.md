# Food Grandma 的三個網頁測試

三支測試都在本機 Food Grandma 執行。測試起點使用 ch16/comparison/seed.spec.ts。
正式測試可以從 ../../support/ch15-16-comparison 匯入 test 與 expect。
demo 會為每支測試重建資料，並提供 demo.restaurant_login 和 demo.seeded_order_id（備餐中的訂單編號）。
困難案例可以再取得 deliveryOrderId（外送員本來就有的那筆配送訂單編號）。
網站入口用 Playwright 已設定的 baseURL。登入、備餐及確認送達都從網頁操作。

## CH15-T01 餐廳管理者登入後看到訂單管理

前提：有可用的餐廳管理帳號。
步驟：開啟餐廳後台登入頁，輸入正確的帳號與密碼，按下「登入」。
預期結果：網址到達 /management/orders，畫面顯示「訂單管理」標題與訂單表格。
輸出 ch16/comparison/sign-in.spec.ts。

## CH15-T02 指定訂單變成待取餐

前提：餐廳管理者有一筆由 demo 提供、狀態為「備餐中」的指定訂單。
步驟：登入餐廳後台，依訂單編號找到這筆訂單，先確認它仍是「備餐中」，再按該列的「備餐完成」。
預期結果：同一筆訂單顯示「待取餐」，該列的「備餐完成」按鈕消失。
輸出 ch16/comparison/mark-order-ready.spec.ts。

## CH15-T03 外送員確認送達後，餐廳看到同一筆訂單已送達

前提：外送員只有一筆進行中的配送。餐廳管理者和外送員各自登入並使用獨立的瀏覽器工作階段。
步驟：餐廳管理者登入後查看指定的訂單，確認目前顯示「配送中」。
外送員從「體驗登入」進入工作台，再開啟進行中配送。核對畫面上的訂單編號後，按下「確認已送達」。
最後由餐廳管理者重新開啟或重新整理訂單清單。
預期結果：外送員畫面顯示「目前沒有進行中的配送」。餐廳後台原編號的訂單顯示「已送達」。
輸出 ch16/comparison/confirm-delivery.spec.ts。
