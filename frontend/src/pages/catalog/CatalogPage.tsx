import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import catalogApi from "@/api/catalog";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { ShoppingCart, Search, Image as ImageIcon, MapPin } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export default function CatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const { addItem, itemCount } = useCartStore();

  const { data: store } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => catalogApi.getStore(slug!),
    enabled: !!slug,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["catalog-categories", slug],
    queryFn: () => catalogApi.getCategories(slug!),
    enabled: !!slug,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog-products", slug, search, categoryId],
    queryFn: () => catalogApi.getProducts(slug!, { search, category_id: categoryId }),
    enabled: !!slug,
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-30 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Хоз Мир" className="h-20 object-contain" />
            <h1 className="text-lg font-bold text-gray-800">{store?.store_name || "Каталог"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/catalog/${slug}/track`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
            >
              <MapPin size={13} /> Отследить
            </Link>
            <Link to={`/catalog/${slug}/cart`} className="relative">
              <ShoppingCart size={24} className="text-gray-700" />
              {itemCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount()}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск товаров..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-50">
          <button
            onClick={() => setCategoryId(undefined)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${!categoryId ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${categoryId === c.id ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      <div className="p-4 grid grid-cols-2 gap-3 pb-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-52 animate-pulse" />
          ))
        ) : products.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400">Товары не найдены</div>
        ) : products.map((p) => (
          <Link
            key={p.id}
            to={`/catalog/${slug}/product/${p.id}`}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {p.photos[0] ? (
              <img src={p.photos[0].thumbnail_url} alt={p.name} className="w-full h-36 object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                <ImageIcon size={32} className="text-gray-300" />
              </div>
            )}
            <div className="p-2.5">
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary-600 font-bold">{formatPrice(p.price)}</span>
                <button
                  onClick={(e) => { e.preventDefault(); addItem(p); }}
                  className="text-xs bg-primary-600 text-white px-2 py-1 rounded-lg"
                >
                  В корзину
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
