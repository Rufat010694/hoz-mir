import { useState } from "react";
import { useParams } from "react-router-dom";
import catalogApi from "@/api/catalog";
import { formatPrice } from "@/utils/format";
import { autoCompletePhone, extractDigits, formatDigits, phoneError } from "@/utils/phone";
import PhoneInput from "@/components/common/PhoneInput";
import { Search, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/common/Button";

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; step: number }> = {
  new:        { label: "Принят",       icon: <CheckCircle size={36} />, color: "text-blue-500",    step: 0 },
  processing: { label: "В обработке",  icon: <Clock size={36} />,       color: "text-yellow-500",  step: 1 },
  ready:      { label: "Готов к выдаче", icon: <Package size={36} />,   color: "text-primary-500", step: 2 },
  delivered:  { label: "Выдан",        icon: <Truck size={36} />,       color: "text-green-600",   step: 3 },
  cancelled:  { label: "Отменён",      icon: <XCircle size={36} />,     color: "text-red-500",     step: -1 },
};

const STEPS = ["Принят", "В обработке", "Готов", "Выдан"];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Наличные", transfer: "Перевод", debt: "В долг", other: "Другое",
};

export default function TrackPage() {
  const { slug } = useParams<{ slug: string }>();
  const [orderNum, setOrderNum] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Awaited<ReturnType<typeof catalogApi.trackOrder>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phoneErr = phoneTouched ? phoneError(phoneDigits) : null;
  const canSearch = !phoneError(phoneDigits) && orderNum.trim().length > 0;

  const handleSearch = async () => {
    setPhoneTouched(true);
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await catalogApi.trackOrder(slug!, parseInt(orderNum), formatDigits(phoneDigits));
      setOrder(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Заказ не найден. Проверьте номер и телефон.");
    } finally {
      setLoading(false);
    }
  };

  const info = order ? (STATUS_INFO[order.status] ?? STATUS_INFO.new) : null;

  return (
    <div className="max-w-lg mx-auto p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Отследить заказ</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Введите номер заказа и телефон</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Номер заказа</label>
          <input
            type="number"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            placeholder="Например: 42"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <PhoneInput
          label="Ваш телефон"
          value={phoneDigits}
          onChange={(d) => { setPhoneDigits(d); setPhoneTouched(true); }}
          touched={phoneTouched}
          required
        />
        <Button className="w-full" onClick={handleSearch} loading={loading} disabled={!canSearch}>
          <Search size={16} className="mr-2" /> Найти заказ
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 text-center">{error}</div>
      )}

      {order && info && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Status header */}
          <div className="p-6 text-center border-b">
            <div className={`flex justify-center mb-3 ${info.color}`}>{info.icon}</div>
            <p className="text-xs text-gray-400 mb-1">Заказ #{order.order_number}</p>
            <p className={`text-xl font-bold ${info.color}`}>{info.label}</p>
          </div>

          {/* Progress bar (skip for cancelled) */}
          {order.status !== "cancelled" && (
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${info.step >= i ? "bg-primary-500" : "bg-gray-200"}`} />
                      <p className="text-xs text-gray-400 mt-1 whitespace-nowrap">{step}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 ${info.step > i ? "bg-primary-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Состав заказа</p>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium text-gray-800">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t">
              <span>Итого</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Оплата: {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
            {order.comment && <p className="text-xs text-gray-500 mt-1">Комментарий: {order.comment}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
