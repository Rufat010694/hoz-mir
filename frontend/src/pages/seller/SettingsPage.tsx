import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { Copy, ExternalLink, QrCode, Share2 } from "lucide-react";
import toast from "react-hot-toast";

const SHARE_OPTIONS = [
  {
    label: "WhatsApp",
    color: "bg-[#25D366] hover:bg-[#20b557] text-white",
    icon: "💬",
    getUrl: (url: string, store: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${store} — каталог товаров:\n${url}`)}`,
  },
  {
    label: "Telegram",
    color: "bg-[#229ED9] hover:bg-[#1a8bbd] text-white",
    icon: "✈️",
    getUrl: (url: string, store: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${store} — каталог товаров`)}`,
  },
  {
    label: "Viber",
    color: "bg-[#7360F2] hover:bg-[#5f4ed4] text-white",
    icon: "📳",
    getUrl: (url: string, store: string) =>
      `viber://forward?text=${encodeURIComponent(`${store} — каталог:\n${url}`)}`,
  },
  {
    label: "Instagram",
    color: "bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] hover:opacity-90 text-white",
    icon: "📸",
    getUrl: (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована — вставь в Instagram!");
      return null;
    },
  },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showQr, setShowQr] = useState(false);

  const catalogUrl = user?.catalog_slug
    ? `${window.location.origin}/catalog/${user.catalog_slug}`
    : null;

  const storeName = user?.store_name || "Каталог";

  const copyLink = () => {
    if (catalogUrl) {
      navigator.clipboard.writeText(catalogUrl);
      toast.success("Ссылка скопирована!");
    }
  };

  const nativeShare = async () => {
    if (navigator.share && catalogUrl) {
      try {
        await navigator.share({ title: storeName, text: "Каталог товаров", url: catalogUrl });
      } catch {}
    }
  };

  const qrUrl = catalogUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(catalogUrl)}&format=svg&color=166534`
    : null;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Настройки</h2>

      <div className="space-y-4 max-w-lg">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Профиль</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Логин:</span> {user?.username}</p>
            <p><span className="font-medium">Имя:</span> {user?.full_name || "—"}</p>
            <p><span className="font-medium">Магазин:</span> {user?.store_name || "—"}</p>
            <p><span className="font-medium">Роль:</span> {user?.role === "admin" ? "Администратор" : "Продавец"}</p>
          </div>
        </div>

        {/* Catalog link */}
        {catalogUrl && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-700 mb-1">Ссылка на каталог</h3>
            <p className="text-sm text-gray-400 mb-3">
              Клиенты могут просматривать товары и заказывать без регистрации.
            </p>

            {/* URL row */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 break-all">
                {catalogUrl}
              </div>
              <button onClick={copyLink} title="Скопировать" className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                <Copy size={18} />
              </button>
              <a href={catalogUrl} target="_blank" rel="noopener noreferrer" title="Открыть" className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                <ExternalLink size={18} />
              </a>
            </div>

            {/* Share buttons */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Поделиться</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SHARE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    const url = opt.getUrl(catalogUrl, storeName);
                    if (url) window.open(url, "_blank");
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity ${opt.color}`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Native share + QR */}
            <div className="flex gap-2">
              {"share" in navigator && (
                <button
                  onClick={nativeShare}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Share2 size={16} /> Ещё способы
                </button>
              )}
              <button
                onClick={() => setShowQr(!showQr)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                <QrCode size={16} /> QR-код
              </button>
            </div>

            {/* QR Code */}
            {showQr && qrUrl && (
              <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <img src={qrUrl} alt="QR код" className="w-48 h-48" />
                <p className="text-xs text-gray-500 text-center">
                  Распечатай и повесь в магазине — клиент сканирует и сразу видит каталог
                </p>
                <a
                  href={qrUrl}
                  download="catalog-qr.svg"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Скачать QR-код
                </a>
              </div>
            )}
          </div>
        )}

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
