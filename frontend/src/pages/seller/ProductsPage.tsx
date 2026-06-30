import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Product } from "@/types";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Download, Image, MoreVertical } from "lucide-react";
import ProductForm from "@/components/seller/ProductForm";
import BulkPriceModal from "@/components/seller/BulkPriceModal";

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkPrice, setShowBulkPrice] = useState(false);
  const [page, setPage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const openEdit = (p: Product) => { setEditProduct(p); setShowForm(true); };
  const openAdd = () => { setEditProduct(null); setShowForm(true); };
  const confirmDelete = (p: Product) => { if (confirm(`Удалить «${p.name}»?`)) deleteMutation.mutate(p.id); };
  const catName = (id: any) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Товары</h2>

        {/* Desktop buttons */}
        <div className="hidden md:flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowBulkPrice(true)}>Изменить цены</Button>
          <Button variant="secondary" size="sm" onClick={productsApi.exportXlsx}><Download size={14} className="mr-1" />Excel</Button>
          <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" />Добавить</Button>
        </div>

        {/* Mobile: add + "..." menu */}
        <div className="flex gap-2 md:hidden">
          <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" />Добавить</Button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 w-44 py-1">
                  <button onClick={() => { setShowBulkPrice(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Изменить цены
                  </button>
                  <button onClick={() => { productsApi.exportXlsx(); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    Скачать Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <Input placeholder="Поиск товаров..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          value={selectedCategory ?? ""}
          onChange={(e) => { setSelectedCategory(e.target.value || undefined); setPage(0); }}
        >
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── Mobile: card list ─────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          [1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Нет товаров</div>
        ) : products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 flex items-center gap-3 p-3">
            {p.photos[0] ? (
              <img
                src={p.photos[0].thumbnail_url}
                alt={p.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Image size={20} className="text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{catName(p.category_id)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-primary-600">{formatPrice(p.price)}</span>
                <span className="text-xs text-gray-500">{p.stock} шт.</span>
                {!p.is_active && <span className="text-xs text-red-500">Неактивен</span>}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                <Pencil size={16} />
              </button>
              <button onClick={() => confirmDelete(p)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: table ────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Товар</th>
              <th className="px-4 py-3 text-left">Категория</th>
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
                      <img src={p.photos[0].thumbnail_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                <td className="px-4 py-3 text-gray-500">{catName(p.category_id)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{p.stock} шт.</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => confirmDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
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
