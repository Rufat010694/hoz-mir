import { useQuery, useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders";
import { formatPrice, formatDate, PAYMENT_LABELS } from "@/utils/format";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { OrderStatus, PaymentMethod } from "@/types";
import toast from "react-hot-toast";
import { X, Printer } from "lucide-react";

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  new: "processing",
  processing: "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

const STATUS_NEXT_LABEL: Record<OrderStatus, string | null> = {
  new: "В обработку",
  processing: "Готов",
  ready: "Выдан",
  delivered: null,
  cancelled: null,
};

interface Props { orderId: number; onClose: () => void; onUpdated: () => void; }

export default function OrderDetailModal({ orderId, onClose, onUpdated }: Props) {
  const { data: order, isLoading } = useQuery({ queryKey: ["order", orderId], queryFn: () => ordersApi.get(orderId) });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => { toast.success("Статус обновлён"); onUpdated(); },
    onError: () => toast.error("Ошибка смены статуса"),
  });

  const paymentMutation = useMutation({
    mutationFn: (pm: PaymentMethod) => ordersApi.updatePayment(orderId, pm),
    onSuccess: () => { toast.success("Оплата обновлена"); onUpdated(); },
    onError: () => toast.error("Ошибка смены оплаты"),
  });

  const isBusy = statusMutation.isPending || paymentMutation.isPending;

  const changeStatus = (status: OrderStatus) => {
    onClose(); // закрываем сразу, не ждём ответа
    statusMutation.mutate(status);
  };

  const printInvoice = () => {
    if (!order) return;
    const storeName = (window as any).__STORE_NAME__ || "Магазин";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Счёт #${order.order_number ?? order.id}</title>
<style>
  body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:14px}
  h1{font-size:20px;margin-bottom:4px}
  .meta{color:#555;font-size:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{text-align:left;border-bottom:2px solid #111;padding:6px 4px;font-size:12px}
  td{padding:6px 4px;border-bottom:1px solid #eee}
  .total{font-weight:bold;font-size:16px;text-align:right}
  .footer{margin-top:24px;font-size:11px;color:#888}
  @media print{body{padding:0}}
</style></head><body>
<h1>Счёт-фактура #${order.order_number ?? order.id}</h1>
<div class="meta">
  Дата: ${new Date(order.created_at).toLocaleString("ru")}<br/>
  Клиент: ${order.client_name || "—"} | Тел: ${order.client_phone || "—"}${order.client_store ? ` | Магазин: ${order.client_store}` : ""}<br/>
  Оплата: ${PAYMENT_LABELS[order.payment_method as keyof typeof PAYMENT_LABELS] ?? order.payment_method}
</div>
<table>
  <thead><tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th style="text-align:right">Сумма</th></tr></thead>
  <tbody>
    ${order.items.map(i => `<tr><td>${i.product_name}</td><td>${formatPrice(i.price)}</td><td>${i.quantity}</td><td style="text-align:right">${formatPrice(i.subtotal)}</td></tr>`).join("")}
  </tbody>
</table>
<div class="total">Итого: ${formatPrice(order.total_amount)}</div>
${order.comment ? `<p style="color:#555;font-size:12px;margin-top:12px">Комментарий: ${order.comment}</p>` : ""}
<div class="footer">Документ сформирован автоматически · ${storeName}</div>
</body></html>`;
    const w = window.open("", "_blank", "width=700,height=600");
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  if (isLoading || !order) return null;
  const nextStatus = STATUS_NEXT[order.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">Заказ #{order.order_number ?? order.id}</h3>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={printInvoice} title="Распечатать счёт" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
              <Printer size={18} />
            </button>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">Клиент:</span> {order.client_name || "—"}</p>
            <p><span className="font-medium">Телефон:</span> {order.client_phone || "—"}</p>
            {order.client_store && <p><span className="font-medium">Магазин:</span> {order.client_store}</p>}
            <p><span className="font-medium">Дата:</span> {formatDate(order.created_at)}</p>
            {order.comment && <p><span className="font-medium">Комментарий:</span> {order.comment}</p>}
          </div>

          <div className="border rounded-xl overflow-hidden">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between p-3 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name}</p>
                  <p className="text-gray-500">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-800">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
            <div className="flex justify-between p-3 bg-gray-50 font-semibold text-gray-800">
              <span>Итого</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Способ оплаты</label>
            <select
              value={order.payment_method}
              onChange={(e) => paymentMutation.mutate(e.target.value as PaymentMethod)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="flex gap-3">
            {order.status !== "cancelled" && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => changeStatus("cancelled")}
                disabled={isBusy}
              >
                Отменить
              </Button>
            )}
            {nextStatus && STATUS_NEXT_LABEL[order.status] && (
              <Button
                className="flex-1"
                onClick={() => changeStatus(nextStatus)}
                disabled={isBusy}
              >
                → {STATUS_NEXT_LABEL[order.status]}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
