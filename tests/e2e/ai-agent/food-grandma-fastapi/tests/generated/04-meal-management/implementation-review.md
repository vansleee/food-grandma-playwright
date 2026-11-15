# Planner 計畫審查與 Generator 交接

原始計畫已保留，內容沒有直接改寫。以下決定作為實作依據：

- 接受不 reset 的 Fixture、RestaurantMeals API Repository 與 POM。只寫入 04-meal-management 目錄。
- 修正工具儲存路徑：Test MCP 的 workspace 是儲存庫根目錄，不是設定檔所在目錄。計畫原本落於根目錄 tests/generated，已移至指定測試 npm 專案。Generator 寫檔也必須使用根目錄相對的完整巢狀路徑。
- POM 不必限制只一個檔案，但 UI Locator 與頁面就緒條件應集中封裝，不依計畫提案把列表 Locator 散落 spec。可用一個 MealsPage 封裝列表及編輯流程並說明取捨，或兩個小型 POM。
- 初始認證可用既有公開示範帳號的 API 登入；token 只在記憶體。可使用確認存在的 localStorage key 注入 UI；此案不測 UI 登入本身。
- 不以 id != 23 作驗收。改確認建立回傳 ID、同 ID 更新與前後 ID 集合相同。
- 只要求 meal envelope 存在、沒有業務失敗以及必要欄位正確；不額外要求回應只能出現精確的一組 keys，避免無需求依據的嚴格格式限制。
- 本輪建立新餐點，不重用 23、24。不發明刪除 API。新增資料保留並回報，API contexts 應釋放。
- 新增通用封裝僅限必要的建立、讀取、列表與 UI 操作。不加入 Builder/DDT/Factory。
- 測試本體保留原價、新價、同 ID、名稱描述未變、列表 ID 集合與重新開啟表單後新價的明確檢查。
- 既有 UI 先前操作成功不等於生成測試已通過；生成後由實際 Playwright Test 執行驗證。
