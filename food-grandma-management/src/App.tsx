import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Account from "./pages/Account";
import MealForm from "./pages/MealForm";
import Meals from "./pages/Meals";
import Orders from "./pages/Orders";
import { lazy, Suspense } from "react";
const Report = lazy(() => import("./pages/Report"));
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

export default function App() {
  return (
    <BrowserRouter basename="/management">
      <aside className="demo-notice" role="note">網站示範，資料可能定期重設。請勿輸入真實姓名、地址、電話或付款資訊；配送地址使用假資料。</aside>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        <Route element={<Layout />}>
          <Route path="/orders" element={<Orders />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/meals/add" element={<MealForm />} />
          <Route path="/meals/:mealId/edit" element={<MealForm />} />
          <Route
            path="/report"
            element={
              <Suspense fallback={<p role="status">正在載入營運報表…</p>}>
                <Report />
              </Suspense>
            }
          />
          <Route path="/account" element={<Account />} />
        </Route>

        <Route path="*" element={<Navigate to="/orders" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
