# 本次執行環境與資料前提

- API_BASE_URL、WEB_BASE_URL 由執行時環境變數提供；預計為 http://127.0.0.1:18081 與 http://127.0.0.1:18082。
- 每版每次執行會從同一全新資料庫快照開始，沒有其他使用者或測試同時使用；不需要在測試裡呼叫 reset/seed/rebuild。
- accounts.json 以原案例 ID 提供六個獨立帳號：restaurantA、restaurantB、customerA、customerB、driverA、driverB。兩家餐廳起始均無餐點或訂單；每個案例不與其他案例共用資料。
- 所有帳號的密碼只從 process.env.TEST_PASSWORD 讀取，不印出、不寫入檔案。可用真實 POST /api/social/token/（form username/password）取得角色 token，後續依產品認證方式使用。
- 測試資料要由實際 API 與合法流程準備；沒有任意設定訂單狀態或刪除資料 API。程式碼請讀原專案前後端 source 確認，不發明介面。
- 原規格的待決項目仍維持原狀；本次選取案例依其原文驗證。產品不符規格時保留失敗及查詢證據，不依程式現況改寫驗收要求。
- UI 回應模擬只作用於指定瀏覽器請求；真正的儲存、資料隔離與狀態回讀使用真實 API。
- 結束時釋放自己建立的 request/browser contexts。資料留在此輪獨立資料庫，不發明資料清理 API。
