# 從 v1 延伸：五種模式的相同案例比較

五組 before／after 都已實際執行：20 個真實 E2E 全部通過；Repository 的真實 API 與 Fake 另各有四個相同契約案例，也全部通過。完整步驟、程式差異與結果見 [RESULTS.md](RESULTS.md)。

## 檔案

```text
baseline/                       v1 未修改的複本，本次引用 support/ 共用程式
examples/page-factory/           直接建立頁面物件／Page Factory
examples/workflow/               逐步操作／Workflow Facade
examples/screenplay/             POM／Actor、Task、Question
examples/adapter/                直接轉換欄位／具名 Adapter
examples/repository/             直接呼叫 API／Repository
examples/repository/contract/    真實 API、Fake 使用同一份契約案例
support/meal-checks.ts           每組完全相同的驗收檢查
spec-comparison/                 本次帳號與初始資料庫準備程式
results/                        各輪 JSON、日誌與逐案例 API 證據
evidence-samples/                本次執行的代表截圖
run-results.csv                 28 次案例的逐次結果
summary.json                    比對、環境與保存檢查
```

before／after 都是這次以 v1 為基礎另外撰寫的範例。原始 v1、v2 與書稿維持不動。baseline/ 供原碼對照，本次設定不會收集其中原有的 27 個測試；若要執行原套件，使用原本的 v1/ 與其資料前提。

## 相同案例與驗收

每組的 T01 把餐點原價 100 改為 150，T02 改為 0。兩版都先等原有資料出現，再從網頁儲存，檢查 HTTP 更新回應、原餐點編號、其他欄位、沒有新增，以及重新開啟後的價格。

Repository E2E 兩版均使用真實 API。Fake 只用於四個共用程式契約案例；它通過不代表網站或 E2E 已通過。Adapter 的 title／description／amount 欄位是本次安排的呼叫端介面，amount 在這個範例指餐點價格。

## 執行

先在本資料夾安裝套件及 Chromium。真實 E2E、API 契約案例需要設定 TEST_PASSWORD、API_BASE_URL、WEB_BASE_URL，並使用本次 seed_accounts.py 建立的獨立帳號。每組前後要使用同一初始資料庫的不同複本，不能共用上一輪已修改的資料。

seed_accounts.py 需要原 FastAPI 專案的 Python 套件、PYTHONPATH 與獨立 DATABASE_URL，並設定 SEED_DEMO_DATA=false、PUBLIC_DEMO_MODE=false。腳本只建立帳號，不建立餐點；已存在帳號時會拒絕執行。服務及端點範圍見 [product-context.md](product-context.md)。

在服務及帳號準備完成後，macOS 指令：

```bash
# 每組可選 page-factory、workflow、screenplay、adapter、repository。
PATTERN_GROUP=page-factory PATTERN_VARIANT=before npx playwright test --workers=1 --retries=0
PATTERN_GROUP=page-factory PATTERN_VARIANT=after npx playwright test --workers=1 --retries=0

PATTERN_GROUP=repository-contract REPOSITORY_KIND=api npx playwright test --workers=1 --retries=0

# Fake 不需要服務、帳號或密碼。
env -u TEST_PASSWORD PATTERN_GROUP=repository-contract REPOSITORY_KIND=fake npx playwright test --workers=1 --retries=0
```

Windows PowerShell 設定相同參數：

```powershell
$env:PATTERN_GROUP='page-factory'
$env:PATTERN_VARIANT='before'
npx playwright test --workers=1 --retries=0

$env:PATTERN_VARIANT='after'
npx playwright test --workers=1 --retries=0
```

本次已驗證 macOS，未實測 Windows。RESULTS.md 記錄實際使用的本機服務準備與重現腳本位置。各輪 JSON 保留當次工具輸出；attachments、cwd 內可能仍是執行電腦的歷史絕對路徑。完整 trace、全部截圖、資料庫及私有密碼檔保留本機，沒有放進範例資料夾。
