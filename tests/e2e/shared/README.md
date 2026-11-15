# v1、v2 的共同資料

這裡只保存兩版測試需要的帳號資料與建立帳號的程式，不是另一套測試，也沒有共用兩版的 POM、Fixture 或測試步驟。

- [accounts.json](accounts.json)：27 個共同案例各自使用的帳號名稱，每個案例有六個角色帳號，不含密碼。
- [seed_accounts.py](seed_accounts.py)：在全新的獨立資料庫建立這些帳號，以及餐廳、顧客與外送員資料；不建立餐點或訂單。密碼從 `TEST_PASSWORD` 讀取。

從 [chapters 的執行入口](../chapters/README.md) 使用 `npm run chapter -- v1` 或 `npm run chapter -- v2`，程式會自動讀取這裡的資料，準備獨立環境。讀者不需要另外執行建立帳號的程式。

共同案例範圍與原實驗環境說明見 [v1／v2 實驗紀錄](../../../experiments/part-two/specs-v1-v2/README.md)，作者取材見 [第二部分素材對照表](../../../experiments/part-two/chapter-example-map.md)。原始生成檔案的快照與歷史紀錄也保存在實驗區；搬移前的路徑只作為當時的紀錄保留。
