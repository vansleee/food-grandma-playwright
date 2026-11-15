# 本次延伸實驗的服務與資料範圍

- 只操作獨立本機資料庫。API_BASE_URL=http://127.0.0.1:18081，WEB_BASE_URL=http://127.0.0.1:18082；管理站內部開發服務使用 18880。
- 不停止、重設或修改原本 8081、8082 的服務；不呼叫產品 reset／seed 或刪除資料端點。
- 使用獨立測試帳號，密碼只由 TEST_PASSWORD 提供。每組 before／after 從同一份初始資料庫另複製一份。
- 店家透過 POST /api/social/token/ 取得 token，以 Bearer 呼叫餐點 API。
- 允許本次案例準備與查詢：POST／GET /api/restaurant/meals/、GET／PUT /api/restaurant/meals/{id}。E2E 價格修改一律從網頁送出；Repository 契約測試的更新另使用真實 PUT。
- 每輪一個 worker，retries=0，沒有負載測試。證據包含請求與回應，收工時遮蔽密碼與 token。
- Fake 契約測試不啟動產品、不提供密碼，不建立任何 HTTP context，API 與網站網址指向未啟動的獨立埠。
- Adapter 的 title／description／amount 是另外安排的呼叫端介面，用於示範與既有 v1 API 的欄位轉換，不是產品新增需求。
