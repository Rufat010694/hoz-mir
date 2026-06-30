import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import clsx from "clsx";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart2,
  Settings, LogOut, Share2, Tag, Menu, X,
} from "lucide-react";

const navItems = [
  { to: "/seller",               label: "Главная",    icon: LayoutDashboard, exact: true },
  { to: "/seller/products",      label: "Товары",     icon: Package },
  { to: "/seller/categories",    label: "Категории",  icon: Tag },
  { to: "/seller/orders",        label: "Заказы",     icon: ShoppingCart },
  { to: "/seller/clients",       label: "Клиенты",    icon: Users },
  { to: "/seller/catalog-share", label: "Мой каталог", icon: Share2 },
  { to: "/seller/reports",       label: "Отчёты",     icon: BarChart2 },
  { to: "/seller/settings",      label: "Настройки",  icon: Settings },
];

// First 4 in mobile bottom bar; rest go into "More" sheet
const MOBILE_MAIN = navItems.slice(0, 4);
const MOBILE_MORE = navItems.slice(4);

export default function SellerLayout() {
  useWebSocket();
  const { logout, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const doLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200 py-4">
        <div className="px-3 mb-1">
          <img src="/logo.png" alt="Хоз Мир" className="w-full object-contain" />
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors",
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
          <div className="px-3 py-1 text-xs text-gray-400">{user?.store_name || user?.username}</div>
          <button
            onClick={doLogout}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1 z-40">
        {MOBILE_MAIN.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              "flex flex-col items-center gap-0.5 text-xs px-2 py-1.5 min-w-[52px]",
              isActive(to, exact) ? "text-primary-600" : "text-gray-500"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 text-xs px-2 py-1.5 min-w-[52px] text-gray-500"
        >
          <Menu size={20} />
          Ещё
        </button>
      </nav>

      {/* "Ещё" bottom sheet (mobile) */}
      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setMoreOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
              <span className="font-semibold text-gray-800">{user?.store_name || user?.username}</span>
              <button onClick={() => setMoreOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-2">
              {MOBILE_MORE.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm",
                    isActive(to) ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              ))}
              <button
                onClick={doLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 w-full mt-1"
              >
                <LogOut size={20} /> Выйти
              </button>
            </div>
            <div className="h-6" />
          </div>
        </>
      )}
    </div>
  );
}
