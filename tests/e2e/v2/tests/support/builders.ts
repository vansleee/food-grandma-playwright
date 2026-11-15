import type { MealDraft, ProfilePayload, RestaurantProfile } from './domain';

/**
 * Ch29 Test Data Builder：預設值固定、不使用亂數或時間；
 * 測試只寫出與預設不同、且會影響結果的欄位。
 */
export class MealBuilder {
  private value: MealDraft;

  constructor(label: string) {
    this.value = {
      name: `${label} Meal`,
      short_description: `${label} description`,
      image: '',
      price: 100,
    };
  }

  named(name: string) {
    this.value.name = name;
    return this;
  }
  described(description: string) {
    this.value.short_description = description;
    return this;
  }
  priced(price: number) {
    this.value.price = price;
    return this;
  }
  build(): MealDraft {
    return { ...this.value };
  }
}

/** 以 API 讀回的原始資料為起點，只改這次要改的欄位（ACCOUNT 規格「資料與前提」）。 */
export class ProfileBuilder {
  private value: ProfilePayload;

  private constructor(value: ProfilePayload) {
    this.value = value;
  }

  static from({ restaurant, user }: RestaurantProfile) {
    return new ProfileBuilder({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      name: restaurant.name,
      phone: restaurant.phone,
      address: restaurant.address,
      logo: restaurant.logo,
    });
  }

  withPhone(phone: string) {
    this.value.phone = phone;
    return this;
  }
  withAddress(address: string) {
    this.value.address = address;
    return this;
  }
  build(): ProfilePayload {
    return { ...this.value };
  }
}
