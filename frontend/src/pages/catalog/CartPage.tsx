import { useNavigate, useParams, Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, total } = useCartStore();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-gray-600" /></button>
        <h2 className="font-semibold text-gray-800">Корзина</h2>
        {items.length > 0 && (
          <button className="ml-auto text-sm text-primary-600 font-medium">Изменить</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-5xl mb-4">🛒</span>
          <p className="text-lg">Корзина пуста</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate(`/catalog/${slug}`)}>
            Перейти в каталог
          </Button>
        </div>
      ) : (
        <div>
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
                {item.product.photos[0] ? (
                  <img src={item.product.photos[0].thumbnail_url} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
                  <p className="text-primary-600 font-semibold">{formatPrice(item.product.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                      <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Итого</span>
              <span className="text-xl font-bold text-gray-800">{formatPrice(total())}</span>
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate(`/catalog/${slug}/checkout`)}>
              Оформить заказ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
