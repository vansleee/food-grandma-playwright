# 本次實際執行的結果與證據

十二個資料夾各自保存一輪 Playwright 的 results.json、stdout.log、launch.json、exit.json 與 case-outcomes.json。

cases/ 內依案例保存 observation.json、outcome.json、console.log、network.log、requests.jsonl 及 raw/ 的 API 請求與回應。密碼與 token 已遮蔽。Fake 的 network.log、requests.jsonl 為空，這是沒有 HTTP 請求的實際結果。

JSON 中的 cwd、attachments 可能保留當次電腦的歷史絕對路徑。完整 trace、所有步驟截圖與逐輪重現腳本仍在 RESULTS.md 記錄的本機工作資料夾；代表截圖另放在 evidence-samples/。
