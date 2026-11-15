# 第一部分與 AI 測試練習的執行方式

[回到全書範例入口](../tests/e2e/README.md)

本頁適用於 `tests/e2e/manual/food-grandma-fastapi/` 與 `tests/e2e/ai-agent/food-grandma-fastapi/`。它們需要先啟動網站；第二部分的 v1、v2 和書中第 17～30 章則使用 [各章的獨立執行器](../tests/e2e/chapters/README.md)，由執行器準備環境。

## 啟動 Food Grandma

先完成首頁的 [下載步驟](../README.md#下載後跑第一支測試)，並安裝及啟動 Docker。以下指令在範例專案根目錄執行，macOS 與 Windows PowerShell 相同：

```text
docker compose -f food-grandma-fastapi/docker-compose.yml up -d --build
docker compose -f food-grandma-web/docker-compose.yml up -d --build
```

先啟動後端，讓它建立共用的 `food-grandma-network`，再啟動網站。後端會準備示範資料，管理網站由顧客網站轉接，使用下列網址：

| 服務 | 網址 |
| --- | --- |
| Food Grandma 網站 | http://localhost:8082 |
| 餐廳管理網站 | http://localhost:8082/management/ |
| API | http://localhost:8081 |
| API 文件 | http://localhost:8081/docs |

本機開發時，管理網站的內部服務使用 5180。瀏覽器與本頁的測試指令使用 8082，由網站轉送管理頁面與 API 請求。請使用練習資料庫；既有測試可能會重設示範資料。

## 執行人工撰寫的測試

從範例專案根目錄執行，macOS 與 Windows PowerShell 相同：

```text
cd tests/e2e/manual/food-grandma-fastapi
npm install
npx playwright install chromium
npx playwright test tests/meals.spec.ts --project=chromium --workers=1
```

依書中練習替換測試檔名。若要執行這個專案的全部測試，使用 `npm test`；開啟報告使用 `npx playwright show-report`。

## 執行 AI 產生的餐點測試

餐點價格修改的 [計畫與程式碼](../tests/e2e/ai-agent/food-grandma-fastapi/tests/generated/04-meal-management/) 保存在 generated 目錄。先從範例專案根目錄進入它的測試專案並安裝套件：

```text
cd tests/e2e/ai-agent/food-grandma-fastapi
npm install
npx playwright install chromium
```

接著在同一個終端機指定網站及 API 網址，執行餐點測試。`playwright.generated.config.ts` 在目前資料夾，不能從範例專案根目錄直接使用同一個相對路徑。

macOS（zsh／bash）：

```bash
WEB_BASE_URL=http://localhost:8082 API_BASE_URL=http://localhost:8081 \
npx playwright test tests/generated/04-meal-management/e2e/edit-meal-price.spec.ts \
  --config=playwright.generated.config.ts --project=e2e --workers=1 --retries=0
```

Windows（PowerShell）：

```powershell
$env:WEB_BASE_URL='http://localhost:8082'
$env:API_BASE_URL='http://localhost:8081'
npx playwright test tests/generated/04-meal-management/e2e/edit-meal-price.spec.ts --config=playwright.generated.config.ts --project=e2e --workers=1 --retries=0
```

這份設定未指定 `WEB_BASE_URL` 時會使用 5180，請保留上面的網址設定。Healer 的修復案例與 [測試維護挑戰](../tests/e2e/ai-agent/food-grandma-fastapi/tests/generated/06-test-maintenance/README.md) 依書中指定檔案或啟動器執行，不直接將整個 generated 目錄當成全部應通過的測試。

## 停止本頁啟動的網站

從範例專案根目錄執行：

```text
docker compose -f food-grandma-web/docker-compose.yml down
docker compose -f food-grandma-fastapi/docker-compose.yml down
```

以上指令保留資料庫使用的 Docker volume。第二部分的獨立服務由章節執行器自行停止，不使用這兩個指令管理。
