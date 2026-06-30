import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import clsx from "clsx";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart2,
  Settings, LogOut, Share2,
} from "lucide-react";

const navItems = [
  { to: "/seller", label: "Главная", icon: LayoutDashboard, exact: true },
  { to: "/seller/products", label: "Товары", icon: Package },
  { to: "/seller/orders", label: "Заказы", icon: ShoppingCart },
  { to: "/seller/clients", label: "Клиенты", icon: Users },
  { to: "/seller/catalog-share", label: "Мой каталог", icon: Share2 },
  { to: "/seller/reports", label: "Отчёты", icon: BarChart2 },
  { to: "/seller/settings", label: "Настройки", icon: Settings },
];

export default function SellerLayout() {
  useWebSocket();
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-200 py-4">
        <div className="px-4 mb-6">
          <h1 className="text-lg font-bold text-primary-700">
            {user?.store_name || "Мой Магазин"}
          </h1>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive(to, exact)
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-2 mt-4 border-t pt-4 space-y-1">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full"
          >
            <LogOut size={18} /> Выход
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              "flex flex-col items-center gap-0.5 text-xs px-2 py-1",
              isActive(to, exact) ? "text-primary-600" : "text-gray-500"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
