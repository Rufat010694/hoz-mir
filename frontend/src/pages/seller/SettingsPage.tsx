import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, logout, loadUser } = useAuthStore();
  const navigate = useNavigate();

  // Profile
  const [iin, setIin] = useState((user as any)?.iin ?? "");
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [storeName, setStoreName] = useState(user?.store_name ?? "");

  const profileMutation = useMutation({
    mutationFn: () => api.patch("/auth/me", { iin, full_name: fullName, store_name: storeName }),
    onSuccess: async () => { await loadUser(); toast.success("Профиль обновлён"); },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const storageGB = ((user as any)?.storage_used ?? 0) / (1024 ** 3);
  const storagePercent = Math.min(100, (storageGB / 5) * 100);

  // New user
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("seller");
  const [newFullName, setNewFullName] = useState("");
  const [newStore, setNewStore] = useState("");

  const createUserMutation = useMutation({
    mutationFn: () =>
      api.post("/auth/register", {
        username: newUsername,
        password: newPassword,
        role: newRole,
        full_name: newFullName || undefined,
        store_name: newStore || undefined,
      }),
    onSuccess: () => {
      toast.success(`Пользователь «${newUsername}» создан`);
      setNewUsername(""); setNewPassword(""); setNewFullName(""); setNewStore(""); setNewRole("seller");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || "Ошибка создания"),
  });

  const canCreate = newUsername.trim().length >= 3 && newPassword.trim().length >= 4;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Настройки</h2>

      <div className="space-y-4 max-w-lg">

        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Профиль</h3>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Логин: <span className="font-medium text-gray-800">{user?.username}</span></p>
            <Input label="ФИО / Название ИП" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
            <Input label="Название магазина" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Мой магазин" />
            <Input label="ИИН / БИН (для накладной)" value={iin} onChange={(e) => setIin(e.target.value)} placeholder="000000000000" />
            <Button size="sm" loading={profileMutation.isPending} onClick={() => profileMutation.mutate()}>
              Сохранить
            </Button>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Хранилище фото</h3>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{storageGB.toFixed(2)} ГБ использовано</span>
            <span>5 ГБ</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${storagePercent > 80 ? "bg-red-500" : "bg-primary-500"}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        {/* Add user */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={16} className="text-primary-600" />
            <h3 className="font-semibold text-gray-700">Добавить пользователя</h3>
          </div>
          <div className="space-y-3">
            <Input
              label="Логин"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="login123"
            />
            <Input
              label="Пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 4 символа"
            />
            <Input
              label="ФИО (необязательно)"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Иванов Иван"
            />
            <Input
              label="Название магазина (необязательно)"
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              placeholder="Мой магазин"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Роль</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="seller">Продавец</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <Button
              size="sm"
              loading={createUserMutation.isPending}
              disabled={!canCreate}
              onClick={() => createUserMutation.mutate()}
            >
              Создать
            </Button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Аккаунт</h3>
          <Button variant="danger" onClick={() => { logout(); navigate("/login"); }}>
            Выйти из системы
          </Button>
        </div>

      </div>
    </div>
  );
}
