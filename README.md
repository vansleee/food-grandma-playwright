# 阿嬤，這次讓 AI 測試就好！

這是《阿嬤，這次讓 AI 測試就好！》的範例專案。書中用 Food Grandma 訂餐網站示範手動測試、Playwright 自動化測試，以及如何請 AI 規劃、撰寫與修復測試。

## 下載後跑第一支測試

先準備 Git 和 Node.js。從終端機執行以下指令，macOS 和 Windows PowerShell 都適用。

```bash
git clone https://github.com/vansleee/food-grandma-playwright.git
cd food-grandma-playwright/tests/e2e/chapters/ch03
npm ci
npx playwright install chromium
npx playwright test
```

第 03 章的[範例測試](tests/e2e/chapters/ch03/tests/example.spec.ts)會開啟 Playwright 官網，預期顯示 `1 passed`。這一步需要網路連線。要查看報告，在同一個目錄執行 `npx playwright show-report`。

Food Grandma 的後端、餐廳管理網站及顧客與外送員網站都隨專案下載。要跑 Food Grandma 的章節範例，請依[第一次執行的環境設定](tests/e2e/chapters/README.md#開始執行)安裝 Python 套件、網站套件與測試套件。需要先手動啟動網站的練習，請看[本機網站啟動方式](docs/existing-exercises.md#啟動-food-grandma)。

## 按書中進度找範例

| 書中章節 | 範例入口 |
| --- | --- |
| 第 03～08 章 | [第一支測試與 Food Grandma 基礎練習](tests/e2e/chapters/README.md) |
| 第 09～11 章 | [Claude Code 與 Playwright Agents](tests/e2e/chapters/README.md#agents) |
| 第 12～16 章 | [API 與 UI 練習](tests/e2e/chapters/README.md#第一部分的-api-與-ui-練習) |
| 第 17～30 章 | [設計模式、平行執行與測試維護](tests/e2e/chapters/README.md#按章執行) |
| 第 31～37 章 | [規格、餐點測試與 Healer 練習](tests/e2e/README.md#第三部分plannergenerator-與-healer) |

**章號以書上刊載的指令為準。** 書中第 17～30 章的範例沿用原有的 `ch15`～`ch28` 資料夾和指令編號。例如，書中第 17 章的 Page Object Model 範例，從專案根目錄這樣執行：

```bash
npm --prefix tests/e2e/chapters run chapter -- 15
```

[全書範例與閱讀順序](tests/e2e/README.md)也整理了原始 [v1](tests/e2e/v1/) 和 [v2](tests/e2e/v2/) 的比較方式及保留的失敗案例。

## 專案目錄

| 位置 | 內容 |
| --- | --- |
| [tests/e2e/](tests/e2e/) | 各章測試、原始 v1／v2、AI Agent 練習及共用程式 |
| [specs/](specs/) | Food Grandma 的功能規格與驗收測試案例 |
| [food-grandma-fastapi/](food-grandma-fastapi/) | FastAPI 後端 |
| [food-grandma-management/](food-grandma-management/) | 餐廳管理網站 |
| [food-grandma-web/](food-grandma-web/) | 顧客與外送員網站 |
| [experiments/part-two/](experiments/part-two/) | 原始實驗紀錄、比較過程與執行結果 |

要回報勘誤或執行問題，請在 GitHub Issues 附上書中章號、執行指令、作業系統與相關錯誤訊息。
