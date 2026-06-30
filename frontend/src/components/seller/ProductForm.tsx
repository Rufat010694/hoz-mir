import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { Category, Product } from "@/types";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { X, Upload, ImagePlus } from "lucide-react";

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductForm({ product, categories, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? "0"));
  const [categoryId, setCategoryId] = useState<string>(String(product?.category_id ?? ""));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [uploading, setUploading] = useState(false);

  // For new products: files queued before save
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  // After new product created, store it to allow live photo upload
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);
  const photoTarget = product ?? savedProduct;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // For new products: queue selected files locally with preview
  const handlePendingSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPendingFiles((prev) => [...prev, ...files]);
    setPendingPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removePending = (i: number) => {
    URL.revokeObjectURL(pendingPreviews[i]);
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPendingPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || undefined,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: categoryId || undefined,
        is_active: isActive,
      };
      if (product) return productsApi.update(product.id, payload);
      return productsApi.create(payload);
    },
    onSuccess: async (data) => {
      if (product) {
        toast.success("Товар обновлён");
        onSaved();
        onClose();
      } else {
        const created = data as Product;
        // Upload any queued photos sequentially
        if (pendingFiles.length > 0) {
          setUploading(true);
          let last = created;
          for (const file of pendingFiles) {
            try {
              last = await productsApi.uploadPhoto(created.id, file);
            } catch {
              toast.error(`Ошибка загрузки ${file.name}`);
            }
          }
          setUploading(false);
          pendingPreviews.forEach((u) => URL.revokeObjectURL(u));
          setPendingFiles([]);
          setPendingPreviews([]);
          setSavedProduct(last);
        } else {
          setSavedProduct(created);
        }
        toast.success("Товар добавлен");
        onSaved();
      }
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  // Upload directly to existing product (edit mode or after first save)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!photoTarget || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      const updated = await productsApi.uploadPhoto(photoTarget.id, e.target.files[0]);
      toast.success("Фото загружено");
      if (!product) setSavedProduct(updated);
      onSaved();
    } catch {
      toast.error("Ошибка загрузки фото");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const isSaving = saveMutation.isPending || uploading;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">{product ? "Редактировать товар" : "Новый товар"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="p-4 space-y-4"
        >
          <fieldset disabled={!!savedProduct} className="space-y-4 disabled:opacity-60">
            <Input label="Название" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Описание товара"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Цена (₸)" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <Input label="Остаток (шт.)" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Категория</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Без категории</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm text-gray-700">Активен (виден в каталоге)</span>
            </label>
          </fieldset>

          {/* Photos section — always visible */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Фото товара</p>
            <div className="flex gap-2 flex-wrap">

              {/* Existing photos (edit mode or after save) */}
              {(photoTarget?.photos ?? []).map((ph, i) => (
                <div key={`saved-${i}`} className="relative">
                  <img
                    src={ph.thumbnail_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => productsApi.deletePhoto(photoTarget!.id, i).then(onSaved)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ))}

              {/* Pending previews (new product, not yet saved) */}
              {!photoTarget && pendingPreviews.map((src, i) => (
                <div key={`pending-${i}`} className="relative">
                  <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-primary-200" />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ))}

              {/* Add photo button */}
              {!savedProduct ? (
                // New product (not yet saved) — queue files locally
                <label className={`w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer gap-0.5 transition-colors ${uploading ? "opacity-40" : "border-gray-300 hover:border-primary-400"}`}>
                  <ImagePlus size={18} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={product ? handlePhotoUpload : handlePendingSelect}
                    disabled={uploading}
                  />
                </label>
              ) : (
                // After new product saved — upload directly
                <label className={`w-16 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer gap-0.5 transition-colors ${uploading ? "opacity-40" : "border-gray-300 hover:border-primary-400"}`}>
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Ещё</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              )}
            </div>

            {pendingFiles.length > 0 && !photoTarget && (
              <p className="text-xs text-primary-600 mt-1.5">
                {pendingFiles.length} фото будет загружено при сохранении
              </p>
            )}
            {uploading && <p className="text-xs text-gray-400 mt-1">Загрузка фото...</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {savedProduct ? "Готово" : "Отмена"}
            </Button>
            {!savedProduct && (
              <Button type="submit" className="flex-1" loading={isSaving}>
                {product ? "Сохранить" : "Добавить"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
