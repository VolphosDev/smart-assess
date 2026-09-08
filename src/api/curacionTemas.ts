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
    /**
     * Fragmentos del documento que originaron este tema.
     *
     * Llega VACÍO en el listado y se pide aparte al desplegar el tema. Traerlos todos de
     * golpe suponía una búsqueda vectorial por tema, en serie, con su llamada de embedding:
     * con 16 temas eran ~7 segundos de panel en blanco para una información que el docente
     * mira en dos o tres, no en los dieciséis.
     */
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

    /** Evidencia de UN tema, bajo demanda. */
    evidenciaDe: (materialId: string | number, tema: string) =>
        apiClient.get<{ tema: string; evidencia: string[] }>(
            `/curacion-temas/material/${materialId}/evidencia?tema=${encodeURIComponent(tema)}`),

    decidir: (materialId: string | number, tema: string, aceptado: boolean, motivo?: string) =>
        apiClient.post<{ mensaje: string }>(`/curacion-temas/material/${materialId}/decidir`, {
            tema,
            aceptado,
            motivo: motivo ?? null,
        }),

    tasaAceptacion: () =>
        apiClient.get<TasaAceptacion>(`/curacion-temas/tasa-aceptacion`),
};
