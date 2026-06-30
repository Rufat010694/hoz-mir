import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
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

export default function CatalogSharePage() {
  const { user } = useAuthStore();
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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(catalogUrl)}&format=svg&color=166534`
    : null;

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Мой каталог</h2>
      <p className="text-sm text-gray-400 mb-6">
        Отправь ссылку клиентам — они откроют каталог и смогут сделать заказ без регистрации.
      </p>

      {!catalogUrl ? (
        <p className="text-gray-400">Каталог недоступен</p>
      ) : (
        <div className="max-w-lg space-y-4">

          {/* Store name */}
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
              {storeName[0]}
            </div>
            <div>
              <p className="font-semibold text-primary-800">{storeName}</p>
              <p className="text-xs text-primary-500">{catalogUrl}</p>
            </div>
            <div className="ml-auto flex gap-1">
              <button onClick={copyLink} title="Скопировать" className="p-2 text-primary-400 hover:text-primary-700 rounded-lg">
                <Copy size={18} />
              </button>
              <a href={catalogUrl} target="_blank" rel="noopener noreferrer" title="Открыть" className="p-2 text-primary-400 hover:text-primary-700 rounded-lg">
                <ExternalLink size={18} />
              </a>
            </div>
          </div>

          {/* Share buttons */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Поделиться через</p>
            <div className="grid grid-cols-2 gap-2">
              {SHARE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    const url = opt.getUrl(catalogUrl, storeName);
                    if (url) window.open(url, "_blank");
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-opacity ${opt.color}`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {"share" in navigator && (
              <button
                onClick={nativeShare}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                <Share2 size={16} /> Другие приложения
              </button>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">QR-код каталога</span>
              </div>
              <span className="text-xs text-gray-400">{showQr ? "Скрыть" : "Показать"}</span>
            </button>

            {showQr && qrUrl && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <img src={qrUrl} alt="QR код" className="w-56 h-56" />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-xs">
                  Распечатай и размести в магазине — клиент сканирует камерой и сразу открывает каталог
                </p>
                <a
                  href={qrUrl}
                  download="catalog-qr.svg"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline font-medium"
                >
                  ↓ Скачать QR-код
                </a>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
