# 本實驗的服務與資料範圍

- 只對本機獨立 FastAPI 資料庫執行，API_BASE_URL=http://127.0.0.1:18081，WEB_BASE_URL=http://127.0.0.1:18082。
- 不停止或重設原本 8081、8082 的服務，不呼叫產品 reset、seed 或刪除資料端點。
- 測試帳號由 spec-comparison/seed_accounts.py 建立；每輪另複製初始資料庫，沒有其他使用者。
- 店家以 POST /api/social/token/ 取得 token，後續使用 Bearer。密碼從 TEST_PASSWORD 讀取，日誌及 trace 收工前遮蔽密碼與 token。
- 第 34、35 章的新增案例只準備與編輯本輪餐點：POST /api/restaurant/meals/、GET /api/restaurant/meals/、GET／PUT /api/restaurant/meals/{id}。操作已包含在使用者要求的實驗範圍。
- baseline 是 v1 的未修改複本，依原始 specs 執行登入、訂單、餐點與帳戶案例；沿用原本各角色認證方式。
- 不增加負載測試或壓力測試；原始案例最多四個 worker，新增餐點案例最多兩個 worker，Flaky 對照固定一個 worker。
