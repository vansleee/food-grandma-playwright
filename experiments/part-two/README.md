# 第二部分完整實驗紀錄

這裡保留作者驗證、取材與重現使用的完整實驗專案。讀者入口在 [tests/e2e/README.md](../../tests/e2e/README.md)，各章只需要一份可執行範例。

| 實驗 | 保存內容 |
| --- | --- |
| [specs-v1-v2](specs-v1-v2/README.md) | 原始獨立 session、提示詞、生成快照、27 個案例的結果與來源紀錄 |
| [parallel-and-flaky](parallel-and-flaky/README.md) | 第 34、35 章 before／after、三輪平行比較、二十次等待對照與 216 次案例結果 |
| [pattern-comparisons](pattern-comparisons/README.md) | 五種模式的 before／after、20 個 E2E 與 8 個 Repository 契約結果 |

程式、資料、結果與歷史 metadata 均保留。各專案內的相對程式匯入保持有效；原始 JSON、提示詞與本機指令可能仍記錄搬移前的位置，屬於當時的執行紀錄。現行位置對照見 [relocation-manifest.json](relocation-manifest.json)。

下列 `./work/` 路徑是原始實驗的工作資料夾名稱，供對照舊紀錄。這些工作資料夾未收錄在範例專案中：

- `./work/specs-v1-v2-20261103`
- `./work/v1-ch34-ch35-20261103`
- `./work/v1-pattern-extensions-20261104`

資料庫與密碼檔不放入版本庫。舊本機控制腳本可能仍使用搬移前的 cwd；若要重新執行完整實驗，請使用各存檔專案目前的位置、套件設定與資料前提。讀者主線請使用 [新的共用執行入口](../../tests/e2e/chapters/README.md)。

現行 [第二部分素材對照表](chapter-example-map.md) 放在這裡，方便作者逐章取材。27 個共同案例的 [清單](specs-v1-v2/cases.md)、[原規格表格紀錄](specs-v1-v2/cases.json) 與 [原實驗環境說明](specs-v1-v2/environment.md) 保留在 specs-v1-v2/，不在測試目錄重複保存。兩版實際使用的帳號資料與建立帳號的程式統一放在 [tests/e2e/shared/](../../tests/e2e/shared/README.md)。

各實驗子資料夾內的舊素材表與原始快照保存當時狀態；其中的歷史路徑不代表目前的執行位置。現在請從 [chapters 的共用入口](../../tests/e2e/chapters/README.md) 執行 v1、v2。

共同資料整併後的實際重跑結果與日誌，見 [整併驗證紀錄](shared-data-consolidation/README.md)。

前一輪逐章改寫前後的執行結果見 [第 20～36 章對照實驗](chapter-before-after/README.md)：84 次全部通過，含 41 組相同案例的前後執行與 2 次 Fake 補充。原始 v1、v2 與書稿維持本輪開始前的內容。

第 20 章後續改為 [未使用 POM、v1、v2 三版本](ch20-three-versions/README.md)，三份完整程式直接列在本章。原始雙組對照的 84 次紀錄保留，三版本另行實測三次全部通過。

目前主線為 [第 20～36 章三版本與 AAA](chapter-three-versions-aaa/README.md)：125 次執行，115 通過、10 次固定等待反例失敗。各章只比較本章差異，共用既有基礎；章節內的 COMPARISON.md 已移除。前面的雙組對照與 ch20 初稿保留當時結果。

2026 年 11 月 5 日，第 25 章另改為 [顧客訂餐三版本](ch25-customer-order/README.md)，比較 POM、行雲流水模式（Fluent Interface）與 Workflow Facade，三版各一次全部通過。其餘章節沒有於本次重跑；上方 125 次仍是前次版本的完整實測，不改寫舊結果。

2026 年 11 月 6 日的 [第 25 章兩筆訂單實作](ch25-two-orders/README.md) 新增搜尋測試，連同原有三版共四次通過。流暢介面與流程類別採用目前名稱，先前紀錄保留當時名稱。
