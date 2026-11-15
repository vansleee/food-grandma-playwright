# specs 兩版生成實驗

已完成實測，兩版各 27 個原案例，均為 26 通過、1 失敗。失敗案例 ROLE-T02 是規格要求一次一筆配送、產品允許三筆的差異。

- [完整結果與步驟](RESULTS.md)。
- [現行第二部分逐章素材對照](../chapter-example-map.md)；[當時的素材表](chapter-example-map.md) 保留原實驗狀態。
- [v1](../../../tests/e2e/v1)、[v2](../../../tests/e2e/v2)：實際輸出的測試與共用程式。
- [cases.json](cases.json)／[cases.md](cases.md)：共同範圍；[environment.md](environment.md)：原實驗環境前提。這裡的 accounts.json 與 seed_accounts.py 保留當時快照，目前兩版執行時使用 [shared/](../../../tests/e2e/shared/README.md)。
- prompts/：兩版完整原提示詞及 v1 路徑修正提示詞。
- input-hashes.json／audit.json：輸入、產出與 session 稽核。

## 再執行時的前提

現在建議直接使用 [chapters 的執行入口](../../../tests/e2e/chapters/README.md)：在該資料夾執行 `npm run chapter -- v1` 或 `npm run chapter -- v2`，會從 shared/ 讀取共同帳號並準備獨立環境。以下保留原實驗的手動準備方式；若手動準備目前的 v1、v2，請改用 `tests/e2e/shared/seed_accounts.py`，讓建立帳號與測試讀取的資料一致。

測試使用 TEST_PASSWORD、API_BASE_URL、WEB_BASE_URL。這次實測的服務位址分別是 http://127.0.0.1:18081 與 http://127.0.0.1:18082；實驗結束後已停止這三個獨立服務。原本的 8081、8082 沒有重設或停止。

每輪必須使用獨立資料庫，並先用 seed_accounts.py 建立本資料夾的帳號；這個腳本由實驗準備，沒有建立餐點或訂單，也沒有被算成兩版生成的程式。它需要原 FastAPI 專案的 Python 環境與 PYTHONPATH，並設定 DATABASE_URL、TEST_PASSWORD、SEED_DEMO_DATA=false、PUBLIC_DEMO_MODE=false。不要對既有資料庫重複執行；腳本會拒絕已存在的帳號。

在餐廳資料及帳號準備完成、前後端服務已啟動後，進入要執行的 v1 或 v2 資料夾，安裝相同套件與 Chromium，再設定三個環境變數並執行 `npm test`。macOS 可用 `export 變數=值`；Windows PowerShell 用 `$env:變數='值'`。兩版各自從同一份初始資料庫複本執行，不能先後共用已被上一版修改的資料庫。

這份實驗在目前 macOS 環境實際執行；沒有宣稱已驗證 Windows 或全新電腦建置。完整執行命令、獨立服務啟動方式、原始快照、資料庫與 trace 都在 本次工作資料夾（本機：`./work/specs-v1-v2-20261103`） 的 runtime.py 與 evidence/。密碼檔不放入範例專案。
