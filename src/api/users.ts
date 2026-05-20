import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { Role, User } from "./store";

export const usersApi = {
  list: (role?: Role) =>
    apiClient.get<User[]>(role ? `${API_ENDPOINTS.users}?role=${role}` : API_ENDPOINTS.users),
  create: (data: Omit<User, "id">) => apiClient.post<User>(API_ENDPOINTS.users, data),
  remove: (id: string) => apiClient.delete<{ ok: true }>(API_ENDPOINTS.user(id)),
};