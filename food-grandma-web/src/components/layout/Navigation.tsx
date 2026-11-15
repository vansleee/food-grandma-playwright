import { NavLink, useLocation } from "react-router-dom";
import { useCart } from "../../CartContext";

export default function Navigation() {
  const { pathname } = useLocation();
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const driver = pathname.startsWith("/driver");
  if (!driver && pathname !== "/" && !pathname.startsWith("/customer"))
    return null;
  const links = driver
    ? [
        { to: "/driver/orders", id: "nav-driver-orders", label: "可接訂單" },
        {
          to: "/driver/delivery",
          id: "nav-driver-delivery",
          label: "進行中配送",
        },
        {
          to: "/driver/earnings",
          id: "nav-driver-earnings",
          label: "本週紀錄",
        },
      ]
    : [
        {
          to: "/customer/restaurants",
          id: "nav-restaurants",
          label: "探索餐廳",
        },
        { to: "/customer/cart", id: "nav-cart", label: `購物車 (${count})` },
        { to: "/customer/delivery", id: "nav-delivery", label: "訂單進度" },
      ];
  return (
    <nav
      className="tab-bar"
      aria-label={driver ? "外送員導覽" : "顧客導覽"}
      data-testid={driver ? "driver-nav" : "customer-nav"}
    >
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          data-testid={link.id}
          className={({ isActive }) =>
            isActive || (pathname === "/" && link.id === "nav-restaurants")
              ? "active"
              : undefined
          }
          aria-current={
            pathname === "/" && link.id === "nav-restaurants"
              ? "page"
              : undefined
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
