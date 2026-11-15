# CH25-T01 證據清單

- 日期：2026 年 11 月 5 日（台灣時間）。
- 目標：比較逐步呼叫 POM、行雲流水模式與 Workflow Facade 的正常訂餐流程。
- 環境：獨立 API 18081、網站 18082、管理網站內部 18880；不使用原有 8081／8082 的資料。
- 認證：本輪指定角色的 API token；密碼來源為 `TEST_PASSWORD`，公開證據遮蔽憑證。
- Trace：三版均有完整 trace，本機完整包在本輪工作資料夾的 `evidence/none/`、`evidence/fluent/`、`evidence/workflow/`。
- 結果：三次通過、零重試；訂單 POST 均為 HTTP 200 且回應 `status: success`。
- UI／API 對照：網頁的訂單編號、餐廳、地址及總額符合 API 查詢；餐點編號、數量、金額與三份資料庫結果一致。
- 請求：每版 15 筆 API 請求及回應，無非 2xx 回應；完整網路紀錄見各版 `network.log`。
- 主控台：保留 `fetchPriority` 與 React Router 警告，未修改產品消除警告。
- 圖片：各版 `before-submit.jpeg` 為送出前最近的 trace 畫面，`after-order.png` 為測試結束畫面。
- 重現：從範例專案根目錄使用 `repro.sh`，會重新準備資料、登入、執行全部網頁步驟及 API 查詢，憑證不固定在腳本中。

逐版資料夾包含 `api-evidence.json`、`requests.jsonl`、`raw/`、`console.log`、`network.log`、`browser-steps.json`、`database-state.json` 與 Playwright 結果。詳細步驟及圖說見 [README.md](README.md)。
