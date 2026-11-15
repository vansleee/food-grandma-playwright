# 第 34、35 章：從 v1 延伸的實驗

這裡保留 v1 的完整複本，另外建立平行執行與等待方式的教學範例。新增的 before／after 是本次實驗另外撰寫的程式，不是原始 Generator 的產出。書稿沒有修改。

## 目錄

```text
baseline/                  未修改的 v1 複本
ch34/before/               兩個案例修改同一筆餐點
ch34/after/                每個案例各自準備帳號與餐點
ch34/support/price-cases.ts 兩版共用的網頁步驟與檢查
ch35/before/               固定等待 200 毫秒，再立即讀取價格
ch35/after/                等待價格欄位出現原值
ch35/support/price-case.ts  兩版共用的餐點編輯流程與延遲控制
spec-comparison/           帳號資料與獨立資料庫準備程式
experiment.json            執行次數、worker 數與固定的延遲順序
```

## 實驗安排

第 34 章有兩組實驗。先對 baseline 的相同 27 個案例分別使用一個與四個 worker，各跑三輪；兩邊都指定 fully-parallel，每輪使用全新資料庫。原本 ROLE-T02 的規格與實作差異照常保留。

第二組取 v1 的 MEAL-T02 流程，另寫 PAR-T01、PAR-T02，分別把原價 100 改成 150、180。before 讓兩個案例修改同一筆餐點；after 使用每個測試自己的帳號與新餐點。兩版呼叫相同的 price-cases.ts，沒有改預期價格或刪除檢查。

為了讓共用資料干擾可以重現，多 worker 時使用實驗用同步點：兩個案例都載入原價後才能修改，兩個都儲存後才查詢結果。這段控制程式只負責安排碰撞時間，不是產品需要的測試步驟，也不是修法。一個 worker 時不等待另一案例。before 的單 worker 跑一輪，雙 worker 跑三輪；after 的雙 worker 跑三輪。

第 35 章沿用餐點編輯流程，透過 Playwright page.route 延遲真實 GET 請求。固定 20 次的延遲順序包含十次 0 毫秒、十次 900 毫秒；順序在執行前寫入 experiment.json，兩版完全相同，沒有臨時重跑到想要的結果。每次建立新餐點，且在同一個 worker 執行。

before 使用固定等待 200 毫秒，after 等待價格欄位為原價 100。載入後仍須從網頁改成 150，確認同一編號、名稱描述不變、沒有新增餐點，再重新開啟編輯頁面確認價格。

## 執行前提

- Node.js、Playwright 1.63.0、Chromium 及原 FastAPI 專案的 Python 套件。
- API_BASE_URL、WEB_BASE_URL、TEST_PASSWORD。預設網址為 18081、18082，與原本的 8081、8082 分開。
- 每輪先建立獨立資料庫，再使用本資料夾的 seed_accounts.py 準備帳號。原本的資料庫不能當成本實驗的資料庫。
- 第 34 章還需要每輪獨立的 LAB_SYNC_DIR；before 需要 LAB_SHARED_MEAL 指向事先透過真實 API 建立的餐點 JSON。
- 所有執行 retries=0，沒有 skip 或預期失敗標記。Flaky 前後對照各執行 20 次就停止。

完成環境及每輪資料準備後，在本資料夾執行：

```bash
# 原始 v1 複本：相同案例，分別以 1、4 個 worker 執行
npx playwright test --config=playwright.baseline.config.ts --fully-parallel --workers=1 --retries=0
npx playwright test --config=playwright.baseline.config.ts --fully-parallel --workers=4 --retries=0

# 第 34 章：LAB_VARIANT 設為 before 或 after
npx playwright test --config=playwright.parallel.config.ts --workers=2 --retries=0

# 第 35 章：LAB_VARIANT 設為 before 或 after
npx playwright test --config=playwright.flaky.config.ts --repeat-each=20 --workers=1 --retries=0
```

macOS 設定版本可用 `export LAB_VARIANT=before`；Windows PowerShell 用 `$env:LAB_VARIANT='before'`。本次實測環境是 macOS，沒有宣稱已實測 Windows。

完整的資料庫、服務準備、本機重現腳本與實際結果，見 [RESULTS.md](RESULTS.md)。依這份文件手動執行時，不能略過帳號與每輪資料準備。
