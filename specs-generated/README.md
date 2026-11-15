# AI 產生的規格草稿

本目錄只放 AI 根據 `specs-draft/` 輸入資料整理出的規格草稿，與人工維護的 `specs/` 分開。這裡的文件尚未核准，不可直接交給測試產生流程當作正式需求。

## 產生 `01-restaurant-auth.md`

1. 從配套 repo 根目錄開啟 AI 工具。
2. 提供 `.github/prompts/generate-spec.md` 的內容，要求 AI 閱讀其中指定的兩份 `specs-draft/01-restaurant-auth/` 輸入資料。
3. 確認 AI 只建立或更新 `specs-generated/01-restaurant-auth.md`，沒有修改 `specs/` 或產品程式碼。
4. 對照草稿來源，審查規則、驗收情境、待確認問題與來源；需要時先修改輸入或提示，再重新產生草稿。
5. 由需求負責人核准後，才透過人工審查與版本控制，決定是否將內容整理進 `specs/`。不要只因 AI 產生完成就視為核准。

`specs/` 是另外維護的參考規格；`specs-generated/` 則是生成中間產物。兩者不得互相覆寫。
