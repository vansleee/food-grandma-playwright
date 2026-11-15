# 第 20～36 章：三版本與 AAA 實測

2026 年 11 月 4 日（台灣時間），每章各執行未使用本章做法、v1、v2。共 125 次：115 通過、10 次固定等待反例失敗。失敗僅出現在第 35 章未使用條件等待的版本，其他章節及 v1、v2 全部通過。

## 重現

先依 [環境設定](../../../tests/e2e/chapters/README.md) 安裝 Python 與前端套件，再在 chapters/ 執行：

```bash
npm run chapter -- 15
npm run chapter -- all
```

每版各自從同一份初始資料庫狀態開始，不共用上一版已修改的資料。所有測試零重試。第 34 章 v2 用兩個 worker，其餘使用一個；第 35 章每版各重複二十次。固定等待反例保留真實失敗，所以 all 指令回傳非零結束狀態。

## 本輪比較方式

每章一份主要測試檔，三組測試均使用 Arrange／Act／Assert。為了只比較當章差異，帳號、既有 POM、餐點資料 Fixture 與相同 API 驗收作為共同基礎；測試直接寫出網頁步驟，沒有委派另一個函式代跑整段流程。截圖與 API 證據由 Playwright trace 保存。

v1、v2 是從原始程式取出相關做法，再統一非本章的部分。原始 v2 沒有完整採用的 Page Factory、Workflow Facade、Screenplay、Adapter、Repository Fake、平行與部分重構，列為教學延伸；不冒充原始 AI 輸出。來源及限制見 [素材表](../chapter-example-map.md) 與 [程式索引](../../../tests/e2e/chapters/comparisons.json)。

章節內的 COMPARISON.md 已移除，完整測試與本章需要的模式定義集中在主要測試檔。前章已介紹的基礎程式仍共用。

## 實際結果

逐章各版本的次數及結果在 [summary.json](summary.json)。第 35 章的固定等待為 200 毫秒，GET 回應依序交替延遲 900／0 毫秒：十次在原資料未載入時失敗，十次完成修改。v1、v2 皆以條件等待，各二十次通過。這是刻意安排的反例，沒有把它說成原始 v1 的錯誤，也沒有用重試或放寬預期消除失敗。

除固定等待反例外，各章三版的餐點及訂單最終資料逐欄比對一致。各測試本身也保留原餐點編號、價格更新、其他欄位不變及不重複新增的檢查；不同執行的資料庫配號不作為跨版本相等的條件。比對紀錄見 [state-comparisons.json](state-comparisons.json)。

第 34 章 v2 的兩個 worker 執行時間有重疊。第 32 章的兩個 Fake 補充沒有發送 HTTP，不能以此宣稱網頁、認證或後端已驗證。第 33 章三版皆有網路模擬，比較的是原生 page.route 與攔截工具封裝。

原始 v1、v2、manual、ai-agent 與書稿逐檔核對保持相同。TypeScript 檢查通過，本輪獨立服務已停止。這次沒有量測長期維護時間或大型測試套件的加速比例。

## 留存證據

- 20/～36/ 的各版本資料夾：results.json、stdout.log、launch.json、exit.json 與 database-state.json。
- 各案例資料夾：evidence.json，含 API 請求回應、狀態碼、主控台訊息、非 2xx 回應及測試錯誤；另保存自動截圖與 trace 的第一張、最後一張畫面。
- [input-hashes.json](input-hashes.json)：本輪的主要程式、共用程式與設定內容摘要。

延遲請求在失敗測試結束時取消，以及第 33 章預期的 HTTP 500，均如實保存，不一概視為產品問題。密碼與 token 已遮蔽。

完整 trace、資料庫及私有密碼留在本機，不加入版本庫：

`./work/chapter-three-versions-aaa-20261104/runs`

前次雙組對照、ch20 三版本初稿及其他實驗各自保留當時紀錄，來源位置與結果不改寫成本輪狀態。
