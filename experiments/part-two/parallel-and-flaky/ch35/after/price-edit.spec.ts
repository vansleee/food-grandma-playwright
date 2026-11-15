import { expect } from '../../baseline/tests/support/fixtures';
import { registerPriceCase } from '../support/price-case';

registerPriceCase(async (_page, form, original) => {
  await expect(form.price()).toHaveValue(String(original.price));
  return form.price().inputValue();
});
