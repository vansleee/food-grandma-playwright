export interface Restaurant {
  id: number;
  name: string;
  phone: string;
  address: string;
  logo: string;
}

export interface Meal {
  id: number;
  name: string;
  short_description: string;
  image: string;
  price: number;
}

export interface CartItem {
  meal: Meal;
  quantity: number;
}

export interface OrderDetail {
  id: number;
  meal: { id: number; name: string; price: number };
  quantity: number;
  sub_total: number;
}

export interface OrderDriver {
  id: number;
  name: string;
  avatar: string;
  car_model: string;
  plate_number: string;
}

export interface Order {
  id: number;
  customer: { id: number; name: string; avatar: string; address: string };
  restaurant: { id: number; name: string; phone: string; address: string };
  driver: OrderDriver | null;
  order_details: OrderDetail[];
  total: number;
  status: string;
  address: string;
}

export interface DriverProfile {
  id: number;
  name: string;
  avatar: string;
  car_model: string;
  plate_number: string;
}
