import { apiClient } from "./client";

/**
 * Curación de los temas extraídos automáticamente de un material.
 *
 * Los subtemas se extraen sección por sección, y una sección puede caer sobre un índice, una
 * portada o una bibliografía: el modelo, obligado a responder, inventa temas de ahí. Ninguna
 * heurística los distingue con fiabilidad de un tema real; un docente sí, si ve de dónde
 * salieron. Por eso cada tema viaja con su `evidencia`.
 */
export interface TemaCurable {
    tema: string;
    /** null = el docente aún no ha decidido. Los no decididos SÍ se muestran al alumno. */
    aceptado: boolean | null;
    motivo: string | null;
    /** Fragmentos del documento que originaron este tema. */
    evidencia: string[];
}

export interface TasaAceptacion {
    temasRevisados: number;
    aceptados: number;
    descartados: number;
    tasaAceptacion: number | null;
    interpretacion: string;
}

export const curacionTemasApi = {
    temasDe: (materialId: string | number) =>
        apiClient.get<TemaCurable[]>(`/curacion-temas/material/${materialId}`),

    decidir: (materialId: string | number, tema: string, aceptado: boolean, motivo?: string) =>
        apiClient.post<{ mensaje: string }>(`/curacion-temas/material/${materialId}/decidir`, {
            tema,
            aceptado,
            motivo: motivo ?? null,
        }),

    tasaAceptacion: () =>
        apiClient.get<TasaAceptacion>(`/curacion-temas/tasa-aceptacion`),
};
