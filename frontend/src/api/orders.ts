import api from "./index";
import { Order, OrderListItem, OrderStatus, PaymentMethod } from "@/types";

export const ordersApi = {
  list: async (params?: { status?: string; client_id?: number; search?: string; skip?: number; limit?: number }) => {
    const { data } = await api.get<OrderListItem[]>("/orders", { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  create: async (payload: {
    client_id?: number;
    client_phone?: string;
    client_name?: string;
    client_store?: string;
    payment_method: PaymentMethod;
    comment?: string;
    items: Array<{ product_id: number; quantity: number }>;
    source?: string;
  }) => {
    const { data } = await api.post<Order>("/orders", payload);
    return data;
  },

  updateStatus: async (id: number, status: OrderStatus) => {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },

  updatePayment: async (id: number, payment_method: PaymentMethod) => {
    const { data } = await api.patch<Order>(`/orders/${id}/payment`, { payment_method });
    return data;
  },
};
