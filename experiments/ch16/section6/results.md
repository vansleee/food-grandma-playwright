# 第 16 章第 6 節：練習實作結果

2026 年 11 月 23 日，本機獨立 SQLite、headless、一個 worker、零重試。兩題各使用新的 Claude Code Playwright Generator 對話；第二題只提供 revised，第三題提供第 15 章的手寫程式，未提供本題現成答案。兩題生成後的型別檢查首次通過，不需要後續修正對話。

| 執行項目 | 結果 | 時間 |
| --- | --- | --- |
| public-q1-manual | 1 passed | 7.6 秒 |
| public-q1-original | 1 passed | 7.1 秒 |
| public-q1-revised | 1 passed | 7.1 秒 |
| public-q2 | 1 passed | 6.9 秒 |
| public-q3 | 1 passed | 6.5 秒 |
| synced-q2 | 1 passed | 7.3 秒 |
| synced-q3 | 1 passed | 6.5 秒 |

## 程式與提示詞

- 第二題：tests/e2e/chapters/ch16/generated/examples/1-2/；沿用 revised，新增指定訂單卡片內的送達動作，兩邊驗收不變。
- 第三題：tests/e2e/chapters/ch16/generated/examples/1-3/；先閱讀第 15 章，直接引用既有 SignInPage，新增錯誤密碼登入。錯誤訊息、網址與表單可使用的檢查都保留在測試。
- 各目錄的 prompt.txt 是實際使用的提示詞；種子測試與 test-case.md 也一併保留。
- 兩個範例專案已同步原始產出，沒有人工重構生成的程式。

## 審查結果

第二題依編號精確比對卡片標題，再操作卡片內的按鈕。這輪只執行原本一筆進行中配送的測試案例，沒有宣稱驗證多筆訂單。

第三題能參考第 15 章的 AAA 與登入方法，但部分定位器仍直接寫在測試裡。這是實際產出與手寫版仍有差異的地方，不因通過就判斷風格完全相同。正式測試使用 demo.restaurant_login 的有效帳號，錯誤密碼是正確密碼加上 -wrong。

Q2 Generator 執行為 1 passed（7.6 秒），Q3 為 1 passed（6.8 秒）。Q3 探索階段有一次工具錯誤，細節在 q3-tools.json；正式測試第一次執行就通過。

## 證據

詳細命令、來源雜湊與結果在 execution.json。工具紀錄另存 q2-tools.json 與 q3-tools.json。trace、截圖、主控台與網路紀錄放在兩個範例專案各自的 tests/e2e/chapters/test-results/direct/ch16-exercises-latest/，不納入 Git。

書稿只更新第 16 章第 6 節，三個題目各自緊接參考答案，其餘段落未改。
