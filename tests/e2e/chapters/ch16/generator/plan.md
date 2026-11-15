# Food Grandma 餐廳後台 UI 對照
種子測試：ch16/generator/seed.spec.ts
正式測試透過同資料夾 demo-fixture.ts 的 test 使用 demo fixture，每支測試重設並建立資料。UI 經由本機網站入口 http://localhost:8082。沿用 seed 回傳的餐廳登入資料及訂單編號。
1. 從 /management/sign-in 送出正確帳密，確認到達 /management/orders，且看得到「訂單管理」標題和訂單表格。輸出 ch16/generator/sign-in.spec.ts。
2. 從網頁登入，依 seed 的訂單編號找出「備餐中」的訂單，在同一列按下「備餐完成」。確認同一筆訂單顯示「待取餐」，且按鈕消失。輸出 ch16/generator/mark-order-ready.spec.ts。
3. 從網頁登入，透過餐廳後台導覽開啟餐點列表，確認到達 /management/meals、顯示餐點表格及 seed 的 Margherita 餐點。輸出 ch16/generator/open-meals.spec.ts。
