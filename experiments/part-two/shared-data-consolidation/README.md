# 共用資料整併的執行驗證

2026 年 11 月 4 日（台灣時間），將 tests/e2e/spec-comparison/ 整併後，實際從讀者入口執行測試。

## 整併位置

- [shared/](../../../tests/e2e/shared/README.md)：目前 v1、v2 使用的帳號名稱與建立帳號的程式。兩份檔案的內容保持相同。
- [共同案例清單](../specs-v1-v2/cases.md)、[案例原文紀錄](../specs-v1-v2/cases.json)、[原實驗環境說明](../specs-v1-v2/environment.md)：與既有實驗紀錄內容相同，保留一份。
- [現行素材對照表](../chapter-example-map.md)：移到實驗區，文字保持相同，相對連結已更新。

v1、v2 各只修改帳號檔案的讀取路徑；共用執行入口改用 shared/ 的建立帳號程式。原始生成快照仍在 specs-v1-v2/archives/，歷史 JSON、提示詞與舊素材表保留當時內容。搬移對照見 [relocation-manifest.json](../relocation-manifest.json) 的 shared_data_consolidation。

## 重現步驟

先依 [讀者入口的環境說明](../../../tests/e2e/chapters/README.md) 安裝前後端與測試套件，並啟用後端 Python 環境。在範例專案根目錄執行：

```bash
cd tests/e2e/chapters
npm run chapter -- v1
npm run chapter -- v2
npm run chapter -- 15
```

每個指令各自建立全新資料庫、準備帳號、啟動服務並執行測試。一次使用一個 worker，失敗不重跑。v1、v2 會因為保留原有 ROLE-T02 失敗而回傳非零結束狀態。

## 實際結果

| 執行範圍 | 執行次數 | 通過 | 失敗 |
| --- | --- | --- | --- |
| v1 | 27 | 26 | 1：ROLE-T02 |
| v2 | 27 | 26 | 1：ROLE-T02 |
| 第 20 章 | 1 | 1 | 0 |

兩版失敗的現象相同：預期外送員已有配送中的訂單時，再接另一筆訂單會被拒絕，但本次產品仍接受第二筆，因此網頁沒有出現預期的拒絕訊息。這與搬移前的結果一致。沒有跳過測試、調整預期或新增失敗。

v1、v2 與 chapters 的 TypeScript 檢查通過。共同資料與整併的說明文件均逐檔核對；manual、ai-agent、書稿內容與書稿 Git 狀態保持相同。本次啟動的 18081、18082、18880 服務已停止。

## 執行證據

[summary.json](summary.json) 保存結果摘要。v1/、v2/、20/ 各有 results.json、stdout.log、launch.json、exit.json 與 evidence.json；後者包含逐案例的 API 請求與回應、狀態碼、非 2xx 回應與瀏覽器主控台訊息。預期的 HTTP 500、登入失敗與測試結束時取消的請求，也保留在證據裡，不一概視為產品問題。

v1/、v2/ 另保留 ROLE-T02 的失敗截圖，以及 ROLE-T02、MEAL-T02 的第一張與最後一張 trace 畫面。這些畫面是本次實際執行的紀錄，不另外安排網頁步驟。

完整 trace、資料庫與私有執行檔留在本機，不加入版本庫：

`./work/shared-data-consolidation-20261104/runs`

公開 JSON 與日誌中的密碼及 token 已遮蔽；檔案路徑保留本次執行位置。
