import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { Role, User } from "./store";

export const authApi = {
  login: (email: string, password: string, role: Role) =>
    apiClient.post<{ user: User }>(API_ENDPOINTS.login, { email, password, role }),
  me: () => apiClient.get<User>(API_ENDPOINTS.me),
  logout: () => apiClient.post<{ ok: true }>(API_ENDPOINTS.logout),
};