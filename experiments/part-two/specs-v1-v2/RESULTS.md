# Food Grandma：直接讀取 specs 的兩版生成實驗

實驗日期：2026 年 11 月 3 日（台灣時間）。這份文件記錄實際提示詞、程式碼與執行結果，沒有修改書稿。

## 結果

兩個獨立 Claude Code session 都直接讀取原專案 specs，產生同一組 27 個原案例。v1 沒有額外指定模式；v2 在撰寫前另外讀取第二部分第 20～36 章，自行選用適合的做法，而且沒有讀取 v1。

| 項目 | v1 | v2 |
| --- | --- | --- |
| 最後完整執行 | 26 通過、1 失敗 | 26 通過、1 失敗 |
| 失敗案例 | ROLE-T02 | ROLE-T02 |
| 跳過、預期失敗、重試 | 皆為 0 | 皆為 0 |
| 完整執行耗時 | 33.75 秒 | 33.17 秒 |
| TypeScript 檢查 | 通過 | 通過 |
| 測試檔 | 6 個、1,011 行 | 6 個、765 行 |
| 共用程式 | 4 個檔案、520 行 | 15 個檔案、956 行 |
| TypeScript 總計 | 10 個檔案、1,531 行 | 21 個檔案、1,721 行 |

行數包含空白與註解，不包含設定及 Markdown。第二版測試檔少了 246 行，但整體多了 190 行；它把較多細節移到共用程式，沒有讓程式總量變少。這次沒有測量後續修改要花多少時間，因此不能據此宣稱維護成本已降低。

## 這次實際怎麼做

1. 保留原 specs，從六份功能規格選出 27 個要求在網頁上執行步驟的案例；兩版都讀取相同的七份文件（另含 specs/README.md）。[cases.json](cases.json) 保留原案例編號、來源與表格原文。
2. 事先提供兩份相同的 Playwright 設定、TypeScript 設定與套件版本。這些設定由實驗準備，不算 AI 自行產生的架構。
3. 每個案例配置六個獨立帳號。餐廳起始沒有餐點與訂單；AI 必須透過真實 API 準備資料，再用瀏覽器完成案例指定的步驟。
4. 從各自工作目錄開啟全新的 Claude Code session。停用既有 MCP、記憶與自訂設定；兩版都只能讀取原規格、共同前提與產品程式。只有 v2 額外讀取第二部分，禁止跨版本讀取。
5. 保存生成原稿，再執行 TypeScript 檢查與 Playwright。v1 的帳號檔路徑錯誤交回原 v1 session 修正；沒有手動改寫 AI 產生的測試。
6. 完整執行每版前，都從同一份空餐點、空訂單的資料庫快照另複製一份。固定 Chromium、workers=1、retries=0。
7. 直接執行兩個實際輸出目錄中的測試。沒有替換 import、插入觀察用 Fixture 或修改測試內容；截圖、console 與 API 請求回應從 Playwright trace 取出。
8. 檢查案例編號、工具讀取紀錄、寫入位置及原始檔案雜湊。原產品、原 specs、書稿及作者原本正在修改的 chapter30.md 都維持實驗開始時的內容。

實際生成的共用程式也都在各自版本內，兩版沒有共用 POM、Fixture、Repository 或 Mother。spec-comparison 只有共同範圍、帳號資料、環境準備與本報告。

## 提示詞與 session

兩版共同要求：直接依原 specs 實作指定的 27 個案例；每個原案例對應一個 test；完整驗證原案例的子條件；產品不符規格時保留失敗。差別是 v2 先讀第二部分並說明模式選擇，沒有要求每個模式都必須採用。

| 版本 | 完整提示詞 | 獨立 session 編號 |
| --- | --- | --- |
| v1 | [v1.txt](prompts/v1.txt) | `d84cdb8c-41a4-48b0-809b-71393294c2b9` |
| v2 | [v2.txt](prompts/v2.txt) | `75b3036e-5b82-410a-8187-9908047a1dc8` |

模型皆為 `claude-sonnet-5-5`；Claude Code 2.1.311、Playwright 1.63.0、Node.js v26.9.0。修正 v1 時延續 v1 自己的 session，沒有把 v1 的程式碼、錯誤或結果送給 v2。

讀取紀錄確認：v1 讀取 7 份 specs、0 章書稿；v2 讀取相同的 7 份 specs、第二部分 17 章。沒有觀察到跨版本讀取，所有生成與修正都寫入各自版本目錄。詳見 [audit.json](audit.json)。

## 原始生成與修正結果分開保留

v1 第一次實際跑 AUTH-T01 時，還沒進入登入步驟就失敗。它將 accounts.json 的相對路徑多往上計算了一層，找到了不存在的 `tests/spec-comparison/accounts.json`。

將真實錯誤交回同一個 v1 session 後，AI 只改了 [v1/support/env.ts](../../../tests/e2e/v1/tests/support/env.ts#L12) 的帳號檔路徑，接著完整執行得到 26 通過、1 失敗。修正提示詞是 [v1-fix-01.txt](prompts/v1-fix-01.txt)。v2 的原始產出則直接通過型別檢查，第一次完整執行就是 26 通過、1 失敗。

生成原稿分別保存在 [v1 原稿](archives/v1-initial-source.zip)、[v2 原稿](archives/v2-initial-source.zip)；v1 可執行版本另存於 [v1 修正後快照](archives/v1-executable-source.zip)。目前範例專案的 v1 是修正路徑後的版本；原稿沒有被丟掉。

另有一次實驗執行命令使用了不合適的 `--grep '^AUTH-T01'`，得到 No tests found；它沒有執行任何案例，屬於實驗命令問題，沒有算成 AI 測試失敗。改用 `--grep AUTH-T01` 後才觀察到上述路徑錯誤。

## 為什麼兩版都保留 ROLE-T02 失敗

原規格要求：外送員已有一筆進行中配送時，再接另一筆應被拒絕，另一筆仍未指派。兩版都依這項要求撰寫。

實際上，兩版瀏覽器都送出第二筆接單請求，後端回傳 HTTP 200 與 `{"status":"success"}`，也都沒有出現規格要求的拒絕提示。後端目前的 [driver.py](../../../food-grandma-fastapi/app/routers/driver.py#L13) 將上限設為 3。這是本次觀察到的規格與實作差異，不能靠修改模式解決，也沒有修改產品或規格來求通過。

兩支測試都在第一個拒絕提示的檢查失敗，因此其後的檢查沒有執行到。實驗另查詢各自資料庫，確認兩筆訂單都已指派給同一位外送員，狀態皆為配送中。原請求回應與額外查詢分別在：

- [v1 ROLE-T02 證據](results/v1-first-full/ROLE-T02)。
- [v2 ROLE-T02 證據](results/v2-first-full/ROLE-T02)。

## 程式碼實際有什麼不同

| 比較點 | v1 自行選擇的結構 | v2 閱讀第二部分後的結構 |
| --- | --- | --- |
| 頁面與定位元素 | 已有 POM，六個頁面類別集中在 pages.ts | POM 分成五份檔案，另有 OrderRow、MealRow、DispatchRow |
| 測試前提 | 測試建立 World，呼叫 helper 準備訂單 | Fixture 提供 Stage，OrderMother 命名備餐中、待取餐、配送中、已送達情境 |
| 餐點資料 | 直接傳物件，Api.createMeal 補預設值 | MealBuilder 提供預設值，測試指出需要改變的欄位 |
| 多角色 API | Api 裡分段放店家、顧客與外送員方法 | 認證 Strategy 與三個角色 Repository 分開 |
| 延遲與失敗回應 | 多支測試各寫 Promise、route、請求計數器 | Gate 與 RequestStub 統一處理，測試指定要延遲或回傳什麼 |
| 檢查結果 | expectRows 已經封裝列表與頁尾檢查 | assertions.ts 再集中列表、狀態與頁籤統計的檢查 |
| 沒有採用的模式 | 沒有要求特定選擇 | 明確沒有採用 Page Factory、Workflow Facade、Screenplay、Adapter、in-memory Fake |

例如，第一版需要在 helper 裡說明「第二筆是否備餐完成」：

```ts
/** Restaurant A with a Cooking order (customer A) and a second order (customer B). */
async function seedTwoOrders(world: World, opts: { markSecondReady: boolean }) {
  const rest = await world.restaurant();
  const meal = await world.meal(rest, { name: `${world.caseId} meal`, price: 100 });
  const common = world.tag('Common');
  const first = await world.order(rest, 'customerA', `Harbor Lane ${common}`, meal.id);
  const second = await world.order(rest, 'customerB', `Willow Court ${common}`, meal.id);
  if (opts.markSecondReady) await world.api.markReady(rest.token, second.id);
  return { rest, common, first, second };
}
```

第二版的角色接單案例則透過 Mother 表達前提：

```ts
  test('ROLE-T02 再接另一筆訂單被拒絕並留在可接訂單頁', async ({ page, stage }) => {
    const mother = await OrderMother.open(stage, 'ROLE-T02');
    const inProgress = await mother.onTheWay('customerA', 'ROLE-T02 Alpha Road 1', 'driverB');
    const another = await mother.ready('customerB', 'ROLE-T02 Bravo Lane 2');
    const driver = await (await stage.driver('driverB')).profile();
```

這些呼叫後面仍有真實 API 程式，沒有憑空產生特定狀態。完整實作在 [v2/support/order-mother.ts](../../../tests/e2e/v2/tests/support/order-mother.ts#L15)。兩個片段示範共用資料準備的組織方式；它們不是同一個案例的逐行對照。

要直接比較同一個案例，建議從 [v1/meals.spec.ts](../../../tests/e2e/v1/tests/meals.spec.ts#L61) 與 [v2/specs/meals.spec.ts](../../../tests/e2e/v2/tests/specs/meals.spec.ts#L43) 的 MEAL-T02 開始：兩者都先建立原價 100 的餐點，在網頁改為 150，確認同一個編號、名稱描述不變，而且沒有多出餐點。第二版主要把建立資料、選取餐點列及等待原值等細節搬進 Builder、Component 與頁面物件。

## 比較時要保留的限制

- v1 是「提示詞沒有額外指定模式」，不是「完全沒有模式」。原 specs/README.md 本來就提到 Fixture、POM、Builder 等建議；而且模型本來就可能自行使用模式。不能把這組實驗命名為「零模式 vs 有模式」。
- 兩版的 27 個原案例編號與必要行為一致，但 AI 自行展開的資料列、準備資料量及額外檢查不同。例如 FIND-T02 的查詢組合 v2 比 v1 多，ACCOUNT-T04 的 v2 先做一次成功儲存再驗證失敗。本次不是逐筆測試資料完全相同的效能實驗。
- 每版只完整執行一次。約 0.58 秒的差異不能說明第二版比較快，也沒有證明平行執行或長期穩定性。
- 第二版同時改了許多做法，不能把結果歸因於某一個模式，也不能保證每次生成都得到相同結構。
- v2 的 design-notes.md 是模型生成當下的自述，保留「尚未執行」原文供追溯；實際執行結果以本報告與 Playwright results.json 為準。
- 程式依賴本實驗的獨立帳號與每輪全新資料庫。未實測在已累積資料的環境重複執行、跨平台建置或提高 workers，不能當成已完成這些驗證。

## 第二部分的素材怎麼選

逐章對照另外整理於 [chapter-example-map.md](chapter-example-map.md)。它只列實驗中看得到的程式與尚需補做的實驗，沒有改寫章節。

v1 已經正確使用的 POM、依編號定位、資料驅動測試與等待方式，可以用來教讀者判斷「哪些值得保留」。目前沒有足夠理由把這組程式改成 Screenplay，也還沒有重現 Flaky；這兩件事不能寫成第一版已經發生的問題。

## 檔案與證據

- 實際 v1：[tests/e2e/v1](../../../tests/e2e/v1)。
- 實際 v2：[tests/e2e/v2](../../../tests/e2e/v2)。
- 原案例與兩版結果：[case-results.csv](case-results.csv)。
- v1 完整執行：[results.json](results/v1-first-full/results.json)、[stdout.log](results/v1-first-full/stdout.log)。
- v2 完整執行：[results.json](results/v2-first-full/results.json)、[stdout.log](results/v2-first-full/stdout.log)。
- 每個案例各有 trace、最後截圖、console、瀏覽器 network，以及 API 準備與查詢的請求回應。APIRequestContext 請求共擷取 v1 153 筆、v2 143 筆，這是請求次數，不是測試案例數。密碼與 token 已遮蔽。
- 本次工具腳本、session 原始紀錄、資料庫及快照保存在 本次工作資料夾（本機：`./work/specs-v1-v2-20261103`），沒有加入書稿或作為上一輪結果使用。

本次沒有執行 commit 或 push。
