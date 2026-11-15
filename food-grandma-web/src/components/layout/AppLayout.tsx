import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Brand from "./Brand";
import Navigation from "./Navigation";
import { brand } from "../../config/brand";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/driver/") || pathname === "/account") {
    const links = [
      { to: "/driver/orders", id: "nav-driver-orders", label: "可接訂單", icon: "▤" },
      { to: "/driver/delivery", id: "nav-driver-delivery", label: "進行中配送", icon: "◫" },
      { to: "/driver/earnings", id: "nav-driver-earnings", label: "本週紀錄", icon: "▥" },
    ];
    const section = links.find((link) => link.to === pathname)?.label ?? "體驗登入";
    return (
      <div className="operations-shell">
        <a className="skip-link" href="#main-content">跳到主要內容</a>
        <aside className="operations-sidebar">
          <Link className="operations-brand" to="/" aria-label="Food Grandma 首頁"><Brand /></Link>
          <div className="operations-caption">外送營運</div>
          <nav aria-label="外送員導覽" data-testid="driver-nav">
            {links.map((link) => <NavLink key={link.to} to={link.to} data-testid={link.id}><span aria-hidden="true">{link.icon}</span>{link.label}</NavLink>)}
            <NavLink className="operations-account" to="/account"><span aria-hidden="true">⚙</span>體驗登入</NavLink>
          </nav>
          <a className="operations-return" href="/management/" data-testid="nav-management">店家管理後台 ↗</a>
        </aside>
        <div className="operations-workspace">
          <header className="operations-topbar"><span>管理工作區 <b>/</b> {section}</span><Link to="/">返回訂餐網站 ↗</Link></header>
          <main id="main-content">{children}</main>
          <footer className="operations-footer">Food Grandma · 外送管理系統</footer>
        </div>
      </div>
    );
  }
  return (
    <div className="app-shell urban-storefront">
      <a className="skip-link" href="#main-content">
        跳到主要內容
      </a>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label={`${brand.name} 首頁`}>
          <Brand />
        </Link>
        <div className="header-note">{brand.tagline}</div>
        <a className="account-link" href="/management/" data-testid="nav-management">管理後台 ↗</a>
        <Link className="account-link" to="/account">
          體驗登入 ↗
        </Link>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <strong>{brand.name}</strong>
        <span>{brand.tagline}</span>
        <small>
          料理照片為示意圖 · Photos from{" "}
          <a href="https://unsplash.com" target="_blank" rel="noreferrer">
            Unsplash
          </a>
        </small>
      </footer>
      <Navigation />
    </div>
  );
}
