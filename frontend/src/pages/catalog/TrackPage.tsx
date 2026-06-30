import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import catalogApi from "@/api/catalog";
import { formatPrice } from "@/utils/format";
import { formatDigits, phoneError } from "@/utils/phone";
import PhoneInput from "@/components/common/PhoneInput";
import { Search, CheckCircle, Clock, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/common/Button";

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; step: number }> = {
  new:        { label: "Принят",          icon: <CheckCircle size={40} />, color: "text-blue-500",    step: 0 },
  processing: { label: "В обработке",     icon: <Clock size={40} />,       color: "text-yellow-500",  step: 1 },
  ready:      { label: "Готов к выдаче",  icon: <Package size={40} />,     color: "text-green-500",   step: 2 },
  delivered:  { label: "Выдан",           icon: <Truck size={40} />,       color: "text-gray-500",    step: 3 },
  cancelled:  { label: "Отменён",         icon: <XCircle size={40} />,     color: "text-red-500",     step: -1 },
};

const STEPS = [
  { key: "new", label: "Принят" },
  { key: "processing", label: "В обработке" },
  { key: "ready", label: "Готов" },
  { key: "delivered", label: "Выдан" },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Наличные", transfer: "Перевод", debt: "В долг", other: "Другое",
};

type TrackResult = Awaited<ReturnType<typeof catalogApi.trackOrder>>;

export default function TrackPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [orderNum, setOrderNum] = useState(searchParams.get("n") ?? "");
  const [phoneDigits, setPhoneDigits] = useState(searchParams.get("p") ?? "");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<TrackResult | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-search when opened via deep link (?n=&p=)
  useEffect(() => {
    const n = searchParams.get("n");
    const p = searchParams.get("p");
    if (n && p && slug) {
      setLoading(true);
      catalogApi.trackOrder(slug, parseInt(n), p)
        .then(setOrder)
        .catch(() => setError("Заказ не найден"))
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // WebSocket for live status updates
  useEffect(() => {
    if (!order?.order_id) return;
    wsRef.current?.close();
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "")
      : window.location.host;
    const ws = new WebSocket(`${proto}://${host}/ws/order/${order.order_id}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "status_changed") setLiveStatus(msg.data.status);
      } catch {}
    };
    return () => ws.close();
  }, [order?.order_id]);

  const canSearch = !phoneError(phoneDigits) && orderNum.trim().length > 0;
  const currentStatus = liveStatus ?? order?.status ?? "new";
  const info = order ? (STATUS_INFO[currentStatus] ?? STATUS_INFO.new) : null;

  const handleSearch = async () => {
    setPhoneTouched(true);
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setLiveStatus(null);
    try {
      const res = await catalogApi.trackOrder(slug!, parseInt(orderNum), formatDigits(phoneDigits));
      setOrder(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Заказ не найден. Проверьте номер и телефон.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Отследить заказ</h1>
      <p className="text-sm text-gray-400 text-center mb-6">Введите номер заказа и номер телефона</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Номер заказа</label>
          <input
            type="number"
            value={orderNum}
            onChange={(e) => setOrderNum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
          {/* Live status header */}
          <div className="p-6 text-center border-b">
            <div className={`flex justify-center mb-3 ${info.color}`}>{info.icon}</div>
            <p className="text-xs text-gray-400 mb-1">Заказ #{order.order_number ?? orderNum}</p>
            <p className={`text-xl font-bold ${info.color}`}>{info.label}</p>
            {liveStatus && (
              <p className="text-xs text-green-500 mt-1 animate-pulse">● Статус обновляется в реальном времени</p>
            )}
          </div>

          {/* Progress steps */}
          {currentStatus !== "cancelled" && (
            <div className="px-4 py-5 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => {
                  const stepIdx = STEPS.findIndex(s => s.key === currentStatus);
                  const done = i <= stepIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                        done ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {i + 1}
                      </div>
                      <p className={`text-xs text-center leading-tight ${done ? "text-primary-600 font-medium" : "text-gray-400"}`}>
                        {step.label}
                      </p>
                      {i < STEPS.length - 1 && (
                        <div className="absolute" style={{ display: "none" }} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Progress line */}
              <div className="relative mt-2 mx-4">
                <div className="h-1 bg-gray-200 rounded" />
                <div
                  className="h-1 bg-primary-500 rounded absolute top-0 left-0 transition-all duration-700"
                  style={{ width: `${(Math.max(0, STEPS.findIndex(s => s.key === currentStatus)) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Items */}
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Состав заказа</p>
            <div className="space-y-2 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.product_name} <span className="text-gray-400">× {item.quantity}</span></span>
                  <span className="font-medium text-gray-800">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-gray-800 pt-3 border-t text-base">
              <span>Итого</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Оплата: {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
            {order.comment && <p className="text-xs text-gray-500 mt-1">💬 {order.comment}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
