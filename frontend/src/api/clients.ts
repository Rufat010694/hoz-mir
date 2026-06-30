import api from "./index";
import { Client } from "@/types";

export const clientsApi = {
  list: async (params?: { search?: string; skip?: number; limit?: number }) => {
    const { data } = await api.get<Client[]>("/clients", { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  create: async (payload: { phone: string; full_name?: string; store_name?: string; notes?: string }) => {
    const { data } = await api.post<Client>("/clients", payload);
    return data;
  },

  update: async (id: number, payload: Partial<Client>) => {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload);
    return data;
  },

  delete: async (id: number) => {
    await api.delete(`/clients/${id}`);
  },
};
