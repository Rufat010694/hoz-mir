import api from "./index";
import { TokenResponse, User } from "@/types";

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>("/auth/login", { username, password });
    return data;
  },

  refresh: async (refresh_token: string): Promise<TokenResponse> => {
    const { data } = await api.post<TokenResponse>("/auth/refresh", { refresh_token });
    return data;
  },

  me: async (): Promise<User> => {
    // Decode token to get user info (or add a /me endpoint)
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No token");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const { data } = await api.get<User>(`/auth/me`).catch(async () => {
      // Fallback: return minimal user from token
      return { data: { id: parseInt(payload.sub), role: payload.role } as User };
    });
    return data;
  },
};
