import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";
import { formatPrice } from "@/utils/format";
import { formatDigits, phoneError } from "@/utils/phone";
import PhoneInput from "@/components/common/PhoneInput";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { Plus, Trash2, Phone, Store } from "lucide-react";

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

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Клиенты</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" />Добавить
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
          <PhoneInput
            label="Телефон *"
            value={phoneDigits}
            onChange={(d) => { setPhoneDigits(d); setPhoneTouched(true); }}
            touched={phoneTouched}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Имя" value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите имя" />
            <Input label="Название магазина" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Необязательно" />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Отмена</Button>
            <Button
              size="sm"
              loading={createMutation.isPending}
              onClick={() => { setPhoneTouched(true); if (canAdd) createMutation.mutate(); }}
              disabled={!canAdd}
            >
              Добавить клиента
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Поиск по имени, телефону, магазину..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* ── Mobile: card list ─────────────────────────────── */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Нет клиентов</div>
        ) : clients.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
              <span className="text-primary-600 font-semibold text-sm">
                {(c.full_name || c.phone).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{c.full_name || c.phone}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Phone size={11} />{c.phone}
                </span>
                {c.store_name && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Store size={11} />{c.store_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {c.total_debt > 0 && (
                <span className="text-sm font-semibold text-red-600">{formatPrice(c.total_debt)}</span>
              )}
              <button
                onClick={() => { if (confirm("Удалить клиента?")) deleteMutation.mutate(c.id); }}
                className="p-2 text-gray-300 hover:text-red-500 rounded-lg"
              >
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
              <th className="px-4 py-3 text-left">Клиент</th>
              <th className="px-4 py-3 text-left">Телефон</th>
              <th className="px-4 py-3 text-left">Магазин</th>
              <th className="px-4 py-3 text-right">Долг</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Загрузка...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Нет клиентов</td></tr>
            ) : clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.full_name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-gray-500">{c.store_name || "—"}</td>
                <td className="px-4 py-3 text-right">
                  {c.total_debt > 0
                    ? <span className="text-red-600 font-semibold">{formatPrice(c.total_debt)}</span>
                    : <span className="text-gray-400">—</span>}
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
