import { useQuery, useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders";
import { formatPrice, formatDate, PAYMENT_LABELS } from "@/utils/format";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { OrderStatus, PaymentMethod } from "@/types";
import { useAuthStore } from "@/store/authStore";
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
  const { user } = useAuthStore();
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
    const seller = user?.store_name || user?.full_name || user?.username || "—";
    const sellerIIN = (user as any)?.iin || "_______________";
    const docNum = order.order_number ?? order.id;
    const docDate = new Date(order.created_at).toLocaleDateString("ru-KZ");
    const buyer = [order.client_name, order.client_store].filter(Boolean).join(", ") || "—";
    const buyerPhone = order.client_phone || "—";
    const rows = order.items.map((item, i) => `
      <tr>
        <td style="border:1px solid #000;padding:4px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #000;padding:4px">${item.product_name}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center"></td>
        <td style="border:1px solid #000;padding:4px;text-align:center">шт</td>
        <td style="border:1px solid #000;padding:4px;text-align:center">${item.quantity}</td>
        <td style="border:1px solid #000;padding:4px;text-align:center">${item.quantity}</td>
        <td style="border:1px solid #000;padding:4px;text-align:right">${item.price.toFixed(2)}</td>
        <td style="border:1px solid #000;padding:4px;text-align:right">${item.subtotal.toFixed(2)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Накладная №${docNum}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#000;margin:10mm 15mm}
  h2{font-size:14px;font-weight:bold;text-align:center;margin:8px 0}
  .ref{font-size:9px;text-align:right;margin-bottom:4px}
  .header-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px}
  .org-box{border:1px solid #000;padding:6px;min-height:60px}
  .org-label{font-size:9px;margin-bottom:4px}
  .meta-row{display:flex;gap:16px;margin-bottom:6px;align-items:flex-end}
  .meta-field{border-bottom:1px solid #000;min-width:80px;display:inline-block}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th{border:1px solid #000;padding:4px;text-align:center;font-size:10px;background:#f5f5f5}
  .sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px}
  .sig-line{border-top:1px solid #000;margin-top:20px;font-size:9px;text-align:center}
  @media print{@page{margin:10mm 15mm}body{margin:0}}
</style></head><body>
<div class="ref">к приказу Министерства финансов Республики Казахстан от 20 декабря 2012 года №562 &nbsp;|&nbsp; Форма 3-2</div>
<div class="header-grid">
  <div>
    <div class="org-box">
      <div class="org-label">Организация (индивидуальный предприниматель) — отправитель:</div>
      <strong>${seller}</strong><br/>
      ИИН/БИН: <span class="meta-field">${sellerIIN}</span>
    </div>
  </div>
  <div>
    <div style="text-align:center">
      <h2>НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</h2>
      <div class="meta-row" style="justify-content:center;gap:24px">
        <span>БИН/ИИН: <span class="meta-field" style="min-width:120px">${sellerIIN}</span></span>
      </div>
      <div class="meta-row" style="justify-content:center;gap:24px">
        <span>Номер <span class="meta-field" style="min-width:60px">${docNum}</span></span>
        <span>Дата <span class="meta-field" style="min-width:80px">${docDate}</span></span>
      </div>
    </div>
    <div class="org-box" style="margin-top:4px">
      <div class="org-label">Организация (индивидуальный предприниматель) — получатель:</div>
      <strong>${buyer}</strong><br/>
      Тел: ${buyerPhone}
    </div>
  </div>
</div>
<div style="font-size:9px;margin-bottom:4px">Товарно-транспортная организация: <span class="meta-field" style="min-width:200px"></span></div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:30px">№</th>
      <th rowspan="2">Наименование, характеристика</th>
      <th rowspan="2" style="width:30px">№</th>
      <th rowspan="2" style="width:40px">Единица изм.</th>
      <th colspan="2">Количество</th>
      <th rowspan="2" style="width:80px">Цена, ₸</th>
      <th rowspan="2" style="width:90px">Сумма, ₸</th>
    </tr>
    <tr>
      <th style="width:55px">Подлежит отпуску</th>
      <th style="width:55px">Отпущено</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="7" style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold">ИТОГО:</td>
      <td style="border:1px solid #000;padding:4px;text-align:right;font-weight:bold">${order.total_amount.toFixed(2)}</td>
    </tr>
  </tfoot>
</table>
<div class="sig">
  <div>
    <p>Ответственный за поставку (Ф.И.О.):</p>
    <div class="sig-line">${seller}</div>
  </div>
  <div>
    <p>Груз принял (Ф.И.О.):</p>
    <div class="sig-line">${buyer}</div>
  </div>
</div>
${order.comment ? `<p style="font-size:10px;margin-top:8px">Примечание: ${order.comment}</p>` : ""}
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400); }
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
            <button
              onClick={printInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Printer size={15} /> Накладная
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={20} /></button>
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
