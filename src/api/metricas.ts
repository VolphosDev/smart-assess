import { apiClient } from "./client";

/**
 * Métricas del canal de IA.
 *
 * Cada bloque devuelve, además de sus cifras, un campo `interpretacion` escrito en el
 * backend que dice qué mide y —importante— qué NO demuestra. Ese texto se muestra tal cual:
 * si algún día cambia el criterio de cálculo, la explicación cambia con él y no se queda
 * mintiendo en la pantalla.
 */
export interface BloqueMetrica {
    interpretacion?: string;
    [clave: string]: unknown;
}

export type ResumenMetricas = Record<string, BloqueMetrica>;

export const metricasApi = {
    /** Panel consolidado: todos los indicadores del canal en una sola llamada. */
    resumen: () => apiClient.get<ResumenMetricas>("/metricas/resumen"),

    bloom: () => apiClient.get<BloqueMetrica>("/metricas/bloom"),
    deduplicacion: () => apiClient.get<BloqueMetrica>("/metricas/deduplicacion"),
    rag: () => apiClient.get<BloqueMetrica>("/metricas/rag"),
    calidadTextual: () => apiClient.get<BloqueMetrica>("/metricas/calidad-textual"),
    imagenes: () => apiClient.get<BloqueMetrica>("/metricas/imagenes"),
    guardiaEnunciado: () => apiClient.get<BloqueMetrica>("/metricas/guardia-enunciado"),
    juez: () => apiClient.get<BloqueMetrica>("/metricas/juez"),
    comite: () => apiClient.get<BloqueMetrica>("/metricas/comite"),

    /**
     * Descarga la telemetría cruda en CSV, para los anexos de la tesis.
     *
     * No usa `apiClient` porque la respuesta no es JSON: hay que tratarla como blob y
     * disparar la descarga en el navegador.
     */
    exportarCsv: async () => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseUrl}/metricas/exportar`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("No se pudo exportar la telemetría");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = `telemetria_ia_${new Date().toISOString().slice(0, 10)}.csv`;
        enlace.style.visibility = "hidden";
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    },
};
