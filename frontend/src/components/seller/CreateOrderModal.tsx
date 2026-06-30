import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders";
import { productsApi } from "@/api/products";
import { clientsApi } from "@/api/clients";
import { formatPrice } from "@/utils/format";
import { formatPhoneInput, phoneError } from "@/utils/phone";
import { CartItem, PaymentMethod } from "@/types";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { X, Plus, Minus } from "lucide-react";

interface Props { onClose: () => void; onSaved: () => void; }

export default function CreateOrderModal({ onClose, onSaved }: Props) {
  const [clientPhone, setClientPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [clientName, setClientName] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [comment, setComment] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products-search", productSearch],
    queryFn: () => productsApi.list({ search: productSearch, limit: 10 }),
    enabled: productSearch.length > 0,
  });

  const addProduct = (p: (typeof products)[0]) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1 }];
    });
    setProductSearch("");
  };

  const updateQty = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((i) => i.product.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const phoneErr = phoneTouched ? phoneError(clientPhone) : null;
  const canSubmit = cartItems.length > 0 && !phoneError(clientPhone);

  const mutation = useMutation({
    mutationFn: () => ordersApi.create({
      client_phone: clientPhone || undefined,
      client_name: clientName || undefined,
      payment_method: payment,
      comment: comment || undefined,
      items: cartItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      source: "direct",
    }),
    onSuccess: () => { toast.success("Заказ создан"); onSaved(); },
    onError: () => toast.error("Ошибка создания заказа"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Новый заказ</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Телефон клиента *"
                type="tel"
                value={clientPhone}
                onChange={(e) => { setClientPhone(formatPhoneInput(e.target.value)); setPhoneTouched(true); }}
                onBlur={() => setPhoneTouched(true)}
                placeholder="+7 (___) ___-__-__"
              />
              {phoneErr && <p className="mt-1 text-xs text-red-500">{phoneErr}</p>}
            </div>
            <Input label="Имя клиента" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Необязательно" />
          </div>

          {/* Product search */}
          <div className="relative">
            <Input label="Добавить товар" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Поиск..." />
            {products.length > 0 && productSearch && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-auto">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full flex justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    <span>{p.name}</span>
                    <span className="text-primary-600 font-medium">{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cartItems.length > 0 && (
            <div className="border rounded-xl overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-gray-500">{formatPrice(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <Plus size={12} />
                    </button>
                    <span className="ml-2 font-semibold w-24 text-right">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-gray-50 font-semibold text-gray-800">
                <span>Итого</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Способ оплаты</label>
            <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="cash">Наличные</option>
              <option value="transfer">Перевод</option>
              <option value="debt">В долг</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <Input label="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" />

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button
              className="flex-1"
              loading={mutation.isPending}
              disabled={!canSubmit}
              onClick={() => { setPhoneTouched(true); if (canSubmit) mutation.mutate(); }}
            >
              Создать заказ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
