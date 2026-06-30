import api from "./index";
import { Category, Product } from "@/types";

export const productsApi = {
  list: async (params?: { search?: string; category_id?: string | number; is_active?: boolean; skip?: number; limit?: number }) => {
    const { data } = await api.get<Product[]>("/products", { params });
    return data;
  },

  get: async (id: string | number) => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  create: async (payload: Partial<Product>) => {
    const { data } = await api.post<Product>("/products", payload);
    return data;
  },

  update: async (id: string | number, payload: Partial<Product>) => {
    const { data } = await api.patch<Product>(`/products/${id}`, payload);
    return data;
  },

  delete: async (id: string | number) => {
    await api.delete(`/products/${id}`);
  },

  uploadPhoto: async (id: string | number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Product>(`/products/${id}/photos`, form);
    return data;
  },

  deletePhoto: async (id: string | number, index: number) => {
    const { data } = await api.delete<Product>(`/products/${id}/photos/${index}`);
    return data;
  },

  bulkPrice: async (payload: { product_ids?: (string | number)[]; action: string; value: number }) => {
    const { data } = await api.post<{ updated: number }>("/products/bulk/price", payload);
    return data;
  },

  exportXlsx: async () => {
    const response = await api.get("/products/export/xlsx", { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },

  // Categories
  listCategories: async () => {
    const { data } = await api.get<Category[]>("/products/categories");
    return data;
  },

  createCategory: async (payload: { name: string; parent_id?: string | number; sort_order?: number }) => {
    const { data } = await api.post<Category>("/products/categories", payload);
    return data;
  },

  deleteCategory: async (id: string | number) => {
    await api.delete(`/products/categories/${id}`);
  },
};
