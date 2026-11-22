# CH16-E01 餐廳管理者用錯誤密碼登入
種子測試為 ch16/generated/examples/1-1/seed.spec.ts。
沿用 ../../fixtures/demo.ts 的 demo Fixture，為每次執行準備已存在的餐廳帳號。
使用正確帳號與不同於正確密碼的非空密碼，從網頁送出登入。
驗收時要確認錯誤訊息已顯示、網址仍在 /management/sign-in、登入表單仍可見。
登入頁物件放在同目錄 pages.ts，供這支練習測試使用。
輸出 ch16/generated/examples/1-1/wrong-password.spec.ts。
