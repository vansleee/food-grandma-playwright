# Food Grandma API 對照
種子測試：ch13/generator/seed.spec.ts
正式測試透過同資料夾 demo-fixture.ts 的 test 使用 demo fixture，在每支測試中重設並建立資料。API 預設 http://localhost:8081（讀取 apiURL），依實際服務核對下列契約。
1. GET /api/customer/restaurants/ 應回 HTTP 200，restaurants 至少有一筆帶名稱的餐廳。輸出 ch13/generator/list-restaurants.spec.ts。
2. GET /api/customer/orders/latest 不附 access_token 應回 HTTP 401，JSON 為 status: failed、error: access_token is required。輸出 ch13/generator/latest-order-without-token.spec.ts。
3. 先以 e2e-customer-token 查詢最新訂單，確認它仍是 Cooking。從既有訂單取得餐廳和餐點，POST /api/customer/orders/，用表單傳 access_token、restaurant_id、address 和 JSON 字串 order_details（含 meal_id 與 quantity）。應回 HTTP 200，status 為 failed，error 為 Your last order must be completed.。輸出 ch13/generator/reject-second-order.spec.ts。
