import { registerPriceCase } from '../support/price-case';
import experiment from '../../experiment.json';

// 教學反例：固定等一段時間，再立即讀值，沒有確認資料是否已載入。
registerPriceCase(async (page, form) => {
  await page.waitForTimeout(experiment.fixed_wait_ms);
  return form.price().inputValue();
});
