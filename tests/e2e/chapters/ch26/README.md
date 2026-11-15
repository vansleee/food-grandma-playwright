# 第 26 章｜平行執行的兩組實驗

先完成[章節範例的環境設定](../README.md#開始執行)。以下指令都從範例專案根目錄執行，macOS 與 Windows PowerShell 可以使用同一組指令。每次執行器都會準備獨立的測試資料庫、啟動本機服務，並設定零重試。

## 4.1～4.3｜先拆開共用餐點，再比較平行設定

[共用餐點的反例](worker-mode/parallel-meals.shared.spec.ts)只在 `beforeAll()` 建立一筆 100 元的雞腿便當。兩支測試依序操作同一個餐點編號。實測第一支改成 150 元後通過，第二支預期原價是 100 元，卻讀到 150 元，因此得到 `1 passed`、`1 failed`。這個指令會以非零狀態結束。

```text
npm --prefix tests/e2e/chapters run chapter -- 26 --variant v2 --config=ch26/playwright.config.ts --project=shared --workers=1
```

接著讓 Fixture 為兩支測試各自準備一筆餐點，再比較開啟平行設定前後的結果。

兩支測試各自準備一筆 100 元的餐點，再分別從網頁改成 150 元和 180 元。兩份程式碼使用相同的 Fixture、資料與驗收條件，唯一差異是在測試群組加入 `test.describe.configure({ mode: 'parallel' })`。

- [改寫前](worker-mode/parallel-meals.before.spec.ts)
- [改寫後](worker-mode/parallel-meals.after.spec.ts)

```text
npm --prefix tests/e2e/chapters run chapter -- 26 --variant v2 --config=ch26/playwright.config.ts --project=before --workers=2
npm --prefix tests/e2e/chapters run chapter -- 26 --variant v2 --config=ch26/playwright.config.ts --project=after --workers=2
```

| 設定 | 指定 worker 數 | 實際使用 | 結果 | 執行時間重疊 | 整輪耗時 |
| --- | ---: | ---: | --- | ---: | ---: |
| 改寫前 | 2 | 1 | `2 passed` | 0 ms | 2.2 秒 |
| 改寫後 | 2 | 2 | `2 passed` | 1,249 ms | 1.8 秒 |

[執行時間紀錄](worker-mode/results.json)列出各測試的 worker 編號和開始、結束時間。重疊時間取較早的結束時間減去較晚的開始時間。改寫前後都允許使用兩個 worker，改寫後的兩支測試才由不同 worker 同時執行。

## 4.4｜請 AI 沿用第 25 章寫法新增測試

在新的 Claude Code 對話貼上[精簡版提示詞](ai-generated/prompt.txt)。這次使用 Claude Code 2.1.311 和範例專案版本 `14c0d931`。兩次產生的 TypeScript 逐行一致。[長版提示詞與原始紀錄](ai-generated/long-prompt/)可供比較。

- [Claude 的原始回覆，含完整程式碼](ai-generated/claude-response.md)
- [可直接執行的版本](ai-generated/with-repository.spec.ts)

可執行版本只調整了匯入路徑，讓程式放在第 26 章時仍能使用共用程式和第 25 章的 Repository。請用以下指令分別執行 1 個和 2 個 worker。

```text
npm --prefix tests/e2e/chapters run chapter -- 26 --variant v2 --config=ch26/playwright.config.ts --project=ai-generated --workers=1
npm --prefix tests/e2e/chapters run chapter -- 26 --variant v2 --config=ch26/playwright.config.ts --project=ai-generated --workers=2
```

| 指定 worker 數 | 實際使用 | 結果 | 執行時間重疊 | 整輪耗時 |
| ---: | ---: | --- | ---: | ---: |
| 1 | 1 | `2 passed` | 0 ms | 2.1 秒 |
| 2 | 2 | `2 passed` | 953 ms | 1.4 秒 |

[執行與資料庫核對紀錄](ai-generated/results.json)列出兩支測試的執行時間、worker 編號，以及執行後查到的餐點編號、餐廳編號與價格。兩輪都各有一筆 150 元和一筆 180 元的雞腿便當，分屬不同餐廳。

Claude 為新增案例沿用了帳號表中的 `CH32-T02`，這個編號也出現在第 25 章的另一個情境。上述指令只選本實驗，並為每輪準備獨立資料庫。

本頁結果來自 2026 年 11 月 11 日（台灣時間）的實測。整輪耗時供本次觀察，會隨執行環境改變。每次執行的完整 Playwright 報告與 trace 會寫到終端機顯示的結果資料夾。
