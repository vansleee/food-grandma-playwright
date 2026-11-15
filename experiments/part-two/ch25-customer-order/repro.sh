#!/bin/sh
set -eu
# 從範例專案根目錄執行，重現登入、資料準備、網頁訂購及 API 查詢。
npm --prefix tests/e2e/chapters run chapter -- 19
