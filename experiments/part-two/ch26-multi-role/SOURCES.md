# Screenplay 來源查證

查證日期：2026 年 11 月 7 日。這是實驗取材紀錄，不修改書稿。

## 歷史來源

[Cucumber screenplay.js 的 Credits](https://github.com/cucumber/screenplay.js/#credits) 記錄：2007 年 Antony Marcano 在 Agile Alliance Functional Test Tools workshop 展示 Journey Pattern；2012 年 Antony Marcano 與 Andy Palmer 提供首個公開實作 Screenplay4j；2015 年 John Ferguson Smart、Jan Molak 與 Andy Palmer、Antony Marcano 將支援加入 Serenity BDD。該專案用於查證歷史，不是本實驗安裝的套件。

Serenity 的 [Working with REST APIs using Serenity Screenplay](https://github.com/serenity-bdd/the-serenity-book/blob/master/modules/ROOT/pages/serenity-screenplay-rest.adoc) 也追溯到 Antony Marcano 於 2007 年提出的想法，並說明 Screenplay 名稱來自戲劇比喻，而非電腦螢幕；命名與最初概念形成是不同事件，不簡化成某人於 2015 年單獨發明。

## 設計與本次實作

[Serenity/JS Screenplay Pattern](https://serenity-js.org/handbook/design/screenplay-pattern/) 說明 Actor、Ability、Interaction、Task、Question 五個組成。

本實驗使用手寫的簡化介面，沒有安裝 Serenity/JS，也不冒充其 API：

- Actor：顧客、餐廳管理者、外送員。
- Ability：`BrowseTheWeb` 持有各角色的獨立 Page；`ReadRestaurantOrders` 只提供給管理者。
- Interaction：沿用 POM 內的點擊、填寫與等待，不為每個點擊額外建立類別。
- Task：`PlaceOrder`、`MarkOrderReady`、`DeliverOrder`。
- Question：`TheOrder` 只查詢，驗收條件保留在測試共用的 `expectLifecycle()`。

「混合責任的 POM」是刻意安排的教學反例，不是原始 v1 的錯誤。「角色分工的 POM」同樣通過，避免把模式差異說成 POM 不能支援多角色。角色狀態由 Fixture 建立獨立 browser context，不能只依賴 Actor 名稱。
