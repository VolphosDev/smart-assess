import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { User } from "./store";

export const authApi = {
    login: (email: string, password: string) =>
        apiClient.post<{ user: User }>(API_ENDPOINTS.login, { email, password }),

    me: () => apiClient.get<User>(API_ENDPOINTS.me),

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return apiClient.post<{ ok: true }>(API_ENDPOINTS.logout);
    }
};