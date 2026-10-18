import { apiClient } from "./http/client";

export interface Administrador {
    id: number;
    nombre: string;
    correo: string;
    adminPrincipal: boolean;
    cuentaBloqueada: boolean;
    permisos: string[];
}

export interface PermisoCatalogo {
    permiso: string;
    descripcion: string;
}

/** Administradores del colegio y sus permisos (requiere ADMINISTRADORES_GESTIONAR). */
export const administradoresApi = {
    catalogo: () => apiClient.get<PermisoCatalogo[]>("/admin/administradores/permisos"),

    listar: () => apiClient.get<Administrador[]>("/admin/administradores"),

    crear: (data: { nombre: string; correo: string; password: string; permisos: string[] }) =>
        apiClient.post<Administrador>("/admin/administradores", data),

    cambiarPermisos: (id: number, permisos: string[]) =>
        apiClient.put<Administrador>(`/admin/administradores/${id}/permisos`, { permisos }),

    alternarBloqueo: (id: number) =>
        apiClient.put<{ cuentaBloqueada: boolean }>(`/admin/administradores/${id}/toggle-block`),

    eliminar: (id: number) => apiClient.delete<{ message: string }>(`/admin/administradores/${id}`),
};
