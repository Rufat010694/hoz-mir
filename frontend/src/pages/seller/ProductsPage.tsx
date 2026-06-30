import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Product } from "@/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Download, Image } from "lucide-react";
import ProductForm from "@/components/seller/ProductForm";
import BulkPriceModal from "@/components/seller/BulkPriceModal";

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search, selectedCategory, page],
    queryFn: () => productsApi.list({ search, category_id: selectedCategory, skip: page * limit, limit }),
    staleTime: 10_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.listCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); toast.success("Товар удалён"); },
  });

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Товары</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBulkPrice(true)}>Изменить цены</Button>
          <Button variant="secondary" size="sm" onClick={productsApi.exportXlsx}><Download size={14} className="mr-1" />Excel</Button>
          <Button size="sm" onClick={() => { setEditProduct(null); setShowForm(true); }}>
            <Plus size={14} className="mr-1" />Добавить
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input placeholder="Поиск товаров..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          value={selectedCategory ?? ""}
          onChange={(e) => { setSelectedCategory(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
        >
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Товар</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Категория</th>
              <th className="px-4 py-3 text-right">Цена</th>
              <th className="px-4 py-3 text-right">Остаток</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Загрузка...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Нет товаров</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.photos[0] ? (
                      <img src={p.photos[0].thumbnail_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Image size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      {!p.is_active && <span className="text-xs text-red-500">Неактивен</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                  {categories.find((c) => c.id === p.category_id)?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.stock} шт.</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditProduct(p); setShowForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm("Удалить товар?")) deleteMutation.mutate(p.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>← Назад</Button>
        <span className="text-sm text-gray-500">Стр. {page + 1}</span>
        <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)} disabled={products.length < limit}>Вперёд →</Button>
      </div>

      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["products"] }); }}
        />
      )}
      {showBulkPrice && (
        <BulkPriceModal
          onClose={() => setShowBulkPrice(false)}
          onSaved={() => { setShowBulkPrice(false); qc.invalidateQueries({ queryKey: ["products"] }); }}
        />
      )}
    </div>
  );
}
