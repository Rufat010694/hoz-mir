import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function BulkPriceModal({ onClose, onSaved }: Props) {
  const [action, setAction] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: () => productsApi.bulkPrice({ action, value: parseFloat(value) }),
    onSuccess: (data) => {
      toast.success(`Обновлено ${data.updated} товаров`);
      onSaved();
    },
    onError: () => toast.error("Ошибка"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">Массовое изменение цен</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Применить к</label>
            <p className="text-sm text-gray-500">Всем товарам</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Действие</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "percent" | "fixed")}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="percent">Изменить на %</option>
              <option value="fixed">Изменить на сумму</option>
            </select>
          </div>
          <Input
            label={action === "percent" ? "Процент (например: 10 или -5)" : "Сумма (например: 50 или -20)"}
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={action === "percent" ? "10" : "50"}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button className="flex-1" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Применить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
