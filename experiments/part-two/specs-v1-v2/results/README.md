# 已納入版本庫的執行結果

各輪 results.json、stdout.log、exit.json 與 launch.json 保留當次 Playwright 結果、失敗訊息及執行參數。case-outcomes.json 或 case-summary.json 記錄逐案例結果；代表案例另保存已遮蔽憑證的 API 請求、回應與觀察值。

這些 JSON 是當次工具原始輸出，attachments 與 cwd 可能保留執行電腦的絕對路徑，作為實驗紀錄。完整 trace 與全部原始截圖仍保留於 RESULTS.md 記錄的本機工作資料夾，不在版本庫內；資料庫、密碼檔與 node_modules 也未納入。
