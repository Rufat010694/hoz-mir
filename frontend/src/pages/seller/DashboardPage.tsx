import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/utils/format";
import { StatusBadge } from "@/components/common/Badge";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="flex-1 flex items-center justify-center text-gray-400">Загрузка...</div>;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Главная</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Package size={20} />} label="Товаров" value={data?.products_count ?? 0} color="blue" />
        <StatCard icon={<ShoppingCart size={20} />} label="Заказов сегодня" value={data?.today_orders ?? 0} color="green" />
        <StatCard icon={<TrendingUp size={20} />} label="Новых заказов" value={data?.new_orders ?? 0} color="yellow" />
        <StatCard icon={<Users size={20} />} label="Выручка сегодня" value={formatPrice(data?.today_revenue ?? 0)} color="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Последние заказы</h3>
          <div className="space-y-2">
            {data?.recent_orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">#{o.id} {o.client_name}</p>
                  <p className="text-xs text-gray-500">{PAYMENT_LABELS[o.payment_method]} · {o.created_at}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatPrice(o.total_amount)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products + debts */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Популярные товары</h3>
            {data?.top_products.map((p, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{p.name}</span>
                <span className="text-sm font-medium text-primary-600">{p.sold} шт.</span>
              </div>
            ))}
          </div>

          {(data?.client_debts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Долги клиентов</h3>
              {data?.client_debts.map((d, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{d.name}</span>
                  <span className="text-sm font-semibold text-red-600">{formatPrice(d.debt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colors[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
