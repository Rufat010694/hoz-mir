// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "seller";
  store_name: string | null;
  catalog_slug: string | null;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// CockroachDB generates 64-bit IDs that exceed JS MAX_SAFE_INTEGER.
// The backend serialises them as strings; keep them as string | number throughout.
export type DbId = string | number;

// ── Product ───────────────────────────────────────────────────────────────────
export interface Category {
  id: DbId;
  name: string;
  parent_id: DbId | null;
  sort_order: number;
}

export interface ProductPhoto {
  url: string;
  thumbnail_url: string;
  key: string;
  thumb_key: string;
}

export interface Product {
  id: DbId;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category_id: DbId | null;
  is_active: boolean;
  photos: ProductPhoto[];
  created_at: string;
  updated_at: string;
}

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus = "new" | "processing" | "ready" | "delivered" | "cancelled";
export type PaymentMethod = "cash" | "transfer" | "debt" | "other";

export interface OrderItem {
  id: DbId;
  product_id: DbId | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: DbId;
  order_number: number | null;
  client_id: DbId | null;
  client_phone: string | null;
  client_name: string | null;
  client_store: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  comment: string | null;
  source: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderListItem {
  id: DbId;
  order_number: number | null;
  client_id: DbId | null;
  client_name: string | null;
  client_phone: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_amount: number;
  created_at: string;
}

// ── Client ────────────────────────────────────────────────────────────────────
export interface Client {
  id: DbId;
  phone: string;
  full_name: string | null;
  store_name: string | null;
  notes: string | null;
  total_debt: number;
  created_at: string;
}

// ── Cart (local state) ────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardData {
  products_count: number;
  today_orders: number;
  new_orders: number;
  today_revenue: number;
  recent_orders: Array<{
    id: DbId;
    client_name: string | null;
    total_amount: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    created_at: string;
  }>;
  top_products: Array<{ name: string; sold: number }>;
  client_debts: Array<{ name: string; debt: number }>;
}
