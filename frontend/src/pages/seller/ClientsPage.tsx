import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { formatPrice } from "@/utils/format";
import { formatDigits, phoneError } from "@/utils/phone";
import PhoneInput from "@/components/common/PhoneInput";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [name, setName] = useState("");
  const [store, setStore] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientsApi.list({ search }),
  });

  const phoneErr = phoneTouched ? phoneError(phoneDigits) : null;
  const canAdd = !phoneError(phoneDigits);

  const createMutation = useMutation({
    mutationFn: () => clientsApi.create({ phone: formatDigits(phoneDigits), full_name: name, store_name: store }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент добавлен");
      setShowForm(false);
      setPhoneDigits(""); setName(""); setStore(""); setPhoneTouched(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Клиент удалён"); },
  });

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Клиенты</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus size={14} className="mr-1" />Добавить</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <PhoneInput
                label="Телефон *"
                value={phoneDigits}
                onChange={(d) => { setPhoneDigits(d); setPhoneTouched(true); }}
                touched={phoneTouched}
                required
              />
            </div>
            <Input label="Имя" value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя" />
          </div>
          <Input label="Название магазина" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Необязательно" />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Отмена</Button>
            <Button size="sm" loading={createMutation.isPending} onClick={() => { setPhoneTouched(true); if (canAdd) createMutation.mutate(); }} disabled={!canAdd}>
              Добавить клиента
            </Button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <Input placeholder="Поиск по имени, телефону, магазину..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Клиент</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Телефон</th>
              <th className="px-4 py-3 text-right">Долг</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Загрузка...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Нет клиентов</td></tr>
            ) : clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.full_name || c.phone}</p>
                  {c.store_name && <p className="text-xs text-gray-500">{c.store_name}</p>}
                  <p className="text-xs text-gray-400 md:hidden">{c.phone}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.phone}</td>
                <td className="px-4 py-3 text-right">
                  {c.total_debt > 0 ? (
                    <span className="text-red-600 font-semibold">{formatPrice(c.total_debt)}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => { if (confirm("Удалить клиента?")) deleteMutation.mutate(c.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
