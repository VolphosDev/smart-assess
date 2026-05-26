import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { Role, User } from "./store";

export const usersApi = {
    getAll: () => apiClient.get<any[]>('/admin/usuarios'),

    create: (data: any) => apiClient.post<any>('/admin/usuarios/crear', data),

    remove: (id: string | number) => apiClient.delete<any>(`/admin/usuarios/${id}`),
};
