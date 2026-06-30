import axios from "axios";
import { Category, Product } from "@/types";

// Public catalog API — no auth required
const catalogApi = {
  getStore: async (slug: string) => {
    const { data } = await axios.get<{ store_name: string; slug: string }>(`/api/catalog/${slug}`);
    return data;
  },

  getProducts: async (slug: string, params?: { category_id?: number; search?: string }) => {
    const { data } = await axios.get<Product[]>(`/api/catalog/${slug}/products`, { params });
    return data;
  },

  getCategories: async (slug: string) => {
    const { data } = await axios.get<Category[]>(`/api/catalog/${slug}/categories`);
    return data;
  },

  trackOrder: async (slug: string, orderNumber: number, phone: string) => {
    const { data } = await axios.get(`/api/catalog/${slug}/track/${orderNumber}`, { params: { phone } });
    return data as {
      order_id: string;
      order_number: number;
      status: string;
      total_amount: number;
      payment_method: string;
      comment: string | null;
      created_at: string;
      items: Array<{ product_name: string; quantity: number; price: number; subtotal: number }>;
    };
  },

  placeOrder: async (
    slug: string,
    payload: {
      client_phone: string;
      client_name?: string;
      client_store?: string;
      payment_method: string;
      comment?: string;
      items: Array<{ product_id: string | number; quantity: number }>;
    }
  ) => {
    const { data } = await axios.post<{ order_id: number | string; order_number?: number; total: number; message: string }>(
      `/api/catalog/${slug}/orders`,
      { ...payload, source: "catalog", catalog_slug: slug }
    );
    return data;
  },
};

export default catalogApi;
