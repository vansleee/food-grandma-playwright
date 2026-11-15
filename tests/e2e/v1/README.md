# v1：第二部分開始時的起始版

原有測試行為與 Playwright 設定保留，帳號檔案的讀取路徑更新為 [shared/accounts.json](../shared/accounts.json)。兩版依相同 specs、相同 27 個原案例，在獨立 session 產生；v2 額外讀取第二部分，沒有讀取 v1。

從共用入口啟動環境並執行：

```bash
cd ../chapters
npm run chapter -- v1
```

第一次使用請先依 [執行說明](../chapters/README.md) 安裝套件與後端環境。ROLE-T02 的規格要求一筆配送就拒絕再接單，產品目前允許三筆，因此會如實保留失敗。

各章練習使用 [chapters/](../chapters/README.md)，不需複製另一套完整專案。原始生成與完整結果放在 [實驗紀錄](../../../experiments/part-two/specs-v1-v2/README.md)。
