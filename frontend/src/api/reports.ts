import api from "./index";
import { DashboardData } from "@/types";

export const reportsApi = {
  dashboard: async () => {
    const { data } = await api.get<DashboardData>("/reports/dashboard");
    return data;
  },

  sales: async (period: "day" | "week" | "month" | "year") => {
    const { data } = await api.get<Array<{ date: string; orders: number; revenue: number }>>("/reports/sales", {
      params: { period },
    });
    return data;
  },
};
