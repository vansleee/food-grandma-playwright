import Brand from "./Brand";
import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { api } from "../api";
import { clearToken, isAuthenticated } from "../auth";

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const section = pathname.startsWith("/meals")
    ? "餐點管理"
    : pathname.startsWith("/report")
      ? "營運報表"
      : pathname.startsWith("/account")
        ? "餐廳設定"
        : "訂單管理";
  const [notificationCount, setNotificationCount] = useState(0);
  const lastCheckRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (!isAuthenticated()) return;

    const poll = async () => {
      try {
        const data = await api.getNotifications(lastCheckRef.current);
        setNotificationCount(data.notification);
      } catch {
        // ignore transient polling errors
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/sign-in" replace />;
  }

  function signOut() {
    clearToken();
    navigate("/sign-in");
  }

  return (
    <div className="dashboard">
      <a className="skip-link" href="#main-content">
        跳至主要內容
      </a>
      <nav className="sidebar" data-testid="sidebar">
        <a href="/" className="sidebar-title" aria-label="Food Grandma 首頁">
          <Brand />
        </a>
        <div className="sidebar-caption">餐廳營運</div>
        <ul>
          <li>
            <NavLink to="/orders" data-testid="nav-orders">
              <span className="nav-icon">▤</span> 訂單管理
              {notificationCount > 0 && (
                <span className="badge" data-testid="notification-badge">
                  {notificationCount}
                </span>
              )}
            </NavLink>
          </li>
          <li>
            <NavLink to="/meals" data-testid="nav-meals">
              <span className="nav-icon">◫</span> 餐點管理
            </NavLink>
          </li>
          <li>
            <NavLink to="/report" data-testid="nav-report">
              <span className="nav-icon">▥</span> 營運報表
            </NavLink>
          </li>
          <li>
            <NavLink to="/account" data-testid="nav-account">
              <span className="nav-icon">⚙</span> 餐廳設定
            </NavLink>
          </li>
          <li>
            <button type="button" onClick={signOut} data-testid="nav-sign-out">
              <span className="nav-icon">↩︎</span> 登出帳號
            </button>
          </li>
        </ul>
        <div className="sidebar-bottom">
          <a href="/">查看訂餐網站 ↗</a>
        </div>
      </nav>
      <div className="workspace">
        <header className="workspace-topbar">
          <span>
            管理後台 <b>/</b> {section}
          </span>
          <a href="/">返回訂餐網站 ↗</a>
        </header>
        <main className="content" id="main-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          Food Grandma · 餐廳管理系統
        </footer>
      </div>
    </div>
  );
}
