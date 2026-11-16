# 各章可執行範例

[回到全書範例入口](../README.md) · [專案首頁](../../../README.md)

第二部分可以先看原始 v1，再依書上章號閱讀練習，最後比較原始 v2。書中第 17～30 章沿用範例編號 15～28，多數範例包含「未使用本章做法、v1、v2」三組，統一用 Arrange／Act／Assert 註解。

書中第 21 章（範例 ch19）使用顧客訂餐情境，三版分別是「逐步呼叫 POM、流暢介面（Fluent Interface）、Workflow Facade」。三版共用四個 POM、相同資料與驗收檢查，只比較流程的寫法；這是新增的教學情境，不使用原始 v1、v2 的名稱。

本目錄的 v1、v2 是為當章比較整理的教學範例，與 [原始 v1](../v1/README.md)、[原始 v2](../v2/README.md) 分開保存。原始兩版由 AI 在獨立對話產生；本目錄抽取相關做法，必要時補上教學延伸，沒有回寫原始輸出。三組比較與來源的完整說明見 [讀者入口](../README.md#各章的-v1v2-是什麼)。所有版本都在 `master`，不必切換分支。

各版本只改本章模式涉及的部分。既有帳號、API、POM 與共同的餐點結果檢查可以重複使用；完整的測試步驟直接寫在本章，不委派給另一個函式代跑整段流程，也不把截圖與紀錄程式塞進範例。

[素材對照表](../../../experiments/part-two/chapter-example-map.md) 列出每章比較的差異與來源。章節內不另設 COMPARISON.md。

## 第 03 章：第一支 Playwright 測試

[第 03 章完整範例](ch03/)包含[第一支測試](ch03/tests/example.spec.ts)、[Playwright 設定](ch03/playwright.config.ts)、[Gherkin 情境](ch03/tests/features/homepage.feature)和[步驟實作](ch03/tests/steps/homepage.steps.ts)。測試會開啟 Playwright 官網，需要網路連線。

從範例專案根目錄執行以下指令：

```bash
cd tests/e2e/chapters/ch03
npm ci
npx playwright install chromium
npx playwright test
```

看到 `1 passed` 後，可用 `npx playwright show-report` 開啟 HTML 報告。要練習第 4.5 節的 Gherkin 流程，在同一個目錄執行 `npm run test:bdd`，會先產生測試再執行，結果同樣為 `1 passed`。 若出現安裝 `bddgen@1.0.5` 的提示，請輸入 `n`，回到 `ch03` 目錄執行 `npm ci` 再執行 `npm run test:bdd`。

## 第 04 章：用 AAA／Given-When-Then 寫測試

先完成本頁「開始執行」的環境設定，再從範例專案根目錄執行以下指令。執行器會啟動本機 Food Grandma、準備獨立的測試資料庫、從 Gherkin 產生測試，最後執行八支測試。

```bash
npm --prefix tests/e2e/chapters run chapter -- 04
```

| 書稿位置 | 範例與預期結果 |
| --- | --- |
| 第 4 節 | [首頁標題](ch04/tests/homepage.spec.ts)的兩種寫法都檢查標題包含 Food Grandma。 |
| 第 4.1 節 | [成功登入](ch04/tests/login.spec.ts)使用餐廳管理者帳號，登入後應進入「訂單管理」。 |
| 練習 1 | [AAA](ch04/tests/login.spec.ts)與 [Gherkin](ch04/tests/features/login.feature)各測一次密碼錯誤，都應顯示 `Invalid username or password`。Gherkin 的操作和檢查寫在[步驟定義](ch04/tests/steps/login.steps.ts)。 |
| 練習 2 | [瀏覽所有餐廳](ch04/tests/homepage.spec.ts)會跳到首頁內的「所有餐廳」清單。 |
| 練習 3 | [購物車](ch04/tests/cart.spec.ts)的兩種寫法都先加入 100 元的披薩，再加入 50 元的可樂，最後核對餐點合計為 150 元。 |

本機實跑結果為 `8 passed`。詳細結果可在終端機列出的資料夾找到，檔名為 `results.json`。

## 第 05 章：把重複的登入步驟放進 Fixture

先完成本頁「開始執行」的環境設定，再從範例專案根目錄執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- 05
```

已經在 `tests/e2e/chapters/ch05` 時，使用 `npm --prefix .. run chapter -- 05`。指令先跑重構前的版本，再用另一份初始資料庫跑重構後的版本。只想執行其中一版時，可在指令最後加上 `--variant before` 或 `--variant after`。

| 測試 | 各自登入 | 共用登入 Fixture |
| --- | --- | --- |
| 依編號搜尋訂單，清單上只剩指定訂單 | [orders.spec.ts](ch05/tests/before/orders.spec.ts) | [orders.spec.ts](ch05/tests/after/orders.spec.ts) |
| 修改同一筆雞腿便當的價格，重新開啟後仍為 150 元 | [meals.spec.ts](ch05/tests/before/meals.spec.ts) | [meals.spec.ts](ch05/tests/after/meals.spec.ts) |

先比對兩版的 Arrange。重構前，每支都自己打開登入頁、填帳密、按下「登入」。重構後，這些步驟集中在 [auth.fixture.ts](ch05/fixtures/auth.fixture.ts)，需要登入的測試直接使用 `loggedInPage`。兩版都透過 [data.fixture.ts](ch05/fixtures/data.fixture.ts) 準備訂單和餐點，測試要做的操作與要檢查的結果都留在各自的測試檔。

登入後台時，網站會先載入訂單。兩版的訂單測試都在測試資料備妥後重新開啟「訂單管理」，讓畫面讀到這次準備的兩筆訂單。實跑結果為重構前 `2 passed`、重構後 `2 passed`。

## 第 06 章：用 Gherkin 寫出訂單的驗收條件

先完成本頁「開始執行」的環境設定，再從範例專案根目錄執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- 06
```

如果終端機已在 `tests/e2e/chapters/ch06`，執行 `npm --prefix .. run chapter -- 06`。章節指令會啟動本機 Food Grandma、建立獨立的 SQLite 資料庫、從 Gherkin 產生測試，再用 Playwright 執行。

- [成功訂購一份招牌便當](ch06/tests/features/order.feature)。從網頁送出訂單後，核對畫面與資料庫的訂單編號，再檢查配送地址、餐點、份數與金額。
- [兩個練習情境](ch06/tests/features/order-exercises.feature)。配送地址只有空白時，顧客名下應查不到訂單。顧客已有未完成訂單時再次送出，資料庫應只保留原訂單。
- [Playwright 步驟定義](ch06/tests/steps/order.steps.ts)對應每行 Given、When、Then。[資料庫查詢](ch06/tests/support/read_customer_orders.py)以唯讀方式查詢本次測試的 SQLite 資料庫。

本機實測結果為 `3 passed`。每個情境的執行結果可在終端機列出的資料夾找到，檔名為 `results.json`。

## 第 07 章：同一個下單情境，分別用 API 和網頁測試

先完成本頁「開始執行」的環境設定，再從範例專案根目錄執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- 07
```

如果終端機已在 `tests/e2e/chapters/ch07`，執行 `npm --prefix .. run chapter -- 07`。章節指令會啟動本機 Food Grandma，並為這一輪測試建立獨立的 SQLite 資料庫。

- [給 Claude Code 的提示詞](ch07/prompt.txt)
- [API 測試](ch07/tests/order-api.spec.ts)。顧客已有未完成的訂單時，再次下單會被拒絕，餐廳的訂單清單只保留原本那筆。
- [網頁測試](ch07/tests/order-ui.spec.ts)。顧客從網頁結帳後，核對「訂單進度」顯示的訂單編號、配送地址和餐點合計。

本機實測結果為 `2 passed`。Playwright 的 `results.json` 位於終端機列出的結果資料夾。

## 第 08 章：把備餐完成的計畫寫成測試

[測試計畫](ch08/practice/restaurant-mark-ready.md)列出要用訂單編號找到哪一筆，以及按下「備餐完成」後要檢查什麼。[參考測試](ch08/practice/restaurant-mark-ready.reference.spec.ts)沿用第 09 章的訂單 Fixture。

依書稿第 08 章第 4.2 節準備本機服務和 Chromium，使用專用的第 08 章練習資料庫。從 `tests/e2e/chapters` 執行參考測試：

```bash
npx playwright test -c playwright.first-part.config.ts ch08/practice/restaurant-mark-ready.reference.spec.ts
```

參考測試的實跑結果為 `1 passed`。

<a id="agents"></a>

## 第 09～11 章：Claude Code 與 Playwright Agents

三章共用 Food Grandma 的同一個情境：餐廳管理者將指定訂單標記為備餐完成。各開一個 Claude Code 對話，依序用 Planner、Generator、Healer。

| 章節 | 範例 |
| --- | --- |
| 第 09 章 Planner | [種子測試](ch09/agent-loop/seed.spec.ts)、[共用 Fixture](ch09/agent-loop/order-fixture.ts)、[提示詞](ch09/agent-loop/prompt.txt)、[交給 Generator 的計畫](ch09/agent-loop/plan-rerun.md)、[重跑紀錄與驗證範例](ch09/agent-loop/results.md) |
| 第 10 章 Generator | [提示詞](ch10/agent-loop/prompt-rerun.txt)、[原始測試（會重現失敗）](ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts)、[實跑紀錄](ch10/agent-loop/results-rerun.md) |
| 第 11 章 Healer | [提示詞](ch11/agent-loop/prompt-rerun.txt)、[修復版本](ch11/agent-loop/restaurant-mark-ready.rerun.spec.ts)、[實跑紀錄](ch11/agent-loop/results-rerun.md) |

先依書稿第 09 章啟動本機 API（8081）與網站入口（8082）。測試會重設資料，只能在專用的本機練習資料庫中依序執行。從範例專案根目錄開始：

```bash
cd tests/e2e/chapters
npm ci
npx playwright install chromium
npx playwright init-agents --loop=claude --config=playwright.agent-loop.config.ts
```

如只想執行書上的版本，可略過初始化 Agent 的最後一行，也不必啟動 Claude Code。逐一執行以下三個指令。第 10 章預期因餐點文字比對失敗；第 11 章的檔案已修好，預期通過。

```bash
npx playwright test -c playwright.agent-loop.config.ts ch09/agent-loop/seed.spec.ts
npx playwright test -c playwright.agent-loop.config.ts ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts --trace on
npx playwright test -c playwright.agent-loop.config.ts ch11/agent-loop/restaurant-mark-ready.rerun.spec.ts --trace on
```

要重做 Agent 操作，請使用自己的練習副本，為每個 Agent 開一個新對話，貼上上表對應的提示詞。Planner 會將計畫寫到 `ch09/agent-loop/plan.md`；Generator 的提示詞預設使用書上保存的 `plan-rerun.md`。要改用自己的計畫，就先換掉提示詞裡的計畫檔名。

```bash
claude --agent playwright-test-planner --strict-mcp-config --mcp-config agent-loop.mcp.json
claude --agent playwright-test-generator --strict-mcp-config --mcp-config agent-loop.mcp.json
```

要重現書上的失敗，從同一個目錄把第 10 章保留的原始產出複製到第 11 章。第一行會覆寫練習副本的第 11 章同名檔案。

```bash
node -e "require('node:fs').copyFileSync('ch10/agent-loop/restaurant-mark-ready.rerun.spec.ts','ch11/agent-loop/restaurant-mark-ready.rerun.spec.ts')"
claude --agent playwright-test-healer --strict-mcp-config --mcp-config agent-loop.mcp.json
```

Healer 修復後，重跑上方第 11 章的 Playwright 指令。

## 第一部分的 API 與 UI 練習

| 書稿章節 | 範例 |
| --- | --- |
| 第 12 章 | [API 啟動與資料準備](ch12/practice/api-setup.spec.ts) |
| 第 13 章 | [API 手寫版](ch13/practice/api-manual.spec.ts)、[Generator 計畫與程式碼](ch13/generator/)、[實跑紀錄](ch13/generator/results.md) |
| 第 15 章 | [餐廳後台登入](ch15/practice/management-setup.spec.ts) |
| 第 16 章 | [UI 手寫版](ch16/practice/ui-manual.spec.ts)、[Generator 計畫與程式碼](ch16/generator/)、[實跑紀錄](ch16/generator/results.md) |

第 12、13 章需要本機 API（8081），第 15、16 章還需要網站入口（8082）。測試會重設並重建資料，請使用專用的本機測試資料庫，依序執行。請先依第 09 章的步驟安裝套件、Chromium 和 Agent。書中第 17 章的 POM 範例放在 [ch15/pom/](ch15/pom/)，第 18 章的定位與等待範例放在 [ch16/locators/](ch16/locators/)。執行指令分別是 `npm run chapter -- 15` 和 `npm run chapter -- 16`。

第 15、16 章的新對照選了登入、指定訂單備餐完成和跨角色確認送達，兩版使用同一份[驗收條件](ch16/comparison/plan.md)。手寫版在 [ch15/comparison/](ch15/comparison/)，Generator 版在 [ch16/comparison/](ch16/comparison/)。[執行指令和比較結果](ch16/comparison/results.md)列出這三個案例各自的檢查。

從 `tests/e2e/chapters` 執行第 13 章的兩版測試：

```bash
npx playwright test -c playwright.first-part.config.ts ch13/practice/api-manual.spec.ts
npx playwright test -c playwright.agent-loop.config.ts ch13/generator/latest-order-without-token.spec.ts ch13/generator/list-restaurants.spec.ts ch13/generator/reject-second-order.spec.ts
```

在同一個目錄執行第 16 章的兩版測試：

```bash
npx playwright test -c playwright.first-part.config.ts ch16/practice/ui-manual.spec.ts
npx playwright test -c playwright.agent-loop.config.ts ch16/generator/mark-order-ready.spec.ts ch16/generator/open-meals.spec.ts ch16/generator/sign-in.spec.ts
```

若要自行產生測試，請在練習副本為各章開啟新的 Claude Code Generator 對話，再貼上各章的 `generator/prompt.txt`。提示詞會要求將產出寫到上述對應檔名。

## 開始執行

本組指令會在本機準備獨立資料庫並啟動後端，所以即使已經用 Docker 啟動網站，仍需要安裝本機 Python 套件。以下步驟只需要在第一次使用時完成。

先在範例專案根目錄建立 `.venv` 並安裝後端套件。

macOS（zsh／bash）：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r food-grandma-fastapi/requirements.txt
```

Windows（PowerShell）：

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r food-grandma-fastapi/requirements.txt
```

接著從同一個範例專案根目錄，安裝兩個網站的套件與測試套件。以下指令在 macOS 與 Windows PowerShell 相同：

```bash
npm --prefix food-grandma-management ci
npm --prefix food-grandma-web ci
cd tests/e2e/chapters
npm ci
npx playwright install chromium
npm run chapter -- 15
```

執行器會自動找到專案根目錄的 `.venv`，不用每次啟用虛擬環境。若目前已經位於 chapters/，先執行 `cd ../../..` 回到範例專案根目錄，再完成上面的首次設定。

指令會建立獨立帳號與初始資料庫快照，依序執行各章列出的版本。各版本均複製同一份初始資料庫狀態，再各自啟動 Playwright，不使用上一組已修改的資料。API 使用 18081，網站使用 18082，管理站內部使用 18880；結束後停止本次服務，不重設原本的 8081、8082。

若已在其他位置安裝後端套件，在 macOS 設定 `export FOOD_GRANDMA_PYTHON="後端虛擬環境/bin/python 的完整路徑"`；Windows PowerShell 設定 `$env:FOOD_GRANDMA_PYTHON='後端虛擬環境\Scripts\python.exe 的完整路徑'`，便可繼續使用該環境。執行器也會檢查已啟用的虛擬環境與後端目錄的 `.venv`。本次已在 macOS 實測，尚未實測 Windows。

每次都使用新的執行資料夾與資料庫，密碼由程式自動產生，無須從實驗紀錄找帳號或 token。若 18081、18082、18880 已被其他服務使用，程式會停止並回報，不會關閉別人的服務。

## 按章執行

| 書中章號 | 主題 | 主要測試檔 | 指令 |
| --- | --- | --- | --- |
| 17 | Page Object Model | [直接寫登入步驟](ch15/pom/restaurant-management.direct.spec.ts)、[使用頁面物件](ch15/pom/restaurant-management.pom.spec.ts)、[修改餐點價格三版本](ch15/pom/meal-price.spec.ts) | `npm run chapter -- 15` |
| 18 | 定位元素與頁面就緒 | [定位](ch16/locators/meal-price.spec.ts)、[頁面就緒](ch16/locators/page-readiness.spec.ts) | `npm run chapter -- 16` |
| 19 | Page Factory | [本章範例](ch17/meal-price.spec.ts) | `npm run chapter -- 17` |
| 20 | Component Object Model | [本章範例](ch18/meal-price.spec.ts) | `npm run chapter -- 18` |
| 21 | 流暢介面與 Workflow Facade | [顧客訂餐三版本](ch19/customer-order.spec.ts) | `npm run chapter -- 19` |
| 22 | Screenplay | [本章範例](ch20/multi-role-order.spec.ts) | `npm run chapter -- 20` |
| 23 | Fixture 與資料隔離 | [外送員接單兩版](ch21/driver-claim.spec.ts) | `npm run chapter -- 21` |
| 24 | 資料驅動測試 | [新增餐點改寫前後](ch22/meal-create.spec.ts)、[CSV 資料](ch22/meal-cases.csv) | `npm run chapter -- 22` |
| 25 | Test Data Builder 與 Object Mother | [一份與兩份雞腿便當](ch23/order-quantity.spec.ts)、[常用訂單情境](ch23/order-scenarios.spec.ts) | `npm run chapter -- 23` |
| 26 | Strategy 與 Adapter | [本章範例](ch24/meal-price.spec.ts) | `npm run chapter -- 24` |
| 27 | Repository 與 Fake | [本章範例](ch25/meal-price.spec.ts) | `npm run chapter -- 25` |
| 28 | 平行執行 | [本章範例](ch26/parallel-meals.spec.ts)、[平行設定與 AI 實驗](ch26/README.md) | `npm run chapter -- 26` |
| 29 | Flaky Test 與條件等待 | [本章範例](ch27/meal-load.spec.ts) | `npm run chapter -- 27` |
| 30 | 審查與整理測試程式 | [本章範例](ch28/meal-price.spec.ts) | `npm run chapter -- 28` |

書中第 28 章（範例 ch26）前兩版循序執行，v2 使用兩個 worker。書中第 29 章（範例 ch27）每版各執行二十次，依序交替延遲餐點 GET 回應 900／0 毫秒；固定等待 200 毫秒是教學反例，本輪十次失敗，v1、v2 的條件等待各二十次通過。程式保留失敗及非零結束狀態，不會自動重試或修改預期。

書中第 27 章（範例 ch25）另外保留兩個 Fake 資料存取檢查，不用它取代真實 E2E。原獨立的 Test Double 章範例保留在[實驗封存](archive/ch33/network-failure.spec.ts)。書中的網路模擬練習位於第三部分。

書中第 21 章（範例 ch19）從搜尋餐廳、開啟菜單、選擇餐點及加入購物車開始，接著查看購物車、前往結帳、填寫配送地址並送出訂單。流暢介面版先記錄步驟，呼叫 `run()` 才依序執行；Workflow Facade 版由 `placeOrder()` 安排同樣的步驟。驗收留在測試裡，核對網頁上的訂單與後端保存的餐點、數量、金額，並確認只新增一筆訂單。三版實測均通過，見 [本次紀錄](../../../experiments/part-two/ch25-customer-order/README.md)。

章節中的 v1、v2 是從原始程式取出相關做法，統一非本章的資料與驗收基礎。Page Factory、Workflow Facade、Screenplay、Adapter、Repository Fake 等未完整出現在原始 v2 的部分，列為教學延伸；不是重新產生或修改原始 v2。來源與限制記在 comparisons.json 及素材表。

## 整體兩版與全部章節

如果要執行原始 v1、v2 或執行 `npm run typecheck`，先在 `tests/e2e/chapters` 安裝兩版自己的相依套件。

```bash
npm --prefix ../v1 ci
npm --prefix ../v2 ci
```

```bash
npm run chapter -- v1
npm run chapter -- v2
npm run chapter -- all
```

`npm test` 也會透過同一入口執行全部章節的對照，各版本分別準備資料。書中第 29 章（範例 ch27）的固定等待反例預期會留下失敗，因此整輪指令也會以非零狀態結束。

v1、v2 保留原有測試行為；共同帳號改從 [shared/](../shared/README.md) 讀取。兩版的 ROLE-T02 與目前產品有規格差異，執行時會如實失敗，不是環境建置錯誤；沒有跳過或更改預期。all 只執行書中第 17～30 章（範例 15～28），不包含這兩份整體比較版。

章節執行器將結果和測試資料庫放在 `test-results/<本次執行編號>/`。直接用 Playwright 執行第一部分或 Agent 範例時，結果分別放在 `test-results/direct/first-part/` 和 `test-results/direct/agent-loop/`。這些資料夾都由 Git 忽略。本次整理後的實際驗證見 [驗證結果](VERIFICATION.md)。

完整實驗歷史與失敗反例在 [實驗區](../../../experiments/part-two/README.md)，供額外查證。章節取材與 v1／v2 對照見 [素材對照表](../../../experiments/part-two/chapter-example-map.md)。

書中第 21 章（範例 ch19）另有 `CH25-T02`：重複使用 `CustomerOrderingWorkflow`，由兩位顧客各下單後搜尋指定地址。章節指令目前共執行四個測試，全部通過，見 [11 月 6 日紀錄](../../../experiments/part-two/ch25-two-orders/README.md)。

書中第 22 章（範例 ch20）比較角色分工的 POM 與 Screenplay。兩版共用 [頁面物件](ch20/page.ts) 與訂餐 Workflow。兩版都包含 CH26-T01 的單筆訂單流程，以及 CH26-T03 的兩筆訂單交錯配送。`npm run chapter -- 20` 共執行四個 E2E 測試。清理失敗檢查從專案根目錄執行 `node --test tests/e2e/chapters/scripts/check-role-sessions.mjs`。結果見 [先前的實驗紀錄](../../../experiments/part-two/ch26-review/README.md)。

書中第 23 章（範例 ch21）的 CH27-T02 用相同的外送員接單情境比較 General Fixture 與按用途拆分的 Fixture。從範例專案根目錄執行 `npm --prefix tests/e2e/chapters run chapter -- 21`，預設會各跑一版。章節指令會為每版啟動自己的本機測試資料庫，並為示範資料的建立和清理設定本次使用的管理金鑰。這兩版的清理會重設該版的測試資料庫。

書中第 24 章（範例 ch22）第二題的 [AI 產生範例](ch22/meal-invalid-ai.spec.ts) 可從範例專案根目錄執行 `npm --prefix tests/e2e/chapters run chapter -- 22 --variant ai-exercise`。

書中第 26 章（範例 ch24）另有 [ROLE-T01 v1、v2 與 Bearer 認證練習](ch24/role-auth/)。從範例專案根目錄分別執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- v1 --config=../chapters/ch24/role-auth/playwright.config.ts --project=v1
npm --prefix tests/e2e/chapters run chapter -- v2 --config=../chapters/ch24/role-auth/playwright.config.ts --project=v2
npm --prefix tests/e2e/chapters run chapter -- v2 --config=../chapters/ch24/role-auth/playwright.config.ts --project=driver-auth
```

書中第 27 章（範例 ch25）的[實作演練](ch25/repository/)比較有無使用 Repository。從範例專案根目錄執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- 25 --variant none --config=ch25/repository/playwright.config.ts
npm --prefix tests/e2e/chapters run chapter -- 25 --variant v2 --config=ch25/repository/playwright.config.ts
```

書中第 30 章（範例 ch28）的[實作演練](ch28/review/)沿用書中第 29 章（範例 ch27） Claude 修好的 `CH35-T01`，比較整理前後的寫法。從範例專案根目錄執行。

```bash
npm --prefix tests/e2e/chapters run chapter -- 28 --variant none --config=ch28/review/playwright.config.ts --project=before --workers=1 --repeat-each=4 --retries=0
npm --prefix tests/e2e/chapters run chapter -- 28 --variant none --config=ch28/review/playwright.config.ts --project=after --workers=1 --repeat-each=4 --retries=0
```
