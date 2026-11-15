# Food Grandma 測試維護挑戰

搭配書稿第 41～43 章，包含十個刻意安排的自動化測試問題，不代表網站有十個產品缺陷。

從範例專案根目錄執行，macOS 與 Windows PowerShell 共用：

```text
node scripts/maintenance-challenge.mjs prepare 02
node scripts/maintenance-challenge.mjs agent 02
```

`prepare` 將 `examples/case-02.before.ts` 複製到 `e2e/case-02.spec.ts`，只變更指定題目。每題使用新對話。測試計畫沿用 `../04-meal-management/plan-meal-t02.md`，Fixture、Repository 與 POM 也使用該目錄現有程式。

網站預設 http://localhost:8082，API 預設 http://localhost:8081，可在目前終端機設定 WEB_BASE_URL、API_BASE_URL 改用獨立環境。先啟動網站與 API，再使用啟動器。部分題目由啟動器提供該題的設定，請使用啟動器開始，不單獨開啟 Claude Code。

執行指定題目：

```text
node scripts/maintenance-challenge.mjs run 02
```

確認原因並處理執行設定後，可用 `run 07 --correct-environment` 或 `run 08 --correct-environment` 使用正常設定。具體原因與修法見書中參考答案，不要一開始就交給 Agent。

額外的網路情境：

```text
node scripts/maintenance-challenge.mjs network
```

`e2e/` 保留實測後可執行的版本；`examples/` 保留修復前版本。若恢復了多題錯誤版本，請一次處理一題，不直接執行整個目錄並期待全部通過。測試會新增並保留餐點，不重設資料庫；不要用正式資料庫練習。

實測平台為 macOS，Windows 尚待驗證。原始 trace 與對話紀錄留在書稿工作目錄，不包含在本目錄中。
