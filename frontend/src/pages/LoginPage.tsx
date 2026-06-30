import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/seller");
    } catch {
      toast.error("Неверный логин или пароль");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Хоз Мир" className="h-64 mx-auto mb-1 object-contain" />
          <p className="text-gray-500 text-sm">Вход в систему</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите логин"
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
