import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { Category } from "@/types";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import toast from "react-hot-toast";
import { Plus, Trash2, Tag } from "lucide-react";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.listCategories,
  });

  const createMut = useMutation({
    mutationFn: (name: string) => productsApi.createCategory({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
      toast.success("Категория добавлена");
    },
    onError: () => toast.error("Ошибка при создании"),
  });

  const deleteMut = useMutation({
    mutationFn: productsApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Категория удалена");
    },
    onError: () => toast.error("Нельзя удалить — есть товары в этой категории"),
    onSettled: () => setDeleting(null),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMut.mutate(trimmed);
  };

  const handleDelete = (id: number) => {
    setDeleting(id);
    deleteMut.mutate(id);
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Категории</h2>
      <p className="text-sm text-gray-400 mb-6">
        Категории помогают клиентам быстрее найти нужный товар в каталоге.
      </p>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 max-w-md mb-6">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название категории"
          className="flex-1"
        />
        <Button type="submit" loading={createMut.isPending} className="flex items-center gap-1 whitespace-nowrap">
          <Plus size={16} /> Добавить
        </Button>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2 max-w-md">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="max-w-md flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <Tag size={36} className="mb-2 text-gray-300" />
          <p className="text-sm">Нет категорий</p>
          <p className="text-xs mt-1">Добавь первую категорию выше</p>
        </div>
      ) : (
        <div className="max-w-md space-y-2">
          {categories.map((cat: Category) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
            >
              <Tag size={16} className="text-primary-400 shrink-0" />
              <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                title="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1">
            Всего: {categories.length} {categories.length === 1 ? "категория" : categories.length < 5 ? "категории" : "категорий"}
          </p>
        </div>
      )}
    </div>
  );
}
