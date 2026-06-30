import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import catalogApi from "@/api/catalog";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { formatDigits, phoneError } from "@/utils/phone";
import PhoneInput from "@/components/common/PhoneInput";
import { ArrowLeft, CheckCircle, Clock, Package, Truck } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new:        { label: "Принят",       icon: <CheckCircle size={40} />, color: "text-blue-500" },
  processing: { label: "В обработке",  icon: <Clock size={40} />,       color: "text-yellow-500" },
  ready:      { label: "Готов",        icon: <Package size={40} />,     color: "text-primary-500" },
  delivered:  { label: "Выдан",        icon: <Truck size={40} />,       color: "text-green-600" },
  cancelled:  { label: "Отменён",      icon: <CheckCircle size={40} />, color: "text-red-500" },
};

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [payment, setPayment] = useState("cash");
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState("new");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const apiHost = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "")
      : window.location.host;
    const ws = new WebSocket(`${proto}://${apiHost}/ws/order/${orderId}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "status_changed") setOrderStatus(msg.data.status);
      } catch {}
    };
    return () => ws.close();
  }, [orderId]);

  const phoneErr = phoneTouched ? phoneError(phoneDigits) : null;
  const canSubmit = !phoneError(phoneDigits) && items.length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      catalogApi.placeOrder(slug!, {
        client_phone: formatDigits(phoneDigits),
        client_name: name || undefined,
        client_store: storeName || undefined,
        payment_method: payment,
        comment: comment || undefined,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    onSuccess: (data) => {
      setOrderId(String(data.order_id));
      setOrderNumber(data.order_number ?? null);
      setSuccess(true);
      clearCart();
    },
  });

  if (success && orderId) {
    const info = STATUS_INFO[orderStatus] || STATUS_INFO.new;
    const steps = ["new", "processing", "ready", "delivered"];
    const currentStep = steps.indexOf(orderStatus);
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className={`mb-4 ${info.color}`}>{info.icon}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Заказ #{orderNumber ?? orderId}</h2>
        <div className={`text-lg font-semibold mb-2 ${info.color}`}>{info.label}</div>
        <p className="text-gray-400 text-sm mb-8">Статус обновляется автоматически</p>
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full transition-all ${currentStep >= i ? "bg-primary-500" : "bg-gray-200"}`} />
              {i < steps.length - 1 && <div className={`h-0.5 w-8 transition-all ${currentStep > i ? "bg-primary-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={() => navigate(`/catalog/${slug}/track`)}>Отследить заказ</Button>
          <Button variant="secondary" onClick={() => navigate(`/catalog/${slug}`)}>Вернуться в каталог</Button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Для отслеживания используй номер заказа <strong>#{orderNumber}</strong> и свой телефон
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-gray-600" /></button>
        <h2 className="font-semibold text-gray-800">Оформление заказа</h2>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm font-medium text-gray-700">Ваши данные</p>

        {/* Store name (optional) */}
        <Input label="Название магазина (если нужно)" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Название вашего магазина" />
        <Input label="ФИО" value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите ваше ФИО" />
        <PhoneInput
          label="Телефон *"
          value={phoneDigits}
          onChange={(d) => { setPhoneDigits(d); setPhoneTouched(true); }}
          touched={phoneTouched}
          required
        />

        {/* Payment */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Способ оплаты</p>
          {[
            { value: "cash", label: "Наличные" },
            { value: "transfer", label: "Перевод" },
            { value: "debt", label: "В долг" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input type="radio" name="payment" value={opt.value} checked={payment === opt.value} onChange={() => setPayment(opt.value)} className="accent-primary-600" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>

        <Input label="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий к заказу" />

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          {items.map((i) => (
            <div key={i.product.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{i.product.name} × {i.quantity}</span>
              <span className="font-medium text-gray-800">{formatPrice(i.product.price * i.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold text-gray-800">
            <span>Итого</span>
            <span>{formatPrice(total())}</span>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          loading={mutation.isPending}
          disabled={!canSubmit}
          onClick={() => { setPhoneTouched(true); if (canSubmit) mutation.mutate(); }}
        >
          Отправить заказ
        </Button>
        <p className="text-xs text-gray-400 text-center">
          После отправки с вами свяжется продавец для подтверждения.
        </p>
      </div>
    </div>
  );
}
