import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import catalogApi from "@/api/catalog";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { ArrowLeft, ShoppingCart, Plus, Minus, Share2 } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function ProductPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const { addItem, itemCount } = useCartStore();

  const { data: products = [] } = useQuery({
    queryKey: ["catalog-products", slug],
    queryFn: () => catalogApi.getProducts(slug!),
    enabled: !!slug,
  });

  const product = products.find((p) => p.id === parseInt(productId!));

  const handleAdd = () => {
    if (product) { addItem(product, quantity); navigate(`/catalog/${slug}/cart`); }
  };

  if (!product) return <div className="p-4 text-center text-gray-400 mt-16">Товар не найден</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 text-gray-600"><ArrowLeft size={22} /></button>
        <h2 className="font-semibold text-gray-800 flex-1 mx-3 truncate">{product.name}</h2>
        <button onClick={() => navigate(`/catalog/${slug}/cart`)} className="relative">
          <ShoppingCart size={22} className="text-gray-700" />
          {itemCount() > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount()}
            </span>
          )}
        </button>
      </div>

      {/* Photos */}
      {product.photos.length > 0 ? (
        <div>
          <img src={product.photos[photoIndex]?.url} alt={product.name} className="w-full h-72 object-contain bg-gray-50" />
          {product.photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {product.photos.map((ph, i) => (
                <button key={i} onClick={() => setPhotoIndex(i)}>
                  <img src={ph.thumbnail_url} alt="" className={`w-14 h-14 rounded-lg object-cover border-2 ${i === photoIndex ? "border-primary-500" : "border-transparent"}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-300 text-6xl">📦</div>
      )}

      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-primary-600">{formatPrice(product.price)}</span>
          <span className={`text-sm px-2 py-0.5 rounded-full ${product.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
            {product.stock > 0 ? "В наличии" : "Нет в наличии"}
          </span>
        </div>

        {product.description && (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.description}</p>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <Minus size={16} />
          </button>
          <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <Plus size={16} />
          </button>
        </div>

        <Button className="w-full" size="lg" onClick={handleAdd} disabled={product.stock === 0}>
          <ShoppingCart size={18} className="mr-2" />
          В корзину
        </Button>
      </div>
    </div>
  );
}
