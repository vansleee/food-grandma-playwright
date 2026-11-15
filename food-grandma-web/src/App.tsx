import { Link, Route, Routes } from "react-router-dom";
import { CartProvider } from "./CartContext";
import AppLayout from "./components/layout/AppLayout";
import RoleSelect from "./pages/RoleSelect";
import Restaurants from "./pages/customer/Restaurants";
import Meals from "./pages/customer/Meals";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import CustomerDelivery from "./pages/customer/Delivery";
import DriverOrders from "./pages/driver/Orders";
import DriverDelivery from "./pages/driver/Delivery";
import DriverEarnings from "./pages/driver/Earnings";

export default function App() {
  return (
    <CartProvider>
      <aside className="demo-notice" role="note">網站示範，資料可能定期重設。請勿輸入真實姓名、地址、電話或付款資訊；配送地址使用假資料。</aside>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Restaurants />} />
          <Route path="/account" element={<RoleSelect />} />
          <Route path="/customer/restaurants" element={<Restaurants />} />
          <Route
            path="/customer/restaurants/:restaurantId/meals"
            element={<Meals />}
          />
          <Route path="/customer/cart" element={<Cart />} />
          <Route path="/customer/checkout" element={<Checkout />} />
          <Route path="/customer/delivery" element={<CustomerDelivery />} />
          <Route path="/driver/orders" element={<DriverOrders />} />
          <Route path="/driver/delivery" element={<DriverDelivery />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route
            path="*"
            element={
              <div className="screen empty-state">
                <h1>找不到這個頁面</h1>
                <Link to="/customer/restaurants">返回餐廳列表</Link>
              </div>
            }
          />
        </Routes>
      </AppLayout>
    </CartProvider>
  );
}
