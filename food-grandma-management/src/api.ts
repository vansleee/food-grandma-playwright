import { clearToken, getToken } from "./auth";

const BASE = "/api";

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (resp.status === 401) {
    clearToken();
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.status === "failed") {
    throw new Error(
      data.error || data.detail || `Request failed: ${resp.status}`,
    );
  }
  return data;
}

export interface Restaurant {
  id: number;
  name: string;
  phone: string;
  address: string;
  logo: string;
}

export interface RestaurantUser {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Meal {
  id: number;
  name: string;
  short_description: string;
  image: string;
  price: number;
}

export interface Order {
  id: number;
  customer: { id: number; name: string; avatar: string; address: string };
  restaurant: { id: number; name: string; phone: string; address: string };
  driver: {
    id: number;
    name: string;
    avatar: string;
    car_model: string;
    plate_number: string;
  } | null;
  order_details: {
    id: number;
    meal: { id: number; name: string; price: number };
    quantity: number;
    sub_total: number;
  }[];
  total: number;
  status: string;
  address: string;
}

export interface Report {
  weekday_labels: string[];
  revenue: number[];
  order_counts: number[];
  meal_labels: string[];
  meal_data: number[];
  driver_labels: string[];
  driver_data: number[];
}

export const api = {
  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const resp = await fetch(`${BASE}/social/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    if (!resp.ok) {
      throw new Error("Invalid username or password");
    }
    return resp.json();
  },

  signUp(payload: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    logo: string;
  }): Promise<{ status: string; access_token?: string; error?: string }> {
    return request("/restaurant/sign_up/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getMe(): Promise<{ restaurant: Restaurant; user: RestaurantUser }> {
    return request("/restaurant/me/");
  },

  updateMe(payload: {
    first_name: string;
    last_name: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    logo: string;
  }): Promise<{ restaurant: Restaurant; user: RestaurantUser }> {
    return request("/restaurant/me/", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  listMeals(): Promise<{ meals: Meal[] }> {
    return request("/restaurant/meals/");
  },

  getMeal(id: number): Promise<{ meal: Meal }> {
    return request(`/restaurant/meals/${id}`);
  },

  createMeal(payload: {
    name: string;
    short_description: string;
    image: string;
    price: number;
  }): Promise<{ meal: Meal }> {
    return request("/restaurant/meals/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateMeal(
    id: number,
    payload: {
      name: string;
      short_description: string;
      image: string;
      price: number;
    },
  ): Promise<{ meal: Meal }> {
    return request(`/restaurant/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  listOrders(): Promise<{ orders: Order[] }> {
    return request("/restaurant/orders/");
  },

  markOrderReady(id: number): Promise<{ order: Order }> {
    return request(`/restaurant/orders/${id}`, { method: "PATCH" });
  },

  getReport(): Promise<Report> {
    return request("/restaurant/report/");
  },

  getNotifications(since: string): Promise<{ notification: number }> {
    return request(
      `/restaurant/notifications/?since=${encodeURIComponent(since)}`,
    );
  },
};
