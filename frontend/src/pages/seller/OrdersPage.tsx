import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders";
import { formatPrice, formatDate } from "@/utils/format";
import { StatusBadge, PaymentBadge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Plus } from "lucide-react";
import CreateOrderModal from "@/components/seller/CreateOrderModal";
import OrderDetailModal from "@/components/seller/OrderDetailModal";

const STATUSES = [
  { key: "", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "processing", label: "В работе" },
  { key: "ready", label: "Готовые" },
  { key: "delivered", label: "Выданные" },
];

export default function OrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", status, search],
    queryFn: () => ordersApi.list({ status: status || undefined, search: search || undefined }),
    refetchInterval: 15_000,
  });

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Заказы</h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} className="mr-1" />Создать
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              status === s.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Поиск по имени, телефону..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* ── Mobile: card list ─────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Заказов нет</div>
        ) : orders.map((o) => (
          <button
            key={o.id}
            className="w-full bg-white rounded-xl border border-gray-100 p-3 text-left active:bg-gray-50"
            onClick={() => setSelectedOrderId(o.id)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-800">#{o.order_number ?? o.id}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-gray-700 truncate">{o.client_name || o.client_phone || "—"}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-sm font-bold text-primary-600">{formatPrice(o.total_amount)}</span>
              <div className="flex items-center gap-2">
                <PaymentBadge method={o.payment_method} />
                <span className="text-xs text-gray-400">{formatDate(o.created_at)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Desktop: table ────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">Клиент</th>
              <th className="px-4 py-3 text-right">Сумма</th>
              <th className="px-4 py-3 text-center">Статус</th>
              <th className="px-4 py-3 text-left">Оплата</th>
              <th className="px-4 py-3 text-right">Время</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Загрузка...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Заказов нет</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrderId(o.id)}>
                <td className="px-4 py-3 font-medium text-gray-700">#{o.order_number ?? o.id}</td>
                <td className="px-4 py-3 text-gray-800">{o.client_name || o.client_phone || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPrice(o.total_amount)}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3"><PaymentBadge method={o.payment_method} /></td>
                <td className="px-4 py-3 text-right text-gray-500">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ["orders"] }); }}
        />
      )}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdated={() => qc.invalidateQueries({ queryKey: ["orders"] })}
        />
      )}
    </div>
  );
}
