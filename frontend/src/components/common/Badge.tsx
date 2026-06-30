import clsx from "clsx";
import { ORDER_STATUS_LABELS, PAYMENT_LABELS } from "@/utils/format";
import { OrderStatus, PaymentMethod } from "@/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, color } = ORDER_STATUS_LABELS[status] ?? { label: status, color: "text-gray-600 bg-gray-100" };
  return <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", color)}>{label}</span>;
}

export function PaymentBadge({ method }: { method: PaymentMethod }) {
  return <span className="text-sm text-gray-600">{PAYMENT_LABELS[method] ?? method}</span>;
}
