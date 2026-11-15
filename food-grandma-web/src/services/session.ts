// Keep legacy storage keys so existing customers retain their sessions.
const CUSTOMER_TOKEN_KEY = "food_alpaca_customer_token";
const DRIVER_TOKEN_KEY = "food_alpaca_driver_token";

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function getDriverToken(): string | null {
  return localStorage.getItem(DRIVER_TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function setDriverToken(token: string) {
  localStorage.setItem(DRIVER_TOKEN_KEY, token);
}

export function clearTokens() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(DRIVER_TOKEN_KEY);
}
