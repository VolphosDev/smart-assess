import { apiClient } from "./http/client";

export interface RegistroAuditoriaDTO {
    fecha: string;
    actor: string;
    rol: string;
    accion: string;
    recurso: string;
    recursoId: number;
    detalle: string;
}

export interface RespuestaAuditoria {
    total: number;
    pagina: number;
    acciones: string[];
    registros: RegistroAuditoriaDTO[];
}

export interface FiltrosAuditoria {
    actor?: string;
    accion?: string;
    pagina?: number;
    tamano?: number;
}

export const auditoriaApi = {
    listar: (params: FiltrosAuditoria = {}) => {
        const query = new URLSearchParams();
        if (params.actor && params.actor.trim()) query.append("actor", params.actor.trim());
        if (params.accion && params.accion.trim() && params.accion !== "TODAS") {
            query.append("accion", params.accion.trim());
        }
        if (params.pagina !== undefined) query.append("pagina", params.pagina.toString());
        if (params.tamano !== undefined) query.append("tamano", params.tamano.toString());
        const qs = query.toString();
        return apiClient.get<RespuestaAuditoria>(`/admin/auditoria${qs ? `?${qs}` : ""}`);
    },
};
