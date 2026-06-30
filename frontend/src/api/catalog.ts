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

  placeOrder: async (
    slug: string,
    payload: {
      client_phone: string;
      client_name?: string;
      client_store?: string;
      payment_method: string;
      comment?: string;
      items: Array<{ product_id: number; quantity: number }>;
    }
  ) => {
    const { data } = await axios.post<{ order_id: number; total: number; message: string }>(
      `/api/catalog/${slug}/orders`,
      { ...payload, source: "catalog", catalog_slug: slug }
    );
    return data;
  },
};

export default catalogApi;
