import { apiClient } from "./http/client";

export interface Colegio {
    id: number;
    nombre: string;
    activo: boolean;
    administradores: number;
    docentes: number;
    estudiantes: number;
    administradoresPrincipales: string[];
}

/** Gestión de colegios (solo SUPERADMIN). No expone datos académicos. */
export const superadminApi = {
    listar: () => apiClient.get<Colegio[]>("/superadmin/colegios"),

    crear: (data: { nombre: string; adminNombre: string; adminCorreo: string; adminPassword: string }) =>
        apiClient.post<Colegio>("/superadmin/colegios", data),

    agregarAdministrador: (id: number, data: { nombre: string; correo: string; password: string }) =>
        apiClient.post<Colegio>(`/superadmin/colegios/${id}/administrador`, data),

    cambiarEstado: (id: number, activo: boolean) =>
        apiClient.put<Colegio>(`/superadmin/colegios/${id}/estado`, { activo }),
};
