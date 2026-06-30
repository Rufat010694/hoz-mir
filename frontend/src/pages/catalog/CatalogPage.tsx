import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import catalogApi from "@/api/catalog";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/utils/format";
import { ShoppingCart, Search, MapPin, Camera, Package } from "lucide-react";

const FONT = "'Poppins', sans-serif";
const GREEN = "#16A34A";
const DARK = "#111827";
const GRAY = "#6B7280";
const GRAY2 = "#374151";
const BG = "#F3F4F6";

export default function CatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const { addItem, itemCount } = useCartStore();

  const { data: store } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => catalogApi.getStore(slug!),
    enabled: !!slug,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["catalog-categories", slug],
    queryFn: () => catalogApi.getCategories(slug!),
    enabled: !!slug,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog-products", slug, search, categoryId],
    queryFn: () => catalogApi.getProducts(slug!, { search, category_id: categoryId }),
    enabled: !!slug,
  });

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT, maxWidth: 480, margin: "0 auto", position: "relative" }}>

      {/* ── HEADER ─────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "#fff",
        boxShadow: "0 1px 0 #E5E7EB",
      }}>
        {/* Top row */}
        <div style={{
          display: "flex", alignItems: "center",
          height: 72, paddingLeft: 16, paddingRight: 16, gap: 0,
        }}>
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Хоз Мир"
            style={{ width: 180, height: "auto", objectFit: "contain", flexShrink: 0 }}
          />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* "Отследить" — outline button */}
          <Link
            to={`/catalog/${slug}/track`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 44, padding: "0 22px",
              borderRadius: 22,
              border: `2px solid ${GREEN}`,
              color: GREEN,
              background: "#fff",
              fontSize: 14, fontWeight: 500, fontFamily: FONT,
              whiteSpace: "nowrap", flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <MapPin size={18} color={GREEN} />
            Отследить
          </Link>

          {/* Gap + Cart */}
          <div style={{ width: 12 }} />
          <Link to={`/catalog/${slug}/cart`} style={{ position: "relative", flexShrink: 0 }}>
            <ShoppingCart size={30} color="#1F2937" />
            {itemCount() > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                background: GREEN, color: "#fff",
                fontSize: 11, fontWeight: 600,
                width: 18, height: 18, borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {itemCount()}
              </span>
            )}
          </Link>
        </div>

        {/* Search */}
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{
            position: "relative", height: 54,
            background: "#F9FAFB",
            borderRadius: 18,
            display: "flex", alignItems: "center",
          }}>
            <Search size={20} color={GRAY} style={{ position: "absolute", left: 18 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товаров..."
              style={{
                width: "100%", height: "100%",
                paddingLeft: 50, paddingRight: 16,
                background: "transparent", border: "none", outline: "none",
                fontSize: 16, color: GRAY2, fontFamily: FONT,
                borderRadius: 18,
              }}
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div style={{
            display: "flex", gap: 8, padding: "0 16px 12px",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            <button
              onClick={() => setCategoryId(undefined)}
              style={{
                height: 42, padding: "0 18px", borderRadius: 21,
                border: "none", cursor: "pointer", whiteSpace: "nowrap",
                fontSize: 16, fontWeight: 500, fontFamily: FONT,
                background: !categoryId ? GREEN : BG,
                color: !categoryId ? "#fff" : GRAY2,
                flexShrink: 0,
              }}
            >
              Все
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                style={{
                  height: 42, padding: "0 18px", borderRadius: 21,
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  fontSize: 16, fontWeight: 500, fontFamily: FONT,
                  background: categoryId === c.id ? GREEN : BG,
                  color: categoryId === c.id ? "#fff" : GRAY2,
                  flexShrink: 0,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PRODUCT GRID ──────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, padding: "10px 10px 20px",
      }}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 18, height: 280,
                animation: "pulse 1.5s infinite",
                opacity: 0.6,
              }} />
            ))
          : products.length === 0
          ? (
            <div style={{
              gridColumn: "1 / -1",
              textAlign: "center", padding: "64px 0",
              color: GRAY, fontFamily: FONT,
            }}>
              <Package size={48} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 16, fontWeight: 500 }}>Товаров пока нет</p>
              <p style={{ fontSize: 14, marginTop: 4 }}>Попробуйте изменить фильтр</p>
            </div>
          )
          : products.map((p) => {
            const outOfStock = Number(p.stock) === 0;
            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={() => navigate(`/catalog/${slug}/product/${p.id}`)}
              >
                {/* Image */}
                {p.photos[0] ? (
                  <img
                    src={p.photos[0].thumbnail_url}
                    alt={p.name}
                    style={{
                      width: "100%", aspectRatio: "4/3",
                      objectFit: "cover",
                      borderRadius: "14px 14px 0 0",
                      display: "block",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: "100%", aspectRatio: "4/3",
                    background: "#F3F4F6",
                    borderRadius: "14px 14px 0 0",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 4,
                  }}>
                    <Camera size={24} color="#D1D5DB" />
                    <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: FONT }}>Фото скоро появится</span>
                  </div>
                )}

                {/* Info */}
                <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Article */}
                  <p style={{ fontSize: 11, color: GRAY, fontFamily: FONT, margin: 0 }}>
                    Арт. {String(p.id).slice(-6).padStart(6, "0")}
                  </p>
                  {/* Name */}
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: DARK,
                    fontFamily: FONT, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                    lineHeight: 1.35,
                  }}>
                    {p.name}
                  </p>
                  {/* Price */}
                  <p style={{
                    fontSize: 15, fontWeight: 600, color: GREEN,
                    fontFamily: FONT, margin: "3px 0 6px",
                  }}>
                    {formatPrice(p.price)}
                  </p>

                  {/* Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!outOfStock) addItem(p);
                    }}
                    disabled={outOfStock}
                    style={{
                      width: "100%", height: 36,
                      borderRadius: 18, border: "none",
                      background: outOfStock ? "#E5E7EB" : GREEN,
                      color: outOfStock ? GRAY : "#fff",
                      fontSize: 12, fontWeight: 500, fontFamily: FONT,
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      marginTop: "auto",
                    }}
                  >
                    {outOfStock ? (
                      "Нет в наличии"
                    ) : (
                      <>
                        <ShoppingCart size={13} />
                        В корзину
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>


    </div>
  );
}
