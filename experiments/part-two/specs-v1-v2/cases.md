# 兩版共同案例清單

本文件只固定範圍，不重新定義產品規則。預期結果請直接閱讀專案 specs/ 原檔；cases.json 的 source_row 為原表格逐字擷取。

共 27 個唯一測試編號，每個編號對應一個 Playwright test。單一原案例包含多個條件時，須在該 test 內完整涵蓋（例如 MEAL-T03 的空名稱／負數／小數，ACCOUNT-T03 的四個必填欄位及 email 格式，READY-T06 的 HTTP 500／status:failed）。不可用略過子條件保持數量。

此輪選取網頁驗收；純 API 案例、權限矩陣待決情境未納入。API 可準備資料與回讀，但不能取代選取案例要求的網頁步驟。未選案例不宣稱已驗證。

- AUTH-T01：`specs/01-restaurant-auth-all.md`
- AUTH-T02：`specs/01-restaurant-auth-all.md`
- AUTH-T03：`specs/01-restaurant-auth-all.md`
- ROLE-T01：`specs/01-restaurant-auth.md`
- ROLE-T02：`specs/01-restaurant-auth.md`
- FIND-T02：`specs/02-order-search-filter.md`
- FIND-T03：`specs/02-order-search-filter.md`
- FIND-T04：`specs/02-order-search-filter.md`
- FIND-T05：`specs/02-order-search-filter.md`
- FIND-T06：`specs/02-order-search-filter.md`
- FIND-T07：`specs/02-order-search-filter.md`
- FIND-T08：`specs/02-order-search-filter.md`
- READY-T02：`specs/03-order-mark-ready.md`
- READY-T05：`specs/03-order-mark-ready.md`
- READY-T06：`specs/03-order-mark-ready.md`
- MEAL-T01：`specs/04-meal-management.md`
- MEAL-T02：`specs/04-meal-management.md`
- MEAL-T03：`specs/04-meal-management.md`
- MEAL-T04：`specs/04-meal-management.md`
- MEAL-T05：`specs/04-meal-management.md`
- MEAL-T06：`specs/04-meal-management.md`
- MEAL-T08：`specs/04-meal-management.md`
- ACCOUNT-T01：`specs/05-restaurant-account.md`
- ACCOUNT-T02：`specs/05-restaurant-account.md`
- ACCOUNT-T03：`specs/05-restaurant-account.md`
- ACCOUNT-T04：`specs/05-restaurant-account.md`
- ACCOUNT-T05：`specs/05-restaurant-account.md`
