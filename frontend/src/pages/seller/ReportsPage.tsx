import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { formatPrice } from "@/utils/format";

const PERIODS = [
  { key: "day" as const, label: "День" },
  { key: "week" as const, label: "Неделя" },
  { key: "month" as const, label: "Месяц" },
  { key: "year" as const, label: "Год" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("week");

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales", period],
    queryFn: () => reportsApi.sales(period),
  });

  const totalRevenue = sales.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = sales.reduce((s, r) => s + r.orders, 0);

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Отчёты</h2>

      <div className="flex gap-1 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              period === p.key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">Выручка</p>
          <p className="text-2xl font-bold text-primary-600">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">Заказов</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Дата</th>
              <th className="px-4 py-3 text-right">Заказов</th>
              <th className="px-4 py-3 text-right">Выручка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">Загрузка...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-gray-400">Нет данных</td></tr>
            ) : sales.map((r) => (
              <tr key={r.date}>
                <td className="px-4 py-3 text-gray-700">{r.date}</td>
                <td className="px-4 py-3 text-right text-gray-600">{r.orders}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPrice(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
