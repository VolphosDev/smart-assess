import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import type { Role, User } from "./store";

export const usersApi = {
    getAll: () => apiClient.get<any[]>('/admin/usuarios'),

    create: (data: any) => apiClient.post<any>('/admin/usuarios/crear', data),

    crearMasivo: (data: any[]) => apiClient.post<any>('/admin/usuarios/crear-masivo', data),

    remove: (id: string | number) => apiClient.delete<any>(`/admin/usuarios/${id}`),

    unlock: (id: string | number) => apiClient.put<any>(`/admin/usuarios/${id}/desbloquear`),

    toggleBlock: (id: string | number) => apiClient.put<any>(`/admin/usuarios/${id}/toggle-block`),

    changePassword: (id: string | number, password: string) => apiClient.put<any>(`/admin/usuarios/${id}/change-password`, { password }),
};
