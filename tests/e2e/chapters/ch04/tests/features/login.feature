Feature: 餐廳管理登入

  Scenario: 練習 1 Given-When-Then：密碼錯誤時顯示登入錯誤訊息
    Given 餐廳管理者在登入頁面
    When 餐廳管理者填寫有效的帳號與錯誤的密碼並送出
    Then 畫面應顯示登入錯誤訊息
