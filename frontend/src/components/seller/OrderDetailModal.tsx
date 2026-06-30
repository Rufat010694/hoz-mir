import { useQuery, useMutation } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders";
import { formatPrice, formatDate, PAYMENT_LABELS } from "@/utils/format";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { OrderStatus, PaymentMethod } from "@/types";
import toast from "react-hot-toast";
import { X } from "lucide-react";

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

  if (isLoading || !order) return null;
  const nextStatus = STATUS_NEXT[order.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-800">Заказ #{order.id}</h3>
            <StatusBadge status={order.status} />
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
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
