import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import catalogApi from "@/api/catalog";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCartStore();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [payment, setPayment] = useState("cash");
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      catalogApi.placeOrder(slug!, {
        client_phone: phone,
        client_name: name || undefined,
        client_store: storeName || undefined,
        payment_method: payment,
        comment: comment || undefined,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      }),
    onSuccess: (data) => {
      setOrderId(data.order_id);
      setSuccess(true);
      clearCart();
    },
  });

  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <CheckCircle size={64} className="text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Заказ #{orderId} принят!</h2>
        <p className="text-gray-500 mb-6">Продавец свяжется с вами для подтверждения заказа.</p>
        <Button onClick={() => navigate(`/catalog/${slug}`)}>Вернуться в каталог</Button>
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
        <Input
          label="Телефон *"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__"
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
          disabled={!phone}
          onClick={() => mutation.mutate()}
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
