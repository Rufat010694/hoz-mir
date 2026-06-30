export const formatPrice = (price: number) =>
  new Intl.NumberFormat("ru-KZ", { style: "decimal", minimumFractionDigits: 0 }).format(price) + " ₸";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "text-blue-600 bg-blue-50" },
  processing: { label: "В обработке", color: "text-yellow-600 bg-yellow-50" },
  ready: { label: "Готов", color: "text-green-600 bg-green-50" },
  delivered: { label: "Выдан", color: "text-gray-600 bg-gray-100" },
  cancelled: { label: "Отменён", color: "text-red-600 bg-red-50" },
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Наличные",
  transfer: "Перевод",
  debt: "В долг",
  other: "Другое",
};
